export default {
  testEnvironment: 'jsdom',
  testMatch: [
    '**/unit-tests/**/*.test.js',
    '**/unit-tests/**/*.test.mjs'
  ],
  transform: {},
  transformIgnorePatterns: [],
  testTimeout: 5000,
  setupFilesAfterEnv: ['./jest.setup.new.js']
};
