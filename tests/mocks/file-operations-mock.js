/**
 * Mock implementation of file-operations module for testing
 */

// Constants
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

/**
 * Processes bucket contents for display
 * @param {Object} data - The bucket contents data
 * @param {string} path - The current path
 * @returns {Object} Processed data with folders and files
 */
function processBucketContents(data, path) {
  // Create a map to track folders
  const folders = new Map();
  
  // Create a list of files to display
  const filesToDisplay = [];
  
  // Create a map of deleted files for faster lookup
  const deletedFilesMap = new Map([['deleted-file.txt', true]]);
  const showDeleted = false;
  
  // Process all objects to identify folders and files
  if (data.objects && data.objects.length > 0) {
    data.objects.forEach(object => {
      // Get the name from the object
      const name = object.name || '';
      
      // Skip empty names
      if (!name) {
        return;
      }
      
      // Skip the .deleted directory and its contents
      if (name.startsWith('.deleted/')) {
        return;
      }
      
      // Skip system files
      if (isSystemFile(name)) {
        return;
      }
      
      // Check if this file is in the deleted files map
      const normalizedName = name.startsWith('/') ? name.substring(1) : name;
      const isDeleted = deletedFilesMap.has(normalizedName);
      
      // Skip deleted files unless we're showing them
      if (isDeleted && !showDeleted) {
        return;
      }
      
      // Remove leading slash if present
      const fullPath = name.startsWith('/') ? name.substring(1) : name;
      
      // Skip if this is not in the current path
      if (path !== '/') {
        const prefix = path === '/' ? '' : path.substring(1); // Remove leading slash
        if (!fullPath.startsWith(prefix)) {
          return;
        }
      }
      
      // Get the relative path from current directory
      let relativePath = fullPath;
      if (path !== '/') {
        const prefix = path.substring(1);
        if (fullPath.startsWith(prefix)) {
          relativePath = fullPath.substring(prefix.length);
          // Remove leading slash if present
          if (relativePath.startsWith('/')) {
            relativePath = relativePath.substring(1);
          }
        }
      }
      
      // Skip if empty
      if (!relativePath) {
        return;
      }
      
      // Check if this is a folder or has a folder in its path
      const slashIndex = relativePath.indexOf('/');
      if (slashIndex > 0) {
        // This is a file in a subfolder
        const folderName = relativePath.substring(0, slashIndex);
        folders.set(folderName, true);
      } else if (relativePath.endsWith('/')) {
        // This is a folder marker
        const folderName = relativePath.substring(0, relativePath.length - 1);
        folders.set(folderName, true);
      } else {
        // This is a file in the current directory
        // Add file to the list of files to display
        filesToDisplay.push({
          fullPath: fullPath,
          fileName: relativePath,
          isDeleted: isDeleted,
          size: object.size,
          timeModified: object.timeModified
        });
      }
    });
  }
  
  return {
    folders: Array.from(folders.keys()),
    files: filesToDisplay,
    parentPath: path !== '/' ? path.substring(0, path.lastIndexOf('/')) || '/' : null
  };
}

/**
 * Loads the contents of a bucket
 * @param {string} path - The path to load
 * @param {function} renderCallback - Callback function to render the contents
 * @returns {Promise<Array>} The bucket contents
 */
async function loadBucketContents(path, renderCallback) {
  try {
    // Get the PAR URL
    const parUrl = await require('../mocks/storage-mock').getParUrl();
    
    if (!parUrl) {
      return [];
    }
    
    // Make the request to list objects
    const response = await fetch(`${parUrl}?prefix=${path}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // If a render callback is provided, call it with the data
    if (typeof renderCallback === 'function') {
      renderCallback(data, path);
    }
    
    return data.objects || [];
  } catch (error) {
    return [];
  }
}

module.exports = {
  isSystemFile,
  processBucketContents,
  loadBucketContents
};
