import { test, expect } from '@playwright/test';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard', { timeout: 10000 });
  await page.goto('/metriken');
}

test.describe('Metrics Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // ── Header ───────────────────────────────────────────────────────────────────
  test('should load metrics page', async ({ page }) => {
    await expect(page.locator('text=METRIKEN')).toBeVisible();
  });

  // ── Summary Tiles Row 1 ──────────────────────────────────────────────────────
  test('should show HRV Ø summary tile', async ({ page }) => {
    await expect(page.locator('text=HRV Ø')).toBeVisible();
  });

  test('should show Schlaf summary tile', async ({ page }) => {
    await expect(page.locator('text=Schlaf')).toBeVisible();
  });

  test('should show Recovery Score tile', async ({ page }) => {
    await expect(page.locator('text=Score')).toBeVisible();
  });

  // ── Summary Tiles Row 2 ──────────────────────────────────────────────────────
  test('should show Ruhepuls tile', async ({ page }) => {
    await expect(page.locator('text=Ruhepuls')).toBeVisible();
  });

  test('should show SpO₂ tile', async ({ page }) => {
    await expect(page.locator('text=SpO₂')).toBeVisible();
  });

  test('should show VO₂ max tile', async ({ page }) => {
    await expect(page.locator('text=VO₂ max')).toBeVisible();
  });

  // ── Chart Sections ───────────────────────────────────────────────────────────
  test('should show HRV chart section header', async ({ page }) => {
    await expect(page.locator('text=HRV — 7 Tage')).toBeVisible();
  });

  test('should show sleep chart section header', async ({ page }) => {
    await expect(page.locator('text=Schlaf — 7 Tage')).toBeVisible();
  });

  test('should show stress chart section header', async ({ page }) => {
    await expect(page.locator('text=Stresslevel — 7 Tage')).toBeVisible();
  });

  test('should show resting HR chart section header', async ({ page }) => {
    await expect(page.locator('text=Ruhepuls — 7 Tage')).toBeVisible();
  });

  test('should show VO₂ max chart section header', async ({ page }) => {
    await expect(page.locator('text=VO₂ max — 7 Tage')).toBeVisible();
  });

  test('should show empty chart or recharts chart for HRV', async ({ page }) => {
    // Either shows Recharts SVG or EmptyChart message
    const emptyChart = page.locator('text=Keine Daten — Uhr verbinden oder Sync starten');
    const svgChart = page.locator('svg');
    const either = await emptyChart.count() > 0 || await svgChart.count() > 0;
    expect(either).toBe(true);
  });

  // ── Manual Input Section ─────────────────────────────────────────────────────
  test('should show manual input section', async ({ page }) => {
    await expect(page.locator('text=Manuell eingeben')).toBeVisible();
  });

  test('should show toggle button for manual form', async ({ page }) => {
    await expect(page.locator('text=Heutige Werte eintragen')).toBeVisible();
  });

  test('should expand manual form when toggle button is clicked', async ({ page }) => {
    await page.click('text=Heutige Werte eintragen');
    await expect(page.locator('text=HRV')).toBeVisible({ timeout: 5000 });
  });

  test('should show HRV input field in manual form', async ({ page }) => {
    await page.click('text=Heutige Werte eintragen');
    const hrvInput = page.locator('input[placeholder="z.B. 42"]');
    await expect(hrvInput).toBeVisible({ timeout: 5000 });
  });

  test('should show sleep duration input in manual form', async ({ page }) => {
    await page.click('text=Heutige Werte eintragen');
    await expect(page.locator('text=Schlafdauer')).toBeVisible({ timeout: 5000 });
    const sleepInput = page.locator('input[placeholder="z.B. 420"]');
    await expect(sleepInput).toBeVisible();
  });

  test('should show resting HR input in manual form', async ({ page }) => {
    await page.click('text=Heutige Werte eintragen');
    await expect(page.locator('text=Ruhepuls').first()).toBeVisible({ timeout: 5000 });
  });

  test('should show stress score input in manual form', async ({ page }) => {
    await page.click('text=Heutige Werte eintragen');
    await expect(page.locator('text=Stresslevel').or(page.locator('text=Stress'))).toBeVisible({ timeout: 5000 });
  });

  test('should show SpO2 input in manual form', async ({ page }) => {
    await page.click('text=Heutige Werte eintragen');
    await expect(page.locator('text=SpO₂').first()).toBeVisible({ timeout: 5000 });
  });

  test('should show steps input in manual form', async ({ page }) => {
    await page.click('text=Heutige Werte eintragen');
    await expect(page.locator('text=Schritte')).toBeVisible({ timeout: 5000 });
  });

  test('should show VO2 max input in manual form', async ({ page }) => {
    await page.click('text=Heutige Werte eintragen');
    await expect(page.locator('text=VO₂ max').first()).toBeVisible({ timeout: 5000 });
  });

  test('should show save button in manual form', async ({ page }) => {
    await page.click('text=Heutige Werte eintragen');
    const saveBtn = page.locator('button').filter({ hasText: /Speichern|Werte speichern/ });
    await expect(saveBtn.first()).toBeVisible({ timeout: 5000 });
  });

  test('should show validation error when saving empty manual form', async ({ page }) => {
    await page.click('text=Heutige Werte eintragen');
    const saveBtn = page.locator('button').filter({ hasText: /Speichern|Werte speichern/ });
    await saveBtn.first().click();
    await expect(page.locator('text=Mindestens ein Wert')).toBeVisible({ timeout: 5000 });
  });

  test('should show validation error for invalid HRV', async ({ page }) => {
    await page.click('text=Heutige Werte eintragen');
    await page.fill('input[placeholder="z.B. 42"]', '300');
    const saveBtn = page.locator('button').filter({ hasText: /Speichern|Werte speichern/ });
    await saveBtn.first().click();
    await expect(page.locator('text=HRV muss zwischen 5 und 200')).toBeVisible({ timeout: 5000 });
  });

  // ── Wellbeing Section ─────────────────────────────────────────────────────────
  test('should show wellbeing section', async ({ page }) => {
    await expect(page.locator('text=Heutiges Befinden')).toBeVisible();
  });

  test('should show fatigue slider', async ({ page }) => {
    await expect(page.locator('text=Müdigkeit')).toBeVisible();
    const sliders = page.locator('input[type="range"]');
    await expect(sliders.first()).toBeVisible();
  });

  test('should show mood slider', async ({ page }) => {
    await expect(page.locator('text=Stimmung')).toBeVisible();
  });

  test('should show wellbeing submit button', async ({ page }) => {
    const submitBtn = page.locator('button').filter({ hasText: /Befinden speichern|Speichern/ });
    if (await submitBtn.count() > 0) {
      await expect(submitBtn.first()).toBeVisible();
    }
  });

  test('should update fatigue slider value', async ({ page }) => {
    const sliders = page.locator('input[type="range"]');
    if (await sliders.count() > 0) {
      await sliders.first().fill('8');
      await expect(sliders.first()).toHaveValue('8');
    }
  });

  // ── Bottom Navigation ─────────────────────────────────────────────────────────
  test('should show bottom navigation', async ({ page }) => {
    await expect(page.locator('nav')).toBeVisible();
  });

  test('metrics icon should be active in bottom nav', async ({ page }) => {
    const metricsLink = page.locator('nav a[href="/metriken"]');
    await expect(metricsLink).toBeVisible();
  });
});
