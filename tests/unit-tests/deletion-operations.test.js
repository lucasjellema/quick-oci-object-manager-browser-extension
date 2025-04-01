/**
 * Test for deletion and restoration operations
 */

// Mock deleted files index
let deletedFilesIndex = {
  deletedFiles: ['file1.txt', 'folder/file2.txt']
};

// Mock fetch for saving the index
global.fetch = jest.fn((url, options) => {
  if (options && options.method === 'PUT') {
    return Promise.resolve({ ok: true });
  }
  if (options && options.method === 'DELETE') {
    return Promise.resolve({ ok: true });
  }
  return Promise.resolve({ 
    ok: true,
    json: () => Promise.resolve(deletedFilesIndex)
  });
});

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

/**
 * Deletes a file (logical deletion)
 * @param {string} filename - The file to delete
 * @returns {Promise<boolean>} Whether the deletion was successful
 */
async function deleteFile(filename) {
  try {
    // Normalize the filename
    const normalizedFilename = filename.startsWith('/') ? filename.substring(1) : filename;
    
    // Add the file to the deleted files index if it's not already there
    if (!isFileDeleted(normalizedFilename)) {
      deletedFilesIndex.deletedFiles.push(normalizedFilename);
      
      // Save the updated index
      const saveResult = await saveDeletedFilesIndex();
      
      if (!saveResult) {
        throw new Error('Failed to save deleted files index');
      }
      
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}

/**
 * Restores a deleted file
 * @param {string} filename - The file to restore
 * @returns {Promise<boolean>} Whether the restoration was successful
 */
async function restoreFile(filename) {
  try {
    // Normalize the filename
    const normalizedFilename = filename.startsWith('/') ? filename.substring(1) : filename;
    
    // Remove the file from the deleted files index
    if (isFileDeleted(normalizedFilename)) {
      deletedFilesIndex.deletedFiles = deletedFilesIndex.deletedFiles.filter(deletedFile => {
        const normalizedDeletedFilename = deletedFile.startsWith('/') ? deletedFile.substring(1) : deletedFile;
        return normalizedFilename !== normalizedDeletedFilename;
      });
      
      // Save the updated index
      const saveResult = await saveDeletedFilesIndex();
      
      if (!saveResult) {
        throw new Error('Failed to save deleted files index');
      }
      
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}

/**
 * Saves the deleted files index
 * @returns {Promise<boolean>} Whether the save was successful
 */
async function saveDeletedFilesIndex() {
  try {
    // Mock saving the index
    const response = await fetch('https://example.com/logically-deleted-files.json', {
      method: 'PUT',
      body: JSON.stringify(deletedFilesIndex)
    });
    
    return response.ok;
  } catch (error) {
    return false;
  }
}

describe('Deletion Operations', () => {
  // Reset the deleted files index before each test
  beforeEach(() => {
    deletedFilesIndex = {
      deletedFiles: ['file1.txt', 'folder/file2.txt']
    };
    global.fetch.mockClear();
  });

  test('should delete a file by adding it to the index', async () => {
    const result = await deleteFile('newfile.txt');
    
    expect(result).toBe(true);
    expect(deletedFilesIndex.deletedFiles).toContain('newfile.txt');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test('should normalize paths when deleting', async () => {
    const result = await deleteFile('/path/to/newfile.txt');
    
    expect(result).toBe(true);
    expect(deletedFilesIndex.deletedFiles).toContain('path/to/newfile.txt');
  });

  test('should not add duplicate entries when deleting', async () => {
    const result = await deleteFile('file1.txt');
    
    expect(result).toBe(false);
    expect(deletedFilesIndex.deletedFiles.filter(f => f === 'file1.txt').length).toBe(1);
  });

  test('should restore a file by removing it from the index', async () => {
    const result = await restoreFile('file1.txt');
    
    expect(result).toBe(true);
    expect(deletedFilesIndex.deletedFiles).not.toContain('file1.txt');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test('should normalize paths when restoring', async () => {
    const result = await restoreFile('/folder/file2.txt');
    
    expect(result).toBe(true);
    expect(deletedFilesIndex.deletedFiles).not.toContain('folder/file2.txt');
  });

  test('should return false when restoring a file that is not deleted', async () => {
    const result = await restoreFile('nonexistent.txt');
    
    expect(result).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
