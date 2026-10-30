import { test, expect } from '@playwright/test';

test.describe('Broker Agent Management — High-Density Command Console Flow', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    // Authenticate as broker using proven account-profile pattern
    await page.goto('/broker/dashboard');
    await page.waitForLoadState('networkidle');
    if (page.url().includes('/login')) {
      const identifierInput = page.locator('#login-identifier');
      if (await identifierInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await identifierInput.fill('broker@pt.com');
        await page.locator('#login-password').fill('brokerPassword123!');
        await page.locator('button[type="submit"]').click();
        await page.waitForURL(url => url.pathname.includes('/broker/'), { timeout: 10000 }).catch(() => {});
        await page.waitForLoadState('networkidle').catch(() => {});
      }
    }
  });

  test('renders high-density 4-stat telemetry strip and top action cluster', async ({ page }) => {
    await page.goto('/broker/agents');
    await page.waitForLoadState('networkidle');

    // Breadcrumbs & Header
    await expect(page.locator('h1:has-text("Agents")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Manage agent profiles')).toBeVisible();

    // 4-Stat Metric Strip
    await expect(page.locator('text=Total Agents')).toBeVisible();
    await expect(page.locator('text=Verified Agents')).toBeVisible();
    await expect(page.locator('text=Pending Review').first()).toBeVisible();
    await expect(page.locator('text=Active Invitations')).toBeVisible();

    // Top action buttons
    await expect(page.getByRole('button', { name: /Invite Agent/i })).toBeVisible();
    await expect(page.getByTitle(/Toggle Analytics & Insights panel/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Refresh/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Export/i })).toBeVisible();
  });

  test('filters roster immediately using one-click status pill tabs', async ({ page }) => {
    await page.goto('/broker/agents');
    await page.waitForLoadState('networkidle');

    // Confirm status pill tabs are present
    const allAgentsPill = page.locator('button:has-text("All Agents")');
    const pendingPill = page.locator('button:has-text("Pending Review")');
    const verifiedPill = page.locator('button:has-text("Verified")');

    await expect(allAgentsPill).toBeVisible();
    await expect(pendingPill).toBeVisible();
    await expect(verifiedPill).toBeVisible();

    // Click Pending Review pill tab
    await pendingPill.click();

    // Table rows should filter to pending
    const statusBadges = page.locator('table tbody tr');
    const count = await statusBadges.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Reset to All Agents
    await allAgentsPill.click();
  });

  test('supports global search with shortcut indicator and clear button', async ({ page }) => {
    await page.goto('/broker/agents');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder('Search agent name, email, or license...');
    await expect(searchInput).toBeVisible();
    await expect(page.getByRole('main').locator('text=⌘K')).toBeVisible();

    // Type query
    await searchInput.fill('Marcus');
    await expect(searchInput).toHaveValue('Marcus');

    // Clear search
    const clearBtn = page.getByLabel('Clear search');
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();
    await expect(searchInput).toHaveValue('');
  });

  test('toggles Analytics & Insights panel to expand table to full width', async ({ page }) => {
    await page.goto('/broker/agents');
    await page.waitForLoadState('networkidle');

    // Verification Summary should initially be visible
    await expect(page.locator('text=Verification Summary')).toBeVisible();

    // Toggle panel closed
    const toggleBtn = page.getByTitle(/Toggle Analytics & Insights panel/i);
    await toggleBtn.click();
    await expect(page.locator('text=Insights')).toBeVisible();

    // Toggle panel back open
    await toggleBtn.click();
    await expect(page.locator('text=Verification Summary')).toBeVisible();
    await expect(page.locator('text=Recent Activities')).toBeVisible();
    await expect(page.locator('text=Agent Onboarding Checklist')).toBeVisible();
  });

  test('opens accessible Radix context menu with row options', async ({ page }) => {
    await page.goto('/broker/agents');
    await page.waitForLoadState('networkidle');

    // Wait for roster rows to render
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const moreBtn = page.getByLabel('More options').first();
    await expect(moreBtn).toBeVisible({ timeout: 5000 });
    await moreBtn.click();

    // Check Radix dropdown menu items
    await expect(page.locator('text=View Dossier')).toBeVisible();
    await expect(page.locator('text=Send Direct Email')).toBeVisible();
    await expect(page.locator('text=Copy Agent ID')).toBeVisible();

    // Press Escape to dismiss
    await page.keyboard.press('Escape');
    await expect(page.locator('text=View Dossier')).not.toBeVisible();
  });

  test('renders unified single-row filter bar and filters popover', async ({ page }) => {
    await page.goto('/broker/agents');
    await page.waitForLoadState('networkidle');

    // Single-row filter container
    const filterContainer = page.locator('div:has(> input[placeholder*="Search agent name"])').first();
    await expect(filterContainer).toBeVisible();

    // Filters Popover trigger button
    const filtersBtn = page.getByRole('button', { name: /Filters/i });
    await expect(filtersBtn).toBeVisible();

    // Click Filters Popover
    await filtersBtn.click();
    await expect(page.locator('text=Agent Role')).toBeVisible();
    await expect(page.locator('text=Team / Department')).toBeVisible();

    // Close popover
    await page.keyboard.press('Escape');
  });

  test('renders giant calendar with interactive side mini-calendar on Calendar tab', async ({ page }) => {
    await page.goto('/broker/agents?tab=calendar');
    await page.waitForLoadState('networkidle');

    // Title should be Calendar
    await expect(page.locator('h1:has-text("Calendar")')).toBeVisible();

    // Mini Side Calendar should be visible
    const miniCalendar = page.locator('[data-testid="mini-side-calendar"]');
    await expect(miniCalendar).toBeVisible();

    // Giant Month View should be default
    const monthView = page.locator('[data-testid="calendar-month-view"]');
    await expect(monthView).toBeVisible();

    // Status legend should be visible
    await expect(page.locator('[data-testid="calendar-status-legend"]')).toBeVisible();

    // Day Snapshot or Filters card
    await expect(page.locator('text=Calendar Filters')).toBeVisible();
    await expect(page.locator('text=Day Snapshot')).toBeVisible();
  });
});
