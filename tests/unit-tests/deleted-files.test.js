/**
 * Test for deleted files detection functionality
 */

// Mock deleted files index
const deletedFilesIndex = {
  deletedFiles: ['file1.txt', 'folder/file2.txt']
};

/**
 * Checks if a file is in the deleted files index
 * @param {string} filename - The filename to check
 * @returns {boolean} Whether the file is deleted
 */
function isFileDeleted(filename) {
  if (!deletedFilesIndex || !deletedFilesIndex.deletedFiles || deletedFilesIndex.deletedFiles.length === 0) {
    return false;
  }
  
  // Handle null or undefined filename
  if (!filename) {
    return false;
  }
  
  // Normalize the filename (remove any leading slash)
  const normalizedFilename = filename.startsWith('/') ? filename.substring(1) : filename;
  
  // Check if the file is in the deleted files index
  return deletedFilesIndex.deletedFiles.some(deletedFile => {
    const normalizedDeletedFilename = deletedFile.startsWith('/') ? deletedFile.substring(1) : deletedFile;
    return normalizedFilename === normalizedDeletedFilename;
  });
}

describe('Deleted Files Detection', () => {
  test('should identify deleted files', () => {
    expect(isFileDeleted('file1.txt')).toBe(true);
    expect(isFileDeleted('folder/file2.txt')).toBe(true);
  });

  test('should normalize paths when checking', () => {
    expect(isFileDeleted('/file1.txt')).toBe(true);
    expect(isFileDeleted('/folder/file2.txt')).toBe(true);
  });

  test('should return false for non-deleted files', () => {
    expect(isFileDeleted('file3.txt')).toBe(false);
    expect(isFileDeleted('folder/file4.txt')).toBe(false);
  });

  test('should handle empty input', () => {
    expect(isFileDeleted('')).toBe(false);
    expect(isFileDeleted(null)).toBe(false);
    expect(isFileDeleted(undefined)).toBe(false);
  });
});
