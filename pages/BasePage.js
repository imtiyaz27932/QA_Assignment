const { expect } = require('@playwright/test');
const logger = require('../utils/logger');

class BasePage {
  constructor(page) {
    this.page = page;
    this.logger = logger;
  }

  // Navigation methods
  async navigate(url) {
    this.logger.info(`Navigating to: ${url}`);
    await this.page.goto(url);
  }

  async getCurrentUrl() {
    return this.page.url();
  }

  async getTitle() {
    return await this.page.title();
  }

  async reload() {
    this.logger.info('Reloading page');
    await this.page.reload();
  }

  async goBack() {
    this.logger.info('Going back');
    await this.page.goBack();
  }

  async goForward() {
    this.logger.info('Going forward');
    await this.page.goForward();
  }

  // Element interaction methods
  async click(selector, options = {}) {
    this.logger.info(`Clicking element: ${selector}`);
    await this.page.click(selector, options);
  }

  async doubleClick(selector) {
    this.logger.info(`Double clicking element: ${selector}`);
    await this.page.dblclick(selector);
  }

  async rightClick(selector) {
    this.logger.info(`Right clicking element: ${selector}`);
    await this.page.click(selector, { button: 'right' });
  }

  async fill(selector, text) {
    this.logger.info(`Filling element ${selector} with: ${text}`);
    await this.page.fill(selector, text);
  }

  async type(selector, text, options = {}) {
    this.logger.info(`Typing in element ${selector}: ${text}`);
    await this.page.type(selector, text, options);
  }

  async clear(selector) {
    this.logger.info(`Clearing element: ${selector}`);
    await this.page.fill(selector, '');
  }

  async selectOption(selector, value) {
    this.logger.info(`Selecting option ${value} in: ${selector}`);
    await this.page.selectOption(selector, value);
  }

  async check(selector) {
    this.logger.info(`Checking checkbox: ${selector}`);
    await this.page.check(selector);
  }

  async uncheck(selector) {
    this.logger.info(`Unchecking checkbox: ${selector}`);
    await this.page.uncheck(selector);
  }

  // Wait methods
  async waitForSelector(selector, options = {}) {
    this.logger.info(`Waiting for selector: ${selector}`);
    return await this.page.waitForSelector(selector, options);
  }

  async waitForText(text, options = {}) {
    this.logger.info(`Waiting for text: ${text}`);
    return await this.page.waitForFunction(
      text => document.body.textContent.includes(text),
      text,
      options
    );
  }

  async waitForUrl(url, options = {}) {
    this.logger.info(`Waiting for URL: ${url}`);
    await this.page.waitForURL(url, options);
  }

  async waitForLoadState(state = 'load') {
    this.logger.info(`Waiting for load state: ${state}`);
    await this.page.waitForLoadState(state);
  }

  // Get methods
  async getText(selector) {
    this.logger.info(`Getting text from: ${selector}`);
    return await this.page.textContent(selector);
  }

  async getValue(selector) {
    this.logger.info(`Getting value from: ${selector}`);
    return await this.page.inputValue(selector);
  }

  async getAttribute(selector, attribute) {
    this.logger.info(`Getting attribute ${attribute} from: ${selector}`);
    return await this.page.getAttribute(selector, attribute);
  }

  async getInnerHTML(selector) {
    this.logger.info(`Getting innerHTML from: ${selector}`);
    return await this.page.innerHTML(selector);
  }

  // Check methods
  async isVisible(selector) {
    return await this.page.isVisible(selector);
  }

  async isHidden(selector) {
    return await this.page.isHidden(selector);
  }

  async isEnabled(selector) {
    return await this.page.isEnabled(selector);
  }

  async isDisabled(selector) {
    return await this.page.isDisabled(selector);
  }

  async isChecked(selector) {
    return await this.page.isChecked(selector);
  }

  // Assertion methods
  async assertElementVisible(selector) {
    this.logger.info(`Asserting element is visible: ${selector}`);
    await expect(this.page.locator(selector)).toBeVisible();
  }

  async assertElementHidden(selector) {
    this.logger.info(`Asserting element is hidden: ${selector}`);
    await expect(this.page.locator(selector)).toBeHidden();
  }

  async assertElementContainsText(selector, text) {
    this.logger.info(`Asserting element ${selector} contains text: ${text}`);
    await expect(this.page.locator(selector)).toContainText(text);
  }

  async assertElementHasText(selector, text) {
    this.logger.info(`Asserting element ${selector} has exact text: ${text}`);
    await expect(this.page.locator(selector)).toHaveText(text);
  }

  async assertElementHasValue(selector, value) {
    this.logger.info(`Asserting element ${selector} has value: ${value}`);
    await expect(this.page.locator(selector)).toHaveValue(value);
  }

  async assertTitle(title) {
    this.logger.info(`Asserting page title: ${title}`);
    await expect(this.page).toHaveTitle(title);
  }

  async assertUrl(url) {
    this.logger.info(`Asserting page URL: ${url}`);
    await expect(this.page).toHaveURL(url);
  }

  // Utility methods
  async screenshot(name, options = {}) {
    this.logger.info(`Taking screenshot: ${name}`);
    return await this.page.screenshot({ 
      path: `screenshots/${name}.png`,
      fullPage: true,
      ...options 
    });
  }

  async scrollToElement(selector) {
    this.logger.info(`Scrolling to element: ${selector}`);
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }

  async scrollToTop() {
    this.logger.info('Scrolling to top');
    await this.page.evaluate(() => window.scrollTo(0, 0));
  }

  async scrollToBottom() {
    this.logger.info('Scrolling to bottom');
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  }

  async hover(selector) {
    this.logger.info(`Hovering over element: ${selector}`);
    await this.page.hover(selector);
  }

  async dragAndDrop(source, target) {
    this.logger.info(`Dragging from ${source} to ${target}`);
    await this.page.dragAndDrop(source, target);
  }

  async uploadFile(selector, filePath) {
    this.logger.info(`Uploading file ${filePath} to: ${selector}`);
    await this.page.setInputFiles(selector, filePath);
  }

  async handleDialog(accept = true, promptText = '') {
    this.logger.info(`Setting up dialog handler - accept: ${accept}`);
    this.page.on('dialog', async dialog => {
      if (promptText) {
        await dialog.accept(promptText);
      } else if (accept) {
        await dialog.accept();
      } else {
        await dialog.dismiss();
      }
    });
  }

  async executeJavaScript(script, ...args) {
    this.logger.info(`Executing JavaScript: ${script}`);
    return await this.page.evaluate(script, ...args);
  }

  async addCookie(cookie) {
    this.logger.info(`Adding cookie: ${cookie.name}`);
    await this.page.context().addCookies([cookie]);
  }

  async getCookies() {
    this.logger.info('Getting all cookies');
    return await this.page.context().cookies();
  }

  async clearCookies() {
    this.logger.info('Clearing all cookies');
    await this.page.context().clearCookies();
  }

  async setViewportSize(width, height) {
    this.logger.info(`Setting viewport size: ${width}x${height}`);
    await this.page.setViewportSize({ width, height });
  }

  async getElementCount(selector) {
    this.logger.info(`Getting element count for: ${selector}`);
    return await this.page.locator(selector).count();
  }

  async waitAndClick(selector, timeout = 10000) {
    this.logger.info(`Waiting for and clicking: ${selector}`);
    await this.waitForSelector(selector, { timeout });
    await this.click(selector);
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

module.exports = BasePage;