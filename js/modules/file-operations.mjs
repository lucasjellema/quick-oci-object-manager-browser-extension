/**
 * File Operations for Quick OCI Object Manager
 * Handles file uploads, downloads, and bucket content loading
 */
import { constructUrl, getParentPath, normalizePathForDisplay, log, showStatus } from './utils.mjs';
import { getParUrl, setCurrentFolder } from './storage.mjs';
import { loadDeletedFilesIndex, createDeletedFilesMap, isShowingDeletedFiles } from './deletion-manager.mjs';

// Constants
const SYSTEM_FILES = ['logically-deleted-files.json'];

/**
 * Checks if a file is a system file that should be hidden from the UI
 * @param {string} filename - The filename to check
 * @returns {boolean} Whether the file is a system file
 */
export function isSystemFile(filename) {
  if (!filename) return false;
  
  // Get just the filename without path
  const baseFilename = filename.split('/').pop();
  
  return SYSTEM_FILES.includes(baseFilename);
}

/**
 * Loads the contents of a bucket
 * @param {string} path - The path to load
 * @param {function} renderCallback - Callback function to render the contents
 * @returns {Promise<Array>} The bucket contents
 */
export async function loadBucketContents(path, renderCallback) {
  try {
    log("Loading bucket contents for path:", path);
    
    // Get the PAR URL
    const parUrl = await getParUrl();
    
    if (!parUrl) {
      log("No PAR URL configured");
      showStatus('PAR URL not configured', 'error');
      return [];
    }
    
    // Load the deleted files index first
    await loadDeletedFilesIndex(parUrl);
    
    // Prepare the URL for listing objects
    let listUrl = parUrl;
    
    // If path is not root, append it to the URL
    if (path !== '/') {
      // Remove leading slash for OCI paths
      const ociPath = path;
      if (listUrl.includes('?')) {
        const urlParts = listUrl.split('?');
        listUrl = `${urlParts[0]}?prefix=${encodeURIComponent(ociPath)}&${urlParts[1].split('&').slice(1).join('&')}`;
      } else {
        listUrl = `${listUrl}?prefix=${encodeURIComponent(ociPath)}`;
      }
    }
    
    log('Fetching bucket contents from:', listUrl);
    
    // Make the request to list objects
    const response = await fetch(listUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    log('Bucket contents received:', data);
    
    // Update current path
    const currentPath = path;
    
    // Update the current folder in storage for context menu uploads
    const displayPath = normalizePathForDisplay(path);
    await setCurrentFolder(displayPath);
    
    // If a render callback is provided, call it with the data
    if (typeof renderCallback === 'function') {
      renderCallback(data, path);
    }
    
    return data.objects || [];
  } catch (error) {
    log('Error loading bucket contents:', error);
    showStatus(`Error loading bucket contents: ${error.message}`, 'error');
    return [];
  }
}

/**
 * Uploads files to the bucket
 * @param {FileList|Array<File>} files - The files to upload
 * @param {string} uploadPath - The path to upload to
 * @param {function} progressCallback - Callback function for upload progress
 * @param {function} completeCallback - Callback function when all uploads complete
 * @returns {Promise<Array>} Array of upload results
 */
export async function uploadFiles(files, uploadPath, progressCallback, completeCallback) {
  try {
    // Get the PAR URL
    const parUrl = await getParUrl();
    
    if (!parUrl) {
      showStatus('PAR URL not configured', 'error');
      return [];
    }
    
    // Ensure uploadPath ends with a slash if it's not root
    if (uploadPath !== '/' && !uploadPath.endsWith('/')) {
      uploadPath = uploadPath + '/';
    }
    
    // Remove leading slash for OCI paths
    if (uploadPath.startsWith('/')) {
      uploadPath = uploadPath.substring(1);
    }
    
    log('Uploading files to path:', uploadPath);
    
    const results = [];
    let completedCount = 0;
    
    // Create an array from FileList if needed
    const fileArray = Array.from(files);
    
    // Process each file
    for (const file of fileArray) {
      try {
        // Construct object name based on upload path
        let objectName = file.name;
        if (uploadPath) {
          objectName = uploadPath + (uploadPath.endsWith('/') ? '' : '/') + file.name;
        }
        
        log('Uploading file:', objectName);
        
        // Prepare the URL for uploading the file
        const uploadUrl = constructUrl(parUrl, objectName);
        
        // Upload the file
        const response = await fetch(uploadUrl, {
          method: 'PUT',
          body: file
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        log('File uploaded successfully:', objectName);
        
        // Call progress callback if provided
        completedCount++;
        if (typeof progressCallback === 'function') {
          progressCallback(completedCount, fileArray.length, file.name);
        }
        
        results.push({
          success: true,
          filename: file.name,
          objectName: objectName
        });
      } catch (error) {
        log('Error uploading file:', error);
        
        results.push({
          success: false,
          filename: file.name,
          error: error.message
        });
        
        // Call progress callback if provided
        completedCount++;
        if (typeof progressCallback === 'function') {
          progressCallback(completedCount, fileArray.length, file.name, error);
        }
      }
    }
    
    // Call complete callback if provided
    if (typeof completeCallback === 'function') {
      completeCallback(results);
    }
    
    return results;
  } catch (error) {
    log('Error in upload process:', error);
    showStatus(`Error uploading files: ${error.message}`, 'error');
    return [];
  }
}

/**
 * Downloads a file from the bucket
 * @param {string} fileName - The name of the file to download
 * @returns {Promise<boolean>} Whether the download was successful
 */
export async function downloadFile(fileName) {
  try {
    // Get the PAR URL
    const parUrl = await getParUrl();
    
    if (!parUrl) {
      showStatus('PAR URL not configured', 'error');
      return false;
    }
    
    // Prepare the URL for downloading the file
    const downloadUrl = constructUrl(parUrl, fileName);
    
    log('Downloading file from URL:', downloadUrl);
    
    // Create a temporary link and click it to download the file
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName.split('/').pop(); // Extract the filename from the path
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showStatus(`Downloading file: ${fileName.split('/').pop()}`, 'success');
    return true;
  } catch (error) {
    log('Error downloading file:', error);
    showStatus(`Error downloading file: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Creates a new folder in the bucket
 * @param {string} folderName - The name of the folder to create
 * @param {string} currentPath - The current path
 * @returns {Promise<boolean>} Whether the folder creation was successful
 */
export async function createFolder(folderName, currentPath) {
  try {
    // Get the PAR URL
    const parUrl = await getParUrl();
    
    if (!parUrl) {
      showStatus('PAR URL not configured', 'error');
      return false;
    }
    
    // Clean up folder name
    folderName = folderName.trim();
    
    // Validate folder name
    if (!folderName) {
      showStatus('Please enter a folder name', 'error');
      return false;
    }
    
    // Construct the full path
    let fullPath = currentPath === '/' ? 
      `/${folderName}/` : 
      `${currentPath}/${folderName}/`;
    
    // Remove leading slash for OCI paths
    const ociPath = fullPath.startsWith('/') ? fullPath.substring(1) : fullPath;
    
    log('Creating folder:', ociPath);
    
    // Prepare the URL for creating the folder
    const uploadUrl = constructUrl(parUrl, ociPath);
    
    // Create an empty file as a folder marker
    const emptyBlob = new Blob([''], { type: 'text/plain' });
    
    // Upload the marker file
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: emptyBlob
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    log('Folder created successfully:', ociPath);
    showStatus(`Folder "${folderName}" created successfully`, 'success');
    return true;
  } catch (error) {
    log('Error creating folder:', error);
    showStatus(`Error creating folder: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Extracts folders from bucket contents
 * @param {Object} data - The bucket contents data
 * @returns {Set<string>} Set of folder paths
 */
export function extractFolders(data) {
  const folders = new Set(['/']);
  
  if (!data || !data.objects) {
    return folders;
  }
  
  data.objects.forEach(object => {
    const name = object.name || '';
    
    if (!name || name.startsWith('.deleted/')) {
      return;
    }
    
    const parts = name.split('/');
    
    if (parts.length > 1) {
      // Build folder paths
      let path = '';
      for (let i = 0; i < parts.length - 1; i++) {
        path += parts[i] + '/';
        folders.add('/' + path);
      }
    }
  });
  
  return folders;
}

/**
 * Processes bucket contents for display
 * @param {Object} data - The bucket contents data
 * @param {string} path - The current path
 * @returns {Object} Processed data with folders and files
 */
export function processBucketContents(data, path) {
  // Create a map to track folders
  const folders = new Map();
  
  // Create a list of files to display
  const filesToDisplay = [];
  
  // Create a map of deleted files for faster lookup
  const deletedFilesMap = createDeletedFilesMap();
  const showDeleted = isShowingDeletedFiles();
  
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
        log('Skipping .deleted/ file:', name);
        return;
      }
      
      // Skip system files
      if (isSystemFile(name)) {
        log('Skipping system file:', name);
        return;
      }
      
      // Check if this file is in the deleted files map
      const normalizedName = name.startsWith('/') ? name.substring(1) : name;
      const isDeleted = deletedFilesMap.has(normalizedName);
      log(`File ${name} deleted status:`, isDeleted);
      
      // Skip deleted files unless we're showing them
      if (isDeleted && !showDeleted) {
        log('Hiding deleted file:', name);
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
    parentPath: path !== '/' ? getParentPath(path) : null
  };
}
