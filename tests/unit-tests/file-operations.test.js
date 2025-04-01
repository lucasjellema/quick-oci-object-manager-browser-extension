/**
 * Unit tests for file operations module
 */

// Import the mock module for testing
const fileOperations = require('../mocks/file-operations-mock');

describe('File Operations Module', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          objects: [
            { name: 'file1.txt', size: 100 },
            { name: 'folder1/', size: 0 }
          ]
        })
      })
    );
  });

  describe('isSystemFile', () => {
    test('should identify system files', () => {
      expect(fileOperations.isSystemFile('logically-deleted-files.json')).toBe(true);
    });

    test('should identify system files with path', () => {
      expect(fileOperations.isSystemFile('/folder/logically-deleted-files.json')).toBe(true);
    });

    test('should return false for regular files', () => {
      expect(fileOperations.isSystemFile('regular-file.txt')).toBe(false);
      expect(fileOperations.isSystemFile('/folder/regular-file.txt')).toBe(false);
    });

    test('should handle empty input', () => {
      expect(fileOperations.isSystemFile('')).toBe(false);
      expect(fileOperations.isSystemFile(null)).toBe(false);
      expect(fileOperations.isSystemFile(undefined)).toBe(false);
    });
  });

  describe('processBucketContents', () => {
    // Sample bucket data for testing
    const sampleData = {
      objects: [
        { name: 'file1.txt', size: 100, timeModified: '2023-01-01' },
        { name: 'folder1/', size: 0, timeModified: '2023-01-01' },
        { name: 'folder1/file2.txt', size: 200, timeModified: '2023-01-01' },
        { name: 'FunnyFolder/', size: 0, timeModified: '2023-01-01' },
        { name: 'FunnyFolder/joke.txt', size: 120, timeModified: '2023-01-01' },
        { name: 'FunnyFolder/meme.jpg', size: 500, timeModified: '2023-01-01' },
        { name: 'logically-deleted-files.json', size: 50, timeModified: '2023-01-01' },
        { name: 'deleted-file.txt', size: 150, timeModified: '2023-01-01' }
      ]
    };

    test('should filter out system files', () => {
      const result = fileOperations.processBucketContents(sampleData, '/');
      
      // Check that system files are not included
      const hasSystemFile = result.files.some(file => file.fileName === 'logically-deleted-files.json');
      expect(hasSystemFile).toBe(false);
    });

    test('should filter out deleted files when not showing them', () => {
      const result = fileOperations.processBucketContents(sampleData, '/');
      
      // Check that deleted files are not included
      const hasDeletedFile = result.files.some(file => file.fileName === 'deleted-file.txt');
      expect(hasDeletedFile).toBe(false);
    });

    test('should identify all folders correctly', () => {
      const result = fileOperations.processBucketContents(sampleData, '/');
      
      expect(result.folders).toContain('folder1');
      expect(result.folders).toContain('FunnyFolder');
      expect(result.folders.length).toBe(2);
    });

    test('should include files in the current directory', () => {
      const result = fileOperations.processBucketContents(sampleData, '/');
      
      // Should include file1.txt but not folder1/file2.txt
      const hasFile1 = result.files.some(file => file.fileName === 'file1.txt');
      const hasFile2 = result.files.some(file => file.fileName === 'file2.txt');
      
      expect(hasFile1).toBe(true);
      expect(hasFile2).toBe(false);
    });

    test('should handle subdirectory path', () => {
      const result = fileOperations.processBucketContents(sampleData, '/folder1');
      
      // Should include folder1/file2.txt as file2.txt
      const hasFile2 = result.files.some(file => file.fileName === 'file2.txt');
      
      expect(hasFile2).toBe(true);
    });

    test('should include files from FunnyFolder when in that directory', () => {
      const result = fileOperations.processBucketContents(sampleData, '/FunnyFolder');
      
      // Should include joke.txt and meme.jpg
      const hasJokeFile = result.files.some(file => file.fileName === 'joke.txt');
      const hasMemeFile = result.files.some(file => file.fileName === 'meme.jpg');
      
      expect(hasJokeFile).toBe(true);
      expect(hasMemeFile).toBe(true);
      expect(result.files.length).toBe(2);
    });
  });

  describe('loadBucketContents', () => {
    test('should load bucket contents successfully', async () => {
      const renderCallback = jest.fn();
      const result = await fileOperations.loadBucketContents('/', renderCallback);
      
      // Verify fetch was called
      expect(global.fetch).toHaveBeenCalled();
      
      // Verify render callback was called
      expect(renderCallback).toHaveBeenCalled();
      
      // Verify the result
      expect(result).toEqual([
        { name: 'file1.txt', size: 100 },
        { name: 'folder1/', size: 0 }
      ]);
    });
  });
});
