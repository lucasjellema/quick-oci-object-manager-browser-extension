/**
 * UI Module for Quick OCI Object Manager
 * Handles UI elements, rendering, and event listeners
 */
import { log, showStatus, normalizePathForDisplay } from './utils.mjs';
import { getCurrentFolder, getAllFolders, addFolder } from './storage.mjs';
import { loadBucketContents, uploadFiles, downloadFile, createFolder, processBucketContents } from './file-operations.mjs';
import { toggleDeletedFilesVisibility } from './deletion-manager.mjs';

// DOM element references
let fileUploadInput;
let uploadButton;
let fileListElement;
let refreshButton;
let createFolderButton;
let toggleDeletedButton;
let currentPathElement;
let folderInput;
let showFolderDropdownButton;
let folderDropdown;
let loadingIndicator;

// Current path state
let currentPath = '/';

/**
 * Initializes UI elements
 */
export function initializeUI() {
  // Get DOM elements
  fileUploadInput = document.getElementById('fileUpload');
  uploadButton = document.getElementById('uploadButton');
  fileListElement = document.getElementById('fileList');
  refreshButton = document.getElementById('refreshButton');
  createFolderButton = document.getElementById('createFolderButton');
  toggleDeletedButton = document.getElementById('toggleDeletedButton');
  currentPathElement = document.getElementById('currentPath');
  folderInput = document.getElementById('folderInput');
  showFolderDropdownButton = document.getElementById('showFolderDropdown');
  folderDropdown = document.getElementById('folderDropdown');
  loadingIndicator = document.getElementById('loadingIndicator');
  
  // Initialize folder input if present
  if (folderInput) {
    getCurrentFolder().then(folder => {
      folderInput.value = folder || '';
    });
  }
  
  // Set up event listeners
  setupEventListeners();
  
  // Load initial content
  refreshContent();
}

/**
 * Sets up event listeners for UI elements
 */
function setupEventListeners() {
  // Upload button click
  if (uploadButton) {
    uploadButton.addEventListener('click', handleUploadButtonClick);
  }
  
  // File upload change
  if (fileUploadInput) {
    fileUploadInput.addEventListener('change', handleFileInputChange);
  }
  
  // Refresh button click
  if (refreshButton) {
    refreshButton.addEventListener('click', refreshContent);
  }
  
  // Create folder button click
  if (createFolderButton) {
    createFolderButton.addEventListener('click', handleCreateFolderClick);
  }
  
  // Toggle deleted files button click
  if (toggleDeletedButton) {
    toggleDeletedButton.addEventListener('click', handleToggleDeletedClick);
  }
  
  // Folder dropdown button click
  if (showFolderDropdownButton && folderDropdown) {
    showFolderDropdownButton.addEventListener('click', handleShowFolderDropdownClick);
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
      if (!showFolderDropdownButton.contains(event.target) && !folderDropdown.contains(event.target)) {
        folderDropdown.style.display = 'none';
      }
    });
  }
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener(handleRuntimeMessages);
}

/**
 * Handles messages from the background script
 * @param {Object} message - The message received
 * @param {Object} sender - The sender of the message
 * @param {function} sendResponse - Function to send a response
 */
function handleRuntimeMessages(message, sender, sendResponse) {
  if (message.action === 'fileUploaded') {
    log('File uploaded via context menu:', message.filename);
    showStatus(`File "${message.filename}" uploaded successfully via context menu`, 'success');
    
    // Check if the file was uploaded to the current folder
    const uploadFolder = message.folder || '';
    const currentFolder = normalizePathForDisplay(currentPath);
    
    if (uploadFolder === currentFolder) {
      log('File uploaded to current folder, refreshing content');
      refreshContent();
      
      // Highlight the newly uploaded file
      setTimeout(() => {
        highlightFile(message.filename);
      }, 500);
    }
  }
}

/**
 * Highlights a file in the file list
 * @param {string} filename - The filename to highlight
 */
function highlightFile(filename) {
  const fileItems = document.querySelectorAll('.browser-item');
  
  fileItems.forEach(item => {
    const nameElement = item.querySelector('.item-name');
    if (nameElement && nameElement.textContent === filename) {
      item.classList.add('highlight-animation');
      
      // Remove the highlight class after animation completes
      setTimeout(() => {
        item.classList.remove('highlight-animation');
      }, 2000);
    }
  });
}

