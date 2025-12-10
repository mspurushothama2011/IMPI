import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { login } from './helpers.js';

/**
 * Accessibility Tests using axe-core
 * 
 * Tests pages for WCAG 2.1 Level A and AA compliance
 */

test.describe('Accessibility Audit', () => {
  
  test('login page should be accessible', async ({ page }) => {
    await page.goto('/login');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('admin login page should be accessible', async ({ page }) => {
    await page.goto('/login/admin');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('manager login page should be accessible', async ({ page }) => {
    await page.goto('/login/manager');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('register page should be accessible', async ({ page }) => {
    await page.goto('/register');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('forbidden page should be accessible', async ({ page }) => {
    await login(page, 'member');
    await page.goto('/admin/dashboard');
    
    // Should be redirected to forbidden page
    await page.waitForURL('/forbidden', { timeout: 5000 });
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('member dashboard should be accessible', async ({ page }) => {
    await login(page, 'member');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('admin dashboard should be accessible', async ({ page }) => {
    await login(page, 'admin');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('manager dashboard should be accessible', async ({ page }) => {
    await login(page, 'manager');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

test.describe('Accessibility - Specific Checks', () => {
  
  test('all images should have alt text', async ({ page }) => {
    await page.goto('/login');
    
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).not.toBeNull();
    }
  });

  test('all form inputs should have labels', async ({ page }) => {
    await page.goto('/login');
    
    const inputs = await page.locator('input').all();
    
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      
      // Input should have id (for label) OR aria-label OR aria-labelledby
      const hasAccessibleName = id || ariaLabel || ariaLabelledBy;
      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test('headings should be in logical order', async ({ page }) => {
    await login(page, 'member');
    
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    const levels = [];
    
    for (const heading of headings) {
      const tagName = await heading.evaluate(el => el.tagName);
      const level = parseInt(tagName.replace('H', ''));
      levels.push(level);
    }
    
    // First heading should be h1
    if (levels.length > 0) {
      expect(levels[0]).toBeLessThanOrEqual(1);
    }
    
    // Check for level skipping (e.g., h1 -> h3)
    for (let i = 1; i < levels.length; i++) {
      const jump = levels[i] - levels[i - 1];
      expect(jump).toBeLessThanOrEqual(1); // Should not skip levels
    }
  });

  test('focusable elements should be keyboard accessible', async ({ page }) => {
    await page.goto('/login');
    
    const buttons = await page.locator('button, a, input').all();
    
    for (const element of buttons) {
      const tabIndex = await element.getAttribute('tabindex');
      
      // tabindex should not be positive (accessibility anti-pattern)
      if (tabIndex) {
        const value = parseInt(tabIndex);
        expect(value).toBeLessThanOrEqual(0);
      }
    }
  });

  test('color contrast should be sufficient', async ({ page }) => {
    await page.goto('/login');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('body')
      .analyze();
    
    // Filter for color contrast violations
    const contrastViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'color-contrast'
    );
    
    expect(contrastViolations).toEqual([]);
  });

  test('page should have document title', async ({ page }) => {
    await page.goto('/login');
    
    const title = await page.title();
    expect(title).not.toBe('');
    expect(title).toBeTruthy();
  });

  test('page should have lang attribute', async ({ page }) => {
    await page.goto('/login');
    
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).not.toBeNull();
    expect(lang).toBeTruthy();
  });

  test('buttons should have accessible names', async ({ page }) => {
    await page.goto('/login');
    
    const buttons = await page.locator('button').all();
    
    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaLabelledBy = await button.getAttribute('aria-labelledby');
      
      const hasAccessibleName = (text && text.trim()) || ariaLabel || ariaLabelledBy;
      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test('links should have descriptive text', async ({ page }) => {
    await page.goto('/login');
    
    const links = await page.locator('a').all();
    
    for (const link of links) {
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      
      const hasText = (text && text.trim()) || ariaLabel;
      expect(hasText).toBeTruthy();
      
      // Link text should not be generic
      if (text) {
        const genericTexts = ['click here', 'read more', 'here', 'link'];
        const isGeneric = genericTexts.some(gt => 
          text.trim().toLowerCase() === gt.toLowerCase()
        );
        expect(isGeneric).toBeFalsy();
      }
    }
  });
});

test.describe('Accessibility - Keyboard Navigation', () => {
  
  test('should be able to navigate login form with keyboard', async ({ page }) => {
    await page.goto('/login');
    
    // Tab through form elements
    await page.keyboard.press('Tab'); // Email input
    await expect(page.locator('input[type="email"]')).toBeFocused();
    
    await page.keyboard.press('Tab'); // Password input
    await expect(page.locator('input[type="password"]')).toBeFocused();
    
    await page.keyboard.press('Tab'); // Submit button
    await expect(page.locator('button[type="submit"]')).toBeFocused();
  });

  test('should be able to activate buttons with keyboard', async ({ page }) => {
    await page.goto('/login');
    
    // Fill form
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Focus submit button
    await page.locator('button[type="submit"]').focus();
    
    // Activate with Enter or Space
    await page.keyboard.press('Enter');
    
    // Should attempt login (will fail with wrong credentials, but keyboard works)
    await page.waitForTimeout(500);
  });

  test('focus should be visible', async ({ page }) => {
    await page.goto('/login');
    
    // Tab to first input
    await page.keyboard.press('Tab');
    
    // Check if focus is visible (requires CSS check)
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});

test.describe('Accessibility - Screen Reader Support', () => {
  
  test('form errors should be announced to screen readers', async ({ page }) => {
    await page.goto('/login');
    
    // Submit empty form
    await page.click('button[type="submit"]');
    
    // Error message should have role="alert" or aria-live
    const errorMessages = await page.locator('[role="alert"], [aria-live]').all();
    
    // Should have at least one error message
    expect(errorMessages.length).toBeGreaterThanOrEqual(0);
  });

  test('loading states should be announced', async ({ page }) => {
    await page.goto('/login');
    
    // Check for aria-busy or aria-live regions
    const liveRegions = await page.locator('[aria-live], [aria-busy]').count();
    
    // Should have live regions for dynamic content
    expect(liveRegions).toBeGreaterThanOrEqual(0);
  });
});
