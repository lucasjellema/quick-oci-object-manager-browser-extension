/**
 * Tests for storage.mjs module
 * Tests Chrome storage operations for Quick OCI Object Manager
 */

import { jest, test, expect, describe, beforeEach, afterEach } from '@jest/globals';

// Create a mock for the log function
const mockLog = jest.fn();

// Mock dependencies
jest.mock('../js/modules/utils.mjs', () => ({
  log: mockLog
}));

// Mock Chrome API
global.chrome = {
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn()
    }
  }
};

// Import the module to test
import {
  getParUrl,
  setParUrl,
  getCurrentFolder,
  setCurrentFolder,
  getAllFolders,
  setAllFolders,
  addFolder,
  clearStorage
} from '../../js/modules/storage.mjs';

describe('Storage Module', () => {
  // Mock data
  const mockParUrl = 'https://example.com/p/token/bucket/object';
  const mockFolder = '/test/folder';
  const mockFolders = new Set(['/folder1', '/folder2', '/folder3']);
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Set up default mock implementations
    chrome.storage.sync.get.mockImplementation((keys, callback) => {
      const result = {};
      if (keys.includes('parUrl')) {
        result.parUrl = mockParUrl;
      }
      if (keys.includes('currentFolder')) {
        result.currentFolder = mockFolder;
      }
      if (keys.includes('allFolders')) {
        result.allFolders = Array.from(mockFolders);
      }
      callback(result);
    });
    
    chrome.storage.sync.set.mockImplementation((data, callback) => {
      callback();
    });
    
    chrome.storage.sync.clear.mockImplementation((callback) => {
      callback();
    });
  });
  
  afterEach(() => {
    // Clean up
    jest.resetAllMocks();
  });
  
  describe('getParUrl function', () => {
    test('should retrieve PAR URL from Chrome storage', async () => {
      // Call the function
      const result = await getParUrl();
      
      // Verify Chrome storage was accessed with the correct key
      expect(chrome.storage.sync.get).toHaveBeenCalledWith(['parUrl'], expect.any(Function));
      
      // Verify the result
      expect(result).toBe(mockParUrl);
    });
    
    test('should return null if PAR URL is not set', async () => {
      // Mock storage to return empty result
      chrome.storage.sync.get.mockImplementationOnce((keys, callback) => {
        callback({});
      });
      
      // Call the function
      const result = await getParUrl();
      
      // Verify the result
      expect(result).toBeNull();
    });
  });
  
  describe('setParUrl function', () => {
    test('should save PAR URL to Chrome storage', async () => {
      // Call the function
      await setParUrl(mockParUrl);
      
      // Verify Chrome storage was updated with the correct data
      expect(chrome.storage.sync.set).toHaveBeenCalledWith(
        { parUrl: mockParUrl },
        expect.any(Function)
      );
    });
    
    test('should log the saved PAR URL', async () => {
      // Call the function
      await setParUrl(mockParUrl);
      
      // Verify log was called with the correct message
      expect(mockLog).toHaveBeenCalledWith('PAR URL saved:', mockParUrl);
    });
  });
  
  describe('getCurrentFolder function', () => {
    test('should retrieve current folder from Chrome storage', async () => {
      // Call the function
      const result = await getCurrentFolder();
      
      // Verify Chrome storage was accessed with the correct key
      expect(chrome.storage.sync.get).toHaveBeenCalledWith(['currentFolder'], expect.any(Function));
      
      // Verify the result
      expect(result).toBe(mockFolder);
    });
    
    test('should return root folder if current folder is not set', async () => {
      // Mock storage to return empty result
      chrome.storage.sync.get.mockImplementationOnce((keys, callback) => {
        callback({});
      });
      
      // Call the function
      const result = await getCurrentFolder();
      
      // Verify the result
      expect(result).toBe('/');
    });
  });
  
  describe('setCurrentFolder function', () => {
    test('should save current folder to Chrome storage', async () => {
      // Call the function
      await setCurrentFolder(mockFolder);
      
      // Verify Chrome storage was updated with the correct data
      expect(chrome.storage.sync.set).toHaveBeenCalledWith(
        { currentFolder: mockFolder },
        expect.any(Function)
      );
    });
    
    test('should log the saved folder', async () => {
      // Call the function
      await setCurrentFolder(mockFolder);
      
      // Verify log was called with the correct message
      expect(mockLog).toHaveBeenCalledWith('Current folder saved:', mockFolder);
    });
  });
  
  describe('getAllFolders function', () => {
    test('should retrieve all folders from Chrome storage', async () => {
      // Call the function
      const result = await getAllFolders();
      
      // Verify Chrome storage was accessed with the correct key
      expect(chrome.storage.sync.get).toHaveBeenCalledWith(['allFolders'], expect.any(Function));
      
      // Verify the result
      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(mockFolders.size);
      for (const folder of mockFolders) {
        expect(result.has(folder)).toBe(true);
      }
    });
    
    test('should return empty set if no folders are saved', async () => {
      // Mock storage to return empty result
      chrome.storage.sync.get.mockImplementationOnce((keys, callback) => {
        callback({});
      });
      
      // Call the function
      const result = await getAllFolders();
      
      // Verify the result
      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(0);
    });
  });
  
  describe('setAllFolders function', () => {
    test('should save all folders to Chrome storage', async () => {
      // Call the function
      await setAllFolders(mockFolders);
      
      // Verify Chrome storage was updated with the correct data
      expect(chrome.storage.sync.set).toHaveBeenCalledWith(
        { allFolders: Array.from(mockFolders) },
        expect.any(Function)
      );
    });
    
    test('should log the saved folders', async () => {
      // Call the function
      await setAllFolders(mockFolders);
      
      // Verify log was called with the correct message
      expect(mockLog).toHaveBeenCalledWith('All folders saved:', Array.from(mockFolders));
    });
  });
  
  describe('addFolder function', () => {
    test('should add a new folder to the list of all folders', async () => {
      // New folder to add
      const newFolder = '/new/folder';
      
      // Call the function
      await addFolder(newFolder);
      
      // Verify Chrome storage was accessed to get current folders
      expect(chrome.storage.sync.get).toHaveBeenCalledWith(['allFolders'], expect.any(Function));
      
      // Verify Chrome storage was updated with the new folder added
      const expectedFolders = new Set(mockFolders);
      expectedFolders.add(newFolder);
      
      expect(chrome.storage.sync.set).toHaveBeenCalledWith(
        { allFolders: Array.from(expectedFolders) },
        expect.any(Function)
      );
    });
    
    test('should not add duplicate folders', async () => {
      // Existing folder
      const existingFolder = '/folder1';
      
      // Call the function
      await addFolder(existingFolder);
      
      // Verify Chrome storage was accessed to get current folders
      expect(chrome.storage.sync.get).toHaveBeenCalledWith(['allFolders'], expect.any(Function));
      
      // Verify Chrome storage was updated with the same folders (no duplicates)
      expect(chrome.storage.sync.set).toHaveBeenCalledWith(
        { allFolders: Array.from(mockFolders) },
        expect.any(Function)
      );
    });
  });
  
  describe('clearStorage function', () => {
    test('should clear all Chrome storage data', async () => {
      // Call the function
      await clearStorage();
      
      // Verify Chrome storage clear was called
      expect(chrome.storage.sync.clear).toHaveBeenCalledWith(expect.any(Function));
    });
    
    test('should log the storage cleared message', async () => {
      // Call the function
      await clearStorage();
      
      // Verify log was called with the correct message
      expect(mockLog).toHaveBeenCalledWith('Storage cleared');
    });
  });
});
