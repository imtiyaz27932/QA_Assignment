// @ts-check
const { devices } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const settingsPath = path.resolve(__dirname, "settings.json");
let settings = {
  executionMode: "parallel",
  browserMode: "headless",
  environment: "staging"
};

if (fs.existsSync(settingsPath)) {
  try {
    const content = fs.readFileSync(settingsPath, "utf-8");
    settings = { ...settings, ...JSON.parse(content) };
  } catch (error) {
    console.error("Failed to parse settings.json:", error);
  }
}

const isParallel = settings.executionMode === "parallel";
const isHeadless = settings.browserMode === "headless";
const environment = settings.environment || "staging";

// Environment URLs
const baseUrls = {
  local: "http://localhost:3000",
  dev: "https://dev.example.com",
  staging: "https://staging.example.com",
  production: "https://example.com"
};

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  testDir: "./tests",
  fullyParallel: isParallel,
  workers: isParallel ? process.env.CI ? 2 : undefined : 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  timeout: 30000,
  expect: {
    timeout: 10000,
  },
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['allure-playwright'],
    ['line']
  ],
  globalSetup: require.resolve('./global-setup.js'),
  globalTeardown: require.resolve('./global-teardown.js'),
  use: {
    headless: isHeadless,
    baseURL: process.env.BASE_URL || baseUrls[environment],
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    // Desktop browsers
    {
      name: "chromium",
      use: { 
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: "firefox",
      use: { 
        ...devices["Desktop Firefox"],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: "webkit",
      use: { 
        ...devices["Desktop Safari"],
        viewport: { width: 1920, height: 1080 }
      },
    },
    // Mobile browsers
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
    // API tests
    {
      name: 'api',
      testDir: './tests/apiTests',
      use: {
        baseURL: process.env.API_BASE_URL || `${baseUrls[environment]}/api`,
      },
    },
  ],
  outputDir: 'test-results',
};

module.exports = config;
