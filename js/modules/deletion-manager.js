/**
 * Deletion Manager for Quick OCI Object Manager
 * Handles logical deletion of files using a central index file
 */
import { constructUrl, log, showStatus } from './utils.js';
import { getParUrl } from './storage.js';

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
export function toggleDeletedFilesVisibility() {
  showingDeletedFiles = !showingDeletedFiles;
  log('Toggled showing deleted files:', showingDeletedFiles);
  return showingDeletedFiles;
}

/**
 * Gets the current state of deleted files visibility
 * @returns {boolean} Whether deleted files are being shown
 */
export function isShowingDeletedFiles() {
  return showingDeletedFiles;
}

/**
 * Loads the deleted files index from the bucket
 * @param {string} [parUrl] - Optional PAR URL, if not provided it will be fetched from storage
 * @returns {Promise<Object>} The deleted files index
 */
export async function loadDeletedFilesIndex(parUrl) {
  try {
    // Get PAR URL if not provided
    if (!parUrl) {
      parUrl = await getParUrl();
    }
    
    if (!parUrl) {
      log('No PAR URL configured, using empty deleted files index');
      deletedFilesIndex = { deletedFiles: [] };
      return deletedFilesIndex;
    }
    
    // Prepare the URL for fetching the index file
    const indexUrl = constructUrl(parUrl, DELETED_FILES_INDEX);
    
    log('Fetching deleted files index from:', indexUrl);
    
    try {
      // Make the request to fetch the index file
      const response = await fetch(indexUrl);
      
      if (response.ok) {
        const data = await response.json();
        log('Deleted files index loaded:', data);
        
        // Validate the structure
        if (data && Array.isArray(data.deletedFiles)) {
          deletedFilesIndex = data;
        } else {
          log('Invalid index file format, creating new one');
          deletedFilesIndex = { deletedFiles: [] };
          await saveDeletedFilesIndex(parUrl);
        }
      } else {
        // If the file doesn't exist (404) or other error, create a new one
        log('Index file not found or error, creating new one');
        deletedFilesIndex = { deletedFiles: [] };
        await saveDeletedFilesIndex(parUrl);
      }
    } catch (error) {
      // If there's an error fetching the file, create a new one
      log('Error fetching index file, creating new one:', error);
      deletedFilesIndex = { deletedFiles: [] };
      await saveDeletedFilesIndex(parUrl);
    }
    
    log('Final deleted files index:', deletedFilesIndex);
    log('Number of deleted files:', deletedFilesIndex.deletedFiles.length);
    
    return deletedFilesIndex;
  } catch (error) {
    log('Error in loadDeletedFilesIndex:', error);
    deletedFilesIndex = { deletedFiles: [] };
    return deletedFilesIndex;
  }
}

/**
 * Saves the deleted files index to the bucket
 * @param {string} [parUrl] - Optional PAR URL, if not provided it will be fetched from storage
 * @returns {Promise<boolean>} Whether the save was successful
 */
