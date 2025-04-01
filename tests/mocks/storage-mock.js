/**
 * Mock implementation of storage module for testing
 */

/**
 * Gets the PAR URL from Chrome storage
 * @returns {Promise<string>} The PAR URL or null if not set
 */
function getParUrl() {
  return Promise.resolve('https://example.com/bucket/');
}

/**
 * Sets the PAR URL in Chrome storage
 * @param {string} parUrl - The PAR URL to save
 * @returns {Promise<void>}
 */
function setParUrl(parUrl) {
  return Promise.resolve();
}

/**
 * Gets the current folder from Chrome storage
 * @returns {Promise<string>} The current folder or '/' if not set
 */
function getCurrentFolder() {
  return Promise.resolve('/');
}

/**
 * Sets the current folder in Chrome storage
 * @param {string} folder - The folder to save
 * @returns {Promise<void>}
 */
function setCurrentFolder(folder) {
  return Promise.resolve();
}

module.exports = {
  getParUrl,
  setParUrl,
  getCurrentFolder,
  setCurrentFolder
};