/**
 * Refreshes the content of the bucket
 */
export function refreshContent() {
  loadBucketContents(currentPath, renderBucketContents);
}

/**
 * Handles the upload button click
 */
function handleUploadButtonClick() {
  if (fileUploadInput) {
    fileUploadInput.click();
  }
}

/**
 * Handles file input change
 * @param {Event} event - The change event
 */
async function handleFileInputChange(event) {
  const files = event.target.files;
  
  if (!files || files.length === 0) {
    return;
  }
  
  // Get upload path
  let uploadPath = '/';
  if (folderInput && folderInput.value) {
    uploadPath = '/' + folderInput.value;
    if (!uploadPath.endsWith('/')) {
      uploadPath += '/';
    }
  }
  
  // Show loading indicator
  showStatus(`Uploading ${files.length} file(s)...`, 'info');
  
  // Upload files
  await uploadFiles(
    files,
    uploadPath,
    (completed, total, filename, error) => {
      // Progress callback
      const percentage = Math.round((completed / total) * 100);
      if (error) {
        showStatus(`Error uploading ${filename}: ${error}`, 'error');
      } else {
        showStatus(`Uploading files: ${percentage}% (${completed}/${total})`, 'info');
      }
    },
    (results) => {
      // Complete callback
      const successCount = results.filter(r => r.success).length;
      showStatus(`Uploaded ${successCount} of ${results.length} file(s) successfully`, 'success');
      
      // Refresh content
      refreshContent();
      
      // Reset file input
      event.target.value = '';
    }
  );
}

/**
 * Handles create folder button click
 */
function handleCreateFolderClick() {
  showCreateFolderDialog();
}

/**
 * Shows the create folder dialog
 */
function showCreateFolderDialog() {
  const folderName = prompt('Enter folder name:');
  
  if (folderName) {
    createFolder(folderName, currentPath).then(success => {
      if (success) {
        // Add the new folder to the list of all folders
        const fullPath = currentPath === '/' ? 
          '/' + folderName : 
          currentPath + '/' + folderName;
        
        addFolder(fullPath).then(() => {
          // Refresh content
          refreshContent();
        });
      }
    });
  }
}

/**
 * Handles toggle deleted files button click
 */
function handleToggleDeletedClick() {
  const showingDeleted = toggleDeletedFilesVisibility();
  
  // Update UI to show toggle state
  if (showingDeleted) {
    document.body.classList.add('deleted-mode-active');
    toggleDeletedButton.classList.add('active');
    toggleDeletedButton.title = 'Hide Deleted Files';
  } else {
    document.body.classList.remove('deleted-mode-active');
    toggleDeletedButton.classList.remove('active');
    toggleDeletedButton.title = 'Show Deleted Files';
  }
  
  // Refresh content
  refreshContent();
  
  // Show status message
  if (showingDeleted) {
    showStatus('Showing deleted files', 'success');
  } else {
    showStatus('Hiding deleted files', 'success');
  }
}

/**
 * Handles show folder dropdown button click
 */
async function handleShowFolderDropdownClick() {
  if (!folderDropdown) {
    return;
  }
  
  // Toggle dropdown visibility
  if (folderDropdown.style.display === 'block') {
    folderDropdown.style.display = 'none';
    return;
  }
  
  // Clear dropdown
  folderDropdown.innerHTML = '';
  
  // Get all folders
  const folders = await getAllFolders();
  
  // Add root folder
  const rootItem = document.createElement('div');
  rootItem.className = 'dropdown-item';
  rootItem.textContent = '/ (root)';
  rootItem.addEventListener('click', () => {
    if (folderInput) {
      folderInput.value = '';
    }
    folderDropdown.style.display = 'none';
  });
  folderDropdown.appendChild(rootItem);
  
  // Add other folders
  Array.from(folders).sort().forEach(folder => {
    if (folder === '/') {
      return;
    }
    
    const item = document.createElement('div');
    item.className = 'dropdown-item';
    item.textContent = folder;
    item.addEventListener('click', () => {
      if (folderInput) {
        folderInput.value = normalizePathForDisplay(folder);
      }
      folderDropdown.style.display = 'none';
    });
    folderDropdown.appendChild(item);
  });
  
  // Show dropdown
  folderDropdown.style.display = 'block';
}

