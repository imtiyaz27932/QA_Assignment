
const { expect } = require("@playwright/test");
const { test } = require("../fixtures/loginFixture");
const { writeTestData, readTestData } = require("../utils/outcomeHelper");
require("dotenv").config();



test.describe("Login Flow", () => {
    
  test("Login with valid credentials", async ({ loginPage }) => {
    await loginPage.login(process.env.LOGIN_EMAIL, process.env.LOGIN_PASSWORD);
    await loginPage.assertLoginSuccess();
    writeTestData({ loginSuccess: true });
  });

  test("Login with invalid credentials", async ({ loginPage }) => {
    await loginPage.login(
      process.env.INVALID_EMAIL,
      process.env.INVALID_PASSWORD
    );
    await loginPage.assertLoginFailure();
  });

  test("Logout after Login", async ({ loginPage }) => {
    const testData = readTestData();

    test.skip(
      !testData.loginSuccess,
      "Skipping logout because login was not successful"
    );

    await loginPage.login(process.env.LOGIN_EMAIL, process.env.LOGIN_PASSWORD);
    await loginPage.assertLoginSuccess();
    await loginPage.logout();
  });
});
