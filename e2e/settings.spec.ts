import { test, expect } from '@playwright/test'

test('Settings Dialog Test', async ({ page }) => {
  await page.goto('http://localhost:3000')

  // Click the settings button
  await page.getByLabel('Audio Settings').click()

  // Wait for the dialog to appear
  await page.waitForSelector('text=Audio Settings')

  // Check that the dialog is visible
  expect(await page.isVisible('text=Audio Settings')).toBe(true)

  // Take a screenshot
  await page.screenshot({ path: 'settings_dialog.png' })
})
