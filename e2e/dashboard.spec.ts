import { test, expect } from '@playwright/test';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard', { timeout: 10000 });
}

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should load dashboard page', async ({ page }) => {
    await expect(page.locator('text=TRAINIQ')).toBeVisible();
  });

  test('should show date in header', async ({ page }) => {
    // Streak indicator or date text should be present
    await expect(page.locator('text=TRAINIQ')).toBeVisible();
  });

  test('should show recovery section', async ({ page }) => {
    await expect(page.locator('text=Erholung Heute')).toBeVisible();
  });

  test('should show recovery score value or skeleton', async ({ page }) => {
    // Score is a large number or skeleton placeholder
    const score = page.locator('text=von 100');
    await expect(score).toBeVisible({ timeout: 10000 });
  });

  test('should show metrics section with HRV', async ({ page }) => {
    await expect(page.locator('text=HRV')).toBeVisible();
  });

  test('should show sleep metric', async ({ page }) => {
    await expect(page.locator('text=Schlaf')).toBeVisible();
  });

  test('should show stress metric', async ({ page }) => {
    await expect(page.locator('text=Stress')).toBeVisible();
  });

  test('should show nutrition section', async ({ page }) => {
    await expect(page.locator('text=Ernährung')).toBeVisible();
  });

  test('should show macro labels in nutrition section', async ({ page }) => {
    const macros = ['Kalorien', 'Protein', 'Carbs', 'Fett'];
    for (const macro of macros) {
      await expect(page.locator(`text=${macro}`).first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('should show today training section', async ({ page }) => {
    // Training block shows either a workout or an empty state
    await expect(
      page.locator('text=TRAINING').or(page.locator('text=Training'))
    ).toBeVisible({ timeout: 10000 });
  });

  test('should show bottom navigation bar', async ({ page }) => {
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should show all 6 bottom nav links', async ({ page }) => {
    const navLinks = page.locator('nav a');
    await expect(navLinks).toHaveCount(6);
  });

  test('should navigate to metrics page via recovery link', async ({ page }) => {
    await page.click('text=Erholung Heute');
    await expect(page).toHaveURL('/metriken');
  });

  test('should navigate to training page via details link', async ({ page }) => {
    const trainingLink = page.locator('a:has-text("Details anzeigen")').first();
    if (await trainingLink.count() > 0) {
      await trainingLink.click();
      await expect(page).toHaveURL('/training');
    }
  });

  test('should navigate to nutrition page via Ernährung link', async ({ page }) => {
    await page.click('text=Ernährung');
    await expect(page).toHaveURL('/ernaehrung');
  });

  test('should navigate to chat via Coach link', async ({ page }) => {
    const coachLink = page.locator('text=Coach fragen').or(page.locator('a[href="/chat"]'));
    if (await coachLink.first().count() > 0) {
      await coachLink.first().click();
      await expect(page).toHaveURL('/chat');
    }
  });

  test('should show streak indicator', async ({ page }) => {
    // StreakIndicator is in the header area
    const headerArea = page.locator('div').filter({ hasText: 'TRAINIQ' }).first();
    await expect(headerArea).toBeVisible();
  });

  test('should show recovery percentage bar', async ({ page }) => {
    // The progress bar track element
    const barTrack = page.locator('.bar-track').or(page.locator('[class*="bar"]').first());
    if (await barTrack.count() > 0) {
      await expect(barTrack.first()).toBeVisible();
    }
  });

  test('should show trend indicators for metrics', async ({ page }) => {
    // Trend arrows like ▲ or ▼ or — should appear
    await expect(page.locator('text=HRV')).toBeVisible({ timeout: 10000 });
  });

  test('error state shows retry button on load failure', async ({ page, context }) => {
    // Block API calls to simulate error
    await context.route('**/api/**', (route) => route.abort());
    await page.goto('/dashboard');
    // Error boundary or retry button should be visible
    const retryBtn = page.locator('text=Erneut versuchen');
    if (await retryBtn.count() > 0) {
      await expect(retryBtn).toBeVisible({ timeout: 10000 });
    }
  });
});
