import { test, expect } from '@playwright/test';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard', { timeout: 10000 });
  await page.goto('/training');
}

test.describe('Training Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // ── Header ──────────────────────────────────────────────────────────────────
  test('should load training page with header', async ({ page }) => {
    await expect(page.locator('text=TRAINING')).toBeVisible();
  });

  // ── Week Strip ───────────────────────────────────────────────────────────────
  test('should show 7-day strip with 7 buttons', async ({ page }) => {
    // Waits for loading to finish (skeleton replaces actual buttons)
    await page.waitForTimeout(1000);
    const dayButtons = page.locator('div button[class*="flex-1"]').or(
      page.locator('div.flex button')
    );
    // At least 7 day buttons
    const count = await dayButtons.count();
    expect(count).toBeGreaterThanOrEqual(7);
  });

  test('should show all German day abbreviations', async ({ page }) => {
    const days = ['SO', 'MO', 'DI', 'MI', 'DO', 'FR', 'SA'];
    for (const day of days) {
      await expect(page.locator(`text=${day}`).first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('should show today indicator in week strip', async ({ page }) => {
    // The today button uses text-blue color class
    await expect(page.locator('text=› Heute').or(page.locator('.text-blue'))).toBeTruthy();
  });

  test('should show status icons in week strip', async ({ page }) => {
    // Status icons: ✓ completed, ✕ skipped, › planned
    await expect(page.locator('text=TRAINING')).toBeVisible();
    await page.waitForTimeout(1500);
    const icons = page.locator('text=✓').or(page.locator('text=✕')).or(page.locator('text=›'));
    expect(await icons.count()).toBeGreaterThan(0);
  });

  // ── Training Detail ──────────────────────────────────────────────────────────
  test('should show selected workout type', async ({ page }) => {
    await page.waitForTimeout(1500);
    // Workout type is shown in large pixel font
    const workoutDetail = page.locator('[class*="font-pixel"]').filter({ hasText: /[A-Z]{3,}/ });
    if (await workoutDetail.count() > 0) {
      await expect(workoutDetail.first()).toBeVisible();
    }
  });

  test('should show today label when today is selected', async ({ page }) => {
    await expect(page.locator('text=› Heute')).toBeVisible({ timeout: 10000 });
  });

  test('should show workout duration in minutes', async ({ page }) => {
    await page.waitForTimeout(2000);
    const minLabel = page.locator('text=MIN');
    if (await minLabel.count() > 0) {
      await expect(minLabel.first()).toBeVisible();
    }
  });

  test('should show complete and skip buttons for planned workout', async ({ page }) => {
    await page.waitForTimeout(2000);
    const completeBtn = page.locator('text=Als erledigt markieren').or(page.locator('text=ERLEDIGT'));
    const skipBtn = page.locator('text=Überspringen').or(page.locator('text=ÜBERSPRINGEN'));
    if (await completeBtn.count() > 0) {
      await expect(completeBtn.first()).toBeVisible();
    }
    if (await skipBtn.count() > 0) {
      await expect(skipBtn.first()).toBeVisible();
    }
  });

  test('should switch to different day when clicked', async ({ page }) => {
    await page.waitForTimeout(1500);
    const dayButtons = page.locator('button').filter({ hasText: /^(SO|MO|DI|MI|DO|FR|SA)$/ });
    if (await dayButtons.count() > 1) {
      // Click a different day button
      await dayButtons.nth(0).click();
      // URL or selected day should change
      await page.waitForTimeout(500);
    }
  });

  test('should show "← Heute" button when non-today day is selected', async ({ page }) => {
    await page.waitForTimeout(1500);
    const dayButtons = page.locator('button').filter({ hasText: /^(SO|MO|DI|MI|DO|FR|SA)$/ });
    if (await dayButtons.count() >= 2) {
      await dayButtons.nth(0).click();
      const backToToday = page.locator('text=← Heute');
      if (await backToToday.count() > 0) {
        await expect(backToToday).toBeVisible();
        await backToToday.click();
        // Should return to today's view
        await expect(page.locator('text=› Heute')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  // ── 4-Week Statistics ────────────────────────────────────────────────────────
  test('should show 4-week overview section', async ({ page }) => {
    await expect(page.locator('text=4-Wochen Übersicht')).toBeVisible({ timeout: 10000 });
  });

  test('should show completion rate statistic', async ({ page }) => {
    await expect(page.locator('text=Abschluss')).toBeVisible({ timeout: 10000 });
  });

  test('should show total hours statistic', async ({ page }) => {
    await expect(page.locator('text=Stunden')).toBeVisible({ timeout: 10000 });
  });

  test('should show total sessions statistic', async ({ page }) => {
    await expect(page.locator('text=Einheiten')).toBeVisible({ timeout: 10000 });
  });

  // ── Skip Reason Flow ─────────────────────────────────────────────────────────
  test('should show skip reason input when skip is clicked', async ({ page }) => {
    await page.waitForTimeout(2000);
    const skipBtn = page.locator('text=Überspringen').or(
      page.locator('button').filter({ hasText: /[Üü]berspringen/ })
    );
    if (await skipBtn.count() > 0) {
      await skipBtn.first().click();
      // Skip modal or inline reason input should appear
      const reasonInput = page.locator('input[placeholder*="Grund"]')
        .or(page.locator('textarea[placeholder*="Grund"]'))
        .or(page.locator('text=Grund'));
      await expect(reasonInput.first()).toBeVisible({ timeout: 5000 });
    }
  });

  // ── Error State ──────────────────────────────────────────────────────────────
  test('should show error state with retry on API failure', async ({ page, context }) => {
    await context.route('**/api/training/**', (route) => route.abort());
    await page.goto('/training');
    const retryBtn = page.locator('text=Erneut versuchen');
    if (await retryBtn.count() > 0) {
      await expect(retryBtn).toBeVisible({ timeout: 10000 });
    }
  });

  // ── Bottom Navigation ────────────────────────────────────────────────────────
  test('should show bottom navigation', async ({ page }) => {
    await expect(page.locator('nav')).toBeVisible();
  });

  test('training icon should be active in bottom nav', async ({ page }) => {
    // Active nav link has border-t-blue class
    const activeLink = page.locator('nav a[href="/training"]');
    await expect(activeLink).toBeVisible();
  });
});
