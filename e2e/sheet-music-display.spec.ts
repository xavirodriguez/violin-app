import { test, expect } from '@playwright/test';

test.describe('SheetMusicDisplay', () => {
  test('should render the sheet music correctly', async ({ page }) => {
    // Navigate to the test page
    await page.goto('/test-pages/sheet-music');

    // Check that the loading indicator is visible
    await expect(page.getByText('Loading Sheet Music...')).toBeVisible({ timeout: 10000 });

    // Wait for the OSMD container to be ready and rendered.
    // Give it a longer timeout as OSMD can be slow to initialize.
    await expect(page.locator('div[id^="osmd-container-"]')).toBeVisible({ timeout: 60000 });

    // Wait for the SVG to be rendered
    await expect(page.locator('svg')).toBeVisible();

    // The loading indicator should now be gone
    await expect(page.getByText('Loading Sheet Music...')).not.toBeVisible();

    // Take a screenshot and compare it to the baseline
    await expect(page).toHaveScreenshot('sheet-music-display.png');
  });

  test('should toggle dark mode', async ({ page }) => {
    // Navigate to the test page
    await page.goto('/test-pages/sheet-music');

    // Wait for render
    await expect(page.locator('div[id^="osmd-container-"]')).toBeVisible({ timeout: 60000 });

    // Click the dark mode toggle button
    await page.getByRole('button', { name: 'Toggle Dark Mode' }).click();

    // Wait for the component to re-render with dark mode
    // In dark mode, OSMD adds a background rect. Let's check for it.
    await expect(page.locator('.osmd-background')).toBeVisible();

    // Take a screenshot and compare it to the baseline
    await expect(page).toHaveScreenshot('sheet-music-display-dark-mode.png');
  });
});
