import { test, expect } from '@playwright/test';

async function loginAs(page: any, email: string, password: string) {
  await page.goto('http://localhost:5173/login');
  const identifierInput = page.locator('#login-identifier');
  if (await identifierInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await identifierInput.fill(email);
    await page.locator('#login-password').fill(password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL((url: URL) => !url.pathname.includes('/login'), { timeout: 10000 }).catch(() => {});
    await page.waitForLoadState('networkidle').catch(() => {});
  }
}

test.describe('Full-Stack Account Profile Management & Persistence', () => {
  test('Client profile inline edit and reload persistence', async ({ page }) => {
    await loginAs(page, 'client@pt.com', 'clientPassword123!');
    await page.goto('http://localhost:5173/client/profile');

    await expect(page.getByTestId('client-profile-studio')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#studio-email')).toHaveAttribute('readonly', '');

    await page.locator('#studio-first-name').fill('Sophia');
    await page.locator('#studio-last-name').fill('Laurel');
    await page.locator('#studio-phone').fill('+63 917 777 8888');
    await page.locator('#client-location').fill('Bonifacio Global City - High Street');

    const saveBar = page.getByTestId('studio-save-bar');
    await expect(saveBar).toBeVisible();
    await saveBar.getByRole('button', { name: /Save Changes/i }).click();
    await expect(saveBar).not.toBeVisible({ timeout: 10000 });

    await page.reload();
    await expect(page.locator('#studio-first-name')).toHaveValue('Sophia');
    await expect(page.locator('#studio-last-name')).toHaveValue('Laurel');
    await expect(page.locator('#studio-phone')).toHaveValue('+63 917 777 8888');
    await expect(page.locator('#client-location')).toHaveValue('Bonifacio Global City - High Street');
  });

  test('Broker executive profile inline edit, Change Password, and persistence', async ({ page }) => {
    await loginAs(page, 'broker@pt.com', 'brokerPassword123!');
    await page.goto('http://localhost:5173/broker/profile');

    await expect(page.getByTestId('broker-profile-studio')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#studio-email')).toHaveAttribute('readonly', '');

    await page.locator('#studio-first-name').fill('Alexander');
    await page.locator('#studio-last-name').fill('Sterling');
    await page.locator('#broker-firm-name').fill('Sterling & Partners Luxury Real Estate Ltd.');

    const saveBar = page.getByTestId('studio-save-bar');
    await expect(saveBar).toBeVisible();
    await saveBar.getByRole('button', { name: /Save Changes/i }).click();
    await expect(saveBar).not.toBeVisible({ timeout: 10000 });

    await page.reload();
    await expect(page.locator('#studio-first-name')).toHaveValue('Alexander');
    await expect(page.locator('#studio-last-name')).toHaveValue('Sterling');
    await expect(page.locator('#broker-firm-name')).toHaveValue('Sterling & Partners Luxury Real Estate Ltd.');

    // Verify Broker can access Update Password in Security tab
    await page.getByRole('tab', { name: /Security/i }).click();
    await expect(page.getByRole('button', { name: /Update Password/i })).toBeVisible();
  });

  test('Agent profile inline edit with split names and HR biodata persistence', async ({ page }) => {
    await loginAs(page, 'agent@pt.com', 'agentPassword123!');
    await page.goto('http://localhost:5173/agent/profile');

    await expect(page.getByTestId('agent-profile-studio')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#studio-email')).toHaveAttribute('readonly', '');

    await page.locator('#studio-first-name').fill('Elena');
    await page.locator('#studio-last-name').fill('Rossi');
    await page.locator('#agent-emergency-name').fill('Maria Rossi');
    await page.locator('#agent-emergency-phone').fill('+63 917 555 1234');

    const saveBar = page.getByTestId('studio-save-bar');
    await expect(saveBar).toBeVisible();
    await saveBar.getByRole('button', { name: /Save Changes/i }).click();
    await expect(saveBar).not.toBeVisible({ timeout: 10000 });

    await page.reload();
    await expect(page.locator('#studio-first-name')).toHaveValue('Elena');
    await expect(page.locator('#studio-last-name')).toHaveValue('Rossi');
    await expect(page.locator('#agent-emergency-name')).toHaveValue('Maria Rossi');
    await expect(page.locator('#agent-emergency-phone')).toHaveValue('+63 917 555 1234');
  });
});
