/**
 * Test for file-operations.mjs module
 * Focuses on testing the file path construction fix
 */

import { jest, test, expect, describe, beforeEach } from '@jest/globals';

// Mock dependencies
jest.mock('../js/modules/utils.mjs', () => ({
  constructUrl: jest.fn((baseUrl, path) => `${baseUrl}/${path}`),
  getParentPath: jest.fn(path => path === '/' ? '/' : path.substring(0, path.lastIndexOf('/'))),
  normalizePathForDisplay: jest.fn(path => path),
  log: jest.fn(),
  showStatus: jest.fn()
}));

jest.mock('../js/modules/storage.mjs', () => ({
  getParUrl: jest.fn(() => Promise.resolve('https://example.com')),
  setCurrentFolder: jest.fn()
}));

jest.mock('../js/modules/deletion-manager.mjs', () => ({
  loadDeletedFilesIndex: jest.fn(() => Promise.resolve({ deletedFiles: [] })),
  createDeletedFilesMap: jest.fn(() => new Map()),
  isShowingDeletedFiles: jest.fn(() => false)
}));

// Import the module to test
import { uploadFiles } from '../../js/modules/file-operations.mjs';

// Mock File class for testing
class MockFile {
  constructor(name, size, type) {
    this.name = name;
    this.size = size || 1024;
    this.type = type || 'application/octet-stream';
    this.arrayBuffer = jest.fn(() => Promise.resolve(new ArrayBuffer(this.size)));
  }
}

describe('File Operations Module', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock fetch API
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('Upload successful')
    });
    
    // Mock FileReader
    global.FileReader = function() {
      this.readAsArrayBuffer = jest.fn(file => {
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: new ArrayBuffer(file.size) } });
          }
        }, 0);
      });
      this.result = null;
      this.onload = null;
    };
  });
  
  describe('File Path Construction Fix', () => {
    test('Should preserve original filename case', async () => {
      // Create a mock file with mixed case
      const file = new MockFile('Chess_Puzzle.png');
      
      // Mock callbacks
      const progressCallback = jest.fn();
      const completeCallback = jest.fn();
      
      // Upload the file
      await uploadFiles([file], 'blog-images/oci-blogs', progressCallback, completeCallback);
      
      // Extract the URL from the fetch call
      const fetchCalls = global.fetch.mock.calls;
      expect(fetchCalls.length).toBeGreaterThan(0);
      
      // Get the first argument of the first call (the URL)
      const url = fetchCalls[0][0];
      
      // Verify the URL contains the correct path with preserved case
      expect(url).toContain('blog-images/oci-blogs/Chess_Puzzle.png');
    });
    
    test('Should handle paths with trailing slashes', async () => {
      // Create a mock file
      const file = new MockFile('test.txt');
      
      // Upload the file to a path with trailing slash
      await uploadFiles([file], 'folder/', jest.fn(), jest.fn());
      
      // Extract the URL from the fetch call
      const fetchCalls = global.fetch.mock.calls;
      expect(fetchCalls.length).toBeGreaterThan(0);
      
      // Get the first argument of the first call (the URL)
      const url = fetchCalls[0][0];
      
      // Verify the URL contains the correct path
      expect(url).toContain('folder/test.txt');
    });
    
    test('Should handle paths without trailing slashes', async () => {
      // Create a mock file
      const file = new MockFile('test.txt');
      
      // Upload the file to a path without trailing slash
      await uploadFiles([file], 'folder', jest.fn(), jest.fn());
      
      // Extract the URL from the fetch call
      const fetchCalls = global.fetch.mock.calls;
      expect(fetchCalls.length).toBeGreaterThan(0);
      
      // Get the first argument of the first call (the URL)
      const url = fetchCalls[0][0];
      
      // Verify the URL contains the correct path with slash added
      expect(url).toContain('folder/test.txt');
    });
    
    test('Should handle the real-world bug case', async () => {
      // This is the exact scenario from the bug report
      const file = new MockFile('chess_puzzle.png');
      
      // Upload the file to the path from the bug report
      await uploadFiles([file], 'blog-images/oci-blogs', jest.fn(), jest.fn());
      
      // Extract the URL from the fetch call
      const fetchCalls = global.fetch.mock.calls;
      expect(fetchCalls.length).toBeGreaterThan(0);
      
      // Get the first argument of the first call (the URL)
      const url = fetchCalls[0][0];
      
      // Verify the URL contains the correct path with preserved case
      // The bug would have produced: blog-images/oci-blogsCHESS_PUZZLE.PNG
      // The fix produces: blog-images/oci-blogs/chess_puzzle.png
      expect(url).toContain('blog-images/oci-blogs/chess_puzzle.png');
    });
    
    test('Should handle multiple files with different cases', async () => {
      // Create mock files with different cases
      const files = [
        new MockFile('lowercase.txt'),
        new MockFile('MixedCase.jpg'),
        new MockFile('UPPERCASE.PDF')
      ];
      
      // Upload the files
      await uploadFiles(files, 'documents', jest.fn(), jest.fn());
      
      // Extract the URLs from the fetch calls
      const fetchCalls = global.fetch.mock.calls;
      expect(fetchCalls.length).toBe(3);
      
      // Get all URLs from the fetch calls
      const urls = fetchCalls.map(call => call[0]);
      
      // Verify each URL contains the correct path with preserved case
      expect(urls[0]).toContain('documents/lowercase.txt');
      expect(urls[1]).toContain('documents/MixedCase.jpg');
      expect(urls[2]).toContain('documents/UPPERCASE.PDF');
    });
    
    test('Should handle root path uploads', async () => {
      // Create a mock file
      const file = new MockFile('root-file.txt');
      
      // Upload the file to the root path
      await uploadFiles([file], '/', jest.fn(), jest.fn());
      
      // Extract the URL from the fetch call
      const fetchCalls = global.fetch.mock.calls;
      expect(fetchCalls.length).toBeGreaterThan(0);
      
      // Get the first argument of the first call (the URL)
      const url = fetchCalls[0][0];
      
      // Verify the URL contains the correct path
      expect(url).toContain('/root-file.txt');
    });
    
    test('Should handle empty path uploads', async () => {
      // Create a mock file
      const file = new MockFile('no-path-file.txt');
      
      // Upload the file with no path
      await uploadFiles([file], '', jest.fn(), jest.fn());
      
      // Extract the URL from the fetch call
      const fetchCalls = global.fetch.mock.calls;
      expect(fetchCalls.length).toBeGreaterThan(0);
      
      // Get the first argument of the first call (the URL)
      const url = fetchCalls[0][0];
      
      // Verify the URL contains just the filename
      expect(url).toContain('no-path-file.txt');
    });
  });
});
