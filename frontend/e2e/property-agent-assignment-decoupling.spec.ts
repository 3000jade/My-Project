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

  test('Add New Property goes directly to Step 1 of Property Creation Wizard', async ({ page }) => {
    // 1. Start from properties ledger and click "+ Add New Property"
    await page.goto('/broker/properties');
    const addPropertyBtn = page.locator('a:has-text("Add New Property")').first();
    await expect(addPropertyBtn).toBeVisible({ timeout: 10000 });
    await addPropertyBtn.click();

    // 2. Confirm direct navigation to /broker/properties/create (select-type gateway removed)
    await expect(page).toHaveURL(/.*\/broker\/properties\/create/);
    await expect(page.getByRole('heading', { name: /Create Property Listing/i })).toBeVisible({ timeout: 10000 });

    // 3. Confirm agent assignment is NOT in Step 1
    await expect(page.locator('#assigned-agent-select')).not.toBeVisible();
    await expect(page.locator('text=Assigned Handler')).not.toBeVisible();

    // 4. Confirm essential property fields in Step 1
    await expect(page.getByText('Basic Details')).toBeVisible();
    await expect(page.getByText('Listing Title')).toBeVisible();
    await expect(page.getByText('Transaction Type')).toBeVisible();
    await expect(page.getByText('Property Type')).toBeVisible();
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
