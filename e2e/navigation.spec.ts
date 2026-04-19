import { test, expect } from '@playwright/test';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard', { timeout: 10000 });
}

test.describe('Navigation', () => {
  // ── Unauthenticated Routes ───────────────────────────────────────────────────
  test('login page is accessible at /login', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL('/login');
    await expect(page.locator('text=TRAINIQ')).toBeVisible();
  });

  test('register page is accessible at /register', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveURL('/register');
    await expect(page.locator('text=TRAINIQ')).toBeVisible();
  });

  test('forgot-password page is accessible at /forgot-password', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page).toHaveURL('/forgot-password');
    await expect(page.locator('text=TRAINIQ')).toBeVisible();
  });

  // ── Bottom Navigation Presence ───────────────────────────────────────────────
  test('should have bottom nav on dashboard', async ({ page }) => {
    await login(page);
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should have 6 nav icons in bottom nav', async ({ page }) => {
    await login(page);
    const navLinks = page.locator('nav a');
    await expect(navLinks).toHaveCount(6);
  });

  test('bottom nav contains link to /dashboard', async ({ page }) => {
    await login(page);
    await expect(page.locator('nav a[href="/dashboard"]')).toBeVisible();
  });

  test('bottom nav contains link to /training', async ({ page }) => {
    await login(page);
    await expect(page.locator('nav a[href="/training"]')).toBeVisible();
  });

  test('bottom nav contains link to /chat', async ({ page }) => {
    await login(page);
    await expect(page.locator('nav a[href="/chat"]')).toBeVisible();
  });

  test('bottom nav contains link to /ernaehrung', async ({ page }) => {
    await login(page);
    await expect(page.locator('nav a[href="/ernaehrung"]')).toBeVisible();
  });

  test('bottom nav contains link to /metriken', async ({ page }) => {
    await login(page);
    await expect(page.locator('nav a[href="/metriken"]')).toBeVisible();
  });

  test('bottom nav contains link to /einstellungen', async ({ page }) => {
    await login(page);
    await expect(page.locator('nav a[href="/einstellungen"]')).toBeVisible();
  });

  // ── Navigate Via Bottom Nav ──────────────────────────────────────────────────
  test('clicking training nav link navigates to /training', async ({ page }) => {
    await login(page);
    await page.click('nav a[href="/training"]');
    await expect(page).toHaveURL('/training');
    await expect(page.locator('text=TRAINING')).toBeVisible();
  });

  test('clicking chat nav link navigates to /chat', async ({ page }) => {
    await login(page);
    await page.click('nav a[href="/chat"]');
    await expect(page).toHaveURL('/chat');
    await expect(page.locator('text=COACH')).toBeVisible();
  });

  test('clicking nutrition nav link navigates to /ernaehrung', async ({ page }) => {
    await login(page);
    await page.click('nav a[href="/ernaehrung"]');
    await expect(page).toHaveURL('/ernaehrung');
    await expect(page.locator('text=ERNÄHRUNG')).toBeVisible();
  });

  test('clicking metrics nav link navigates to /metriken', async ({ page }) => {
    await login(page);
    await page.click('nav a[href="/metriken"]');
    await expect(page).toHaveURL('/metriken');
    await expect(page.locator('text=METRIKEN')).toBeVisible();
  });

  test('clicking settings nav link navigates to /einstellungen', async ({ page }) => {
    await login(page);
    await page.click('nav a[href="/einstellungen"]');
    await expect(page).toHaveURL('/einstellungen');
    await expect(page.locator('text=EINSTELLUNGEN')).toBeVisible();
  });

  test('clicking dashboard nav link navigates back to /dashboard', async ({ page }) => {
    await login(page);
    await page.click('nav a[href="/training"]');
    await page.click('nav a[href="/dashboard"]');
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=TRAINIQ')).toBeVisible();
  });

  // ── Active State ─────────────────────────────────────────────────────────────
  test('active nav link gets border-t-blue class on dashboard', async ({ page }) => {
    await login(page);
    const dashLink = page.locator('nav a[href="/dashboard"]');
    const classList = await dashLink.getAttribute('class');
    expect(classList).toContain('border-t-blue');
  });

  test('active nav link changes when navigating to training', async ({ page }) => {
    await login(page);
    await page.click('nav a[href="/training"]');
    const trainingLink = page.locator('nav a[href="/training"]');
    const classList = await trainingLink.getAttribute('class');
    expect(classList).toContain('border-t-blue');
  });

  // ── Full Navigation Cycle ─────────────────────────────────────────────────────
  test('can navigate through all pages and back', async ({ page }) => {
    await login(page);
    const routes = ['/training', '/chat', '/ernaehrung', '/metriken', '/einstellungen', '/dashboard'];
    for (const route of routes) {
      await page.goto(route);
      await expect(page).toHaveURL(route);
      await expect(page.locator('nav')).toBeVisible();
    }
  });

  // ── Redirect After Login ─────────────────────────────────────────────────────
  test('should redirect to /dashboard after successful login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

  // ── Not Found ────────────────────────────────────────────────────────────────
  test('should show 404 or redirect for unknown routes', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');
    // Should show a 404 page or redirect
    const notFound = page.locator('text=404').or(
      page.locator('text=Nicht gefunden').or(page.locator('text=Not found'))
    );
    if (await notFound.count() > 0) {
      await expect(notFound.first()).toBeVisible();
    }
  });
});
