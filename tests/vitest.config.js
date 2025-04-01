import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['unit-tests/**/*.test.js'],
    globals: true
  }
});
