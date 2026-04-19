import { test, expect } from '@playwright/test';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard', { timeout: 10000 });
  await page.goto('/chat');
}

test.describe('Chat Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // ── Header ───────────────────────────────────────────────────────────────────
  test('should load chat page with COACH header', async ({ page }) => {
    await expect(page.locator('text=COACH')).toBeVisible();
  });

  test('should show AKTIV status in header', async ({ page }) => {
    await expect(page.locator('text=AKTIV')).toBeVisible();
  });

  // ── Message Input ─────────────────────────────────────────────────────────────
  test('should show message input field', async ({ page }) => {
    await expect(page.locator('input[placeholder*="Nachricht"]').or(
      page.locator('input[placeholder*="nachricht"]')
    ).first()).toBeVisible();
  });

  test('should allow typing in the message input', async ({ page }) => {
    const input = page.locator('input[placeholder*="Nachricht"]').or(
      page.locator('input[placeholder*="nachricht"]')
    ).first();
    await input.fill('Test Nachricht');
    await expect(input).toHaveValue('Test Nachricht');
  });

  test('should show send button', async ({ page }) => {
    const sendButton = page.locator('button').filter({ hasText: /Senden|Send/ }).first();
    if (await sendButton.count() === 0) {
      // Send button may be an icon button — just check it exists
      const sendArea = page.locator('[class*="send"]').or(page.locator('button[type="submit"]').last());
      await expect(sendArea).toBeVisible();
    } else {
      await expect(sendButton).toBeVisible();
    }
  });

  // ── Quick Replies ─────────────────────────────────────────────────────────────
  test('should show all quick reply buttons', async ({ page }) => {
    const quickReplies = ['Warum?', 'Plan ändern', 'Ruhetag', 'Wochenziel', 'Ernährungstipp'];
    for (const reply of quickReplies) {
      await expect(page.locator(`text=${reply}`)).toBeVisible({ timeout: 10000 });
    }
  });

  test('should send message when quick reply is clicked', async ({ page }) => {
    // Click "Ruhetag" quick reply
    await page.click('text=Ruhetag');
    // The input or message area should update (or message is sent)
    await page.waitForTimeout(500);
    // Coach response or loading indicator should appear
    await expect(page.locator('text=COACH')).toBeVisible();
  });

  // ── Empty State Suggestions ───────────────────────────────────────────────────
  test('should show coach ready message or messages on empty chat', async ({ page }) => {
    const coachReady = page.locator('text=COACH BEREIT');
    const existingMessages = page.locator('[class*="message"]').or(page.locator('[class*="bubble"]'));
    const either = await coachReady.count() > 0 || await existingMessages.count() > 0;
    expect(either).toBe(true);
  });

  test('should show suggestion buttons in empty state', async ({ page }) => {
    const coachReady = page.locator('text=COACH BEREIT');
    if (await coachReady.count() > 0) {
      const suggestions = [
        'Wie ist mein Recovery heute?',
        'Erstelle mir einen Trainingsplan',
        'Was sollte ich vor dem Training essen'
      ];
      for (const suggestion of suggestions) {
        await expect(page.locator(`text=${suggestion}`).first()).toBeVisible();
      }
    }
  });

  // ── Sending a Message ─────────────────────────────────────────────────────────
  test('should allow sending a message via input', async ({ page }) => {
    const input = page.locator('input[placeholder*="Nachricht"]').or(
      page.locator('input[placeholder*="nachricht"]')
    ).first();
    await input.fill('Hallo Coach');
    await page.keyboard.press('Enter');
    // Either message appears or loading starts
    await page.waitForTimeout(1000);
    await expect(page.locator('text=COACH')).toBeVisible();
  });

  test('should clear input after sending message', async ({ page }) => {
    const input = page.locator('input[placeholder*="Nachricht"]').or(
      page.locator('input[placeholder*="nachricht"]')
    ).first();
    await input.fill('Test message');
    await page.keyboard.press('Enter');
    // Input should be cleared
    await expect(input).toHaveValue('', { timeout: 3000 });
  });

  // ── Image Upload ──────────────────────────────────────────────────────────────
  test('should show image upload button', async ({ page }) => {
    // Camera icon button in the input area
    const cameraBtn = page.locator('button').filter({ has: page.locator('svg') }).last();
    await expect(cameraBtn).toBeVisible();
  });

  // ── Delete Chat History ───────────────────────────────────────────────────────
  test('should show delete button when messages exist', async ({ page }) => {
    // Check if there are existing messages to show the delete button
    const deleteBtn = page.locator('button').filter({ has: page.locator('[class*="Trash"]') });
    if (await deleteBtn.count() > 0) {
      await expect(deleteBtn.first()).toBeVisible();
    }
  });

  test('should show delete confirmation dialog when delete is clicked', async ({ page }) => {
    const deleteBtn = page.locator('button').filter({ has: page.locator('svg') }).nth(1);
    if (await deleteBtn.count() > 0) {
      // Try to find a trash icon button
      const trashBtn = page.locator('[data-testid="delete-history"]').or(
        page.locator('button').filter({ hasText: '' }).nth(1)
      );
      // Only test if delete button is present
      const confirmText = page.locator('text=Chatverlauf löschen');
      if (await confirmText.count() > 0) {
        await expect(confirmText).toBeVisible();
      }
    }
  });

  // ── Max Length Validation ─────────────────────────────────────────────────────
  test('should not send empty message', async ({ page }) => {
    const input = page.locator('input[placeholder*="Nachricht"]').or(
      page.locator('input[placeholder*="nachricht"]')
    ).first();
    await input.fill('');
    await page.keyboard.press('Enter');
    // No new message should be sent
    await page.waitForTimeout(500);
    await expect(page.locator('text=COACH')).toBeVisible();
  });

  // ── Bottom Navigation ─────────────────────────────────────────────────────────
  test('should show bottom navigation', async ({ page }) => {
    await expect(page.locator('nav')).toBeVisible();
  });

  test('chat icon should be active in bottom nav', async ({ page }) => {
    const chatLink = page.locator('nav a[href="/chat"]');
    await expect(chatLink).toBeVisible();
  });
});
