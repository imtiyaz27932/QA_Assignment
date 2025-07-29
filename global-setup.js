const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

module.exports = async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(process.env.BASE_URL);
  await page.click('a[href="/login"]');
  await page.fill('input[name="email"]', process.env.LOGIN_EMAIL);
  await page.fill('input[name="password"]', process.env.LOGIN_PASSWORD);
  await page.click('button[type="submit"]');

  const storageDir = path.resolve(__dirname, "storageState");
  if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir);

  await context.storageState({
    path: path.join(storageDir, "storageState.json"),
  });

  await browser.close();
};
