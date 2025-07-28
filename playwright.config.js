// @ts-check
const { devices } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const settingsPath = path.resolve(__dirname, "settings.json");
let settings = {
  executionMode: "parallel",
  browserMode: "headless",
};

if (fs.existsSync(settingsPath)) {
  try {
    const content = fs.readFileSync(settingsPath, "utf-8");
    settings = JSON.parse(content);
  } catch (error) {
    console.error(" Failed to parse settings.json:", error);
  }
}

const isParallel = settings.executionMode === "parallel";
const isHeadless = settings.browserMode === "headless";

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  testDir: "./tests",
  fullyParallel: isParallel,
  workers: isParallel ? undefined : 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: process.env.BASE_URL,
    headless: isHeadless,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
};

module.exports = config;
