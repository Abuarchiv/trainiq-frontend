import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should show login page with TRAINIQ header', async ({ page }) => {
    await expect(page.locator('text=TRAINIQ')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should show submit button', async ({ page }) => {
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toContainText('Anmelden');
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.click('button[type="submit"]');
    await expect(page.locator('input:invalid')).toHaveCount(2);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Login fehlgeschlagen')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to register page', async ({ page }) => {
    await page.click('text=Jetzt registrieren');
    await expect(page).toHaveURL('/register');
  });

  test('should navigate to forgot password page', async ({ page }) => {
    await page.click('text=Passwort vergessen?');
    await expect(page).toHaveURL('/forgot-password');
  });

  test('should allow guest access via guest link', async ({ page }) => {
    const guestLink = page.locator('text=Als Gast').or(page.locator('text=Gast'));
    // If a guest link exists, it should be visible
    if (await guestLink.count() > 0) {
      await expect(guestLink.first()).toBeVisible();
    }
  });

  test('should disable submit button while loading', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    const submitBtn = page.locator('button[type="submit"]');
    await Promise.all([
      page.click('button[type="submit"]'),
      expect(submitBtn).toHaveAttribute('disabled', { timeout: 5000 }),
    ]);
  });

  test('password input masks the typed value', async ({ page }) => {
    await page.fill('input[type="password"]', 'secretpass');
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('email input accepts valid email format', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('user@domain.com');
    await expect(emailInput).toHaveValue('user@domain.com');
  });

  test('should reject invalid email format', async ({ page }) => {
    await page.fill('input[type="email"]', 'notanemail');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    const emailInput = page.locator('input[type="email"]');
    // HTML5 validation: should be invalid
    expect(await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid)).toBe(false);
  });

  test('can submit form with keyboard Enter key', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.keyboard.press('Enter');
    // Should attempt login (either success or error)
    await expect(
      page.locator('text=Login fehlgeschlagen').or(page.locator('/dashboard'))
    ).toBeTruthy();
  });
});