const { expect } = require("@playwright/test");
const Logger = require("../utils/logger"); 
const { faker } = require("@faker-js/faker");
require("dotenv").config();

class SignUpPage {
  constructor(page) {
    this.page = page;
    this.nameInput = page.getByRole("textbox", { name: "Name" });
    this.emailInput = page.locator('input[data-qa="signup-email"]');
    this.signupButton = page.locator('button[data-qa="signup-button"]');
    this.passwordInput = page.locator("#password");
    this.selectDay = page.locator("#days");
    this.selectMonth = page.locator("#months");
    this.selectYear = page.locator("#years");
    this.firstAddress = page.getByRole("textbox", { name: "First name *" });
    this.lastAddress = page.getByRole("textbox", { name: "Last name *" });
    this.companyInput = page.getByRole("textbox", {
      name: "Company",
      exact: true,
    });
    this.addressInput = page.getByRole("textbox", {
      name: "Address * (Street address, P.",
    });
    this.address2Input = page.getByRole("textbox", { name: "Address 2" });
    this.countrySelect = page.getByLabel("country *");
    this.stateInput = page.getByRole("textbox", { name: "State *" });
    this.cityInput = page.getByRole("textbox", { name: "City *" });
    this.zipcodeInput = page.locator("#zipcode");
    this.mobileInput = page.getByRole("textbox", { name: "Mobile Number *" });
    this.createAccountButton = page.getByRole("button", {
      name: "Create Account",
    });
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

  async signup(name, email) {
    name = name || faker.person.fullName();
    email = email || faker.internet.email();

    await Logger.info(`Signing up with name: ${name} and email: ${email}`);
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.signupButton.click();
    await Logger.success(
      "Signup form submitted successfully with faker-generated data"
    );
  }

  async assertDuplicateEmailError() {
    await Logger.info("Checking for duplicate email error");

    const errorMsg = this.page.getByText("Email Address already exist!");
    await expect(errorMsg).toBeVisible({ timeout: 5000 });

    await Logger.error(" Duplicate email error message is visible");
  }

  async fillSignupForm({
    name = faker.person.fullName(),
    email = faker.internet.email(),
    password = faker.internet.password(),
    day = "1",
    month = "January",
    year = "2000",
    firstName = faker.person.firstName(),
    lastName = faker.person.lastName(),
    company = faker.company.name(),
    address = faker.location.streetAddress(),
    address2 = faker.location.secondaryAddress(),
    country = "United States",
    state = faker.location.state(),
    city = faker.location.city(),
    zipcode = faker.location.zipCode(),
    mobileNumber = faker.phone.number(),
  } = {}) {
    await Logger.info("Filling out the signup form with provided data...");
    Logger.info(
      `Name: ${name}, Email: ${email}, Password: ${password}, Day: ${day}, Month: ${month}, Year: ${year}, First Name: ${firstName}, Last Name: ${lastName}, Company: ${company}, Address: ${address}, Address2: ${address2}, Country: ${country}, State: ${state}, City: ${city}, Zipcode: ${zipcode}, Mobile Number: ${mobileNumber}`
    );
    await this.passwordInput.fill(password);

    await this.selectDay.selectOption(day);
    await this.selectMonth.selectOption(month);
    await this.selectYear.selectOption(year);

    await this.firstAddress.fill(firstName);
    await this.lastAddress.fill(lastName);

    await this.companyInput.fill(company);
    await this.addressInput.fill(address);
    await this.address2Input.fill(address2);

    await this.countrySelect.selectOption(country);

    await this.stateInput.fill(state);
    await this.cityInput.fill(city);

    await this.zipcodeInput.fill(zipcode);

    await this.mobileInput.fill(mobileNumber);
    await this.createAccountButton.click();
    await expect(this.page).toHaveURL(/account_created/);

    await Logger.success("Signup form filled and submitted successfully.");
  }
}

module.exports = { SignUpPage };
