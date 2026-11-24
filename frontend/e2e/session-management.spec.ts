import { test, expect } from '@playwright/test';

const BROKER_EMAIL = 'broker@pt.com';
const BROKER_PASSWORD = 'brokerPassword123!';

async function loginAsBroker(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Email' }).fill(BROKER_EMAIL);
  await page.getByRole('textbox', { name: 'Password' }).fill(BROKER_PASSWORD);
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await page.waitForURL((url) => url.pathname.includes('/broker/dashboard'), { timeout: 20000 });
}

test.describe('Session Management Verification', () => {
  test('1. Session survives reload and extends cleanly via backend', async ({ page }) => {
    await loginAsBroker(page);

    const token = await page.evaluate(() => localStorage.getItem('cp_auth_token'));
    expect(token).toBeTruthy();

    // Reload dashboard and confirm session remains authenticated
    await page.reload();
    await expect(page).toHaveURL(/\/broker\/dashboard/);
    await expect(page.getByRole('heading', { level: 1, name: /Dashboard/i })).toBeVisible({ timeout: 15000 });

    // Confirm Active Sessions and Extend Session endpoints respond 200
    const apiBase = await page.evaluate(() => {
      return window.location.hostname.includes('vercel.app')
        ? 'https://project-propertytech.onrender.com/api'
        : 'http://localhost:5000/api';
    });

    const sessionsRes = await page.request.get(`${apiBase}/auth/sessions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(sessionsRes.status()).toBe(200);
    const sessionsJson = await sessionsRes.json();
    expect(Array.isArray(sessionsJson?.data?.sessions)).toBe(true);
    expect(sessionsJson.data.sessions.length).toBeGreaterThan(0);

    const extendRes = await page.request.post(`${apiBase}/auth/extend-session`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(extendRes.status()).toBe(200);
  });

  test('2. Multi-page portal navigation succeeds smoothly under throttled persistence', async ({ page }) => {
    await loginAsBroker(page);

    const routes = [
      ['/broker/properties', /Property Listings/i],
      ['/broker/agents', /Agents/i],
      ['/broker/inquiries', /Inquiries/i],
      ['/broker/dashboard', /Dashboard/i],
    ] as const;

    for (const [route, headingRegex] of routes) {
      await page.goto(route);
      await expect(page.getByRole('heading', { level: 1, name: headingRegex })).toBeVisible({ timeout: 15000 });
    }
  });

  test('3. Multi-tab activity sync keeps session active across tabs', async ({ context, page }) => {
    await loginAsBroker(page);

    const secondTab = await context.newPage();
    await secondTab.goto('/broker/properties');
    await expect(secondTab.getByRole('heading', { level: 1, name: /Property Listings/i })).toBeVisible({ timeout: 15000 });

    // Broadcast SESSION_EXTENDED from Tab A and verify Tab B stays logged in
    await page.evaluate(() => {
      const ch = new BroadcastChannel('cp_kerby_session_sync');
      ch.postMessage({ type: 'SESSION_EXTENDED', timestamp: Date.now() });
      ch.close();
    });

    await secondTab.waitForTimeout(500);
    await expect(secondTab).toHaveURL(/\/broker\/properties/);
    await secondTab.close();
  });

  test('4. Revoked session is rejected immediately without waiting for cache expiry', async ({ page }) => {
    await loginAsBroker(page);

    const token = await page.evaluate(() => localStorage.getItem('cp_auth_token'));
    const apiBase = await page.evaluate(() => {
      return window.location.hostname.includes('vercel.app')
        ? 'https://project-propertytech.onrender.com/api'
        : 'http://localhost:5000/api';
    });

    // Logout revokes current session and clears authUserCache immediately
    const logoutRes = await page.request.post(`${apiBase}/auth/logout`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(logoutRes.status()).toBe(200);

    // Immediately reuse old token -> must fail with 401
    const afterRes = await page.request.get(`${apiBase}/auth/sessions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(afterRes.status()).toBe(401);
  });

  test('5. Clean UI logout clears tokens and guards protected routes', async ({ page }) => {
    await loginAsBroker(page);

    // Open profile menu in header and click Log out
    await page.getByRole('button', { name: /Broker|Principal Broker/i }).click();
    await page.getByRole('menuitem', { name: /Log Out|Sign Out/i }).click();

    await page.waitForURL((url) => url.pathname.includes('/login'), { timeout: 15000 });
    const tokenAfter = await page.evaluate(() => localStorage.getItem('cp_auth_token'));
    expect(tokenAfter).toBeNull();

    // Protected route must redirect back to /login
    await page.goto('/broker/dashboard');
    await page.waitForURL((url) => url.pathname.includes('/login'), { timeout: 15000 });
  });
});
