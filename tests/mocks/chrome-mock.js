/**
 * Chrome API mock for unit testing
 */

// Mock storage
const storageMock = {
  sync: {
    get: jest.fn((keys, callback) => {
      const result = {};
      if (typeof keys === 'string') {
        result[keys] = storageMock.data[keys] || null;
      } else if (Array.isArray(keys)) {
        keys.forEach(key => {
          result[key] = storageMock.data[key] || null;
        });
      } else if (typeof keys === 'object') {
        Object.keys(keys).forEach(key => {
          result[key] = storageMock.data[key] || keys[key];
        });
      } else {
        Object.assign(result, storageMock.data);
      }
      callback(result);
    }),
    set: jest.fn((items, callback) => {
      Object.assign(storageMock.data, items);
      if (callback) callback();
    }),
    clear: jest.fn(callback => {
      storageMock.data = {};
      if (callback) callback();
    }),
    // Mock data store
    data: {
      parUrl: 'https://objectstorage.example.com/p/mock-par-token/n/namespace/b/bucket/o/'
    }
  },
  local: {
    get: jest.fn((keys, callback) => {
      const result = {};
      if (typeof keys === 'string') {
        result[keys] = storageMock.localData[keys] || null;
      } else if (Array.isArray(keys)) {
        keys.forEach(key => {
          result[key] = storageMock.localData[key] || null;
        });
      } else if (typeof keys === 'object') {
        Object.keys(keys).forEach(key => {
          result[key] = storageMock.localData[key] || keys[key];
        });
      } else {
        Object.assign(result, storageMock.localData);
      }
      callback(result);
    }),
    set: jest.fn((items, callback) => {
      Object.assign(storageMock.localData, items);
      if (callback) callback();
    }),
    clear: jest.fn(callback => {
      storageMock.localData = {};
      if (callback) callback();
    }),
    // Mock local data store
    localData: {}
  }
};

// Mock runtime
const runtimeMock = {
  onMessage: {
    addListener: jest.fn(),
    removeListener: jest.fn()
  },
  sendMessage: jest.fn(),
  getURL: jest.fn(path => `chrome-extension://mock-extension-id/${path}`)
};

// Mock action
const actionMock = {
  onClicked: {
    addListener: jest.fn()
  },
  setBadgeText: jest.fn(),
  setBadgeBackgroundColor: jest.fn()
};

// Mock side panel
const sidePanelMock = {
  open: jest.fn(),
  setPanelBehavior: jest.fn()
};

// Mock context menus
const contextMenusMock = {
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  removeAll: jest.fn(),
  onClicked: {
    addListener: jest.fn()
  }
};

// Export the complete Chrome API mock
const chromeMock = {
  storage: storageMock,
  runtime: runtimeMock,
  action: actionMock,
  sidePanel: sidePanelMock,
  contextMenus: contextMenusMock
};

export default chromeMock;
