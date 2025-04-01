/**
 * Utility functions for Quick OCI Object Manager
 */

/**
 * Gets the parent path of a given path
 * @param {string} path - The current path
 * @returns {string} The parent path
 */
export function getParentPath(path) {
  if (path === '/' || !path) {
    return '/';
  }
  
  // Remove trailing slash if present
  const cleanPath = path.endsWith('/') ? path.slice(0, -1) : path;
  
  // Find the last slash
  const lastSlashIndex = cleanPath.lastIndexOf('/');
  
  // If no slash found or slash is the first character, return root
  if (lastSlashIndex <= 0) {
    return '/';
  }
  
  // Return the parent path
  return cleanPath.substring(0, lastSlashIndex);
}

/**
 * Normalizes a path for display (removes leading slash except for root)
 * @param {string} path - The path to normalize
 * @returns {string} The normalized path for display
 */
export function normalizePathForDisplay(path) {
  if (path === '/') {
    return '';
  }
  
  // Remove leading slash if present
  const displayPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Remove trailing slash if present
  return displayPath.endsWith('/') ? displayPath.slice(0, -1) : displayPath;
}

/**
 * Constructs a URL with the given base URL and path
 * @param {string} baseUrl - The base URL
 * @param {string} path - The path to append
 * @returns {string} The constructed URL
 */
export function constructUrl(baseUrl, path) {
  if (!baseUrl) {
    return null;
  }
  
  // If URL already has query parameters, handle that
  if (baseUrl.includes('?')) {
    const urlParts = baseUrl.split('?');
    return `${urlParts[0]}/${encodeURIComponent(path)}?${urlParts[1]}`;
  } else {
    return `${baseUrl}/${encodeURIComponent(path)}`;
  }
}

/**
 * Extracts the filename from a path
 * @param {string} path - The path containing the filename
 * @returns {string} The extracted filename
 */
export function getFilenameFromPath(path) {
  if (!path) {
    return '';
  }
  
  // Remove trailing slash if present
  const cleanPath = path.endsWith('/') ? path.slice(0, -1) : path;
  
  // Find the last slash
  const lastSlashIndex = cleanPath.lastIndexOf('/');
  
  // If no slash found, return the whole path
  if (lastSlashIndex === -1) {
    return cleanPath;
  }
  
  // Return the filename
  return cleanPath.substring(lastSlashIndex + 1);
}

/**
 * Shows a status message
 * @param {string} message - The message to display
 * @param {string} type - The type of message (success, error, info)
 */
export function showStatus(message, type = 'info') {
  const statusElement = document.getElementById('statusMessage');
  if (!statusElement) {
    console.log(`Status message (${type}): ${message}`);
    return;
  }
  
  statusElement.textContent = message;
  statusElement.className = `status ${type}`;
  statusElement.style.display = 'block';
  
  // Hide the status message after a delay
  setTimeout(() => {
    statusElement.style.display = 'none';
  }, 3000);
}

/**
 * Logs a message to the console with a prefix
 * @param {string} message - The message to log
 * @param {any} data - Optional data to log
 */
export function log(message, data) {
  const prefix = '[Quick OCI Object Manager]';
  if (data !== undefined) {
    console.log(`${prefix} ${message}`, data);
  } else {
    console.log(`${prefix} ${message}`);
  }
}
