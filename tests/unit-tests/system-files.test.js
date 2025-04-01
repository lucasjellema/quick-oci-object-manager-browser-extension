/**
 * Test for system file filtering functionality
 */

// Define the system files constant
const SYSTEM_FILES = ['logically-deleted-files.json'];

/**
 * Checks if a file is a system file that should be hidden from the UI
 * @param {string} filename - The filename to check
 * @returns {boolean} Whether the file is a system file
 */
function isSystemFile(filename) {
  if (!filename) return false;
  
  // Get just the filename without path
  const baseFilename = filename.split('/').pop();
  
  return SYSTEM_FILES.includes(baseFilename);
}

describe('System File Filtering', () => {
  test('should identify system files', () => {
    expect(isSystemFile('logically-deleted-files.json')).toBe(true);
  });

  test('should identify system files with path', () => {
    expect(isSystemFile('/folder/logically-deleted-files.json')).toBe(true);
  });

  test('should return false for regular files', () => {
    expect(isSystemFile('regular-file.txt')).toBe(false);
    expect(isSystemFile('/folder/regular-file.txt')).toBe(false);
  });

  test('should handle empty input', () => {
    expect(isSystemFile('')).toBe(false);
    expect(isSystemFile(null)).toBe(false);
    expect(isSystemFile(undefined)).toBe(false);
  });
});
