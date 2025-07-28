const { expect } = require("@playwright/test");
const Logger = require("../utils/logger"); 
require("dotenv").config();

class SignUpPage {

  constructor(page) {
    this.page = page;
    this.nameInput = page.getByRole("textbox", { name: "Name" });
    this.emailInput = page.locator('input[data-qa="signup-email"]');
    this.signupButton = page.locator('button[data-qa="signup-button"]');
  }

  async goto() {
  await Logger.info("Navigating to login page...");
    await this.page.goto(`${process.env.BASE_URL}/login`, {
      waitUntil: "domcontentloaded",
    });


    const signupHeading = this.page.getByRole("heading", {
      name: "New User Signup!",
    });
    const loginHeading = this.page.getByRole("heading", {
      name: "Login to your account",
    });

    await expect(signupHeading).toBeVisible({ timeout: 5000 });
    await expect(loginHeading).toBeVisible({ timeout: 5000 });

    await expect(this.nameInput).toBeVisible({ timeout: 5000 });
    await expect(this.emailInput).toBeVisible({ timeout: 5000 });
    await expect(this.signupButton).toBeVisible({ timeout: 5000 });

    await Logger.success("Signup page verified successfully");
  }


  async signup() {
    const name = process.env.SIGNUP_NAME;
    const email = process.env.SIGNUP_EMAIL;

    await Logger.info(`Signing up with name: ${name} and email: ${email}`);
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.signupButton.click();
    await Logger.success("Signup form submitted successfully with existing email");
  }


  async assertDuplicateEmailError() {
    await Logger.info("Checking for duplicate email error");

    const errorMsg = this.page.getByText("Email Address already exist!");
    await expect(errorMsg).toBeVisible({ timeout: 5000 });

    await Logger.error(" Duplicate email error message is visible");
  }
}

module.exports = { SignUpPage };
