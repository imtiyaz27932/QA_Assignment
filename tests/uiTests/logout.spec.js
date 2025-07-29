
const { test } = require("../../fixtures/loginFixture");
const { LoginPage } = require("../../pages/LoginPage");
require("dotenv").config();


test.describe("Logout Flow using storageState", () => {
  test.use({
    storageState: "./storageState/storageState.json",
  });

  test("Logout from the application", async ({ page }) => {
    await page.goto(`${process.env.BASE_URL}`, {
      waitUntil: "domcontentloaded",
    });

    const loginPage = new LoginPage(page);
    await loginPage.logout();
  });
});