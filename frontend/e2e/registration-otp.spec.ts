import { test, expect } from '@playwright/test';

test.describe('Client Self-Registration with In-Place Email OTP Verification', () => {
  test('Complete 2-step registration workflow: credentials intake -> email OTP -> client dashboard auto-login', async ({ page }) => {
    // 1. Navigate to /register
    await page.goto('http://localhost:5173/register');
    await page.waitForLoadState('domcontentloaded');

    // 2. Verify Step 1 intake form elements
    await expect(page.getByRole('heading', { name: /Create an account/i })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Step 01 / Identity Onboarding')).toBeVisible();

    const uniqueEmail = `test.client.${Date.now()}@luxury.com`;

    // 3. Fill in Step 1 credentials
    await page.locator('#reg-fullname').fill('Katarina Rostova');
    await page.locator('#reg-email').fill(uniqueEmail);
    await page.locator('#reg-phone').fill('+63 917 888 9999');
    await page.locator('#reg-password').fill('LuxuryPass123!@#');
    await page.locator('#reg-confirm-password').fill('LuxuryPass123!@#');

    // 4. Click Continue to Verification
    const continueBtn = page.getByRole('button', { name: /Continue to Verification/i });
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();

    // 5. Verify Step 2 In-Place OTP screen mounts smoothly
    await expect(page.locator('text=Step 02 / Verification')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: /Verify your email/i })).toBeVisible();
    await expect(page.getByText(uniqueEmail, { exact: true })).toBeVisible();

    // Verify 6 OTP input boxes
    for (let i = 1; i <= 6; i++) {
      await expect(page.locator(`input[aria-label="Digit ${i} of 6"]`)).toBeVisible();
    }

    // 6. Enter 6-digit test OTP
    await page.locator('input[aria-label="Digit 1 of 6"]').fill('1');
    await page.locator('input[aria-label="Digit 2 of 6"]').fill('2');
    await page.locator('input[aria-label="Digit 3 of 6"]').fill('3');
    await page.locator('input[aria-label="Digit 4 of 6"]').fill('4');
    await page.locator('input[aria-label="Digit 5 of 6"]').fill('5');
    await page.locator('input[aria-label="Digit 6 of 6"]').fill('6');

    // 7. Verify auto-submit or click Verify
    const verifyBtn = page.getByRole('button', { name: /Verify & Complete Registration/i });
    if (await verifyBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await verifyBtn.click();
    }

    // 8. Assert successful landing on /client/dashboard
    await page.waitForURL(url => url.pathname.includes('/client/dashboard'), { timeout: 15000 });
    await expect(page).toHaveURL(/.*\/client\/dashboard/);
    await expect(page.getByRole('heading', { name: /Welcome back, Katarina/i })).toBeVisible({ timeout: 10000 });
  });
});
