const { test } = require('../../fixtures/customFixtures');
const { expect } = require('@playwright/test');
const BasePage = require('../../pages/BasePage');

test.describe('Login Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('successful login with valid credentials @smoke', async ({ 
    page, 
    testData, 
    screenshot, 
    errorTracker,
    performanceMonitor 
  }) => {
    // Get test user data
    const user = testData.getUser('valid', 0);
    const basePage = new BasePage(page);
    
    // Take screenshot before login
    await screenshot.takeScreenshot('before-login');
    
    // Fill login form
    await basePage.fill('[data-testid="email"]', user.email);
    await basePage.fill('[data-testid="password"]', user.password);
    
    // Monitor performance during login
    const startTime = Date.now();
    await basePage.click('[data-testid="login-button"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('/dashboard');
    const loginTime = Date.now() - startTime;
    
    // Assertions
    await basePage.assertUrl('/dashboard');
    await basePage.assertElementVisible('[data-testid="user-menu"]');
    await basePage.assertElementContainsText('[data-testid="welcome-message"]', user.firstName);
    
    // Performance assertion
    expect(loginTime).toBeLessThan(3000); // Login should take less than 3 seconds
    
    // Check for any errors
    expect(errorTracker.hasErrors()).toBeFalsy();
    
    // Take screenshot after successful login
    await screenshot.takeScreenshot('after-successful-login');
    
    console.log(`Login completed in ${loginTime}ms`);
  });

  test('login failure with invalid credentials', async ({ 
    page, 
    testData, 
    screenshot,
    errorTracker 
  }) => {
    const basePage = new BasePage(page);
    const invalidUser = testData.createInvalidUser();
    
    // Fill login form with invalid credentials
    await basePage.fill('[data-testid="email"]', invalidUser.email);
    await basePage.fill('[data-testid="password"]', invalidUser.password);
    await basePage.click('[data-testid="login-button"]');
    
    // Assert error message appears
    await basePage.assertElementVisible('[data-testid="error-message"]');
    await basePage.assertElementContainsText('[data-testid="error-message"]', 'Invalid credentials');
    
    // Assert we stay on login page
    await basePage.assertUrl('/login');
    
    // Take screenshot of error state
    await screenshot.takeScreenshot('login-error-state');
  });

  test('login with empty fields validation', async ({ page, screenshot }) => {
    const basePage = new BasePage(page);
    
    // Try to login with empty fields
    await basePage.click('[data-testid="login-button"]');
    
    // Assert validation messages
    await basePage.assertElementVisible('[data-testid="email-validation"]');
    await basePage.assertElementVisible('[data-testid="password-validation"]');
    await basePage.assertElementContainsText('[data-testid="email-validation"]', 'Email is required');
    await basePage.assertElementContainsText('[data-testid="password-validation"]', 'Password is required');
    
    await screenshot.takeScreenshot('validation-errors');
  });

  test('remember me functionality', async ({ page, testData, browserHelper }) => {
    const user = testData.getUser('valid', 0);
    const basePage = new BasePage(page);
    
    // Login with remember me checked
    await basePage.fill('[data-testid="email"]', user.email);
    await basePage.fill('[data-testid="password"]', user.password);
    await basePage.check('[data-testid="remember-me"]');
    await basePage.click('[data-testid="login-button"]');
    
    await page.waitForURL('/dashboard');
    
    // Check if remember me cookie is set
    const cookies = await browserHelper.getCookies();
    const rememberMeCookie = cookies.find(cookie => cookie.name === 'remember_me');
    expect(rememberMeCookie).toBeTruthy();
    expect(rememberMeCookie.value).toBe('true');
  });

  test('login rate limiting @security', async ({ page, testData }) => {
    const basePage = new BasePage(page);
    const invalidUser = testData.createInvalidUser();
    
    // Attempt multiple failed logins
    for (let i = 0; i < 5; i++) {
      await basePage.fill('[data-testid="email"]', invalidUser.email);
      await basePage.fill('[data-testid="password"]', 'wrong-password');
      await basePage.click('[data-testid="login-button"]');
      
      if (i < 4) {
        await basePage.assertElementVisible('[data-testid="error-message"]');
      }
    }
    
    // After 5 attempts, should show rate limiting message
    await basePage.assertElementVisible('[data-testid="rate-limit-message"]');
    await basePage.assertElementContainsText('[data-testid="rate-limit-message"]', 'Too many login attempts');
  });

  test('login with API mock @mocked', async ({ page, testData, networkMocker }) => {
    const user = testData.getUser('valid', 0);
    const basePage = new BasePage(page);
    
    // Mock successful login API response
    await networkMocker.mockAPI('**/auth/login', {
      status: 200,
      body: {
        success: true,
        token: 'mock-jwt-token',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      }
    }, 'POST');
    
    // Perform login
    await basePage.fill('[data-testid="email"]', user.email);
    await basePage.fill('[data-testid="password"]', user.password);
    await basePage.click('[data-testid="login-button"]');
    
    // Assert successful login
    await page.waitForURL('/dashboard');
    await basePage.assertElementVisible('[data-testid="user-menu"]');
  });

  test('login on mobile device @mobile', async ({ mobileDevice, testData }) => {
    const { page } = mobileDevice;
    const user = testData.getUser('valid', 0);
    const basePage = new BasePage(page);
    
    await page.goto('/login');
    
    // Check mobile-specific elements
    await basePage.assertElementVisible('[data-testid="mobile-login-form"]');
    
    // Perform login on mobile
    await basePage.fill('[data-testid="email"]', user.email);
    await basePage.fill('[data-testid="password"]', user.password);
    await basePage.click('[data-testid="login-button"]');
    
    await page.waitForURL('/dashboard');
    await basePage.assertElementVisible('[data-testid="mobile-navigation"]');
  });

  test('login performance under slow network @performance', async ({ 
    page, 
    testData, 
    networkMocker, 
    performanceMonitor 
  }) => {
    const user = testData.getUser('valid', 0);
    const basePage = new BasePage(page);
    
    // Simulate slow network
    await networkMocker.simulateSlowNetwork();
    
    // Perform login and measure time
    const startTime = Date.now();
    
    await basePage.fill('[data-testid="email"]', user.email);
    await basePage.fill('[data-testid="password"]', user.password);
    await basePage.click('[data-testid="login-button"]');
    
    await page.waitForURL('/dashboard');
    
    const loginTime = Date.now() - startTime;
    const metrics = await performanceMonitor.getMetrics();
    
    // Assert performance under slow network
    expect(loginTime).toBeLessThan(10000); // Should complete within 10 seconds even on slow network
    expect(metrics.loadTime).toBeLessThan(5000);
    
    console.log(`Login under slow network: ${loginTime}ms`);
    console.log('Performance metrics:', metrics);
  });

  test('login with keyboard navigation @accessibility', async ({ page, testData }) => {
    const user = testData.getUser('valid', 0);
    
    // Navigate using keyboard only
    await page.keyboard.press('Tab'); // Focus on email field
    await page.keyboard.type(user.email);
    
    await page.keyboard.press('Tab'); // Focus on password field
    await page.keyboard.type(user.password);
    
    await page.keyboard.press('Tab'); // Focus on login button
    await page.keyboard.press('Enter'); // Submit form
    
    // Assert successful login
    await page.waitForURL('/dashboard');
    expect(page.url()).toContain('/dashboard');
  });

  test('login form validation styling', async ({ page, browserHelper }) => {
    const basePage = new BasePage(page);
    
    // Try to submit empty form
    await basePage.click('[data-testid="login-button"]');
    
    // Check validation styling
    const emailFieldBorder = await browserHelper.getComputedStyle('[data-testid="email"]', 'border-color');
    const passwordFieldBorder = await browserHelper.getComputedStyle('[data-testid="password"]', 'border-color');
    
    // Assert error styling is applied
    expect(emailFieldBorder).toContain('rgb(220, 53, 69)'); // Bootstrap danger color
    expect(passwordFieldBorder).toContain('rgb(220, 53, 69)');
  });

  test('login session persistence @regression', async ({ page, testData, browserHelper }) => {
    const user = testData.getUser('valid', 0);
    const basePage = new BasePage(page);
    
    // Login
    await basePage.fill('[data-testid="email"]', user.email);
    await basePage.fill('[data-testid="password"]', user.password);
    await basePage.click('[data-testid="login-button"]');
    
    await page.waitForURL('/dashboard');
    
    // Refresh the page
    await page.reload();
    
    // Should still be logged in
    await basePage.assertUrl('/dashboard');
    await basePage.assertElementVisible('[data-testid="user-menu"]');
    
    // Check auth token in localStorage
    const authToken = await basePage.getLocalStorageItem('auth_token');
    expect(authToken).toBeTruthy();
  });
});