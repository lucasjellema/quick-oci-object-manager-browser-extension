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

```bash
# Run all unit tests
npm run test:unit

# Run specific unit test files
npx jest unit-tests/system-files.test.js
npx jest unit-tests/deleted-files.test.js
npx jest unit-tests/deletion-operations.test.js
npx jest unit-tests/ui-components.test.js
```

### Unit Test Structure

The unit tests are organized into the following files:

1. **system-files.test.js**: Tests the system file filtering functionality that hides the index file from the UI
2. **deleted-files.test.js**: Tests the detection of deleted files and path normalization
3. **deletion-operations.test.js**: Tests the actual deletion and restoration operations
4. **ui-components.test.js**: Tests the UI components for showing/hiding deleted files

#### Testing Approach

The unit tests focus on the core functionality of the logical deletion system:

1. **Focused Component Tests**: Each test file focuses on a specific component of the logical deletion system
2. **Isolated Tests**: Tests are isolated from external dependencies to ensure reliable results
3. **Comprehensive Coverage**: Tests cover both normal operation and edge cases

This approach ensures that the core functionality is thoroughly tested while avoiding complex setup requirements.

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
