import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.describe('Broker Dashboard Font Size & Typography Density Adjustment (FR-UM-006)', () => {
  test.beforeEach(async ({ page }) => {
    // Obtain valid token from local backend
    const loginRes = await page.request.post('http://localhost:5000/api/auth/login', {
      data: {
        email: 'broker@pt.com',
        password: 'brokerPassword123!',
      },
    });
    const json = await loginRes.json();
    const token = json?.data?.token;
    const user = json?.data?.user;

    // Pre-populate storage for instant authenticated session
    await page.addInitScript(({ token, user }) => {
      if (token) {
        localStorage.setItem('cp_auth_token', token);
      }
      if (user) {
        localStorage.setItem('cp_user', JSON.stringify(user));
      }
    }, { token, user });
  });

  test('renders density options, updates layout density, and persists across reloads and route changes', async ({ page }) => {
    // 1. Navigate directly to Broker Settings/Profile
    await page.goto('/broker/profile');
    await page.waitForLoadState('networkidle');

    // 2. Verify Appearance & Typography Density card is visible
    const densityCard = page.locator('[data-testid="typography-density-card"]');
    await expect(densityCard).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Appearance & Typography Density')).toBeVisible();

    const compactBtn = page.locator('[data-testid="density-option-compact"]');
    const standardBtn = page.locator('[data-testid="density-option-standard"]');
    const comfortableBtn = page.locator('[data-testid="density-option-comfortable"]');

    await expect(compactBtn).toBeVisible();
    await expect(standardBtn).toBeVisible();
    await expect(comfortableBtn).toBeVisible();

    // 3. Click Compact (14px base)
    await compactBtn.click();
    await expect(compactBtn).toHaveAttribute('aria-pressed', 'true');

    // Verify root dashboard container received data-dashboard-density="compact"
    const dashboardContainer = page.locator('[data-testid="broker-dashboard-container"]');
    await expect(dashboardContainer).toHaveAttribute('data-dashboard-density', 'compact');

    // Verify localStorage persistence
    const storedAfterCompact = await page.evaluate(() => localStorage.getItem('broker_dashboard_font_size'));
    expect(storedAfterCompact).toBe('compact');

    // 4. Reload page and confirm persistence
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="broker-dashboard-container"]')).toHaveAttribute('data-dashboard-density', 'compact');
    await expect(page.locator('[data-testid="density-option-compact"]')).toHaveAttribute('aria-pressed', 'true');

    // 5. Click Comfortable (18px base)
    await page.locator('[data-testid="density-option-comfortable"]').click();
    await expect(page.locator('[data-testid="density-option-comfortable"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-testid="broker-dashboard-container"]')).toHaveAttribute('data-dashboard-density', 'comfortable');

    // 6. Navigate to another portal page and verify density is maintained
    await page.goto('/broker/properties');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="broker-dashboard-container"]')).toHaveAttribute('data-dashboard-density', 'comfortable');
  });
});
