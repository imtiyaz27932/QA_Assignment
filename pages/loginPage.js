const { expect } = require("@playwright/test");
const Logger = require("../utils/logger");

class LoginPage {

    constructor(page) {
      
    this.page = page;
    this.usernameInput = page.locator('input[data-qa="login-email"]');
    this.passwordInput = page.locator('input[data-qa="login-password"]');
    this.loginButton = page.locator('button[data-qa="login-button"]');
    this.errorMsg = page.getByText("Your email or password is incorrect!"); 
    this.logoutButton = page.locator('a[href="/logout"]');
    this.loginSuccessElement = page.getByText("Logged in as");
  }

  async goto() {
  await Logger.info("Navigating to login page...");
  await this.page.goto("/login", {
    waitUntil: "domcontentloaded",
  });


    await Logger.info("Validating login fields are visible...");
    await expect(this.usernameInput).toBeVisible({ timeout: 5000 });
    await expect(this.passwordInput).toBeVisible({ timeout: 5000 });
    await expect(this.loginButton).toBeVisible({ timeout: 5000 });
    await Logger.success("Login page loaded successfully.");
  }

  async login(username, password) {
    await Logger.info(`Filling in username: ${username}`);
    await this.usernameInput.fill(username);

    await Logger.info("Filling in password.");
    await this.passwordInput.fill(password);

    await Logger.info("Clicking on Login button...");
    await Promise.all([
      this.page.waitForLoadState("domcontentloaded"),
      this.loginButton.click(),
    ]);
    await Logger.success("Login form submitted.");
  }

  async assertLoginSuccess() {
    await Logger.info("Asserting successful login...");
    await expect(this.loginSuccessElement).toBeVisible({ timeout: 5000 });
    await Logger.success("Login was successful.");
  }

  async assertLoginFailure() {
    await Logger.info("Asserting failed login...");
    await expect(this.errorMsg).toBeVisible({ timeout: 5000 });
    await Logger.warn("Login failed as expected.");
  }

  async logout() {
    await Logger.info("Attempting to logout...");
    await expect(this.logoutButton).toBeVisible({ timeout: 5000 });
    await this.logoutButton.click();

    await Logger.info("Validating logout success...");
    await expect(this.page).toHaveURL(/.*login.*/);
    await expect(this.usernameInput).toBeVisible({ timeout: 5000 });
    await Logger.success("Logout successful. Back on login page.");
  }
}

module.exports = { LoginPage };
