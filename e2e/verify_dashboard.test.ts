import { test, expect } from '@playwright/test';

test('verify dashboard and curriculum map', async ({ page }) => {
  await page.goto('http://localhost:3000/');

  // Bypass onboarding
  await page.evaluate(() => {
    localStorage.setItem('onboarding-completed', 'true');
  });
  await page.reload();

  // Navigate to Dashboard tab
  await page.click('button[role="tab"]:has-text("Dashboard")');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'dashboard_view.png', fullPage: true });

  // Check for Curriculum Map or Skill nodes
  const nodes = await page.locator('.skill-node').count();
  console.log('Skill nodes found:', nodes);
});
