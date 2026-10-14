import { test, expect } from '@playwright/test';

test.describe('Property Flow', () => {
  test('should navigate to properties and load listings', async ({ page }) => {
    await page.goto('/');

    // Assuming there's a link to properties in the navigation
    const propertiesLink = page.getByRole('navigation').getByRole('link', { name: /properties/i }).first();
    await expect(propertiesLink).toBeVisible();
    await propertiesLink.click();

    // Verify URL changed to /properties or similar
    await expect(page).toHaveURL(/.*properties/);
    
    // Wait for the property cards to render by checking for h3
    const propertyCard = page.locator('h3').first();
    await expect(propertyCard).toBeVisible();
    
    // Find the property card div using CSS selector
    const cardElement = page.locator('div[role="button"][aria-label^="View details for"]').first();
    await expect(cardElement).toBeVisible();
    
    // Wait for animations/virtualizer to settle
    await page.waitForTimeout(1000);
    
    // Use evaluate to avoid detached from DOM issues due to re-renders
    await cardElement.evaluate((node) => node.click());

    // Verify URL changed to a property details page (e.g., /properties/some-id)
    await expect(page).toHaveURL(/.*properties\/.+/);
    
    // Check if the property details are loaded (e.g. Back button, Price, Area, etc.)
    await expect(page.locator('h1').first()).toBeVisible();
  });
});

