const { test } = require("@playwright/test");
const { SignUpPage } = require("../pages/signUp");


test.describe("Sign Up Flow", () => {

  test("Valid Sign Up with an Existing Email Address", async ({ page }) => {
    const signUpPage = new SignUpPage(page);
      await signUpPage.goto();
      await signUpPage.signup(); 
      await signUpPage.assertDuplicateEmailError();
     
  });
});
