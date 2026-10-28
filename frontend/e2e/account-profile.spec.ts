import { test, expect } from '@playwright/test';

test.describe('Full-Stack Account Profile Management & Persistence', () => {
  test('Client profile edit and reload persistence', async ({ page }) => {
    // Authenticate as client
    await page.goto('http://localhost:5173/login');
    const identifierInput = page.locator('#login-identifier');
    if (await identifierInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await identifierInput.fill('client@pt.com');
      await page.locator('#login-password').fill('clientPassword123!');
      await page.locator('button[type="submit"]').click();
      await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 10000 }).catch(() => {});
      await page.waitForLoadState('networkidle').catch(() => {});
    }

    await page.goto('http://localhost:5173/client/profile');

    // Verify header
    await expect(page.getByRole('heading', { name: /My Profile & Settings/i })).toBeVisible({ timeout: 10000 });

    // Open Edit Profile dialog
    const editBtn = page.getByRole('button', { name: /Edit Profile/i });
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // Verify dialog opens
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/Edit Client Profile/i)).toBeVisible();

    // Modify contact and preference fields
    const nameInput = dialog.locator('input[name="name"]');
    await nameInput.fill('Sophia Isabella Laurel');

    const phoneInput = dialog.locator('input[name="phone"]');
    await phoneInput.fill('+63 917 777 8888');

    const locationInput = dialog.locator('input[name="preferredLocation"]');
    await locationInput.fill('Bonifacio Global City - High Street');

    // Submit using Coral Save Changes CTA
    const saveBtn = dialog.getByRole('button', { name: /Save Changes/i });
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    // Dialog closes
    await expect(dialog).not.toBeVisible();

    // Verify updated values in the page
    await expect(page.getByText('+63 917 777 8888')).toBeVisible();
    await expect(page.getByText('Bonifacio Global City - High Street')).toBeVisible();

    // Reload page and verify persistence
    await page.reload();
    await expect(page.getByText('+63 917 777 8888')).toBeVisible();
    await expect(page.getByText('Bonifacio Global City - High Street')).toBeVisible();
  });

  test('Broker executive profile edit and persistence', async ({ page }) => {
    // Authenticate as broker
    await page.goto('http://localhost:5173/login');
    const identifierInput = page.locator('#login-identifier');
    if (await identifierInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await identifierInput.fill('broker@pt.com');
      await page.locator('#login-password').fill('brokerPassword123!');
      await page.locator('button[type="submit"]').click();
      await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 10000 }).catch(() => {});
      await page.waitForLoadState('networkidle').catch(() => {});
    }

    await page.goto('http://localhost:5173/broker/profile');

    // Verify broker executive header
    await expect(page.getByRole('heading', { name: /Broker Executive Profile/i })).toBeVisible({ timeout: 10000 });

    // Open Edit Profile dialog
    const editBtn = page.getByRole('button', { name: /Edit Profile/i });
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // Verify dialog opens
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/Edit Broker Profile/i)).toBeVisible();

    // Modify firm name
    const firmInput = dialog.locator('input[name="firm_name"]');
    await firmInput.fill('Sterling & Partners Luxury Real Estate Ltd.');

    // Save
    const saveBtn = dialog.getByRole('button', { name: /Save Profile/i });
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    // Verify persistence
    await expect(dialog).not.toBeVisible();
    await expect(page.getByText('Sterling & Partners Luxury Real Estate Ltd.')).toBeVisible();

    // Reload page
    await page.reload();
    await expect(page.getByText('Sterling & Partners Luxury Real Estate Ltd.')).toBeVisible();
  });
});
