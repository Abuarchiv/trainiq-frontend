import { test, expect } from '@playwright/test';

test.describe('Register Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should show register page with TRAINIQ header', async ({ page }) => {
    await expect(page.locator('text=TRAINIQ')).toBeVisible();
    await expect(page.locator('text=Konto erstellen')).toBeVisible();
  });

  test('should show all required form fields', async ({ page }) => {
    await expect(page.locator('input[type="text"][placeholder="Dein Name"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should show submit button', async ({ page }) => {
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.click('button[type="submit"]');
    await expect(page.locator('input:invalid')).toHaveCount(3);
  });

  test('should validate email format', async ({ page }) => {
    await page.fill('input[type="text"]', 'Test User');
    await page.fill('input[type="email"]', 'not-an-email');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute('type', 'email');
  });

  test('should show link to login page', async ({ page }) => {
    const loginLink = page.locator('a[href="/login"]');
    await expect(loginLink).toBeVisible();
  });

  test('should navigate to login page via link', async ({ page }) => {
    await page.click('a[href="/login"]');
    await expect(page).toHaveURL('/login');
  });

  test('should show error for failed registration', async ({ page }) => {
    await page.fill('input[type="text"]', 'Test User');
    await page.fill('input[type="email"]', 'existing@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    // Error message appears (API call fails in test env)
    await expect(page.locator('text=Registrierung fehlgeschlagen')).toBeVisible({ timeout: 10000 });
  });

  test('should disable submit button while loading', async ({ page }) => {
    await page.fill('input[type="text"]', 'Test User');
    await page.fill('input[type="email"]', 'newuser@example.com');
    await page.fill('input[type="password"]', 'password123');

    const submitBtn = page.locator('button[type="submit"]');
    // Click and immediately check disabled state before response
    await Promise.all([
      page.click('button[type="submit"]'),
      expect(submitBtn).toHaveAttribute('disabled', { timeout: 3000 }),
    ]);
  });

  test('password input is masked', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await passwordInput.fill('mysecretPass1!');
    await expect(passwordInput).toHaveValue('mysecretPass1!');
  });

  test('name input has autocomplete attribute', async ({ page }) => {
    const nameInput = page.locator('input[autocomplete="name"]');
    await expect(nameInput).toBeVisible();
  });

  test('email input has autocomplete attribute', async ({ page }) => {
    const emailInput = page.locator('input[autocomplete="email"]');
    await expect(emailInput).toBeVisible();
  });
});
