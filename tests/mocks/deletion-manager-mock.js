/**
 * Mock implementation of the deletion manager module
 */

// Mock deleted files index
let deletedFilesIndex = {
  deletedFiles: []
};

// Flag for showing deleted files
let showingDeletedFiles = false;

/**
 * Toggles the visibility of deleted files
 * @returns {boolean} The new state of showingDeletedFiles
 */
function toggleDeletedFilesVisibility() {
  showingDeletedFiles = !showingDeletedFiles;
  return showingDeletedFiles;
}

/**
 * Gets the current state of deleted files visibility
 * @returns {boolean} Whether deleted files are being shown
 */
function isShowingDeletedFiles() {
  return showingDeletedFiles;
}

/**
 * Loads the deleted files index from the server
 * @param {string} parUrl - The PAR URL
 * @returns {Promise<Object>} The deleted files index
 */
async function loadDeletedFilesIndex(parUrl) {
  try {
    const indexUrl = `${parUrl}/logically-deleted-files.json`;
    const response = await fetch(indexUrl);
    
    if (response.ok) {
      deletedFilesIndex = await response.json();
      return deletedFilesIndex;
    } else if (response.status === 404) {
      // Create a new index if it doesn't exist
      deletedFilesIndex = { deletedFiles: [] };
      await saveDeletedFilesIndex(parUrl, deletedFilesIndex);
      return deletedFilesIndex;
    } else {
      throw new Error(`Failed to load deleted files index: ${response.status}`);
    }
  } catch (error) {
    console.error('Error loading deleted files index:', error);
    deletedFilesIndex = { deletedFiles: [] };
    return deletedFilesIndex;
  }
}

/**
 * Saves the deleted files index to the server
 * @param {string} parUrl - The PAR URL
 * @param {Object} index - The deleted files index to save
 * @returns {Promise<boolean>} Whether the save was successful
 */
async function saveDeletedFilesIndex(parUrl, index) {
  try {
    const indexUrl = `${parUrl}/logically-deleted-files.json`;
    const response = await fetch(indexUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(index)
    });
    
    if (response.ok) {
      deletedFilesIndex = index;
      return true;
    } else {
      throw new Error(`Failed to save deleted files index: ${response.status}`);
    }
  } catch (error) {
    console.error('Error saving deleted files index:', error);
    return false;
  }
}

/**
 * Normalizes a file path
 * @param {string} path - The path to normalize
 * @returns {string} The normalized path
 */
function normalizePath(path) {
  if (!path) return '';
  // Remove leading slash if present
  return path.startsWith('/') ? path.substring(1) : path;
}

/**
 * Checks if a file is in the deleted files index
 * @param {string} filename - The filename to check
 * @returns {boolean} Whether the file is deleted
 */
function isFileDeleted(filename) {
  if (!filename) return false;
  
  const normalizedFilename = normalizePath(filename);
  return deletedFilesIndex.deletedFiles.some(deletedFile => {
    const normalizedDeletedFile = normalizePath(deletedFile);
    return normalizedDeletedFile === normalizedFilename;
  });
}

/**
 * Creates a map of deleted files for faster lookup
 * @returns {Map<string, boolean>} Map of deleted files
 */
function createDeletedFilesMap() {
  const map = new Map();
  
  if (deletedFilesIndex && deletedFilesIndex.deletedFiles) {
    deletedFilesIndex.deletedFiles.forEach(file => {
      map.set(normalizePath(file), true);
    });
  }
  
  return map;
}

/**
 * Deletes a file by adding it to the deleted files index
 * @param {string} parUrl - The PAR URL
 * @param {string} filename - The filename to delete
 * @returns {Promise<boolean>} Whether the deletion was successful
 */
async function deleteFile(parUrl, filename) {
  try {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) {
      return false;
    }
    
    // Add the file to the index if it's not already there
    const normalizedFilename = normalizePath(filename);
    if (!isFileDeleted(normalizedFilename)) {
      deletedFilesIndex.deletedFiles.push(normalizedFilename);
      
      // Save the updated index
      const success = await saveDeletedFilesIndex(parUrl, deletedFilesIndex);
      
      if (success) {
        console.log(`File ${filename} marked as deleted`);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

/**
 * Restores a file by removing it from the deleted files index
 * @param {string} parUrl - The PAR URL
 * @param {string} filename - The filename to restore
 * @returns {Promise<boolean>} Whether the restoration was successful
 */
async function restoreFile(parUrl, filename) {
  try {
    // Remove the file from the index
    const normalizedFilename = normalizePath(filename);
    const index = deletedFilesIndex.deletedFiles.findIndex(
      deletedFile => normalizePath(deletedFile) === normalizedFilename
    );
    
    if (index !== -1) {
      deletedFilesIndex.deletedFiles.splice(index, 1);
      
      // Save the updated index
      const success = await saveDeletedFilesIndex(parUrl, deletedFilesIndex);
      
      if (success) {
        console.log(`File ${filename} restored`);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error restoring file:', error);
    return false;
  }
}

// Export the functions
module.exports = {
  toggleDeletedFilesVisibility,
  isShowingDeletedFiles,
  loadDeletedFilesIndex,
  saveDeletedFilesIndex,
  isFileDeleted,
  createDeletedFilesMap,
  deleteFile,
  restoreFile,
  // Export the deletedFilesIndex for testing
  deletedFilesIndex
};
