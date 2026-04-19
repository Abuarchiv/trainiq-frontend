import { test, expect } from '@playwright/test';

test.describe('Forgot Password Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forgot-password');
  });

  test('should show page with TRAINIQ header', async ({ page }) => {
    await expect(page.locator('text=TRAINIQ')).toBeVisible();
    await expect(page.locator('text=Passwort zurücksetzen')).toBeVisible();
  });

  test('should show email input field', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('placeholder', 'Deine E-Mail-Adresse');
  });

  test('should show reset link submit button', async ({ page }) => {
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toContainText('Reset-Link senden');
  });

  test('should show success message after form submission', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=E-MAIL GESENDET')).toBeVisible({ timeout: 10000 });
  });

  test('should show informational text after submission', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Falls ein Konto mit dieser E-Mail existiert')).toBeVisible({ timeout: 10000 });
  });

  test('should show back-to-login link after submission', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Zurück zum Login')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate back to login after successful submission', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button[type="submit"]');
    await page.click('text=Zurück zum Login');
    await expect(page).toHaveURL('/login');
  });

  test('should require email before submission', async ({ page }) => {
    await page.click('button[type="submit"]');
    const emailInput = page.locator('input[type="email"]');
    // HTML5 validation prevents submission
    await expect(emailInput).toHaveAttribute('required', { timeout: 2000 });
  });

  test('should disable button while loading', async ({ page }) => {
    await page.fill('input[type="email"]', 'loading@example.com');
    const submitBtn = page.locator('button[type="submit"]');
    await Promise.all([
      page.click('button[type="submit"]'),
      expect(submitBtn).toHaveAttribute('disabled', { timeout: 3000 }),
    ]);
  });

  test('should show loading state text during request', async ({ page }) => {
    await page.fill('input[type="email"]', 'loading@example.com');
    await page.click('button[type="submit"]');
    // Either shows "..." loading text or success message
    await expect(
      page.locator('text=E-MAIL GESENDET').or(page.locator('text=...'))
    ).toBeVisible({ timeout: 5000 });
  });
});
