/**
 * Storage operations for Quick OCI Object Manager
 */
import { log } from './utils.js';

/**
 * Gets the PAR URL from Chrome storage
 * @returns {Promise<string>} The PAR URL or null if not set
 */
export function getParUrl() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['parUrl'], function(result) {
      resolve(result.parUrl || null);
    });
  });
}

/**
 * Sets the PAR URL in Chrome storage
 * @param {string} parUrl - The PAR URL to save
 * @returns {Promise<void>}
 */
export function setParUrl(parUrl) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ parUrl }, function() {
      log('PAR URL saved:', parUrl);
      resolve();
    });
  });
}

/**
 * Gets the current folder from Chrome storage
 * @returns {Promise<string>} The current folder or '/' if not set
 */
export function getCurrentFolder() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['currentFolder'], function(result) {
      resolve(result.currentFolder || '/');
    });
  });
}

/**
 * Sets the current folder in Chrome storage
 * @param {string} folder - The folder to save
 * @returns {Promise<void>}
 */
export function setCurrentFolder(folder) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ currentFolder: folder }, function() {
      log('Current folder saved:', folder);
      resolve();
    });
  });
}

/**
 * Gets all folders from Chrome storage
 * @returns {Promise<Set<string>>} A set of all folders
 */
export function getAllFolders() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['allFolders'], function(result) {
      if (result.allFolders && Array.isArray(result.allFolders)) {
        resolve(new Set(result.allFolders));
      } else {
        resolve(new Set(['/']));
      }
    });
  });
}

/**
 * Sets all folders in Chrome storage
 * @param {Set<string>} folders - The set of folders to save
 * @returns {Promise<void>}
 */
export function setAllFolders(folders) {
  return new Promise((resolve) => {
    const foldersArray = Array.from(folders);
    chrome.storage.sync.set({ allFolders: foldersArray }, function() {
      log('All folders saved:', foldersArray);
      resolve();
    });
  });
}

/**
 * Adds a folder to the list of all folders
 * @param {string} folder - The folder to add
 * @returns {Promise<void>}
 */
export async function addFolder(folder) {
  const folders = await getAllFolders();
  folders.add(folder);
  await setAllFolders(folders);
}

/**
 * Clears all storage data
 * @returns {Promise<void>}
 */
export function clearStorage() {
  return new Promise((resolve) => {
    chrome.storage.sync.clear(function() {
      log('Storage cleared');
      resolve();
    });
  });
}
