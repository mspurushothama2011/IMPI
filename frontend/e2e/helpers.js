/**
 * E2E Test Helpers for IMIP
 * 
 * Provides reusable functions for authentication, navigation, and common actions.
 */

/**
 * Login as a specific role
 */
export async function login(page, role = 'member', email = null, password = null) {
  const credentials = {
    admin: {
      email: email || process.env.TEST_ADMIN_EMAIL || 'admin@test.com',
      password: password || process.env.TEST_ADMIN_PASSWORD || 'admin123!@#',
      path: '/login/admin',
      expectedRedirect: '/admin/dashboard'
    },
    manager: {
      email: email || process.env.TEST_MANAGER_EMAIL || 'manager@test.com',
      password: password || process.env.TEST_MANAGER_PASSWORD || 'manager123!@#',
      path: '/login/manager',
      expectedRedirect: '/manager/dashboard'
    },
    member: {
      email: email || process.env.TEST_MEMBER_EMAIL || 'member@test.com',
      password: password || process.env.TEST_MEMBER_PASSWORD || 'member123!@#',
      path: '/login',
      expectedRedirect: '/'
    }
  };

  const creds = credentials[role];
  
  await page.goto(creds.path);
  await page.fill('input[type="email"]', creds.email);
  await page.fill('input[type="password"]', creds.password);
  await page.click('button[type="submit"]');
  
  // Wait for navigation after login
  await page.waitForURL(creds.expectedRedirect, { timeout: 10000 });
  
  return creds;
}

/**
 * Logout
 */
export async function logout(page) {
  // Look for logout button (adjust selector based on your UI)
  await page.click('button:has-text("Logout"), a:has-text("Logout")');
  
  // Wait for redirect to login
  await page.waitForURL(/\/login/, { timeout: 5000 });
}

/**
 * Check if user is on forbidden page
 */
export async function expectForbidden(page) {
  await page.waitForURL('/forbidden', { timeout: 5000 });
  await page.waitForSelector('text=/403.*Access Denied/i');
}

/**
 * Wait for loading to complete
 */
export async function waitForLoading(page) {
  // Wait for loading spinners to disappear
  await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 });
}

/**
 * Get API response from network
 */
export async function waitForAPI(page, urlPattern) {
  return page.waitForResponse(
    response => response.url().includes(urlPattern) && response.status() === 200
  );
}

/**
 * Create test user via API (helper for setup)
 */
export async function createTestUser(request, role = 'member', email = null) {
  const testEmail = email || `test-${role}-${Date.now()}@test.com`;
  const testPassword = `Test${role}123!@#`;
  
  const response = await request.post('/auth/register', {
    data: {
      email: testEmail,
      password: testPassword,
      full_name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`
    },
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  return {
    email: testEmail,
    password: testPassword,
    response: await response.json()
  };
}

/**
 * Take screenshot with timestamp
 */
export async function screenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ path: `test-results/${name}-${timestamp}.png`, fullPage: true });
}