export async function saveDeletedFilesIndex(parUrl) {
  try {
    // Get PAR URL if not provided
    if (!parUrl) {
      parUrl = await getParUrl();
    }
    
    if (!parUrl) {
      log('No PAR URL configured, cannot save deleted files index');
      return false;
    }
    
    // Prepare the URL for uploading the index file
    const indexUrl = constructUrl(parUrl, DELETED_FILES_INDEX);
    
    log('Saving deleted files index to:', indexUrl);
    log('Index contents:', deletedFilesIndex);
    
    // Convert the index to JSON
    const indexBlob = new Blob([JSON.stringify(deletedFilesIndex, null, 2)], { type: 'application/json' });
    
    // Upload the index file
    const response = await fetch(indexUrl, {
      method: 'PUT',
      body: indexBlob
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    log('Deleted files index saved successfully');
    return true;
  } catch (error) {
    log('Error saving deleted files index:', error);
    return false;
  }
}

/**
 * Checks if a file is in the deleted files index
 * @param {string} filename - The filename to check
 * @returns {boolean} Whether the file is deleted
 */
export function isFileDeleted(filename) {
  if (!deletedFilesIndex || !deletedFilesIndex.deletedFiles || deletedFilesIndex.deletedFiles.length === 0) {
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
export function createDeletedFilesMap() {
  const deletedFilesMap = new Map();
  
  if (deletedFilesIndex && deletedFilesIndex.deletedFiles && deletedFilesIndex.deletedFiles.length > 0) {
    deletedFilesIndex.deletedFiles.forEach(filename => {
      const normalizedFilename = filename.startsWith('/') ? filename.substring(1) : filename;
      deletedFilesMap.set(normalizedFilename, true);
      log(`Added to deleted files map: ${normalizedFilename}`);
    });
  }
  
  log(`Created deleted files map with ${deletedFilesMap.size} entries`);
  return deletedFilesMap;
}

/**
 * Deletes a file (logical deletion)
 * @param {string} filename - The file to delete
 * @param {string} [parUrl] - Optional PAR URL, if not provided it will be fetched from storage
 * @returns {Promise<boolean>} Whether the deletion was successful
 */
export async function deleteFile(filename, parUrl) {
  try {
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) {
      return false;
    }
    
    // Get PAR URL if not provided
    if (!parUrl) {
      parUrl = await getParUrl();
    }
    
    if (!parUrl) {
      showStatus('PAR URL not configured', 'error');
      return false;
    }
    
    log('Marking file as deleted:', filename);
    
    // Normalize the filename
    const normalizedFilename = filename.startsWith('/') ? filename.substring(1) : filename;
    
    // Add the file to the deleted files index if it's not already there
    if (!isFileDeleted(normalizedFilename)) {
      deletedFilesIndex.deletedFiles.push(normalizedFilename);
      
      // Save the updated index
      const saveResult = await saveDeletedFilesIndex(parUrl);
      
      if (!saveResult) {
        throw new Error('Failed to save deleted files index');
      }
      
      log('File marked as deleted successfully');
      showStatus(`File "${filename}" deleted successfully`, 'success');
      return true;
    } else {
      log('File is already marked as deleted');
      showStatus(`File "${filename}" is already deleted`, 'info');
      return false;
    }
  } catch (error) {
    log('Error deleting file:', error);
    showStatus(`Error deleting file: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Restores a deleted file
 * @param {string} filename - The file to restore
 * @param {string} [parUrl] - Optional PAR URL, if not provided it will be fetched from storage
 * @returns {Promise<boolean>} Whether the restoration was successful
 */
export async function restoreFile(filename, parUrl) {
  try {
    // Get PAR URL if not provided
    if (!parUrl) {
      parUrl = await getParUrl();
    }
    
    if (!parUrl) {
      showStatus('PAR URL not configured', 'error');
      return false;
    }
    
    log('Restoring file:', filename);
    
    // Normalize the filename
    const normalizedFilename = filename.startsWith('/') ? filename.substring(1) : filename;
    
    // Remove the file from the deleted files index
    if (isFileDeleted(normalizedFilename)) {
      deletedFilesIndex.deletedFiles = deletedFilesIndex.deletedFiles.filter(deletedFile => {
        const normalizedDeletedFilename = deletedFile.startsWith('/') ? deletedFile.substring(1) : deletedFile;
        return normalizedFilename !== normalizedDeletedFilename;
      });
      
      // Save the updated index
      const saveResult = await saveDeletedFilesIndex(parUrl);
      
      if (!saveResult) {
        throw new Error('Failed to save deleted files index');
      }
      
      log('File restored successfully');
      showStatus(`File "${filename}" restored successfully`, 'success');
      return true;
    } else {
      log('File is not marked as deleted');
      showStatus(`File "${filename}" is not deleted`, 'info');
      return false;
    }
  } catch (error) {
    log('Error restoring file:', error);
    showStatus(`Error restoring file: ${error.message}`, 'error');
    return false;
  }
}
