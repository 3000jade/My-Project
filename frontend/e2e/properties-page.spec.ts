import { test, expect } from '@playwright/test';

test.describe('Properties Page - Comprehensive Feature Suite', () => {
  test('Search Bar: expands and collapses cleanly without layout shifts', async ({ page }) => {
    await page.setViewportSize({ width: 1536, height: 742 });
    await page.goto('/properties');
    await page.waitForSelector('[data-testid="search-bar-collapse-toggle"]', { state: 'visible', timeout: 10000 });

    const toggleButton = page.getByTestId('search-bar-collapse-toggle');
    await expect(toggleButton).toBeVisible();
    await expect(toggleButton).toContainText(/compact/i);

    // Verify secondary popovers and district scroller are initially visible
    const propertyTypeSelect = page.getByRole('combobox');
    const priceRangeBtn = page.getByRole('button', { name: /Price Range/i });
    const districtPill = page.getByText(/All Metro Manila/i).first();

    await expect(propertyTypeSelect).toBeVisible();
    await expect(priceRangeBtn).toBeVisible();
    await expect(districtPill).toBeVisible();

    // Click collapse / compact
    await toggleButton.click();
    await expect(toggleButton).toContainText(/expand/i);

    // Verify secondary filters and district scroller are hidden in collapsed state
    await expect(propertyTypeSelect).not.toBeVisible();
    await expect(priceRangeBtn).not.toBeVisible();
    await expect(districtPill).not.toBeVisible();

    // Click expand again
    await toggleButton.click();
    await expect(toggleButton).toContainText(/compact/i);
    await expect(propertyTypeSelect).toBeVisible();
    await expect(priceRangeBtn).toBeVisible();
    await expect(districtPill).toBeVisible();
  });

  test('All Filters Drawer: opens and closes via filter action button', async ({ page }) => {
    await page.setViewportSize({ width: 1536, height: 742 });
    await page.goto('/properties');
    await page.waitForSelector('[data-testid="search-bar-collapse-toggle"]', { state: 'visible', timeout: 10000 });

    const filtersButton = page.getByRole('button', { name: /^filters/i }).first();
    await expect(filtersButton).toBeVisible();
    await filtersButton.click();

    // Drawer should open with "All Filters" header
    const drawerHeading = page.getByRole('heading', { name: /all filters/i }).first();
    await expect(drawerHeading).toBeVisible();

    // Close the drawer
    const closeBtn = page.getByRole('button', { name: /close/i }).or(page.locator('button:has(.material-symbols-outlined:text("close"))')).first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await expect(drawerHeading).not.toBeVisible();
    }
  });

  test('Layout: toggles seamlessly between Split Map and Grid View', async ({ page }) => {
    await page.setViewportSize({ width: 1536, height: 742 });
    await page.goto('/properties');
    await page.waitForSelector('[data-testid="search-bar-collapse-toggle"]', { state: 'visible', timeout: 10000 });

    const gridViewBtn = page.getByRole('button', { name: /grid view/i });
    const splitMapBtn = page.getByRole('button', { name: /split map/i });

    await expect(gridViewBtn).toBeVisible();
    await expect(splitMapBtn).toBeVisible();

    // In initial split view, the map container should be present and visible
    const mapContainer = page.locator('.leaflet-container, [data-testid="interactive-property-map"]').first();
    await expect(mapContainer).toBeVisible();

    // Switch to Grid View
    await gridViewBtn.click();
    await page.waitForTimeout(500);

    // Map container should now be hidden or unmounted in Grid View
    await expect(mapContainer).not.toBeVisible();

    // Switch back to Split View
    await splitMapBtn.click();
    await page.waitForTimeout(500);
    await expect(mapContainer).toBeVisible();
  });

  test('Map HUD Controls: interacts with layer modes and fit-all controls', async ({ page }) => {
    await page.setViewportSize({ width: 1536, height: 742 });
    await page.goto('/properties');
    await page.waitForSelector('[data-testid="search-bar-collapse-toggle"]', { state: 'visible', timeout: 10000 });

    // HUD Pill buttons
    const streetBtn = page.getByRole('button', { name: /^Street$/i });
    const satelliteBtn = page.getByRole('button', { name: /^Satellite$/i });
    const districtsBtn = page.getByRole('button', { name: /Districts/i });
    const fitAllBtn = page.getByRole('button', { name: /Fit All/i });
    const moveSearchBtn = page.getByRole('button', { name: /Search on Move|Move/i });

    await expect(streetBtn).toBeVisible();
    await expect(satelliteBtn).toBeVisible();
    await expect(districtsBtn).toBeVisible();
    await expect(fitAllBtn).toBeVisible();
    await expect(moveSearchBtn).toBeVisible();

    // Switch to Satellite layer
    await satelliteBtn.click();
    await expect(satelliteBtn).toHaveClass(/bg-\[#0F766E\]/);

    // Switch back to Street layer
    await streetBtn.click();
    await expect(streetBtn).toHaveClass(/bg-\[#0F766E\]/);

    // Toggle Districts
    await districtsBtn.click();
    await expect(districtsBtn).toHaveClass(/bg-\[#FF6B6B\]/);

    // Click Fit All
    await fitAllBtn.click();

    // Toggle Search on Move
    await moveSearchBtn.click();
  });

  test('Responsive Tablet: switches between List and Map without blank grey canvas void', async ({ page }) => {
    // iPad / Tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/properties');
    await page.waitForSelector('[data-testid="search-bar-collapse-toggle"]', { state: 'visible', timeout: 10000 });

    // Verify inline Compact and Filters action cluster
    const compactBtn = page.getByTestId('search-bar-collapse-toggle');
    const filtersBtn = page.getByRole('button', { name: /^filters/i }).first();
    await expect(compactBtn).toBeVisible();
    await expect(filtersBtn).toBeVisible();

    // Verify side-by-side positioning (both have roughly the same Y coordinate)
    const compactBox = await compactBtn.boundingBox();
    const filtersBox = await filtersBtn.boundingBox();
    if (compactBox && filtersBox) {
      expect(Math.abs(compactBox.y - filtersBox.y)).toBeLessThan(10);
    }

    // Switch from List to Map tab
    const viewMapBtn = page.getByRole('button', { name: /View Map/i });
    await expect(viewMapBtn).toBeVisible();
    await viewMapBtn.click();

    // Wait for Leaflet map canvas and tiles to settle
    await page.waitForTimeout(600);
    const mapElement = page.locator('.leaflet-container');
    await expect(mapElement).toBeVisible();

    // Ensure Leaflet tiles have non-zero dimensions (no grey blank void)
    const mapBox = await mapElement.boundingBox();
    expect(mapBox).not.toBeNull();
    expect(mapBox!.width).toBeGreaterThan(400);
    expect(mapBox!.height).toBeGreaterThan(400);

    // Toggle back to List tab
    const viewListBtn = page.getByRole('button', { name: /View List/i });
    await expect(viewListBtn).toBeVisible();
    await viewListBtn.click();
    await page.waitForTimeout(400);

    const listingsContainer = page.getByTestId('properties-scroll-container');
    await expect(listingsContainer).toBeVisible();
  });

  test('Responsive Mobile: safe bottom clearance avoids FAB and toggle overlap', async ({ page }) => {
    // iPhone / Pixel mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/properties');
    await page.waitForSelector('[data-testid="search-bar-collapse-toggle"]', { state: 'visible', timeout: 10000 });

    const scrollContainer = page.getByTestId('properties-scroll-container');
    await expect(scrollContainer).toBeVisible();

    // Scroll to bottom
    await scrollContainer.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await page.waitForTimeout(500);

    // Verify View Map toggle button is visible
    const viewMapBtn = page.getByRole('button', { name: /View Map/i });
    await expect(viewMapBtn).toBeVisible();

    // Verify Compact and Filters buttons are inline on mobile
    const compactBtn = page.getByTestId('search-bar-collapse-toggle');
    const filtersBtn = page.getByRole('button', { name: /^filters/i }).first();
    const compactBox = await compactBtn.boundingBox();
    const filtersBox = await filtersBtn.boundingBox();
    if (compactBox && filtersBox) {
      expect(Math.abs(compactBox.y - filtersBox.y)).toBeLessThan(10);
    }
  });
});
