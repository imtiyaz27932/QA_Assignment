
const { test } = require("../../fixtures/loginFixture");
const { LoginPage } = require("../../pages/LoginPage");
require("dotenv").config();



test.describe("Login Flow", () => {
    
  test("Login with valid credentials", async ({ loginPage }) => {
    await loginPage.login(process.env.LOGIN_EMAIL, process.env.LOGIN_PASSWORD);
    await loginPage.assertLoginSuccess();
   
  });

  test("Login with invalid credentials", async ({ loginPage }) => {
    await loginPage.login(
      process.env.INVALID_EMAIL,
      process.env.INVALID_PASSWORD
    );
    await loginPage.assertLoginFailure();
  });
});
  

 