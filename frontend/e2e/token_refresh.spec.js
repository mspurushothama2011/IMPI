import { test, expect } from '@playwright/test';

// This test verifies the axios refresh flow by invalidating the access token
// and ensuring the refresh token is used to obtain a new token and proceed.

test.describe('Token refresh flow', () => {
  const base = 'http://localhost:5173';

  test('uses refresh token to recover from 401 and stays authenticated', async ({ page }) => {
    // Go to login
    await page.goto(base + '/login');

    // Fill in default member creds (see E2E_TESTS_GUIDE.md)
    await page.getByLabel('Email Address').fill(process.env.TEST_MEMBER_EMAIL || 'member@test.com');
    await page.getByLabel('Password').fill(process.env.TEST_MEMBER_PASSWORD || 'member123!@#');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // App root is protected; wait for content to render
    await page.waitForURL(base + '/');

    // Confirm a token is stored
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();

    const refresh = await page.evaluate(() => localStorage.getItem('refreshToken'));
    expect(refresh).toBeTruthy();

    // Corrupt the access token to force 401
    await page.evaluate(() => localStorage.setItem('token', 'invalid-token')); // keep refresh token intact

    // Trigger an authenticated request by refreshing the page (App fetches /meetings on load)
    await page.reload();

    // Expect to remain on the protected route (not redirected to /login)
    await page.waitForURL(base + '/');

    // After refresh flow, token should be replaced with a real one
    const newToken = await page.evaluate(() => localStorage.getItem('token'));
    expect(newToken && newToken !== 'invalid-token').toBeTruthy();
  });
});
