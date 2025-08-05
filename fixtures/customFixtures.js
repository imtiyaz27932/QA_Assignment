const { test as base } = require('@playwright/test');
const APIHelper = require('../utils/apiHelper');
const BrowserHelper = require('../utils/browserHelper');
const testDataManager = require('../utils/testDataManager');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

// Custom fixtures for the testing framework
const test = base.extend({
  // API Helper fixture
  apiHelper: async ({ baseURL }, use) => {
    const apiHelper = new APIHelper(baseURL);
    await use(apiHelper);
  },

  // Browser Helper fixture
  browserHelper: async ({ page, context }, use) => {
    const browserHelper = new BrowserHelper(page, context);
    await use(browserHelper);
  },

  // Test Data Manager fixture
  testData: async ({}, use) => {
    await use(testDataManager);
  },

  // Authenticated User fixture
  authenticatedUser: async ({ page, apiHelper }, use) => {
    logger.info('Setting up authenticated user session');
    
    // Get user credentials from test data
    const user = testDataManager.getUser('valid', 0);
    
    try {
      // Login via API to get session token
      const loginResponse = await apiHelper.post('/auth/login', {
        email: user.email,
        password: user.password
      });

      if (loginResponse.success && loginResponse.data.token) {
        // Set the auth token for future API calls
        apiHelper.setBearerToken(loginResponse.data.token);
        
        // Store auth state in browser context
        await page.context().addCookies([{
          name: 'auth_token',
          value: loginResponse.data.token,
          domain: new URL(page.url() || 'http://localhost').hostname,
          path: '/'
        }]);

        logger.info(`Authenticated user: ${user.email}`);
        await use({ user, token: loginResponse.data.token });
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      logger.error('Authentication setup failed:', error);
      // Fallback to UI login if API login fails
      await page.goto('/login');
      await page.fill('[data-testid="email"]', user.email);
      await page.fill('[data-testid="password"]', user.password);
      await page.click('[data-testid="login-button"]');
      await page.waitForURL('/dashboard');
      
      await use({ user });
    }
  },

  // Admin User fixture
  adminUser: async ({ page, apiHelper }, use) => {
    logger.info('Setting up admin user session');
    
    const admin = testDataManager.getUser('valid', 1); // Admin user
    
    try {
      const loginResponse = await apiHelper.post('/auth/login', {
        email: admin.email,
        password: admin.password
      });

      if (loginResponse.success && loginResponse.data.token) {
        apiHelper.setBearerToken(loginResponse.data.token);
        
        await page.context().addCookies([{
          name: 'auth_token',
          value: loginResponse.data.token,
          domain: new URL(page.url() || 'http://localhost').hostname,
          path: '/'
        }]);

        logger.info(`Authenticated admin: ${admin.email}`);
        await use({ user: admin, token: loginResponse.data.token });
      } else {
        throw new Error('Admin authentication failed');
      }
    } catch (error) {
      logger.error('Admin authentication setup failed:', error);
      throw error;
    }
  },

  // Database fixture (mock implementation)
  database: async ({}, use) => {
    const database = {
      async connect() {
        logger.info('Connecting to test database');
        // Implementation would depend on your database
        return true;
      },
      
      async disconnect() {
        logger.info('Disconnecting from test database');
        return true;
      },
      
      async query(sql, params = []) {
        logger.info(`Executing query: ${sql}`);
        // Mock implementation - replace with actual database calls
        return { rows: [], rowCount: 0 };
      },
      
      async insertUser(userData) {
        logger.info(`Inserting user: ${userData.email}`);
        // Mock implementation
        return { id: 'mock_user_id', ...userData };
      },
      
      async deleteUser(userId) {
        logger.info(`Deleting user: ${userId}`);
        // Mock implementation
        return true;
      },
      
      async cleanupTestData() {
        logger.info('Cleaning up test data from database');
        // Mock implementation
        return true;
      }
    };

    await database.connect();
    await use(database);
    await database.cleanupTestData();
    await database.disconnect();
  },

  // Performance monitoring fixture
  performanceMonitor: async ({ page }, use) => {
    const performanceData = {
      startTime: Date.now(),
      metrics: {},
      
      async startMonitoring() {
        await page.addInitScript(() => {
          window.performanceData = {
            navigationStart: performance.timing.navigationStart,
            loadStart: performance.timing.loadEventStart,
            resources: []
          };
          
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
              window.performanceData.resources.push({
                name: entry.name,
                duration: entry.duration,
                startTime: entry.startTime
              });
            });
          });
          observer.observe({ entryTypes: ['resource', 'navigation'] });
        });
      },
      
      async getMetrics() {
        return await page.evaluate(() => {
          const navigation = performance.getEntriesByType('navigation')[0];
          return {
            loadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
            domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
            resources: window.performanceData?.resources || []
          };
        });
      }
    };

    await performanceData.startMonitoring();
    await use(performanceData);
  },

  // Screenshot fixture
  screenshot: async ({ page }, use, testInfo) => {
    const screenshotHelper = {
      async takeScreenshot(name = null) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = name || `${testInfo.title}-${timestamp}`;
        const screenshotPath = path.join('screenshots', `${filename}.png`);
        
        // Ensure directory exists
        const dir = path.dirname(screenshotPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        await page.screenshot({ 
          path: screenshotPath, 
          fullPage: true 
        });
        
        logger.info(`Screenshot saved: ${screenshotPath}`);
        return screenshotPath;
      },
      
      async takeElementScreenshot(selector, name = null) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = name || `element-${timestamp}`;
        const screenshotPath = path.join('screenshots', `${filename}.png`);
        
        const dir = path.dirname(screenshotPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        await page.locator(selector).screenshot({ path: screenshotPath });
        
        logger.info(`Element screenshot saved: ${screenshotPath}`);
        return screenshotPath;
      }
    };

    await use(screenshotHelper);
    
    // Take screenshot on failure
    if (testInfo.status !== testInfo.expectedStatus) {
      await screenshotHelper.takeScreenshot(`failure-${testInfo.title}`);
    }
  },

  // Network mocking fixture
  networkMocker: async ({ page }, use) => {
    const networkMocker = {
      mockedRoutes: new Map(),
      
      async mockAPI(urlPattern, response, method = 'GET') {
        logger.info(`Mocking ${method} ${urlPattern}`);
        
        await page.route(urlPattern, route => {
          if (route.request().method() === method) {
            route.fulfill({
              status: response.status || 200,
              contentType: response.contentType || 'application/json',
              headers: response.headers || {},
              body: typeof response.body === 'object' 
                ? JSON.stringify(response.body) 
                : response.body
            });
          } else {
            route.continue();
          }
        });
        
        this.mockedRoutes.set(urlPattern, { response, method });
      },
      
      async blockResources(resourceTypes = ['image', 'font', 'media']) {
        logger.info(`Blocking resources: ${resourceTypes.join(', ')}`);
        
        await page.route('**/*', route => {
          const resourceType = route.request().resourceType();
          if (resourceTypes.includes(resourceType)) {
            route.abort();
          } else {
            route.continue();
          }
        });
      },
      
      async simulateSlowNetwork() {
        logger.info('Simulating slow network conditions');
        await page.emulateNetworkConditions({
          offline: false,
          downloadThroughput: 500 * 1024, // 500kb/s
          uploadThroughput: 500 * 1024,
          latency: 2000 // 2s
        });
      },
      
      async restoreNetwork() {
        logger.info('Restoring normal network conditions');
        await page.emulateNetworkConditions({
          offline: false,
          downloadThroughput: -1,
          uploadThroughput: -1,
          latency: -1
        });
      },
      
      async clearMocks() {
        logger.info('Clearing all network mocks');
        await page.unroute('**/*');
        this.mockedRoutes.clear();
      }
    };

    await use(networkMocker);
    await networkMocker.clearMocks();
  },

  // Error tracking fixture
  errorTracker: async ({ page }, use) => {
    const errors = {
      consoleErrors: [],
      pageErrors: [],
      networkErrors: []
    };

    // Track console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.consoleErrors.push({
          text: msg.text(),
          location: msg.location(),
          timestamp: Date.now()
        });
        logger.error(`Console error: ${msg.text()}`);
      }
    });

    // Track page errors
    page.on('pageerror', error => {
      errors.pageErrors.push({
        message: error.message,
        stack: error.stack,
        timestamp: Date.now()
      });
      logger.error(`Page error: ${error.message}`);
    });

    // Track network errors
    page.on('requestfailed', request => {
      errors.networkErrors.push({
        url: request.url(),
        method: request.method(),
        failure: request.failure(),
        timestamp: Date.now()
      });
      logger.error(`Network error: ${request.url()}`);
    });

    const errorTracker = {
      getErrors() {
        return errors;
      },
      
      hasErrors() {
        return errors.consoleErrors.length > 0 || 
               errors.pageErrors.length > 0 || 
               errors.networkErrors.length > 0;
      },
      
      clearErrors() {
        errors.consoleErrors = [];
        errors.pageErrors = [];
        errors.networkErrors = [];
      },
      
      getErrorSummary() {
        return {
          totalErrors: errors.consoleErrors.length + errors.pageErrors.length + errors.networkErrors.length,
          consoleErrors: errors.consoleErrors.length,
          pageErrors: errors.pageErrors.length,
          networkErrors: errors.networkErrors.length
        };
      }
    };

    await use(errorTracker);
  },

  // File operations fixture
  fileOperations: async ({ page }, use) => {
    const fileOps = {
      downloadPath: path.join(process.cwd(), 'downloads'),
      uploadPath: path.join(process.cwd(), 'testFiles'),
      
      async ensureDirectories() {
        if (!fs.existsSync(this.downloadPath)) {
          fs.mkdirSync(this.downloadPath, { recursive: true });
        }
        if (!fs.existsSync(this.uploadPath)) {
          fs.mkdirSync(this.uploadPath, { recursive: true });
        }
      },
      
      async downloadFile(downloadPromise, filename = null) {
        await this.ensureDirectories();
        
        const download = await downloadPromise;
        const suggestedFilename = filename || download.suggestedFilename();
        const filePath = path.join(this.downloadPath, suggestedFilename);
        
        await download.saveAs(filePath);
        logger.info(`File downloaded: ${filePath}`);
        
        return {
          path: filePath,
          filename: suggestedFilename,
          size: fs.statSync(filePath).size
        };
      },
      
      async createTestFile(filename, content = 'Test file content') {
        await this.ensureDirectories();
        
        const filePath = path.join(this.uploadPath, filename);
        fs.writeFileSync(filePath, content);
        
        logger.info(`Test file created: ${filePath}`);
        return filePath;
      },
      
      async uploadFile(selector, filename) {
        const filePath = path.join(this.uploadPath, filename);
        if (!fs.existsSync(filePath)) {
          await this.createTestFile(filename);
        }
        
        await page.setInputFiles(selector, filePath);
        logger.info(`File uploaded: ${filename}`);
      },
      
      async cleanupFiles() {
        try {
          if (fs.existsSync(this.downloadPath)) {
            const files = fs.readdirSync(this.downloadPath);
            files.forEach(file => {
              fs.unlinkSync(path.join(this.downloadPath, file));
            });
          }
          
          if (fs.existsSync(this.uploadPath)) {
            const files = fs.readdirSync(this.uploadPath);
            files.forEach(file => {
              fs.unlinkSync(path.join(this.uploadPath, file));
            });
          }
          
          logger.info('Test files cleaned up');
        } catch (error) {
          logger.error('Error cleaning up files:', error);
        }
      }
    };

    await fileOps.ensureDirectories();
    await use(fileOps);
    await fileOps.cleanupFiles();
  },

  // Mobile device fixture
  mobileDevice: async ({ browser }, use) => {
    const devices = require('@playwright/test').devices;
    const iPhone = devices['iPhone 12'];
    
    const context = await browser.newContext({
      ...iPhone,
      locale: 'en-US',
      timezoneId: 'America/New_York'
    });
    
    const page = await context.newPage();
    
    await use({ page, context, device: iPhone });
    
    await context.close();
  }
});

module.exports = { test };