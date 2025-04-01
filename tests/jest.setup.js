// Jest setup file

// Mock Chrome API
const chromeMock = {
  storage: {
    sync: {
      get: jest.fn((keys, callback) => {
        const result = {};
        if (typeof keys === 'string') {
          result[keys] = chromeMock.storage.sync.data[keys] || null;
        } else if (Array.isArray(keys)) {
          keys.forEach(key => {
            result[key] = chromeMock.storage.sync.data[key] || null;
          });
        } else if (typeof keys === 'object') {
          Object.keys(keys).forEach(key => {
            result[key] = chromeMock.storage.sync.data[key] || keys[key];
          });
        } else {
          Object.assign(result, chromeMock.storage.sync.data);
        }
        callback(result);
      }),
      set: jest.fn((items, callback) => {
        Object.assign(chromeMock.storage.sync.data, items);
        if (callback) callback();
      }),
      data: {
        parUrl: 'https://objectstorage.example.com/p/mock-par-token/n/namespace/b/bucket/o/'
      }
    }
  },
  runtime: {
    getURL: jest.fn(path => `chrome-extension://mock-extension-id/${path}`)
  }
};

global.chrome = chromeMock;

// Mock fetch API
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob())
  })
);

// Mock DOM elements that might not be in jsdom
document.body.innerHTML = `
<div id="statusMessage" class="status"></div>
<div id="fileList"></div>
<div id="currentPath"></div>
<div id="loadingIndicator"></div>
`;

// Mock console methods to avoid cluttering test output
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Cleanup mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});
