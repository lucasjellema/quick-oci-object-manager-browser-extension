/**
 * Test for the file path construction in file-operations.mjs
 * This test imports the actual module and tests it directly
 */

// Import Jest functions for ES modules
import { jest, test, expect, describe, beforeEach } from '@jest/globals';

// Mock the modules that file-operations.mjs imports
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

// Import the actual file-operations.mjs module
import { uploadFiles } from '../../js/modules/file-operations.mjs';

// Mock File class for testing
class MockFile {
  constructor(name, size, type) {
    this.name = name;
    this.size = size;
    this.type = type;
    this.arrayBuffer = jest.fn(() => Promise.resolve(new ArrayBuffer(size)));
  }
}

// Tests for file path construction in file-operations.mjs
describe('File Operations Module Import Test', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock fetch to simulate a successful upload
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
  
  test('uploadFiles should maintain original filename case', async () => {
    // Create a mock file with mixed case
    const file = new MockFile('Chess_Puzzle.png', 1024, 'image/png');
    
    // Mock callbacks
    const progressCallback = jest.fn();
    const completeCallback = jest.fn();
    
    // Upload the file to a path
    await uploadFiles([file], 'blog-images/oci-blogs', progressCallback, completeCallback);
    
    // Verify fetch was called with the correct URL containing the original filename case
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('blog-images/oci-blogs/Chess_Puzzle.png'),
      expect.objectContaining({
        method: 'PUT'
      })
    );
  });
  
  test('uploadFiles should handle paths with trailing slashes', async () => {
    // Create a mock file
    const file = new MockFile('test.txt', 100, 'text/plain');
    
    // Upload the file to a path with trailing slash
    await uploadFiles([file], 'folder/', jest.fn(), jest.fn());
    
    // Verify fetch was called with the correct URL
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('folder/test.txt'),
      expect.any(Object)
    );
  });
  
  test('uploadFiles should handle paths without trailing slashes', async () => {
    // Create a mock file
    const file = new MockFile('test.txt', 100, 'text/plain');
    
    // Upload the file to a path without trailing slash
    await uploadFiles([file], 'folder', jest.fn(), jest.fn());
    
    // Verify fetch was called with the correct URL
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('folder/test.txt'),
      expect.any(Object)
    );
  });
  
  test('uploadFiles should handle the real-world bug case', async () => {
    // This is the exact scenario from the bug report
    const file = new MockFile('chess_puzzle.png', 1024, 'image/png');
    
    // Upload the file to the path from the bug report
    await uploadFiles([file], 'blog-images/oci-blogs', jest.fn(), jest.fn());
    
    // Verify fetch was called with the correct URL
    // The bug would have produced: blog-images/oci-blogsCHESS_PUZZLE.PNG
    // The fix produces: blog-images/oci-blogs/chess_puzzle.png
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('blog-images/oci-blogs/chess_puzzle.png'),
      expect.any(Object)
    );
  });
});
