module.exports = {
  testEnvironment: 'jsdom',
  testMatch: [
    '**/unit-tests/**/*.test.js'
  ],
  transform: {},
  testTimeout: 5000,
  setupFilesAfterEnv: ['./jest.setup.js']
};
