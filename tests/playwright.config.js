// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

// Get the absolute path to the extension
const extensionPath = path.resolve(__dirname, '..');

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',
  timeout: 60000, // Increase timeout to 60 seconds
  expect: {
    timeout: 10000 // Increase expect timeout to 10 seconds
  },
  fullyParallel: false, // Run tests sequentially for extension testing
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Add 1 retry for local testing
  workers: 1, // Use a single worker for extension testing
  reporter: 'html',
  use: {
    actionTimeout: 15000, // Increase action timeout
    navigationTimeout: 30000, // Add navigation timeout
    trace: 'on', // Record trace for all tests
    headless: false, // Run in headed mode to see the browser
    video: 'on-first-retry', // Record video on first retry
    screenshot: 'on', // Take screenshots
    // Launch options for testing with Chrome extensions
    launchOptions: {
      slowMo: 100, // Slow down actions by 100ms
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox',
        '--disable-web-security'
      ]
    }
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }
  ],
  outputDir: 'test-results/',
  webServer: {
    command: 'node mock-server.js',
    port: 3000,
    reuseExistingServer: true,
    timeout: 10000 // Increase web server startup timeout
  }
});
