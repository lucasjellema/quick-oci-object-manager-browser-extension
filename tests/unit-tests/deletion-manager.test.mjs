/**
 * Tests for deletion-manager.mjs module
 * Tests the logical deletion system using a JSON index file
 */

import { jest, test, expect, describe, beforeEach, afterEach } from '@jest/globals';

// Mock dependencies
jest.mock('../js/modules/utils.mjs', () => ({
  constructUrl: jest.fn((baseUrl, path) => `${baseUrl}/${path}`),
  log: jest.fn(),
  showStatus: jest.fn()
}));

jest.mock('../js/modules/storage.mjs', () => ({
  getParUrl: jest.fn(() => Promise.resolve('https://example.com'))
}));

// Import the module to test
import {
  toggleDeletedFilesVisibility,
  isShowingDeletedFiles,
  loadDeletedFilesIndex,
  saveDeletedFilesIndex,
  isFileDeleted,
  createDeletedFilesMap,
  deleteFile,
  restoreFile
} from '../../js/modules/deletion-manager.mjs';

describe('Deletion Manager Module', () => {
  // Mock data
  const mockDeletedFilesIndex = {
    deletedFiles: [
      { name: 'deleted-file1.txt', deletedAt: '2023-01-01T12:00:00Z' },
      { name: 'folder/deleted-file2.txt', deletedAt: '2023-01-02T12:00:00Z' }
    ]
  };
  
  const mockParUrl = 'https://example.com';
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Reset module state by reloading with empty index
    loadDeletedFilesIndex(mockParUrl).then(() => {
      // Do nothing, just ensure the module is initialized
    });
    
    // Mock fetch API
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('logically-deleted-files.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDeletedFilesIndex),
          text: () => Promise.resolve(JSON.stringify(mockDeletedFilesIndex))
        });
      }
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve('Success')
      });
    });
  });
  
  afterEach(() => {
    // Clean up
    global.fetch.mockClear();
  });
  
  describe('toggleDeletedFilesVisibility function', () => {
    test('should toggle the visibility state', () => {
      // Get initial state
      const initialState = isShowingDeletedFiles();
      
      // Toggle state
      const newState = toggleDeletedFilesVisibility();
      
      // Verify state was toggled
      expect(newState).toBe(!initialState);
      expect(isShowingDeletedFiles()).toBe(newState);
      
      // Toggle back
      const finalState = toggleDeletedFilesVisibility();
      
      // Verify state was toggled back
      expect(finalState).toBe(initialState);
      expect(isShowingDeletedFiles()).toBe(initialState);
    });
  });
  
  describe('loadDeletedFilesIndex function', () => {
    test('should load deleted files index from the bucket', async () => {
      // Load the index
      const result = await loadDeletedFilesIndex(mockParUrl);
      
      // Verify the result
      expect(result).toEqual(mockDeletedFilesIndex);
    });
    
    test('should fetch PAR URL if not provided', async () => {
      // Mock getParUrl
      const { getParUrl } = require('../js/modules/storage.mjs');
      
      // Load the index without providing PAR URL
      await loadDeletedFilesIndex();
      
      // Verify getParUrl was called
      expect(getParUrl).toHaveBeenCalled();
    });
    
    test('should handle fetch errors', async () => {
      // Mock fetch to fail
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      
      // Load the index
      const result = await loadDeletedFilesIndex(mockParUrl);
      
      // Verify the result is a default index
      expect(result).toEqual({ deletedFiles: [] });
    });
  });
  
  describe('isFileDeleted function', () => {
    test('should return true for deleted files', async () => {
      // Mock the internal state of the module
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDeletedFilesIndex)
      });
      
      // Load the index first
      await loadDeletedFilesIndex(mockParUrl);
      
      // Check if files are deleted
      expect(isFileDeleted('deleted-file1.txt')).toBe(true);
      expect(isFileDeleted('folder/deleted-file2.txt')).toBe(true);
    });
    
    test('should return false for non-deleted files', async () => {
      // Mock the internal state of the module
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDeletedFilesIndex)
      });
      
      // Load the index first
      await loadDeletedFilesIndex(mockParUrl);
      
      // Check if files are deleted
      expect(isFileDeleted('non-deleted-file.txt')).toBe(false);
      expect(isFileDeleted('folder/non-deleted-file.txt')).toBe(false);
    });
    
    test('should handle null or empty filenames', async () => {
      // Check edge cases
      expect(isFileDeleted(null)).toBe(false);
      expect(isFileDeleted('')).toBe(false);
    });
  });
  
  describe('createDeletedFilesMap function', () => {
    test('should create a map of deleted files', async () => {
      // Mock the internal state of the module
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDeletedFilesIndex)
      });
      
      // Load the index first
      await loadDeletedFilesIndex(mockParUrl);
      
      // Create the map
      const map = createDeletedFilesMap();
      
      // Verify the map
      expect(map).toBeInstanceOf(Map);
      expect(map.size).toBe(2);
      expect(map.get('deleted-file1.txt')).toBe(true);
      expect(map.get('folder/deleted-file2.txt')).toBe(true);
    });
  });
  
  describe('deleteFile function', () => {
    test('should add file to deleted files index', async () => {
      // Mock the internal state of the module
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ deletedFiles: [] })
      }).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('Success')
      });
      
      // Delete a file
      const result = await deleteFile('new-deleted-file.txt', mockParUrl);
      
      // Verify the result
      expect(result).toBe(true);
    });
  });
  
  describe('restoreFile function', () => {
    test('should remove file from deleted files index', async () => {
      // Mock the internal state of the module
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDeletedFilesIndex)
      }).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('Success')
      });
      
      // Restore a file
      const result = await restoreFile('deleted-file1.txt', mockParUrl);
      
      // Verify the result
      expect(result).toBe(true);
    });
  });
});
