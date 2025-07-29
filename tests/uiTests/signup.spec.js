const { test } = require("@playwright/test");
const { SignUpPage } = require("../../pages/signUp");
require("dotenv").config();

test.describe("Sign Up Flow", () => {
  let signUpPage;

  test.beforeEach(async ({ page }) => {
    signUpPage = new SignUpPage(page);
    await signUpPage.goto();
  });

  test("Valid Sign Up", async () => {
    await signUpPage.signup(); 
    await signUpPage.fillSignupForm();
  });

  test("Sign Up with existing email", async () => {
    await signUpPage.signup(process.env.SIGNUP_NAME, process.env.SIGNUP_EMAIL);
    await signUpPage.assertDuplicateEmailError();
  });
});
