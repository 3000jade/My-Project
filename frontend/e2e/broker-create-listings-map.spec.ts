import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5173';

test.describe('Broker Create Listings — Cadastral Map Functionality Flow', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    // Automatically accept any dialogs (such as beforeunload unsaved changes prompt)
    page.on('dialog', async dialog => {
      await dialog.accept().catch(() => {});
    });

    // Authenticate as broker
    await page.goto(`${BASE_URL}/login`);
    const identifierInput = page.locator('#login-identifier');
    if (await identifierInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await identifierInput.fill('broker@pt.com');
      await page.locator('#login-password').fill('brokerPassword123!');
      await page.locator('button[type="submit"]').click();
      await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 10000 }).catch(() => {});
      await page.waitForLoadState('networkidle').catch(() => {});
    }
  });

  test('navigates to Step 2 Location and verifies Cadastral Map components are mounted', async ({ page }) => {
    await page.goto(`${BASE_URL}/broker/properties/create`);
    await page.waitForLoadState('networkidle');

    // Click Location step indicator (Step 2)
    const step2Indicator = page.locator('div, span, button').filter({ hasText: /^Location$/ }).first();
    await expect(step2Indicator).toBeVisible({ timeout: 10000 });
    await step2Indicator.click();

    // Verify Cadastral Map Section Header & Coordinates Verification
    await expect(page.getByText(/Cadastral Pinpoint Placement/i)).toBeVisible();
    await expect(page.getByText(/Cadastral Coordinates Verified/i)).toBeVisible();

    // Verify Latitude and Longitude input fields exist
    const latInput = page.getByRole('textbox', { name: 'Latitude' });
    const lngInput = page.getByRole('textbox', { name: 'Longitude' });
    await expect(latInput).toBeVisible();
    await expect(lngInput).toBeVisible();

    // Cadastral interactive map container is active
    const mapCanvas = page.locator('[data-testid="cadastral-map-canvas"]');
    await expect(mapCanvas).toBeVisible();

    // Click BGC preset to verify coordinate population
    const bgcBtn = page.getByRole('button', { name: 'BGC, Taguig' });
    await expect(bgcBtn).toBeVisible();
    await bgcBtn.click();
    await page.waitForTimeout(500);

    const populatedLat = await latInput.inputValue();
    const populatedLng = await lngInput.inputValue();
    expect(parseFloat(populatedLat)).toBeGreaterThanOrEqual(4.5);
    expect(parseFloat(populatedLat)).toBeLessThanOrEqual(21.5);
    expect(parseFloat(populatedLng)).toBeGreaterThanOrEqual(116.0);
    expect(parseFloat(populatedLng)).toBeLessThanOrEqual(127.0);
  });

  test('synchronizes coordinates when clicking Cadastral Presets', async ({ page }) => {
    await page.goto(`${BASE_URL}/broker/properties/create`);
    await page.waitForLoadState('networkidle');

    // Advance to Step 2
    const step2Indicator = page.locator('div, span, button').filter({ hasText: /^Location$/ }).first();
    await step2Indicator.click();

    const latInput = page.getByRole('textbox', { name: 'Latitude' });
    const lngInput = page.getByRole('textbox', { name: 'Longitude' });

    // 1. Click Ortigas Center preset
    const ortigasBtn = page.getByRole('button', { name: 'Ortigas Center' });
    await expect(ortigasBtn).toBeVisible();
    await ortigasBtn.click();
    await page.waitForTimeout(500);

    expect(await latInput.inputValue()).toBe('14.5869000');
    expect(await lngInput.inputValue()).toBe('121.0614000');
    await expect(ortigasBtn).toHaveClass(/bg-\[#0F766E\]/);

    // 2. Click Clark Freeport preset
    const clarkBtn = page.getByRole('button', { name: 'Clark Freeport' });
    await expect(clarkBtn).toBeVisible();
    await clarkBtn.click();
    await page.waitForTimeout(500);

    expect(await latInput.inputValue()).toBe('15.1856000');
    expect(await lngInput.inputValue()).toBe('120.5369000');
    await expect(clarkBtn).toHaveClass(/bg-\[#0F766E\]/);

    // 3. Click Cebu IT Park preset
    const cebuBtn = page.getByRole('button', { name: 'Cebu IT Park' });
    await expect(cebuBtn).toBeVisible();
    await cebuBtn.click();
    await page.waitForTimeout(500);

    expect(await latInput.inputValue()).toBe('10.3297000');
    expect(await lngInput.inputValue()).toBe('123.9063000');
    await expect(cebuBtn).toHaveClass(/bg-\[#0F766E\]/);

    // 4. Click BGC, Taguig preset
    const bgcBtn = page.getByRole('button', { name: 'BGC, Taguig' });
    await expect(bgcBtn).toBeVisible();
    await bgcBtn.click();
    await page.waitForTimeout(500);

    expect(await latInput.inputValue()).toBe('14.5547000');
    expect(await lngInput.inputValue()).toBe('121.0494000');
    await expect(bgcBtn).toHaveClass(/bg-\[#0F766E\]/);
  });

  test('supports manual coordinate entry with two-way cadastral badge reflection', async ({ page }) => {
    await page.goto(`${BASE_URL}/broker/properties/create`);
    await page.waitForLoadState('networkidle');

    // Advance to Step 2
    const step2Indicator = page.locator('div, span, button').filter({ hasText: /^Location$/ }).first();
    await step2Indicator.click();

    const latInput = page.getByRole('textbox', { name: 'Latitude' });
    const lngInput = page.getByRole('textbox', { name: 'Longitude' });

    // Manually enter Makati Greenbelt coordinates
    await latInput.fill('14.5521000');
    await lngInput.fill('121.0205000');
    await page.waitForTimeout(500);

    // Verify coordinates reflected in the verified GPS display badge
    await expect(page.getByText(/14.552100/i).first()).toBeVisible();
    await expect(page.getByText(/121.020500/i).first()).toBeVisible();
  });

  test('parses coordinates from Google Maps URL input', async ({ page }) => {
    await page.goto(`${BASE_URL}/broker/properties/create`);
    await page.waitForLoadState('networkidle');

    // Advance to Step 2
    const step2Indicator = page.locator('div, span, button').filter({ hasText: /^Location$/ }).first();
    await step2Indicator.click();

    const urlInput = page.locator('input[placeholder*="maps.app.goo.gl"]');
    await expect(urlInput).toBeVisible();

    // Paste coordinate string resembling Google Maps pin URL
    await urlInput.fill('https://www.google.com/maps/@14.5678000,121.0345000,17z');
    await page.waitForTimeout(600);

    const latInput = page.getByRole('textbox', { name: 'Latitude' });
    const lngInput = page.getByRole('textbox', { name: 'Longitude' });

    expect(await latInput.inputValue()).toBe('14.5678000');
    expect(await lngInput.inputValue()).toBe('121.0345000');
  });

  test('switches Google Maps Embed layers and exercises zoom controls', async ({ page }) => {
    await page.goto(`${BASE_URL}/broker/properties/create`);
    await page.waitForLoadState('networkidle');

    // Advance to Step 2
    const step2Indicator = page.locator('div, span, button').filter({ hasText: /^Location$/ }).first();
    await step2Indicator.click();

    const gmapsIframe = page.locator('iframe[title="Google Maps Cadastral Pinpoint"]');
    await expect(gmapsIframe).toBeVisible({ timeout: 10000 });

    // 1. Verify default Roadmap mode
    await expect(gmapsIframe).toHaveAttribute('src', /t=m/);

    // 2. Switch to Satellite
    const satelliteBtn = page.getByRole('button', { name: 'Satellite' });
    await satelliteBtn.click();
    await page.waitForTimeout(400);
    await expect(gmapsIframe).toHaveAttribute('src', /t=k/);
    await expect(satelliteBtn).toHaveClass(/bg-\[#0F766E\]/);

    // 3. Switch to Hybrid
    const hybridBtn = page.getByRole('button', { name: 'Hybrid' });
    await hybridBtn.click();
    await page.waitForTimeout(400);
    await expect(gmapsIframe).toHaveAttribute('src', /t=h/);
    await expect(hybridBtn).toHaveClass(/bg-\[#0F766E\]/);

    // 4. Zoom in
    const zoomInBtn = page.getByRole('button', { name: 'Zoom in' });
    await zoomInBtn.click();
    await page.waitForTimeout(400);
    await expect(gmapsIframe).toHaveAttribute('src', /z=17/);
  });
});
