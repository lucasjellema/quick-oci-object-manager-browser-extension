/**
 * Mock implementation of deletion-manager module for testing
 */

// Constants
const DELETED_FILES_INDEX = 'logically-deleted-files.json';

// State for deleted files
let deletedFilesIndex = {
  deletedFiles: []
};
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
 * Loads the deleted files index from the bucket
 * @param {string} [parUrl] - Optional PAR URL, if not provided it will be fetched from storage
 * @returns {Promise<Object>} The deleted files index
 */
async function loadDeletedFilesIndex(parUrl) {
  try {
    // Mock loading the index
    return deletedFilesIndex;
  } catch (error) {
    return { deletedFiles: [] };
  }
}

/**
 * Saves the deleted files index to the bucket
 * @param {string} [parUrl] - Optional PAR URL, if not provided it will be fetched from storage
 * @returns {Promise<boolean>} Whether the save was successful
 */
async function saveDeletedFilesIndex(parUrl) {
  try {
    // Mock saving the index
    return true;
  } catch (error) {
    return false;
  }
}

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
 * Creates a map of deleted files for faster lookups
 * @returns {Map<string, boolean>} Map with filenames as keys
 */
function createDeletedFilesMap() {
  const deletedFilesMap = new Map();
  
  if (deletedFilesIndex && deletedFilesIndex.deletedFiles && deletedFilesIndex.deletedFiles.length > 0) {
    deletedFilesIndex.deletedFiles.forEach(filename => {
      const normalizedFilename = filename.startsWith('/') ? filename.substring(1) : filename;
      deletedFilesMap.set(normalizedFilename, true);
    });
  }
  
  return deletedFilesMap;
}

/**
 * Deletes a file (logical deletion)
 * @param {string} filename - The file to delete
 * @param {string} [parUrl] - Optional PAR URL, if not provided it will be fetched from storage
 * @returns {Promise<boolean>} Whether the deletion was successful
 */
async function deleteFile(filename, parUrl) {
  try {
    // Normalize the filename
    const normalizedFilename = filename.startsWith('/') ? filename.substring(1) : filename;
    
    // Add the file to the deleted files index if it's not already there
    if (!isFileDeleted(normalizedFilename)) {
      deletedFilesIndex.deletedFiles.push(normalizedFilename);
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
 * @param {string} [parUrl] - Optional PAR URL, if not provided it will be fetched from storage
 * @returns {Promise<boolean>} Whether the restoration was successful
 */
async function restoreFile(filename, parUrl) {
  try {
    // Normalize the filename
    const normalizedFilename = filename.startsWith('/') ? filename.substring(1) : filename;
    
    // Remove the file from the deleted files index
    if (isFileDeleted(normalizedFilename)) {
      deletedFilesIndex.deletedFiles = deletedFilesIndex.deletedFiles.filter(deletedFile => {
        const normalizedDeletedFilename = deletedFile.startsWith('/') ? deletedFile.substring(1) : deletedFile;
        return normalizedFilename !== normalizedDeletedFilename;
      });
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}

// For testing purposes
function _setDeletedFilesIndex(index) {
  deletedFilesIndex = index;
}

module.exports = {
  toggleDeletedFilesVisibility,
  isShowingDeletedFiles,
  loadDeletedFilesIndex,
  saveDeletedFilesIndex,
  isFileDeleted,
  createDeletedFilesMap,
  deleteFile,
  restoreFile,
  _setDeletedFilesIndex
};
