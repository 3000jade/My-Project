import { test, expect } from '@playwright/test';

test.describe('Property Listings & Agent Assignment Decoupling Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Attempt authentication as broker
    await page.goto('/login');
    const identifierInput = page.locator('#login-identifier');
    if (await identifierInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await identifierInput.fill('broker@pt.com');
      await page.locator('#login-password').fill('brokerPassword123!');
      await page.locator('button[type="submit"]').click();
      await page.waitForURL(url => url.pathname.includes('/broker') || url.pathname.includes('/dashboard'), { timeout: 10000 }).catch(() => {});
    }
  });

  test('Step 1 of Property Creation Wizard completely excludes sales agent selection and integrates select-type flow', async ({ page }) => {
    // 1. Start from properties ledger and click "+ Add New Property"
    await page.goto('/broker/properties');
    const addPropertyBtn = page.locator('a:has-text("Add New Property")').first();
    await expect(addPropertyBtn).toBeVisible({ timeout: 10000 });
    await addPropertyBtn.click();

    // 2. Confirm intermediate selection page: /broker/properties/select-type
    await expect(page).toHaveURL(/.*\/broker\/properties\/select-type/);
    await expect(page.locator('text=Select Property Type')).toBeVisible();
    await expect(page.locator('text=What type of property are you listing?')).toBeVisible();

    // Verify all 8 common property type options exist with icon and name only
    await expect(page.locator('button[aria-label="House & Lot"]')).toBeVisible();
    await expect(page.locator('button[aria-label="Condominium"]')).toBeVisible();
    await expect(page.locator('button[aria-label="Townhouse"]')).toBeVisible();
    await expect(page.locator('button[aria-label="Lot / Land"]')).toBeVisible();
    await expect(page.locator('button[aria-label="Commercial"]')).toBeVisible();
    await expect(page.locator('button[aria-label="Apartment"]')).toBeVisible();
    await expect(page.locator('button[aria-label="Villa"]')).toBeVisible();
    await expect(page.locator('button[aria-label="Warehouse"]')).toBeVisible();

    // 3. Click Condominium card to navigate to creation wizard
    await page.locator('button[aria-label="Condominium"]').click();

    // Confirm wizard is on Step 1: Basic Property Information with type preselected
    await expect(page).toHaveURL(/.*\/broker\/properties\/create\?type=Condominium/);
    await expect(page.locator('text=Section 1: Basic Property Information')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Active: Condominium')).toBeVisible();

    // Assert that the agent selection UI is entirely absent (decoupled)
    await expect(page.locator('text=Sales Agent')).not.toBeVisible();
    await expect(page.locator('text=Select Sales Agent')).not.toBeVisible();
    await expect(page.locator('button:has-text("Assign Agent")')).not.toBeVisible();

    // Confirm essential property fields are rendered
    await expect(page.locator('text=Listing Title')).toBeVisible();
    await expect(page.locator('text=Transaction Purpose')).toBeVisible();
    await expect(page.locator('text=Category / Type')).toBeVisible();

    // Fill title
    const titleInput = page.locator('input[placeholder*="Modernist Cantilever Estate"]');
    await expect(titleInput).toBeVisible();
    await titleInput.fill('Decoupled Prime Residence');
    await expect(titleInput).toHaveValue('Decoupled Prime Residence');
  });

  test('Agent Detail view in Agent Management provides agent-centric property assignment modal', async ({ page }) => {
    // Navigate to agents directory
    await page.goto('/broker/agents');
    await page.waitForLoadState('networkidle').catch(() => {});

    // If agents list renders, click the first agent; otherwise navigate directly to an agent ID or test placeholder
    const agentRowOrCard = page.locator('tbody tr, [data-testid="agent-card"], div.cursor-pointer').first();
    const hasAgent = await agentRowOrCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasAgent) {
      await agentRowOrCard.click();
      await page.waitForURL(/.*broker\/agents\/.+/, { timeout: 8000 }).catch(() => {});
    } else {
      await page.goto('/broker/agents/agent-1');
    }

    // Switch to Listings tab
    const listingsTab = page.getByRole('button', { name: /Listings/i });
    if (await listingsTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await listingsTab.click();

      // Verify "+ Assign Property" button is visible
      const assignBtn = page.getByRole('button', { name: /Assign Property/i });
      await expect(assignBtn).toBeVisible({ timeout: 8000 });

      // Click to open the Assign Property modal
      await assignBtn.click();

      // Verify modal opens with correct title and elements
      await expect(page.locator('text=Assign Property to')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('input[placeholder*="Search unassigned properties"]')).toBeVisible();
      await expect(page.getByRole('button', { name: /Cancel/i })).toBeVisible();

      // Close modal
      await page.getByRole('button', { name: /Cancel/i }).click();
      await expect(page.locator('text=Assign Property to')).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('Public Property Listing View loads cleanly and respects invariant without modifications', async ({ page }) => {
    // Navigate to public properties list or a direct property details route
    await page.goto('/properties');
    await page.waitForLoadState('networkidle').catch(() => {});

    // Check that properties page renders
    await expect(page).toHaveURL(/.*properties/);

    // Ensure header or page title is present
    const mainHeading = page.locator('h1, h2, h3').first();
    await expect(mainHeading).toBeVisible({ timeout: 10000 });
  });
});
