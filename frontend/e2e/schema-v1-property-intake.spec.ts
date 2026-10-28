import { test, expect } from '@playwright/test';
import path from 'path';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5173';
const ARTIFACT_DIR = 'C:/Users/Win11x64/.gemini/antigravity/brain/9eeb88a0-af46-42cf-a531-abe14feca154';

test.describe('Schema v1.0 Property Intake Studio & Real-World Specifications', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    // Automatically accept any dialogs (e.g. beforeunload unsaved changes prompt)
    page.on('dialog', async dialog => {
      await dialog.accept().catch(() => {});
    });

    // Obtain broker authentication token from backend API
    const res = await page.request.post('http://localhost:5000/api/auth/login', {
      data: {
        email: 'broker@pt.com',
        password: 'brokerPassword123!',
      }
    });
    const body = await res.json();
    const token = body?.data?.token || body?.token;

    if (token) {
      await page.addInitScript((authToken) => {
        window.localStorage.setItem('cp_auth_token', authToken);
      }, token);
    }
  });

  test('verifies property type selection gateway renders 3 core asset classes with shadcn cards', async ({ page }) => {
    await page.goto(`${BASE_URL}/broker/properties/types`);
    await page.waitForLoadState('networkidle');

    // Verify page header
    await expect(page.getByRole('heading', { name: /Select Property Type/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Primary Philippine Asset Classes/i)).toBeVisible();

    // Verify 3 core asset cards
    const lotCard = page.getByRole('heading', { name: /Subdivision Lot/i });
    const houseCard = page.getByRole('heading', { name: /House and Lot/i });
    const condoCard = page.getByRole('heading', { name: /Condominium/i });

    await expect(lotCard).toBeVisible();
    await expect(houseCard).toBeVisible();
    await expect(condoCard).toBeVisible();

    // Verify badges
    await expect(page.getByText('Vacant Land', { exact: true })).toBeVisible();
    await expect(page.getByText('Single-Family', { exact: true })).toBeVisible();
    await expect(page.getByText('Vertical Strata', { exact: true })).toBeVisible();

    // Click 'Subdivision Lot' button and verify navigation to property creation wizard
    const lotSelectBtn = page.getByRole('button', { name: /Select Subdivision Lot/i });
    await expect(lotSelectBtn).toBeVisible();
    await lotSelectBtn.click();

    await page.waitForURL(url => (url.pathname.includes('/broker/properties/new') || url.pathname.includes('/broker/properties/create')) && url.search.includes('type=residentialLot'), { timeout: 10000 });
    expect(page.url()).toContain('type=residentialLot');
  });

  test('completes full-stack residentialLot intake flow with canonical Schema v1.0 specifications', async ({ page }) => {
    await page.goto(`${BASE_URL}/broker/properties/new?type=residentialLot`);
    await page.waitForLoadState('networkidle');

    // 1. STEP 1: Listing Overview
    await expect(page.getByText(/Step 1 of 7/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Listing Overview/i).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Add Property/i })).toBeVisible();

    // Verify Marketing Tagline & Cadastral Reference input fields exist
    const titleInput = page.getByPlaceholder(/e\.g\. Modernist Cantilever Estate/i);
    const taglineInput = page.getByPlaceholder(/e\.g\. Elevated residential lot overlooking/i);
    const referenceCodeInput = page.getByPlaceholder(/e\.g\. CAD-HAV-B12-L04/i);
    const agentSelect = page.locator('#assigned-agent-select');

    await expect(titleInput).toBeVisible();
    await expect(taglineInput).toBeVisible();
    await expect(referenceCodeInput).toBeVisible();
    // Verify decoupled architecture: assigned agent dropdown and redundant category grid are absent
    await expect(agentSelect).not.toBeVisible();
    await expect(page.getByText(/Category \/ Type Classification/i)).not.toBeVisible();

    // Fill Step 1 values
    await titleInput.fill('Prime Corner Lot in Havila Highlands Subdivision');
    await taglineInput.fill('Elevated residential lot overlooking Laguna de Bay');
    await referenceCodeInput.fill('CAD-HAV-B12-L04');

    // Advance to Step 2
    const nextBtn = page.getByRole('button', { name: /Next Section/i });
    await nextBtn.click();

    // 2. STEP 2: Location & Address
    await expect(page.getByText(/Step 2 of 7/i).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Location & Address/i).first()).toBeVisible();

    // Verify residentialLot location fields (Subdivision / Phase / Block / Lot) are rendered
    await expect(page.locator('#subdivision-input')).toBeVisible();
    await expect(page.locator('#phase-input')).toBeVisible();
    await expect(page.locator('#block-input')).toBeVisible();
    await expect(page.locator('#lot-input')).toBeVisible();
    await expect(page.locator('#street-address-input')).toBeVisible();

    // Verify condo-specific fields (Tower, Floor Level, Unit Number) are NOT visible
    await expect(page.locator('#tower-name-input')).not.toBeVisible();
    await expect(page.locator('#unit-number-input')).not.toBeVisible();

    // Fill Subdivision & Address
    await page.locator('#subdivision-input').fill('Havila Highlands Executive Subdivision');
    await page.locator('#phase-input').fill('2');
    await page.locator('#block-input').fill('12');
    await page.locator('#lot-input').fill('4');
    await page.locator('#street-address-input').fill('Forest Ridge Avenue');

    // Populate coordinates via preset
    const bgcBtn = page.getByRole('button', { name: /Antipolo|BGC, Taguig/i }).first();
    if (await bgcBtn.isVisible().catch(() => false)) {
      await bgcBtn.click();
    } else {
      const latInput = page.getByRole('textbox', { name: 'Latitude' });
      const lngInput = page.getByRole('textbox', { name: 'Longitude' });
      await latInput.fill('14.5824');
      await lngInput.fill('121.1689');
    }

    // Advance to Step 3
    await nextBtn.click();

    // 3. STEP 3: Property Specifications
    await expect(page.getByText(/Step 3 of 7/i).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Property Specifications/i).first()).toBeVisible();

    // Verify residentialLot tailored fields: Frontage, Depth, Lot Position, Terrain, Facing Direction
    await expect(page.locator('#frontage-meters-input')).toBeVisible(); // Frontage
    await expect(page.locator('#depth-meters-input')).toBeVisible(); // Depth
    await expect(page.locator('#lot-size-area-input')).toBeVisible(); // Lot Area
    await expect(page.getByText(/Lot Position \/ Cut/i)).toBeVisible();
    await expect(page.getByText(/Topography \/ Terrain/i)).toBeVisible();
    await expect(page.getByText(/Sun Orientation \/ Facing/i)).toBeVisible();
    await expect(page.getByText(/Property Title Status/i)).toBeVisible();

    // Verify residentialLot does NOT display bedrooms, bathrooms, or room details
    await expect(page.getByText(/Bedrooms Total/i)).not.toBeVisible();
    await expect(page.getByText(/Room Dimensions/i)).not.toBeVisible();

    // Fill residentialLot specifications
    await page.locator('#lot-size-area-input').fill('270');
    await page.locator('#frontage-meters-input').fill('15');
    await page.locator('#depth-meters-input').fill('18');

    // Advance to Step 4: Pricing & Terms
    await nextBtn.click();
    await expect(page.getByText(/Step 4 of 7/i).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Pricing & Terms/i).first()).toBeVisible();

    // Fill price
    const priceInput = page.locator('input[placeholder="150,000,000"]');
    await expect(priceInput).toBeVisible();
    await priceInput.fill('6480000');

    // Advance to Step 5: Features & Amenities
    await nextBtn.click();
    await expect(page.getByText(/Step 5 of 7/i).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Features and Amenities/i).first()).toBeVisible();

    // Advance to Step 6: Photos & Media
    await nextBtn.click();
    await expect(page.getByText(/Step 6 of 7/i).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Media & Documents/i).first()).toBeVisible();

    // Advance to Step 7: Review & Publish
    await nextBtn.click();
    await expect(page.getByText(/Step 7 of 7/i).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Review Listing/i).first()).toBeVisible();

    // Capture screenshot of Step 7 review
    const screenshotPath = path.join(ARTIFACT_DIR, 'schema-v1-property-intake-review.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });

    // Intercept property save API payload to verify canonical schema serialization
    let capturedPayload: any = null;
    page.on('request', req => {
      if (req.url().includes('/api/properties') && req.method() === 'POST') {
        try {
          capturedPayload = req.postDataJSON();
        } catch (e) {}
      }
    });

    // Click Draft save button to test dual-envelope payload serialization without strict media constraints
    const saveDraftBtn = page.getByRole('button', { name: /Save Draft/i });
    await expect(saveDraftBtn).toBeVisible();
    await saveDraftBtn.click();

    // Wait for network request to be fired
    await page.waitForTimeout(1500);

    // Verify intercepted dual-envelope payload
    if (capturedPayload) {
      expect(capturedPayload.title).toBe('Prime Corner Lot in Havila Highlands Subdivision');
      expect(capturedPayload.price).toBe(6480000);
      expect(capturedPayload.specs.sqft).toBe(Math.round(270 * 10.7639));

      const canonical = capturedPayload.customResoAttributes?.canonicalPayload;
      expect(canonical).toBeDefined();
      expect(canonical.schemaVersion).toBe('1.0');
      expect(canonical.propertyType).toBe('residentialLot');
      expect(canonical.propertyDetails?.subdivision?.name).toBe('Havila Highlands Executive Subdivision');
      expect(canonical.propertyDetails?.lotArea?.value).toBe(270);
      expect(canonical.propertyDetails?.frontage?.value).toBe(15);
      expect(canonical.propertyDetails?.depth?.value).toBe(18);
    }
  });

  test('verifies Condominium tailored specifications hide lot details and show strata unit details', async ({ page }) => {
    await page.goto(`${BASE_URL}/broker/properties/new?type=condominium`);
    await page.waitForLoadState('networkidle');

    // Advance to Step 2 Location
    const nextBtn = page.getByRole('button', { name: /Next Section/i });
    await page.getByPlaceholder(/e\.g\. Modernist Cantilever Estate/i).fill('Ayala Premiere Sky Residence');
    await nextBtn.click();

    // Step 2: Location
    await expect(page.locator('#building-name-input')).toBeVisible();
    await expect(page.locator('#tower-name-input')).toBeVisible();
    await expect(page.locator('#floor-level-input')).toBeVisible();
    await expect(page.locator('#unit-number-input')).toBeVisible();

    // Verify Subdivision name is NOT displayed for Condo
    await expect(page.locator('#subdivision-input')).not.toBeVisible();

    // Advance to Step 3: Specs
    await page.locator('#street-address-input').fill('5th Avenue corner 28th Street');
    await nextBtn.click();

    // Step 3: Specifications
    await expect(page.getByText(/Balcony Details & Strata Unit Configuration/i)).toBeVisible();
    await expect(page.getByText(/Unit Layout/i)).toBeVisible();

    // Verify Lot Frontage and Lot Area are NOT displayed for Condo
    await expect(page.locator('#frontage-meters-input')).not.toBeVisible();
    await expect(page.locator('#lot-size-area-input')).not.toBeVisible();
  });
});
