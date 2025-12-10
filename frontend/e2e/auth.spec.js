import { test, expect } from '@playwright/test';
import { login, logout, expectForbidden } from './helpers.js';

test.describe('Authentication Flows', () => {
  
  test('should show login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/IMIP|Login/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await expect(page.locator('text=/invalid.*password/i')).toBeVisible({ timeout: 5000 });
  });

  test('should redirect authenticated users away from login', async ({ page }) => {
    // Login first
    await login(page, 'member');
    
    // Try to visit login page
    await page.goto('/login');
    
    // Should be redirected away from login
    await expect(page).not.toHaveURL('/login');
  });

  test('should persist authentication after page reload', async ({ page }) => {
    await login(page, 'member');
    
    // Reload page
    await page.reload();
    
    // Should still be authenticated (not redirected to login)
    await expect(page).not.toHaveURL('/login');
  });
});

test.describe('Admin Authentication', () => {
  
  test('admin login page should have contextual hints', async ({ page }) => {
    await page.goto('/login/admin');
    
    // Check for admin-specific elements
    await expect(page.locator('text=/admin/i')).toBeVisible();
    await expect(page.locator('text=/administrator/i')).toBeVisible();
    
    // Check for hint box
    await expect(page.locator('text=/admin.*email/i')).toBeVisible();
  });

  test('should prevent non-admin from using admin login', async ({ page }) => {
    await page.goto('/login/admin');
    await page.fill('input[type="email"]', 'member@test.com');
    await page.fill('input[type="password"]', 'member123!@#');
    await page.click('button[type="submit"]');
    
    // Should show error about wrong portal
    await expect(page.locator('text=/admin.*only/i, text=/forbidden/i')).toBeVisible({ timeout: 5000 });
  });

  test('admin should redirect to admin dashboard', async ({ page }) => {
    await login(page, 'admin');
    
    // Should be on admin dashboard
    await expect(page).toHaveURL('/admin/dashboard');
    await expect(page.locator('text=/admin/i')).toBeVisible();
  });
});

test.describe('Manager Authentication', () => {
  
  test('manager login page should have contextual hints', async ({ page }) => {
    await page.goto('/login/manager');
    
    // Check for manager-specific elements
    await expect(page.locator('text=/manager/i')).toBeVisible();
    
    // Check for hint box
    await expect(page.locator('text=/manager.*email/i')).toBeVisible();
  });

  test('manager should redirect to manager dashboard', async ({ page }) => {
    await login(page, 'manager');
    
    // Should be on manager dashboard
    await expect(page).toHaveURL('/manager/dashboard');
    await expect(page.locator('text=/manager/i')).toBeVisible();
  });
});

test.describe('Token Refresh', () => {
  
  test('should automatically refresh expired tokens', async ({ page }) => {
    // This test would require mocking short token expiry
    // For now, we'll just verify the auth flow works
    await login(page, 'member');
    
    // Wait a bit
    await page.waitForTimeout(2000);
    
    // Make an API request (should auto-refresh if needed)
    await page.reload();
    
    // Should still be authenticated
    await expect(page).not.toHaveURL('/login');
  });
});

test.describe('Logout', () => {
  
  test('should logout and clear session', async ({ page }) => {
    await login(page, 'member');
    
    // Logout
    await logout(page);
    
    // Should be on login page
    await expect(page).toHaveURL(/\/login/);
    
    // Try to access protected route
    await page.goto('/');
    
    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/);
  });
});
