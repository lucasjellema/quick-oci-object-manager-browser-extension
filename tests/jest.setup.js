// Jest setup file

// Mock Chrome API
global.chrome = {
  storage: {
    sync: {
      get: jest.fn((keys, callback) => {
        const result = {};
        if (typeof keys === 'string') {
          result[keys] = global.chrome.storage.sync.data[keys] || null;
        } else if (Array.isArray(keys)) {
          keys.forEach(key => {
            result[key] = global.chrome.storage.sync.data[key] || null;
          });
        } else if (typeof keys === 'object') {
          Object.keys(keys).forEach(key => {
            result[key] = global.chrome.storage.sync.data[key] || keys[key];
          });
        } else {
          Object.assign(result, global.chrome.storage.sync.data);
        }
        callback(result);
      }),
      set: jest.fn((data, callback) => {
        Object.assign(global.chrome.storage.sync.data, data);
        if (callback) callback();
      }),
      data: {}
    },
    local: {
      get: jest.fn((keys, callback) => {
        const result = {};
        if (typeof keys === 'string') {
          result[keys] = global.chrome.storage.local.data[keys] || null;
        } else if (Array.isArray(keys)) {
          keys.forEach(key => {
            result[key] = global.chrome.storage.local.data[key] || null;
          });
        } else if (typeof keys === 'object') {
          Object.keys(keys).forEach(key => {
            result[key] = global.chrome.storage.local.data[key] || keys[key];
          });
        } else {
          Object.assign(result, global.chrome.storage.local.data);
        }
        callback(result);
      }),
      set: jest.fn((data, callback) => {
        Object.assign(global.chrome.storage.local.data, data);
        if (callback) callback();
      }),
      data: {}
    }
  },
  runtime: {
    lastError: null
  }
};

// Mock fetch
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob())
  })
);

// Mock DOM elements that might not be in jsdom
global.document.body.innerHTML = `
<div id="status" style="display: none;"></div>
<div id="fileList"></div>
<div id="breadcrumbs"></div>
<button id="showDeletedFilesBtn">Show Deleted Files</button>
<button id="hideDeletedFilesBtn" style="display: none;">Hide Deleted Files</button>
`;

// Mock FileReader
global.FileReader = function() {
  this.readAsArrayBuffer = jest.fn(file => {
    setTimeout(() => {
      if (this.onload) {
        this.onload({ target: { result: new ArrayBuffer(file.size || 100) } });
      }
    }, 0);
  });
  this.result = null;
  this.onload = null;
};

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
