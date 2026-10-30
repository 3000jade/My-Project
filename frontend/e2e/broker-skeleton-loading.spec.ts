import { test, expect } from '@playwright/test';

test.describe('Broker Portal Layout-Tailored Skeleton Loading Verification', () => {
  test.describe.configure({ mode: 'serial' });

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
    await page.addInitScript(
      ({ token, user }) => {
        if (token) {
          localStorage.setItem('cp_auth_token', token);
        }
        if (user) {
          localStorage.setItem('cp_user', JSON.stringify(user));
        }
      },
      { token, user }
    );
  });

  test('displays consistent layout-tailored skeleton loading UI across broker pages before populating data', async ({ page }) => {
    // 1. Artificially delay properties API response by 1.2s to observe table skeleton loading
    await page.route('**/api/properties**', async (route) => {
      await new Promise((r) => setTimeout(r, 1200));
      await route.continue();
    });

    await page.goto('/broker/properties');

    // Assert that table skeleton with role="status" and animate-pulse elements is visible
    const tableSkeleton = page.locator('[role="status"][aria-label="Loading data table..."]');
    await expect(tableSkeleton).toBeVisible({ timeout: 5000 });
    await expect(tableSkeleton.locator('.animate-pulse').first()).toBeVisible();

    // After delay, data should populate cleanly and skeleton dismisses
    await expect(page.getByRole('heading', { name: 'Property Listings' })).toBeVisible({ timeout: 10000 });
    await expect(tableSkeleton).not.toBeVisible({ timeout: 10000 });

    // 2. Delay agents API to observe agents page table skeleton
    await page.route('**/api/agents**', async (route) => {
      await new Promise((r) => setTimeout(r, 1200));
      await route.continue();
    });

    await page.goto('/broker/agents');
    const agentSkeleton = page.locator('[role="status"][aria-label="Loading data table..."]');
    await expect(agentSkeleton).toBeVisible({ timeout: 5000 });
    await expect(agentSkeleton.locator('.animate-pulse').first()).toBeVisible();
    await expect(page.locator('h1:has-text("Agents")')).toBeVisible();

    // 3. Delay profile API to observe profile skeleton
    await page.route('**/api/profile**', async (route) => {
      await new Promise((r) => setTimeout(r, 1200));
      await route.continue();
    });

    await page.goto('/broker/profile');
    const profileSkeleton = page.locator('[role="status"][aria-label="Loading profile credentials..."]');
    await expect(profileSkeleton).toBeVisible({ timeout: 5000 });
    await expect(profileSkeleton.locator('.animate-pulse').first()).toBeVisible();
    await expect(profileSkeleton).not.toBeVisible({ timeout: 10000 });
  });
});
