const { test as base, expect } = require('@playwright/test');
const logger = require('../utils/logger');
const { faker } = require('@faker-js/faker');
const fs = require('fs');
const path = require('path');

class BaseTest {
  constructor() {
    this.logger = logger;
    this.faker = faker;
    this.testData = {};
    this.startTime = null;
  }

  // Create custom test with enhanced functionality
  static createTest() {
    return base.extend({
      // Custom fixtures can be added here
      baseTest: async ({ page }, use) => {
        const baseTest = new BaseTest();
        baseTest.page = page;
        baseTest.startTime = Date.now();
        
        // Setup
        await baseTest.beforeEach();
        
        await use(baseTest);
        
        // Teardown
        await baseTest.afterEach();
      }
    });
  }

  async beforeEach() {
    this.logger.info('🚀 Starting test execution');
    this.logger.info(`Test URL: ${this.page.url()}`);
    
    // Set up error handling
    this.page.on('pageerror', (error) => {
      this.logger.error(`Page error: ${error.message}`);
    });

    this.page.on('requestfailed', (request) => {
      this.logger.warn(`Failed request: ${request.url()}`);
    });

    // Ensure screenshots directory exists
    const screenshotDir = path.join(process.cwd(), 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
  }

  async afterEach() {
    const duration = Date.now() - this.startTime;
    this.logger.info(`✅ Test completed in ${duration}ms`);
    
    // Clean up test data if needed
    this.testData = {};
  }

  // Test data management
  setTestData(key, value) {
    this.testData[key] = value;
    this.logger.info(`Set test data: ${key} = ${value}`);
  }

  getTestData(key) {
    return this.testData[key];
  }

  // Generate fake data
  generateUserData() {
    return {
      firstName: this.faker.person.firstName(),
      lastName: this.faker.person.lastName(),
      email: this.faker.internet.email(),
      password: this.faker.internet.password({ length: 12 }),
      phone: this.faker.phone.number(),
      address: {
        street: this.faker.location.streetAddress(),
        city: this.faker.location.city(),
        state: this.faker.location.state(),
        zipCode: this.faker.location.zipCode(),
        country: this.faker.location.country()
      },
      company: this.faker.company.name(),
      website: this.faker.internet.url()
    };
  }

  generateProductData() {
    return {
      name: this.faker.commerce.productName(),
      description: this.faker.commerce.productDescription(),
      price: this.faker.commerce.price(),
      category: this.faker.commerce.department(),
      sku: this.faker.string.alphanumeric(8).toUpperCase(),
      color: this.faker.color.human(),
      brand: this.faker.company.name()
    };
  }

  // Utility methods
  async takeScreenshot(name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.png`;
    const screenshotPath = path.join(process.cwd(), 'screenshots', filename);
    
    await this.page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    
    this.logger.info(`Screenshot saved: ${filename}`);
    return screenshotPath;
  }

  async captureNetworkRequests() {
    const requests = [];
    
    this.page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData()
      });
    });

    this.page.on('response', response => {
      const request = requests.find(req => req.url === response.url());
      if (request) {
        request.status = response.status();
        request.responseHeaders = response.headers();
      }
    });

    return requests;
  }

  async waitForAllNetworkIdle(timeout = 30000) {
    this.logger.info('Waiting for network to be idle');
    await this.page.waitForLoadState('networkidle', { timeout });
  }

  async mockAPI(url, response, method = 'GET') {
    this.logger.info(`Mocking API: ${method} ${url}`);
    await this.page.route(url, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }

  async interceptAPI(url, callback) {
    this.logger.info(`Intercepting API: ${url}`);
    await this.page.route(url, callback);
  }

  async clearLocalStorage() {
    this.logger.info('Clearing localStorage');
    await this.page.evaluate(() => localStorage.clear());
  }

  async clearSessionStorage() {
    this.logger.info('Clearing sessionStorage');
    await this.page.evaluate(() => sessionStorage.clear());
  }

  async setLocalStorageItem(key, value) {
    this.logger.info(`Setting localStorage: ${key}`);
    await this.page.evaluate(({ key, value }) => {
      localStorage.setItem(key, value);
    }, { key, value });
  }

  async getLocalStorageItem(key) {
    this.logger.info(`Getting localStorage: ${key}`);
    return await this.page.evaluate(key => localStorage.getItem(key), key);
  }

  // Performance utilities
  async measurePageLoadTime() {
    const startTime = Date.now();
    await this.page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;
    this.logger.info(`Page load time: ${loadTime}ms`);
    return loadTime;
  }

  async getPerformanceMetrics() {
    const metrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime,
        firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime
      };
    });
    
    this.logger.info('Performance metrics:', metrics);
    return metrics;
  }

  // Assertion helpers
  async assertPageTitle(expectedTitle) {
    this.logger.info(`Asserting page title: ${expectedTitle}`);
    await expect(this.page).toHaveTitle(expectedTitle);
  }

  async assertPageURL(expectedURL) {
    this.logger.info(`Asserting page URL: ${expectedURL}`);
    await expect(this.page).toHaveURL(expectedURL);
  }

  async assertElementExists(selector) {
    this.logger.info(`Asserting element exists: ${selector}`);
    await expect(this.page.locator(selector)).toBeVisible();
  }

  async assertElementNotExists(selector) {
    this.logger.info(`Asserting element does not exist: ${selector}`);
    await expect(this.page.locator(selector)).not.toBeVisible();
  }

  async assertElementText(selector, expectedText) {
    this.logger.info(`Asserting element text: ${selector} = ${expectedText}`);
    await expect(this.page.locator(selector)).toHaveText(expectedText);
  }

  async assertElementContainsText(selector, expectedText) {
    this.logger.info(`Asserting element contains text: ${selector} contains ${expectedText}`);
    await expect(this.page.locator(selector)).toContainText(expectedText);
  }

  // Database helpers (for API tests)
  async executeQuery(query, params = []) {
    // This would integrate with your database
    this.logger.info(`Executing query: ${query}`);
    // Implementation depends on your database setup
  }

  // File utilities
  async downloadFile(downloadPromise, filename) {
    this.logger.info(`Downloading file: ${filename}`);
    const download = await downloadPromise;
    const downloadsPath = path.join(process.cwd(), 'downloads');
    
    if (!fs.existsSync(downloadsPath)) {
      fs.mkdirSync(downloadsPath, { recursive: true });
    }
    
    const filePath = path.join(downloadsPath, filename);
    await download.saveAs(filePath);
    
    this.logger.info(`File downloaded to: ${filePath}`);
    return filePath;
  }

  async uploadFile(selector, filePath) {
    this.logger.info(`Uploading file: ${filePath}`);
    const fileBuffer = fs.readFileSync(filePath);
    await this.page.setInputFiles(selector, {
      name: path.basename(filePath),
      mimeType: 'application/octet-stream',
      buffer: fileBuffer
    });
  }

  // Wait utilities
  async waitForElement(selector, timeout = 10000) {
    this.logger.info(`Waiting for element: ${selector}`);
    return await this.page.waitForSelector(selector, { timeout });
  }

  async waitForText(text, timeout = 10000) {
    this.logger.info(`Waiting for text: ${text}`);
    return await this.page.waitForFunction(
      text => document.body.textContent.includes(text),
      text,
      { timeout }
    );
  }

  async waitForCondition(condition, timeout = 10000) {
    this.logger.info('Waiting for custom condition');
    return await this.page.waitForFunction(condition, {}, { timeout });
  }

  // Retry utilities
  async retryAssertion(assertion, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await assertion();
        return;
      } catch (error) {
        this.logger.warn(`Assertion failed, retry ${i + 1}/${maxRetries}: ${error.message}`);
        if (i === maxRetries - 1) throw error;
        await this.page.waitForTimeout(delay);
      }
    }
  }

  async retryAction(action, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await action();
        return;
      } catch (error) {
        this.logger.warn(`Action failed, retry ${i + 1}/${maxRetries}: ${error.message}`);
        if (i === maxRetries - 1) throw error;
        await this.page.waitForTimeout(delay);
      }
    }
  }
}

// Export both the class and a pre-configured test
const test = BaseTest.createTest();
const { expect: playwrightExpect } = require('@playwright/test');

module.exports = { BaseTest, test, expect: playwrightExpect };