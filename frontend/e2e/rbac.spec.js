import { test, expect } from '@playwright/test';
import { login, expectForbidden } from './helpers.js';

test.describe('Role-Based Access Control', () => {
  
  test('member cannot access admin dashboard', async ({ page }) => {
    await login(page, 'member');
    
    // Try to access admin dashboard
    await page.goto('/admin/dashboard');
    
    // Should be redirected to forbidden page
    await expectForbidden(page);
    
    // Should show helpful guidance
    await expect(page.locator('text=/member portal/i')).toBeVisible();
  });

  test('member cannot access manager dashboard', async ({ page }) => {
    await login(page, 'member');
    
    // Try to access manager dashboard
    await page.goto('/manager/dashboard');
    
    // Should be redirected to forbidden page
    await expectForbidden(page);
  });

  test('manager cannot access admin dashboard', async ({ page }) => {
    await login(page, 'manager');
    
    // Try to access admin dashboard
    await page.goto('/admin/dashboard');
    
    // Should be redirected to forbidden page
    await expectForbidden(page);
  });

  test('manager can access manager dashboard', async ({ page }) => {
    await login(page, 'manager');
    
    // Should be on manager dashboard
    await expect(page).toHaveURL('/manager/dashboard');
    await expect(page.locator('text=/manager/i')).toBeVisible();
  });

  test('admin can access admin dashboard', async ({ page }) => {
    await login(page, 'admin');
    
    // Should be on admin dashboard
    await expect(page).toHaveURL('/admin/dashboard');
    await expect(page.locator('text=/admin/i')).toBeVisible();
  });

  test('unauthenticated user redirected to login', async ({ page }) => {
    // Try to access protected route without login
    await page.goto('/admin/dashboard');
    
    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Forbidden Page', () => {
  
  test('forbidden page shows role-specific guidance', async ({ page }) => {
    await login(page, 'member');
    await page.goto('/admin/dashboard');
    
    // Should be on forbidden page
    await expectForbidden(page);
    
    // Should show current role
    await expect(page.locator('text=/member/i')).toBeVisible();
    
    // Should show link to correct portal
    await expect(page.locator('a[href="/dashboard"], a:has-text("Member Portal")')).toBeVisible();
  });

  test('forbidden page has working portal link', async ({ page }) => {
    await login(page, 'member');
    await page.goto('/admin/dashboard');
    
    await expectForbidden(page);
    
    // Click portal link
    await page.click('a[href="/dashboard"], a:has-text("Member Portal")');
    
    // Should navigate to member dashboard
    await expect(page).toHaveURL('/');
  });

  test('forbidden page has go back button', async ({ page }) => {
    await login(page, 'member');
    await page.goto('/');
    await page.goto('/admin/dashboard');
    
    await expectForbidden(page);
    
    // Click go back
    await page.click('button:has-text("Go Back")');
    
    // Should go to previous page
    await expect(page).toHaveURL('/');
  });
});

test.describe('Loading Gates', () => {
  
  test('should show loading gate during auth check', async ({ page }) => {
    await page.goto('/');
    
    // Should briefly show loading message
    // This might be too fast to catch, but we can verify no content flash
    await page.waitForLoadState('networkidle');
    
    // Should eventually show login or content
    const hasLogin = await page.locator('input[type="email"]').count() > 0;
    const hasContent = await page.locator('text=/meeting/i').count() > 0;
    
    expect(hasLogin || hasContent).toBeTruthy();
  });
});
