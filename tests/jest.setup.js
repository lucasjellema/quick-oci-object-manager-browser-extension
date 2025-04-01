// Jest setup file for ES modules
import { jest } from '@jest/globals';

// Mock console methods to avoid cluttering test output
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
};

// Mock fetch API for testing network requests
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob())
  })
);

// Mock FileReader for file operations
global.FileReader = function() {
  this.readAsArrayBuffer = jest.fn(file => {
    setTimeout(() => {
      if (this.onload) {
        this.onload({ target: { result: new ArrayBuffer(file?.size || 100) } });
      }
    }, 0);
  });
  this.result = null;
  this.onload = null;
};
