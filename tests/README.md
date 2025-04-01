# Automated Testing for Quick OCI Object Manager

This directory contains automated tests for the Quick OCI Object Manager Chrome extension using Playwright.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Install Playwright browsers:
   ```
   npx playwright install
   ```

## Running Tests

### Mock Server

The mock server simulates OCI Object Storage for testing purposes:

```
npm run mock-server
```

This will start a server at http://localhost:3000 that mimics the OCI Object Storage API. Use `http://localhost:3000/o` as your PAR URL in the extension settings for testing.

### Running Tests

To run the automated tests:

```
npm test
```

This will:
1. Launch Chrome with the extension loaded
2. Run through the test suite
3. Generate a report of the test results

## Test Structure

- `playwright.config.js` - Configuration for Playwright
- `mock-server.js` - Express server that simulates OCI Object Storage
- `tests/` - Directory containing test files
  - `extension.test.js` - Tests for the extension functionality

## What's Being Tested

1. **Options Page**
   - Loading the options page
   - Saving PAR URL settings

2. **Side Panel**
   - Loading the side panel
   - UI elements visibility

3. **Logical Deletion**
   - Delete button visibility
   - Toggle functionality for showing/hiding deleted files

4. **API Interactions**
   - Mocked file deletion

## Adding New Tests

To add new tests, create or modify files in the `tests/` directory. Follow the existing patterns for:

1. Testing UI elements
2. Mocking API responses
3. Simulating user interactions

## Unit Tests

In addition to end-to-end tests, this project includes unit tests for critical components, particularly focusing on the logical deletion system.

### Running Unit Tests

All tests should be run from the `tests` directory of the project.

```bash
# Run all tests (both CommonJS and ES modules)
node --experimental-vm-modules node_modules/jest/bin/jest.js

# Run all ES module tests
node --experimental-vm-modules node_modules/jest/bin/jest.js "unit-tests/.*\.mjs$"

# Run specific ES module test files
node --experimental-vm-modules node_modules/jest/bin/jest.js unit-tests/utils.test.mjs
node --experimental-vm-modules node_modules/jest/bin/jest.js unit-tests/file-operations.test.mjs
node --experimental-vm-modules node_modules/jest/bin/jest.js unit-tests/storage.test.mjs
node --experimental-vm-modules node_modules/jest/bin/jest.js unit-tests/deletion-manager.test.mjs
node --experimental-vm-modules node_modules/jest/bin/jest.js unit-tests/file-operations-import.test.mjs
```

### Unit Test Structure

The unit tests are organized into the following files:

#### ES Module Tests (.mjs)
1. **utils.test.mjs**: Tests utility functions for path handling and URL construction
2. **file-operations.test.mjs**: Tests file upload functionality and path construction
   - Focuses on the fix for preserving filename case
   - Tests proper path construction with slashes
   - Verifies handling of paths with and without trailing slashes
3. **storage.test.mjs**: Tests Chrome storage operations for settings and folders
4. **deletion-manager.test.mjs**: Tests the logical deletion system using a JSON index
5. **file-operations-import.test.mjs**: Additional tests for file operations module

### Running Specific Tests

To run specific unit tests:

```bash
# Run a specific test file
npx jest unit-tests/system-files.test.js

# Run multiple test files
npx jest unit-tests/system-files.test.js unit-tests/deleted-files.test.js
```

### Running All Tests

To run both unit tests and end-to-end tests:

```bash
npm run test:all
```

This will first run the unit tests and then the end-to-end tests.

## Debugging

When tests fail, Playwright generates traces that can be viewed with:

```
npx playwright show-report
```

This opens a web interface showing detailed information about each test run, including screenshots and DOM snapshots.
