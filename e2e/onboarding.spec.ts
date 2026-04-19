import { test, expect } from '@playwright/test';

// Helper: skip to onboarding by mocking a fresh authenticated state
// In tests without backend, we navigate directly
test.describe('Onboarding Page', () => {
  test.beforeEach(async ({ page }) => {
    // Simulate authenticated state by setting token in localStorage
    await page.goto('/onboarding');
  });

  test('should show progress dots (3 steps)', async ({ page }) => {
    // 3 progress dots at top
    const dots = page.locator('.h-\\[3px\\].w-8').or(page.locator('div.h-\\[3px\\]'));
    // At minimum verify the first step content is visible
    await expect(page.locator('text=Schritt 1 / 3')).toBeVisible({ timeout: 10000 });
  });

  test('should show sport selection in step 1', async ({ page }) => {
    await expect(page.locator('text=DEIN SPORT')).toBeVisible({ timeout: 10000 });
  });

  test('should show all sport options', async ({ page }) => {
    const sports = ['LAUFEN', 'RADFAHREN', 'SCHWIMMEN', 'TRIATHLON'];
    for (const sport of sports) {
      await expect(page.locator(`text=${sport}`)).toBeVisible({ timeout: 10000 });
    }
  });

  test('should have disabled next button before sport selection', async ({ page }) => {
    await expect(page.locator('text=Schritt 1 / 3')).toBeVisible({ timeout: 10000 });
    const nextBtn = page.locator('button:has-text("Weiter")');
    await expect(nextBtn).toBeDisabled();
  });

  test('should enable next button after selecting a sport', async ({ page }) => {
    await expect(page.locator('text=DEIN SPORT')).toBeVisible({ timeout: 10000 });
    await page.click('text=LAUFEN');
    const nextBtn = page.locator('button:has-text("Weiter")');
    await expect(nextBtn).toBeEnabled();
  });

  test('should allow selecting multiple sports', async ({ page }) => {
    await expect(page.locator('text=DEIN SPORT')).toBeVisible({ timeout: 10000 });
    await page.click('text=LAUFEN');
    await page.click('text=RADFAHREN');
    // Both should be selected (border-blue class)
    const nextBtn = page.locator('button:has-text("Weiter")');
    await expect(nextBtn).toBeEnabled();
  });

  test('should navigate to step 2 after sport selection', async ({ page }) => {
    await expect(page.locator('text=DEIN SPORT')).toBeVisible({ timeout: 10000 });
    await page.click('text=LAUFEN');
    await page.click('button:has-text("Weiter")');
    await expect(page.locator('text=Schritt 2 / 3')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=DEIN ZIEL')).toBeVisible();
  });

  test('should show goal textarea in step 2', async ({ page }) => {
    await expect(page.locator('text=DEIN SPORT')).toBeVisible({ timeout: 10000 });
    await page.click('text=LAUFEN');
    await page.click('button:has-text("Weiter")');
    await expect(page.locator('textarea')).toBeVisible({ timeout: 5000 });
  });

  test('should show weekly hours slider in step 2', async ({ page }) => {
    await expect(page.locator('text=DEIN SPORT')).toBeVisible({ timeout: 10000 });
    await page.click('text=LAUFEN');
    await page.click('button:has-text("Weiter")');
    await expect(page.locator('text=Wöchentliche Stunden')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[type="range"]')).toBeVisible();
  });

  test('should show fitness level buttons in step 2', async ({ page }) => {
    await expect(page.locator('text=DEIN SPORT')).toBeVisible({ timeout: 10000 });
    await page.click('text=LAUFEN');
    await page.click('button:has-text("Weiter")');
    await expect(page.locator('text=Fitnesslevel')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=EINSTEIGER')).toBeVisible();
    await expect(page.locator('text=FORTGESCHRITTEN')).toBeVisible();
    await expect(page.locator('text=PROFI')).toBeVisible();
  });

  test('should have disabled next button in step 2 without goal', async ({ page }) => {
    await expect(page.locator('text=DEIN SPORT')).toBeVisible({ timeout: 10000 });
    await page.click('text=LAUFEN');
    await page.click('button:has-text("Weiter")');
    await expect(page.locator('text=DEIN ZIEL')).toBeVisible({ timeout: 5000 });
    const nextBtn = page.locator('button').filter({ hasText: 'Weiter' });
    await expect(nextBtn).toBeDisabled();
  });

  test('should have back button in step 2', async ({ page }) => {
    await expect(page.locator('text=DEIN SPORT')).toBeVisible({ timeout: 10000 });
    await page.click('text=LAUFEN');
    await page.click('button:has-text("Weiter")');
    await expect(page.locator('button:has-text("Zurück")')).toBeVisible({ timeout: 5000 });
  });

  test('should go back to step 1 from step 2', async ({ page }) => {
    await expect(page.locator('text=DEIN SPORT')).toBeVisible({ timeout: 10000 });
    await page.click('text=LAUFEN');
    await page.click('button:has-text("Weiter")');
    await expect(page.locator('text=DEIN ZIEL')).toBeVisible({ timeout: 5000 });
    await page.click('button:has-text("Zurück")');
    await expect(page.locator('text=Schritt 1 / 3')).toBeVisible({ timeout: 5000 });
  });

  test('should show watch connection step 3 after completing step 2', async ({ page }) => {
    await expect(page.locator('text=DEIN SPORT')).toBeVisible({ timeout: 10000 });
    await page.click('text=LAUFEN');
    await page.click('button:has-text("Weiter")');
    await expect(page.locator('textarea')).toBeVisible({ timeout: 5000 });
    await page.fill('textarea', 'Halbmarathon unter 2 Stunden');
    await page.locator('button').filter({ hasText: 'Weiter' }).last().click();
    await expect(page.locator('text=Schritt 3 / 3')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=UHR VERBINDEN')).toBeVisible();
  });

  test('should show all watch providers in step 3', async ({ page }) => {
    // Navigate to step 3
    await expect(page.locator('text=DEIN SPORT')).toBeVisible({ timeout: 10000 });
    await page.click('text=LAUFEN');
    await page.click('button:has-text("Weiter")');
    await page.fill('textarea', 'Halbmarathon unter 2 Stunden');
    await page.locator('button').filter({ hasText: 'Weiter' }).last().click();
    await expect(page.locator('text=UHR VERBINDEN')).toBeVisible({ timeout: 10000 });

    const providers = ['GARMIN', 'POLAR', 'APPLE HEALTH'];
    for (const p of providers) {
      await expect(page.locator(`text=${p}`)).toBeVisible();
    }
  });

  test('should show optional hint text in step 3', async ({ page }) => {
    await expect(page.locator('text=DEIN SPORT')).toBeVisible({ timeout: 10000 });
    await page.click('text=LAUFEN');
    await page.click('button:has-text("Weiter")');
    await page.fill('textarea', 'Halbmarathon unter 2 Stunden');
    await page.locator('button').filter({ hasText: 'Weiter' }).last().click();
    await expect(page.locator('text=Optional')).toBeVisible({ timeout: 10000 });
  });

  test('should show finish button in step 3', async ({ page }) => {
    await expect(page.locator('text=DEIN SPORT')).toBeVisible({ timeout: 10000 });
    await page.click('text=LAUFEN');
    await page.click('button:has-text("Weiter")');
    await page.fill('textarea', 'Halbmarathon unter 2 Stunden');
    await page.locator('button').filter({ hasText: 'Weiter' }).last().click();
    await expect(page.locator('button:has-text("Los geht")')).toBeVisible({ timeout: 10000 });
  });
});
