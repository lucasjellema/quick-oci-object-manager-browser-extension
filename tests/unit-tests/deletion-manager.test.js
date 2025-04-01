/**
 * Unit tests for deletion manager module
 */

// Import the actual module to test
import * as deletionManager from '../../js/modules/deletion-manager.js';

// Mock dependencies
jest.mock('../../js/modules/utils.js', () => {
  return {
    constructUrl: jest.fn((baseUrl, path) => `${baseUrl}/${path}`),
    log: jest.fn(),
    showStatus: jest.fn()
  };
});

jest.mock('../../js/modules/storage.js', () => {
  return {
    getParUrl: jest.fn(() => Promise.resolve('https://example.com'))
  };
});

describe('Deletion Manager Module', () => {
  // Set up mocks before each test
  beforeEach(() => {
    // Mock the fetch API
    global.fetch = jest.fn(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ deletedFiles: ['file1.txt', 'folder/file2.txt', '/folder/file3.txt'] })
      })
    );
    
    // Reset module state
    deletionManager.toggleDeletedFilesVisibility();
    deletionManager.toggleDeletedFilesVisibility();
  });
  
  // Clean up after each test
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('toggleDeletedFilesVisibility', () => {
    test('should toggle showingDeletedFiles state', () => {
      // Initially should be false
      expect(deletionManager.isShowingDeletedFiles()).toBe(false);
      
      // Toggle to true
      expect(deletionManager.toggleDeletedFilesVisibility()).toBe(true);
      expect(deletionManager.isShowingDeletedFiles()).toBe(true);
      
      // Toggle back to false
      expect(deletionManager.toggleDeletedFilesVisibility()).toBe(false);
      expect(deletionManager.isShowingDeletedFiles()).toBe(false);
    });
  });

  describe('loadDeletedFilesIndex', () => {
    test('should load index file if it exists', async () => {
      const result = await deletionManager.loadDeletedFilesIndex('https://example.com');
      
      // Verify fetch was called with the correct URL
      expect(global.fetch).toHaveBeenCalledWith('https://example.com/logically-deleted-files.json');
      
      // Verify the result
      expect(result).toEqual({ deletedFiles: ['file1.txt', 'folder/file2.txt', '/folder/file3.txt'] });
    });
    
    test('should create new index if file does not exist', async () => {
      // Mock fetch response for file not found
      global.fetch.mockImplementationOnce(() => 
        Promise.resolve({
          ok: false,
          status: 404
        })
      );
      
      // Mock successful save
      global.fetch.mockImplementationOnce(() => 
        Promise.resolve({
          ok: true
        })
      );
      
      const result = await deletionManager.loadDeletedFilesIndex('https://example.com');
      
      // Verify fetch was called to get the index
      expect(global.fetch).toHaveBeenCalledWith('https://example.com/logically-deleted-files.json');
      
      // Verify a second fetch was called to create the index
      expect(global.fetch).toHaveBeenCalledTimes(2);
      
      // Verify the result is an empty index
      expect(result).toEqual({ deletedFiles: [] });
    });
  });

  describe('isFileDeleted', () => {
    beforeEach(async () => {
      // Load the deleted files index
      await deletionManager.loadDeletedFilesIndex('https://example.com');
    });
    
    test('should return true for deleted files', () => {
      expect(deletionManager.isFileDeleted('file1.txt')).toBe(true);
      expect(deletionManager.isFileDeleted('folder/file2.txt')).toBe(true);
      expect(deletionManager.isFileDeleted('/folder/file3.txt')).toBe(true);
      // Test with different path format
      expect(deletionManager.isFileDeleted('folder/file3.txt')).toBe(true);
    });

    test('should return false for non-deleted files', () => {
      expect(deletionManager.isFileDeleted('file4.txt')).toBe(false);
      expect(deletionManager.isFileDeleted('folder/file5.txt')).toBe(false);
    });

    test('should handle null or undefined filename', () => {
      expect(deletionManager.isFileDeleted(null)).toBe(false);
      expect(deletionManager.isFileDeleted(undefined)).toBe(false);
    });
  });

  describe('createDeletedFilesMap', () => {
    beforeEach(async () => {
      // Load the deleted files index
      await deletionManager.loadDeletedFilesIndex('https://example.com');
    });
    
    test('should create a map from deleted files index', () => {
      const map = deletionManager.createDeletedFilesMap();
      
      expect(map.size).toBe(3);
      expect(map.has('file1.txt')).toBe(true);
      expect(map.has('folder/file2.txt')).toBe(true);
      expect(map.has('folder/file3.txt')).toBe(true);
    });
  });

  describe('deleteFile', () => {
    beforeEach(() => {
      // Mock confirm dialog to always return true
      global.confirm = jest.fn(() => true);
      
      // Mock successful fetch for saving the index
      global.fetch.mockImplementation(() => 
        Promise.resolve({
          ok: true
        })
      );
    });
    
    test('should add a file to the deleted files index', async () => {
      const result = await deletionManager.deleteFile('newfile.txt');
      
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2); // One for PUT, one for reload
    });
  });
  
  describe('restoreFile', () => {
    beforeEach(async () => {
      // Load the deleted files index
      await deletionManager.loadDeletedFilesIndex('https://example.com');
      
      // Mock successful fetch for deleting the marker
      global.fetch.mockImplementation(() => 
        Promise.resolve({
          ok: true
        })
      );
    });
    
    test('should remove a file from the deleted files index', async () => {
      const result = await deletionManager.restoreFile('file1.txt');
      
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2); // One for DELETE, one for reload
    });
  });
});
