// fixtures/loginFixture.js
const baseTest = require("@playwright/test").test;
const { LoginPage } = require("../pages/LoginPage");
require("dotenv").config();

const test = baseTest.extend({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await use(loginPage); 
  },
});

module.exports = { test };
