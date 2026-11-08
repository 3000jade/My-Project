# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: frontend\e2e\properties-page.spec.ts >> Properties Page - Comprehensive Feature Suite >> Layout: toggles seamlessly between Split Map and Grid View
- Location: frontend\e2e\properties-page.spec.ts:58:3

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/properties", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Properties Page - Comprehensive Feature Suite', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     // Navigate to /properties and wait for network activity to settle
> 6   |     await page.goto('/properties');
      |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  7   |     await page.waitForLoadState('networkidle');
  8   |   });
  9   | 
  10  |   test('Search Bar: expands and collapses cleanly without layout shifts', async ({ page }) => {
  11  |     await page.setViewportSize({ width: 1536, height: 742 });
  12  | 
  13  |     const toggleButton = page.getByTestId('search-bar-collapse-toggle');
  14  |     await expect(toggleButton).toBeVisible();
  15  |     await expect(toggleButton).toContainText(/compact/i);
  16  | 
  17  |     // Verify secondary popovers and district scroller are initially visible
  18  |     const propertyTypeFilter = page.getByText(/All Property Types/i).first();
  19  |     await expect(propertyTypeFilter).toBeVisible();
  20  | 
  21  |     const districtPill = page.getByText(/All Metro Manila/i).first();
  22  |     await expect(districtPill).toBeVisible();
  23  | 
  24  |     // Click collapse / compact
  25  |     await toggleButton.click();
  26  |     await expect(toggleButton).toContainText(/expand/i);
  27  | 
  28  |     // Verify secondary filters and district scroller are hidden in collapsed state
  29  |     await expect(propertyTypeFilter).not.toBeVisible();
  30  |     await expect(districtPill).not.toBeVisible();
  31  | 
  32  |     // Click expand again
  33  |     await toggleButton.click();
  34  |     await expect(toggleButton).toContainText(/compact/i);
  35  |     await expect(propertyTypeFilter).toBeVisible();
  36  |     await expect(districtPill).toBeVisible();
  37  |   });
  38  | 
  39  |   test('All Filters Drawer: opens and closes via filter action button', async ({ page }) => {
  40  |     await page.setViewportSize({ width: 1536, height: 742 });
  41  | 
  42  |     const filtersButton = page.getByRole('button', { name: /^filters/i }).first();
  43  |     await expect(filtersButton).toBeVisible();
  44  |     await filtersButton.click();
  45  | 
  46  |     // Drawer should open with "All Filters" header
  47  |     const drawerHeading = page.getByRole('heading', { name: /all filters/i }).first();
  48  |     await expect(drawerHeading).toBeVisible();
  49  | 
  50  |     // Close the drawer
  51  |     const closeBtn = page.getByRole('button', { name: /close/i }).or(page.locator('button:has(.material-symbols-outlined:text("close"))')).first();
  52  |     if (await closeBtn.isVisible()) {
  53  |       await closeBtn.click();
  54  |       await expect(drawerHeading).not.toBeVisible();
  55  |     }
  56  |   });
  57  | 
  58  |   test('Layout: toggles seamlessly between Split Map and Grid View', async ({ page }) => {
  59  |     await page.setViewportSize({ width: 1536, height: 742 });
  60  | 
  61  |     const gridViewBtn = page.getByRole('button', { name: /grid view/i });
  62  |     const splitMapBtn = page.getByRole('button', { name: /split map/i });
  63  | 
  64  |     await expect(gridViewBtn).toBeVisible();
  65  |     await expect(splitMapBtn).toBeVisible();
  66  | 
  67  |     // In initial split view, the map container should be present and visible
  68  |     const mapContainer = page.locator('.leaflet-container, [data-testid="interactive-property-map"]').first();
  69  |     await expect(mapContainer).toBeVisible();
  70  | 
  71  |     // Switch to Grid View
  72  |     await gridViewBtn.click();
  73  |     await page.waitForTimeout(500);
  74  | 
  75  |     // Map container should now be hidden or unmounted in Grid View
  76  |     await expect(mapContainer).not.toBeVisible();
  77  | 
  78  |     // Switch back to Split View
  79  |     await splitMapBtn.click();
  80  |     await page.waitForTimeout(500);
  81  |     await expect(mapContainer).toBeVisible();
  82  |   });
  83  | 
  84  |   test('Map HUD Controls: interacts with layer modes and fit-all controls', async ({ page }) => {
  85  |     await page.setViewportSize({ width: 1536, height: 742 });
  86  | 
  87  |     // HUD Pill buttons
  88  |     const streetBtn = page.getByRole('button', { name: /^Street$/i });
  89  |     const satelliteBtn = page.getByRole('button', { name: /^Satellite$/i });
  90  |     const districtsBtn = page.getByRole('button', { name: /Districts/i });
  91  |     const fitAllBtn = page.getByRole('button', { name: /Fit All/i });
  92  |     const moveSearchBtn = page.getByRole('button', { name: /Search on Move|Move/i });
  93  | 
  94  |     await expect(streetBtn).toBeVisible();
  95  |     await expect(satelliteBtn).toBeVisible();
  96  |     await expect(districtsBtn).toBeVisible();
  97  |     await expect(fitAllBtn).toBeVisible();
  98  |     await expect(moveSearchBtn).toBeVisible();
  99  | 
  100 |     // Switch to Satellite layer
  101 |     await satelliteBtn.click();
  102 |     await expect(satelliteBtn).toHaveClass(/bg-\[#0F766E\]/);
  103 | 
  104 |     // Switch back to Street layer
  105 |     await streetBtn.click();
  106 |     await expect(streetBtn).toHaveClass(/bg-\[#0F766E\]/);
```