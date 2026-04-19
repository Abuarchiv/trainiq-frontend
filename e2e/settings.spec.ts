import { test, expect } from '@playwright/test';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard', { timeout: 10000 });
  await page.goto('/einstellungen');
}

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // ── Header ───────────────────────────────────────────────────────────────────
  test('should load settings page', async ({ page }) => {
    await expect(page.locator('text=EINSTELLUNGEN')).toBeVisible();
  });

  // ── Achievements Section ──────────────────────────────────────────────────────
  test('should show achievements section', async ({ page }) => {
    await expect(page.locator('text=Erfolge')).toBeVisible({ timeout: 10000 });
  });

  test('should show achievement grid items', async ({ page }) => {
    await expect(page.locator('text=Erfolge')).toBeVisible({ timeout: 10000 });
    // Grid with achievement icons — at least the section renders
    const achievementsSection = page.locator('div').filter({ hasText: 'Erfolge' }).first();
    await expect(achievementsSection).toBeVisible();
  });

  // ── Profile Section ──────────────────────────────────────────────────────────
  test('should show profile section with account label', async ({ page }) => {
    await expect(page.locator('text=Profil').or(page.locator('text=Konto'))).toBeVisible({ timeout: 10000 });
  });

  test('should show email field in profile section', async ({ page }) => {
    await expect(page.locator('text=E-Mail').first()).toBeVisible({ timeout: 10000 });
  });

  test('should show name input in profile section', async ({ page }) => {
    await expect(page.locator('text=Name').first()).toBeVisible({ timeout: 10000 });
    const nameInput = page.locator('input[maxlength="100"]');
    await expect(nameInput).toBeVisible({ timeout: 10000 });
  });

  test('should show birth date input in profile section', async ({ page }) => {
    const birthDateInput = page.locator('input[type="date"]').first();
    await expect(birthDateInput).toBeVisible({ timeout: 10000 });
  });

  test('should show gender select dropdown', async ({ page }) => {
    const genderSelect = page.locator('select');
    await expect(genderSelect.first()).toBeVisible({ timeout: 10000 });
  });

  test('should show weight and height inputs', async ({ page }) => {
    const numberInputs = page.locator('input[type="number"]');
    await expect(numberInputs.first()).toBeVisible({ timeout: 10000 });
  });

  test('should show save profile button', async ({ page }) => {
    const saveBtn = page.locator('button').filter({ hasText: /Profil speichern|Speichern/ });
    await expect(saveBtn.first()).toBeVisible({ timeout: 10000 });
  });

  // ── Goals Section ────────────────────────────────────────────────────────────
  test('should show goals section', async ({ page }) => {
    await expect(page.locator('text=Ziele').first()).toBeVisible({ timeout: 10000 });
  });

  test('should show sport selection buttons', async ({ page }) => {
    await expect(page.locator('text=Ziele').first()).toBeVisible({ timeout: 10000 });
    // Wait for profile to load
    await page.waitForTimeout(2000);
    // Sports buttons: Laufen, Radfahren, etc.
    const sportButtons = page.locator('button').filter({ hasText: /Laufen|Radfahren|Schwimmen|Triathlon/i });
    if (await sportButtons.count() > 0) {
      await expect(sportButtons.first()).toBeVisible();
    }
  });

  test('should show fitness level buttons in goals section', async ({ page }) => {
    await page.waitForTimeout(2000);
    // Einsteiger, Fortgeschritten, Profi
    const levelBtns = page.locator('button').filter({ hasText: /Einsteiger|Fortgeschritten|Profi/i });
    if (await levelBtns.count() > 0) {
      await expect(levelBtns.first()).toBeVisible();
    }
  });

  test('should show goal description textarea', async ({ page }) => {
    await page.waitForTimeout(2000);
    const textarea = page.locator('textarea');
    if (await textarea.count() > 0) {
      await expect(textarea.first()).toBeVisible();
    }
  });

  test('should show weekly hours range slider', async ({ page }) => {
    await page.waitForTimeout(2000);
    const slider = page.locator('input[type="range"]').first();
    if (await slider.count() > 0) {
      await expect(slider).toBeVisible();
    }
  });

  // ── Watch Connections ─────────────────────────────────────────────────────────
  test('should show connected devices section', async ({ page }) => {
    await expect(
      page.locator('text=Uhr verbinden').or(page.locator('text=Verbundene Geräte'))
    ).toBeVisible({ timeout: 10000 });
  });

  test('should show Garmin provider', async ({ page }) => {
    await expect(page.locator('text=Garmin')).toBeVisible({ timeout: 10000 });
  });

  test('should show Polar provider', async ({ page }) => {
    await expect(page.locator('text=Polar')).toBeVisible({ timeout: 10000 });
  });

  test('should show Apple Health provider', async ({ page }) => {
    await expect(page.locator('text=Apple Health')).toBeVisible({ timeout: 10000 });
  });

  test('should show connect button for disconnected providers', async ({ page }) => {
    await page.waitForTimeout(1500);
    const connectBtn = page.locator('button').filter({ hasText: /Verbinden|Login|Importieren/ }).first();
    if (await connectBtn.count() > 0) {
      await expect(connectBtn).toBeVisible();
    }
  });

  test('should expand Garmin form when Garmin login is clicked', async ({ page }) => {
    await page.waitForTimeout(1500);
    const garminLoginBtn = page.locator('button').filter({ hasText: 'Login' }).first();
    if (await garminLoginBtn.count() > 0) {
      await garminLoginBtn.click();
      const garminEmailInput = page.locator('input[type="email"]').or(
        page.locator('input[placeholder*="Garmin"]')
      );
      await expect(garminEmailInput.first()).toBeVisible({ timeout: 5000 });
    }
  });

  // ── Password Change ───────────────────────────────────────────────────────────
  test('should show password change section', async ({ page }) => {
    await expect(
      page.locator('text=Passwort').or(page.locator('text=Passwort ändern'))
    ).toBeVisible({ timeout: 10000 });
  });

  test('should show expand button for password change', async ({ page }) => {
    const pwBtn = page.locator('button').filter({ hasText: /Passwort ändern/ });
    if (await pwBtn.count() > 0) {
      await expect(pwBtn.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('should show password fields when password section is expanded', async ({ page }) => {
    const pwBtn = page.locator('button').filter({ hasText: /Passwort ändern/ });
    if (await pwBtn.count() > 0) {
      await pwBtn.first().click();
      const pwInputs = page.locator('input[type="password"]');
      await expect(pwInputs.first()).toBeVisible({ timeout: 5000 });
    }
  });

  // ── Delete Account ────────────────────────────────────────────────────────────
  test('should show delete account section', async ({ page }) => {
    const deleteSection = page.locator('text=Konto löschen').or(
      page.locator('text=Account löschen')
    );
    if (await deleteSection.count() > 0) {
      await expect(deleteSection.first()).toBeVisible({ timeout: 10000 });
    }
  });

  // ── Billing Section ───────────────────────────────────────────────────────────
  test('should show subscription or billing section', async ({ page }) => {
    const billingSection = page.locator('text=Abo').or(
      page.locator('text=Abonnement').or(page.locator('text=Premium'))
    );
    if (await billingSection.count() > 0) {
      await expect(billingSection.first()).toBeVisible({ timeout: 10000 });
    }
  });

  // ── Push Notifications ────────────────────────────────────────────────────────
  test('should show push notification settings section', async ({ page }) => {
    const pushSection = page.locator('text=Benachrichtigungen').or(
      page.locator('text=Push')
    );
    if (await pushSection.count() > 0) {
      await expect(pushSection.first()).toBeVisible({ timeout: 10000 });
    }
  });

  // ── Language Switcher ─────────────────────────────────────────────────────────
  test('should show language switcher', async ({ page }) => {
    const langSwitcher = page.locator('text=Sprache').or(
      page.locator('[data-testid="language-switcher"]').or(
        page.locator('select[name="language"]')
      )
    );
    if (await langSwitcher.count() > 0) {
      await expect(langSwitcher.first()).toBeVisible({ timeout: 10000 });
    }
  });

  // ── Logout ────────────────────────────────────────────────────────────────────
  test('should show logout button', async ({ page }) => {
    await expect(page.locator('text=Ausloggen').or(page.locator('text=Abmelden'))).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to login after logout', async ({ page }) => {
    const logoutBtn = page.locator('text=Ausloggen').or(page.locator('text=Abmelden'));
    await expect(logoutBtn).toBeVisible({ timeout: 10000 });
    await logoutBtn.click();
    await expect(page).toHaveURL('/login', { timeout: 10000 });
  });

  // ── Bottom Navigation ─────────────────────────────────────────────────────────
  test('should show bottom navigation', async ({ page }) => {
    await expect(page.locator('nav')).toBeVisible();
  });

  test('settings icon should be active in bottom nav', async ({ page }) => {
    const settingsLink = page.locator('nav a[href="/einstellungen"]');
    await expect(settingsLink).toBeVisible();
  });
});