/**
 * Renders the bucket contents
 * @param {Object} data - The bucket contents data
 * @param {string} path - The current path
 */
function renderBucketContents(data, path) {
  // Update current path
  currentPath = path;
  
  // Update path display
  if (currentPathElement) {
    currentPathElement.textContent = normalizePathForDisplay(path);
  }
  
  // Process bucket contents
  const processedData = processBucketContents(data, path);
  
  // Clear file list
  if (fileListElement) {
    fileListElement.innerHTML = '';
    
    // Add parent directory item if not at root
    if (processedData.parentPath) {
      const parentItem = document.createElement('div');
      parentItem.className = 'browser-item';
      parentItem.innerHTML = `
        <div class="icon"><i class="fas fa-arrow-up"></i></div>
        <div class="item-name">..</div>
      `;
      parentItem.addEventListener('click', () => {
        loadBucketContents(processedData.parentPath, renderBucketContents);
      });
      fileListElement.appendChild(parentItem);
    }
    
    // Add folders
    processedData.folders.forEach(folderName => {
      const folderPath = path === '/' ? 
        '/' + folderName : 
        path + '/' + folderName;
      
      const folderItem = document.createElement('div');
      folderItem.className = 'browser-item';
      folderItem.innerHTML = `
        <div class="icon folder-icon"><i class="fas fa-folder"></i></div>
        <div class="item-name">${folderName}</div>
      `;
      
      folderItem.addEventListener('click', () => {
        loadBucketContents(folderPath, renderBucketContents);
      });
      
      fileListElement.appendChild(folderItem);
    });
    
    // Add files
    processedData.files.forEach(file => {
      const fileItem = document.createElement('div');
      fileItem.className = file.isDeleted ? 'browser-item deleted-file' : 'browser-item';
      
      // Different actions based on whether the file is deleted or not
      if (file.isDeleted) {
        fileItem.innerHTML = `
          <div class="icon file-icon"><i class="fas fa-file"></i></div>
          <div class="item-name">${file.fileName}</div>
          <div class="deleted-file-actions">
            <button class="restore-file" title="Restore File"><i class="fas fa-trash-restore"></i></button>
          </div>
        `;
        
        // Add restore file functionality
        const restoreButton = fileItem.querySelector('.restore-file');
        restoreButton.addEventListener('click', (e) => {
          e.stopPropagation();
          restoreFile(file.fullPath).then(success => {
            if (success) {
              refreshContent();
            }
          });
        });
      } else {
        fileItem.innerHTML = `
          <div class="icon file-icon"><i class="fas fa-file"></i></div>
          <div class="item-name">${file.fileName}</div>
          <div class="item-actions">
            <button class="download-file" title="Download File"><i class="fas fa-download"></i></button>
            <button class="delete-file" title="Delete File"><i class="fas fa-trash"></i></button>
          </div>
        `;
        
        // Add download file functionality
        const downloadButton = fileItem.querySelector('.download-file');
        downloadButton.addEventListener('click', (e) => {
          e.stopPropagation();
          downloadFile(file.fullPath);
        });
        
        // Add delete file functionality
        const deleteButton = fileItem.querySelector('.delete-file');
        deleteButton.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteFile(file.fullPath).then(success => {
            if (success) {
              refreshContent();
            }
          });
        });
        
        // Make the entire file item clickable for download
        fileItem.addEventListener('click', () => {
          downloadFile(file.fullPath);
        });
      }
      
      fileListElement.appendChild(fileItem);
    });
    
    // Show empty message if no content
    if (fileListElement.children.length === 0) {
      fileListElement.innerHTML = '<div class="browser-item">No files or folders found</div>';
    }
  }
  
  // Hide loading indicator
  if (loadingIndicator) {
    loadingIndicator.classList.add('hidden');
    loadingIndicator.style.display = 'none';
  }
}
