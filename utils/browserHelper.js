const logger = require('./logger');
const fs = require('fs');
const path = require('path');

class BrowserHelper {
  constructor(page, context = null) {
    this.page = page;
    this.context = context || page.context();
  }

  // Performance monitoring
  async startPerformanceMonitoring() {
    await this.page.addInitScript(() => {
      window.performanceMetrics = {
        navigationStart: performance.timing.navigationStart,
        loadStart: performance.timing.loadEventStart,
        loadEnd: performance.timing.loadEventEnd,
        domContentLoaded: performance.timing.domContentLoadedEventEnd,
        resources: []
      };

      // Monitor resource loading
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          window.performanceMetrics.resources.push({
            name: entry.name,
            type: entry.entryType,
            startTime: entry.startTime,
            duration: entry.duration,
            transferSize: entry.transferSize || 0
          });
        });
      });
      observer.observe({ entryTypes: ['resource'] });
    });
  }

  async getPerformanceMetrics() {
    return await this.page.evaluate(() => {
      const metrics = window.performanceMetrics || {};
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      
      return {
        ...metrics,
        navigation: navigation ? {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          totalTime: navigation.loadEventEnd - navigation.fetchStart,
          dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
          tcpConnect: navigation.connectEnd - navigation.connectStart,
          ttfb: navigation.responseStart - navigation.requestStart
        } : null,
        paint: paint.reduce((acc, entry) => {
          acc[entry.name] = entry.startTime;
          return acc;
        }, {}),
        memory: performance.memory ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        } : null
      };
    });
  }

  // Network management
  async blockResources(resourceTypes = ['image', 'font', 'media']) {
    await this.page.route('**/*', (route) => {
      const request = route.request();
      const resourceType = request.resourceType();
      
      if (resourceTypes.includes(resourceType)) {
        logger.info(`Blocking resource: ${resourceType} - ${request.url()}`);
        route.abort();
      } else {
        route.continue();
      }
    });
  }

  async mockNetworkResponse(urlPattern, mockResponse) {
    await this.page.route(urlPattern, (route) => {
      logger.info(`Mocking response for: ${route.request().url()}`);
      route.fulfill({
        status: mockResponse.status || 200,
        contentType: mockResponse.contentType || 'application/json',
        headers: mockResponse.headers || {},
        body: typeof mockResponse.body === 'object' 
          ? JSON.stringify(mockResponse.body) 
          : mockResponse.body
      });
    });
  }

  async interceptNetworkRequests(urlPattern, callback) {
    await this.page.route(urlPattern, async (route) => {
      const request = route.request();
      logger.info(`Intercepting request: ${request.method()} ${request.url()}`);
      
      const result = await callback(request);
      
      if (result === false) {
        route.abort();
      } else if (result && typeof result === 'object') {
        route.fulfill(result);
      } else {
        route.continue();
      }
    });
  }

  async captureNetworkActivity() {
    const networkActivity = {
      requests: [],
      responses: [],
      failures: []
    };

    this.page.on('request', request => {
      networkActivity.requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData(),
        resourceType: request.resourceType(),
        timestamp: Date.now()
      });
    });

    this.page.on('response', response => {
      networkActivity.responses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        headers: response.headers(),
        timestamp: Date.now()
      });
    });

    this.page.on('requestfailed', request => {
      networkActivity.failures.push({
        url: request.url(),
        method: request.method(),
        failure: request.failure(),
        timestamp: Date.now()
      });
    });

    return networkActivity;
  }

  // Console and error handling
  async captureConsoleMessages() {
    const consoleMessages = [];
    
    this.page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
        timestamp: Date.now()
      });
      
      if (msg.type() === 'error') {
        logger.error(`Console error: ${msg.text()}`);
      }
    });

    return consoleMessages;
  }

  async capturePageErrors() {
    const pageErrors = [];
    
    this.page.on('pageerror', error => {
      const errorInfo = {
        message: error.message,
        stack: error.stack,
        name: error.name,
        timestamp: Date.now()
      };
      
      pageErrors.push(errorInfo);
      logger.error(`Page error: ${error.message}`);
    });

    return pageErrors;
  }

  // Browser state management
  async clearBrowserData() {
    logger.info('Clearing browser data');
    
    // Clear cookies
    await this.context.clearCookies();
    
    // Clear local storage and session storage
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Clear cache
    await this.context.clearPermissions();
  }

  async setBrowserPermissions(permissions) {
    logger.info(`Setting browser permissions: ${permissions.join(', ')}`);
    await this.context.grantPermissions(permissions);
  }

  async setGeolocation(latitude, longitude) {
    logger.info(`Setting geolocation: ${latitude}, ${longitude}`);
    await this.context.setGeolocation({ latitude, longitude });
  }

  async setTimezone(timezone) {
    logger.info(`Setting timezone: ${timezone}`);
    await this.context.addInitScript(`
      Object.defineProperty(Intl, 'DateTimeFormat', {
        value: class extends Intl.DateTimeFormat {
          constructor(...args) {
            super(...args);
            this.resolvedOptions = () => ({ timeZone: '${timezone}' });
          }
        }
      });
    `);
  }

  async setViewport(width, height, deviceScaleFactor = 1) {
    logger.info(`Setting viewport: ${width}x${height} (scale: ${deviceScaleFactor})`);
    await this.page.setViewportSize({ width, height });
    await this.page.emulateMedia({ reducedMotion: 'reduce' });
  }

  // Device emulation
  async emulateDevice(device) {
    logger.info(`Emulating device: ${device.name}`);
    await this.page.emulate(device);
  }

  async emulateNetwork(networkProfile) {
    logger.info(`Emulating network: ${networkProfile.name}`);
    await this.page.emulateNetworkConditions(networkProfile);
  }

  // Storage management
  async setLocalStorage(items) {
    logger.info('Setting localStorage items');
    await this.page.evaluate((items) => {
      Object.entries(items).forEach(([key, value]) => {
        localStorage.setItem(key, JSON.stringify(value));
      });
    }, items);
  }

  async getLocalStorage() {
    logger.info('Getting localStorage items');
    return await this.page.evaluate(() => {
      const items = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        try {
          items[key] = JSON.parse(localStorage.getItem(key));
        } catch (e) {
          items[key] = localStorage.getItem(key);
        }
      }
      return items;
    });
  }

  async setCookies(cookies) {
    logger.info('Setting cookies');
    await this.context.addCookies(cookies);
  }

  async getCookies(urls = []) {
    logger.info('Getting cookies');
    return await this.context.cookies(urls);
  }

  // File operations
  async downloadFile(downloadPromise, filename = null) {
    logger.info('Waiting for download');
    const download = await downloadPromise;
    
    const downloadPath = path.join(process.cwd(), 'downloads');
    if (!fs.existsSync(downloadPath)) {
      fs.mkdirSync(downloadPath, { recursive: true });
    }
    
    const suggestedFilename = filename || download.suggestedFilename();
    const filePath = path.join(downloadPath, suggestedFilename);
    
    await download.saveAs(filePath);
    logger.info(`File downloaded: ${filePath}`);
    
    return {
      path: filePath,
      filename: suggestedFilename,
      size: fs.statSync(filePath).size
    };
  }

  async uploadFiles(selector, filePaths) {
    logger.info(`Uploading files to ${selector}: ${filePaths.join(', ')}`);
    await this.page.setInputFiles(selector, filePaths);
  }

  // Screenshot and recording
  async takeFullPageScreenshot(filename = null) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotName = filename || `fullpage-${timestamp}.png`;
    const screenshotPath = path.join(process.cwd(), 'screenshots', screenshotName);
    
    // Ensure directory exists
    const dir = path.dirname(screenshotPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    await this.page.screenshot({
      path: screenshotPath,
      fullPage: true
    });
    
    logger.info(`Full page screenshot saved: ${screenshotPath}`);
    return screenshotPath;
  }

  async takeElementScreenshot(selector, filename = null) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotName = filename || `element-${timestamp}.png`;
    const screenshotPath = path.join(process.cwd(), 'screenshots', screenshotName);
    
    // Ensure directory exists
    const dir = path.dirname(screenshotPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    await this.page.locator(selector).screenshot({ path: screenshotPath });
    
    logger.info(`Element screenshot saved: ${screenshotPath}`);
    return screenshotPath;
  }

  // Advanced interactions
  async simulateSlowNetwork() {
    await this.page.emulateNetworkConditions({
      offline: false,
      downloadThroughput: 500 * 1024, // 500kb/s
      uploadThroughput: 500 * 1024,   // 500kb/s
      latency: 2000 // 2s
    });
  }

  async simulateOfflineMode() {
    await this.page.emulateNetworkConditions({
      offline: true,
      downloadThroughput: 0,
      uploadThroughput: 0,
      latency: 0
    });
  }

  async restoreNetworkConditions() {
    await this.page.emulateNetworkConditions({
      offline: false,
      downloadThroughput: -1,
      uploadThroughput: -1,
      latency: -1
    });
  }

  // Accessibility testing
  async getAccessibilitySnapshot() {
    logger.info('Getting accessibility snapshot');
    return await this.page.accessibility.snapshot();
  }

  async checkAccessibilityViolations() {
    // Basic accessibility checks - can be enhanced with axe-core
    const violations = await this.page.evaluate(() => {
      const issues = [];
      
      // Check for missing alt attributes
      const images = document.querySelectorAll('img:not([alt])');
      images.forEach(img => {
        issues.push({
          type: 'missing-alt',
          element: img.tagName,
          message: 'Image missing alt attribute'
        });
      });
      
      // Check for missing form labels
      const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
      inputs.forEach(input => {
        const hasLabel = document.querySelector(`label[for="${input.id}"]`);
        if (!hasLabel && input.type !== 'hidden') {
          issues.push({
            type: 'missing-label',
            element: input.tagName,
            message: 'Form input missing label'
          });
        }
      });
      
      return issues;
    });
    
    logger.info(`Found ${violations.length} accessibility violations`);
    return violations;
  }

  // CSS and styling
  async injectCSS(css) {
    logger.info('Injecting custom CSS');
    await this.page.addStyleTag({ content: css });
  }

  async injectCSSFile(filePath) {
    logger.info(`Injecting CSS file: ${filePath}`);
    await this.page.addStyleTag({ path: filePath });
  }

  async getComputedStyle(selector, property) {
    logger.info(`Getting computed style for ${selector}: ${property}`);
    return await this.page.evaluate(({ selector, property }) => {
      const element = document.querySelector(selector);
      if (element) {
        return window.getComputedStyle(element).getPropertyValue(property);
      }
      return null;
    }, { selector, property });
  }

  // Utility methods
  async waitForPageIdle(timeout = 30000) {
    logger.info('Waiting for page to be idle');
    await this.page.waitForLoadState('networkidle', { timeout });
    await this.page.waitForLoadState('domcontentloaded', { timeout });
  }

  async scrollToPosition(x, y) {
    logger.info(`Scrolling to position: ${x}, ${y}`);
    await this.page.evaluate(({ x, y }) => {
      window.scrollTo(x, y);
    }, { x, y });
  }

  async smoothScrollToElement(selector, behavior = 'smooth') {
    logger.info(`Smooth scrolling to element: ${selector}`);
    await this.page.evaluate(({ selector, behavior }) => {
      const element = document.querySelector(selector);
      if (element) {
        element.scrollIntoView({ behavior, block: 'center' });
      }
    }, { selector, behavior });
  }

  async measureElementLoadTime(selector) {
    const startTime = Date.now();
    await this.page.waitForSelector(selector, { state: 'visible' });
    const loadTime = Date.now() - startTime;
    
    logger.info(`Element ${selector} loaded in ${loadTime}ms`);
    return loadTime;
  }

  async getElementBoundingBox(selector) {
    logger.info(`Getting bounding box for: ${selector}`);
    return await this.page.locator(selector).boundingBox();
  }

  async isElementInViewport(selector) {
    logger.info(`Checking if element is in viewport: ${selector}`);
    return await this.page.evaluate((selector) => {
      const element = document.querySelector(selector);
      if (!element) return false;
      
      const rect = element.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= window.innerHeight &&
        rect.right <= window.innerWidth
      );
    }, selector);
  }
}

module.exports = BrowserHelper;