import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5173';

test.describe('House and Lot Property Listing Creation & Database Verification', () => {
  test.setTimeout(120000);

  let brokerToken: string = '';

  test.beforeEach(async ({ page }) => {
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
    brokerToken = body?.data?.token || body?.token;
    expect(brokerToken).toBeTruthy();

    await page.addInitScript((authToken) => {
      window.localStorage.setItem('cp_auth_token', authToken);
    }, brokerToken);
  });

  test('creates house and lot property listing and verifies data reaches database', async ({ page }) => {
    // 1. Navigate to House & Lot intake studio
    await page.goto(`${BASE_URL}/broker/properties/new?type=houseAndLot`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    // 2. Step 1: Listing Overview
    await expect(page.getByText(/Step 1 of 7/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Listing Overview/i).first()).toBeVisible();

    const titleInput = page.getByPlaceholder(/e\.g\. Modernist Cantilever Estate/i);
    const taglineInput = page.getByPlaceholder(/e\.g\. Elevated residential lot overlooking/i);

    await expect(titleInput).toBeVisible();
    await titleInput.fill('Modern Scandinavian House and Lot in Ayala Alabang');
    await taglineInput.fill('Luxurious 4-Bedroom Smart Home with Private Garden');

    // Select Transaction Purpose
    const forSaleBtn = page.getByRole('button', { name: 'For Sale' });
    if (await forSaleBtn.isVisible().catch(() => false)) {
      await forSaleBtn.click();
    }

    // Select Condition
    const rfoBtn = page.getByRole('button', { name: /Brand New \/ RFO/i });
    if (await rfoBtn.isVisible().catch(() => false)) {
      await rfoBtn.click();
    }

    // Advance to Step 2
    const nextBtn = page.getByRole('button', { name: /Next Section/i });
    await nextBtn.click();

    // 3. Step 2: Location & Address
    await expect(page.getByText(/Step 2 of 7/i).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Location & Address/i).first()).toBeVisible();

    // Verify inline subdivision and parcel inputs
    const subdivisionInput = page.locator('#subdivision-input');
    const phaseInput = page.locator('#phase-input');
    const blockInput = page.locator('#block-input');
    const lotInput = page.locator('#lot-input');
    const streetInput = page.locator('#street-address-input');

    await expect(subdivisionInput).toBeVisible();
    await subdivisionInput.fill('Ayala Alabang Village');
    await phaseInput.fill('3');
    await blockInput.fill('14');
    await lotInput.fill('8');
    await streetInput.fill('Acacia Avenue');

    // Select Region: National Capital Region (NCR)
    await page.getByText(/Select Region\.\.\./i).click();
    await page.locator('#geo-region').fill('National Capital');
    await page.locator('div', { hasText: 'National Capital Region (NCR)' }).last().click();

    // Select City: City Of Muntinlupa
    await page.getByText(/Select City \/ Municipality\.\.\./i).click();
    await page.locator('#geo-city').fill('Muntinlupa');
    await page.locator('div', { hasText: 'City Of Muntinlupa' }).last().click();

    // Select Barangay: Alabang
    await page.getByText(/Select Barangay\.\.\./i).click();
    await page.locator('#geo-barangay').fill('Alabang');
    await page.locator('div', { hasText: 'Alabang' }).last().click();

    // Fill coordinates via preset or direct input
    const presetBtn = page.getByRole('button', { name: /BGC, Taguig|Antipolo/i }).first();
    if (await presetBtn.isVisible().catch(() => false)) {
      await presetBtn.click();
    } else {
      const latInput = page.getByRole('textbox', { name: 'Latitude' });
      const lngInput = page.getByRole('textbox', { name: 'Longitude' });
      if (await latInput.isVisible().catch(() => false)) {
        await latInput.fill('14.4172');
        await lngInput.fill('121.0253');
      }
    }

    // Advance to Step 3
    await nextBtn.click();

    // 4. Step 3: House & Lot Specifications
    await expect(page.getByText(/Step 3 of 7/i).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Property Specifications/i).first()).toBeVisible();
    await expect(page.getByTestId('house-and-lot-specs')).toBeVisible();

    // Fill content-sized area inputs
    const lotAreaInput = page.locator('#house-lot-size-input');
    const floorAreaInput = page.locator('#house-floor-area-input');
    await expect(lotAreaInput).toBeVisible();
    await expect(floorAreaInput).toBeVisible();
    await lotAreaInput.fill('350');
    await floorAreaInput.fill('420');

    // Fill content-sized numeric counts (inline row)
    const bedroomsInput = page.locator('#house-bedrooms-input');
    const bathroomsInput = page.locator('#house-bathrooms-input');
    const storiesInput = page.locator('#house-stories-input');
    const parkingInput = page.locator('#house-parking-input');

    await expect(bedroomsInput).toBeVisible();
    await expect(bathroomsInput).toBeVisible();
    await expect(storiesInput).toBeVisible();
    await expect(parkingInput).toBeVisible();

    await bedroomsInput.fill('4');
    await bathroomsInput.fill('3');
    await storiesInput.fill('2');
    await parkingInput.fill('2');

    // Select title status and check maid's room
    const titleStatusSelect = page.locator('#house-title-status-select');
    await expect(titleStatusSelect).toBeVisible();
    await titleStatusSelect.selectOption('clean');

    const maidsRoomCheckbox = page.locator('input[type="checkbox"]').first();
    if (await maidsRoomCheckbox.isVisible().catch(() => false)) {
      await maidsRoomCheckbox.check();
    }

    // Advance to Step 4: Pricing & Terms
    await nextBtn.click();
    await expect(page.getByText(/Step 4 of 7/i).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Pricing & Terms/i).first()).toBeVisible();

    const priceInput = page.locator('input[placeholder="150,000,000"]');
    await expect(priceInput).toBeVisible();
    await priceInput.fill('45000000');

    // Advance to Step 5: Features & Amenities
    await nextBtn.click();
    await expect(page.getByText(/Step 5 of 7/i).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Features and Amenities/i).first()).toBeVisible();

    // Pick an amenity if available
    const amenityChip = page.getByRole('button', { name: /Smart Home|Swimming Pool|Clubhouse|24\/7 Security/i }).first();
    if (await amenityChip.isVisible().catch(() => false)) {
      await amenityChip.click();
    }

    // Advance to Step 6: Photos & Media
    await nextBtn.click();
    await expect(page.getByText(/Step 6 of 7/i).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Media & Documents/i).first()).toBeVisible();

    // Advance to Step 7: Review & Publish
    await nextBtn.click();
    await expect(page.getByText(/Step 7 of 7/i).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Review Listing/i).first()).toBeVisible();

    // 5. Submit Listing & Intercept API Response
    const saveDraftBtn = page.getByRole('button', { name: /Save Draft/i });
    await expect(saveDraftBtn).toBeVisible();

    // Set up response listener for POST /api/properties
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/properties') && response.request().method() === 'POST',
      { timeout: 15000 }
    );

    await saveDraftBtn.click();

    const apiResponse = await responsePromise;
    expect(apiResponse.status()).toBe(201);

    const resJson = await apiResponse.json();
    expect(resJson.success).toBe(true);

    const createdProperty = resJson.data;
    expect(createdProperty).toBeDefined();
    const propertyId = createdProperty.id || createdProperty.listingId || createdProperty.listingKey;
    expect(propertyId).toBeTruthy();

    console.log(`[E2E] Created Property ID: ${propertyId}`);

    // 6. Direct Database Reach Verification
    // Query backend API directly with broker credentials to verify database persistence
    const dbQueryRes = await page.request.get(`http://localhost:5000/api/properties/${propertyId}`, {
      headers: {
        Authorization: `Bearer ${brokerToken}`,
      }
    });

    expect(dbQueryRes.status()).toBe(200);
    const dbRecordJson = await dbQueryRes.json();
    expect(dbRecordJson.success).toBe(true);
    const dbRecord = dbRecordJson.data;
    expect(dbRecord).toBeDefined();

    // 7. Verify Core Field Integrity in Database
    expect(dbRecord.title).toBe('Modern Scandinavian House and Lot in Ayala Alabang');
    expect(Number(dbRecord.price)).toBe(45000000);

    // Area & Room Metrics
    const specs = dbRecord.specs || {};
    expect(Number(specs.livingArea || specs.sqft)).toBe(420);
    expect(Number(specs.lotSizeArea || specs.lot_size_area || dbRecord.lot_size_area)).toBe(350);
    expect(Number(specs.bedroomsTotal || specs.beds)).toBe(4);
    expect(Number(specs.bathroomsTotalInteger || specs.baths)).toBe(3);
    expect(Number(specs.storiesTotal || specs.stories)).toBe(2);
    expect(Number(specs.parkingTotal || specs.parking_total || specs.garage_spaces)).toBe(2);

    // Subdivision Cadastral Location
    const location = dbRecord.location || {};
    expect(location.subdivisionName || dbRecord.subdivision_name).toBe('Ayala Alabang Village');
    expect(location.address || dbRecord.address).toContain('Acacia Avenue');

    // Canonical Schema v1.0 Envelope Verification
    const customReso = dbRecord.customResoAttributes || dbRecord.custom_reso_attributes || {};
    const canonical = customReso.canonicalPayload;
    expect(canonical).toBeDefined();
    expect(canonical.schemaVersion).toBe('1.0');
    expect(canonical.propertyType).toBe('houseAndLot');
    expect(canonical.propertyDetails?.lotArea?.value).toBe(350);
    expect(canonical.propertyDetails?.floorArea?.value).toBe(420);
    expect(canonical.propertyDetails?.rooms?.bedrooms).toBe(4);
    expect(canonical.propertyDetails?.rooms?.bathrooms).toBe(3);
    expect(canonical.propertyDetails?.rooms?.stories).toBe(2);
    expect(canonical.propertyDetails?.parking?.spaces).toBe(2);
    expect(canonical.propertyDetails?.cadastralInfo?.phase).toBe('3');
    expect(canonical.propertyDetails?.cadastralInfo?.block).toBe('14');
    expect(canonical.propertyDetails?.cadastralInfo?.lot).toBe('8');

    console.log('[E2E] Verified: Property data successfully persisted in database with full Schema v1.0 integrity.');
  });
});
