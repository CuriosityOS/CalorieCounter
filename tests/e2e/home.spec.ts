import { expect, test } from '@playwright/test';

test('landing page displays hero content and CTA', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Track Your Meals Smarter, Not Harder' })).toBeVisible();
  await expect(page.getByText('AI-Powered Nutrition Tracking')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Get Started' })).toBeVisible();
});
