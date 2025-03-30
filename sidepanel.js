// Side panel script for Quick OCI Object Manager

document.addEventListener('DOMContentLoaded', function() {
  // Immediately hide the folder modal to prevent it from showing at startup
  const folderModal = document.getElementById('folderModal');
  if (folderModal) {
    folderModal.style.display = 'none';
    folderModal.classList.add('hidden');
  }

  // Get references to DOM elements
  // Browser elements
  const fileListElement = document.getElementById('fileList');
  const currentPathElement = document.getElementById('currentPath');
  const refreshButton = document.getElementById('refreshButton');
  const createFolderButton = document.getElementById('createFolderButton');
  const browserMessage = document.getElementById('browserMessage');
  const loadingIndicator = document.getElementById('loadingIndicator');
  
  // Ensure loading indicator is hidden on startup
  if (loadingIndicator) {
    loadingIndicator.classList.add('hidden');
    loadingIndicator.style.display = 'none !important';
    
    // Force hide loading indicator after a short delay to catch any race conditions
    setTimeout(() => {
      if (loadingIndicator) {
        loadingIndicator.classList.add('hidden');
        loadingIndicator.style.display = 'none !important';
        console.log('Force hiding loading indicator on startup');
      }
    }, 500);
    
    // Add another timeout just to be sure
    setTimeout(() => {
      if (loadingIndicator) {
        loadingIndicator.classList.add('hidden');
        loadingIndicator.style.display = 'none !important';
        console.log('Second force hiding of loading indicator');
      }
    }, 2000);
  }
  
  // Upload elements
  const fileUploadInput = document.getElementById('fileUpload');
  const selectedFilesListElement = document.getElementById('selectedFilesList');
  const uploadButton = document.getElementById('uploadButton');
  const folderInput = document.getElementById('folderInput');
  const showFolderDropdownButton = document.getElementById('showFolderDropdown');
  const folderDropdown = document.getElementById('folderDropdown');
  const progressContainer = document.getElementById('progressContainer');
  const progressBar = document.getElementById('progressBar');
  const statusMessage = document.getElementById('statusMessage');
  const parMissingMessage = document.getElementById('parMissingMessage');
  
  // Modal elements
  const closeModalButton = document.getElementById('closeModal');
  const cancelFolderCreateButton = document.getElementById('cancelFolderCreate');
  const createFolderConfirmButton = document.getElementById('createFolderConfirm');
  
  // Options links
  const openOptionsLink = document.getElementById('openOptionsLink');
  const openOptionsLink2 = document.getElementById('openOptionsLink2');
  
  // State variables
  let currentPath = '/';
  let currentBucketContents = [];
  let allFolders = new Set(['/']);
  
  // Initialize folder input
  if (folderInput) {
    folderInput.value = '/';
  }
  
  // Check if PAR URL is configured
  checkParUrlConfiguration();
  
  // Open options page when links are clicked
  openOptionsLink.addEventListener('click', function(e) {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
  
  openOptionsLink2.addEventListener('click', function(e) {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
  
  // Refresh button click handler
  refreshButton.addEventListener('click', function() {
    loadBucketContents(currentPath);
  });
  
  // Create folder button click handler
  createFolderButton.addEventListener('click', function() {
    showFolderModal();
  });
  
  // Show folder dropdown when button is clicked
  if (showFolderDropdownButton && folderDropdown) {
    showFolderDropdownButton.addEventListener('click', function() {
      folderDropdown.classList.toggle('hidden');
    });
    
    // Hide dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!showFolderDropdownButton.contains(e.target) && !folderDropdown.contains(e.target)) {
        folderDropdown.classList.add('hidden');
      }
    });
  }
  
  // Handle folder selection from dropdown
  if (folderDropdown) {
    folderDropdown.addEventListener('click', function(e) {
      const folderItem = e.target.closest('.folder-item');
      if (folderItem) {
        const path = folderItem.getAttribute('data-path');
        if (path && folderInput) {
          folderInput.value = path;
          folderDropdown.classList.add('hidden');
        }
      }
    });
  }
  
  // Folder select change handler
  if (folderDropdown) {
    folderDropdown.addEventListener('change', function() {
      // Update the current upload path based on the selected folder
      currentPath = folderDropdown.value;
      
      // If we're in a folder view, navigate to that folder
      if (currentPath !== '/') {
        loadBucketContents(currentPath);
      }
    });
  }
  
  // Modal close handlers
  if (closeModalButton) {
    closeModalButton.addEventListener('click', function() {
      hideFolderModal();
    });
  }
  
  if (cancelFolderCreateButton) {
    cancelFolderCreateButton.addEventListener('click', function() {
      hideFolderModal();
    });
  }
  
  // Create folder confirm handler
  if (createFolderConfirmButton) {
    createFolderConfirmButton.addEventListener('click', function() {
      const folderName = document.getElementById('folderName').value.trim();
      if (!folderName) {
        showStatus('Please enter a folder name', 'error');
        return;
      }
      
      createFolder(folderName);
      hideFolderModal();
    });
  }
  
  // Handle file selection for upload
  fileUploadInput.addEventListener('change', function() {
    const files = fileUploadInput.files;
    
    if (files.length === 0) {
      selectedFilesListElement.innerHTML = '<div class="file-item">No files selected</div>';
      uploadButton.disabled = true;
      return;
    }
    
    // Display selected files
    let fileListHTML = '';
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const sizeInKB = (file.size / 1024).toFixed(2);
      fileListHTML += `
        <div class="file-item">
          <span>${file.name}</span>
          <span>${sizeInKB} KB</span>
        </div>
      `;
    }
    
    selectedFilesListElement.innerHTML = fileListHTML;
    uploadButton.disabled = false;
    
    // Check PAR URL configuration again in case it was updated
    checkParUrlConfiguration();
  });
  
  // Handle file upload
  uploadButton.addEventListener('click', function() {
    const files = fileUploadInput.files;
    
    if (files.length === 0) {
      showStatus('Please select files to upload', 'error');
      return;
    }
    
    // Get the selected folder path from the input
    const selectedPath = folderInput.value.trim();
    
    // Validate the folder path format
    if (selectedPath !== '/' && !isValidFolderPath(selectedPath)) {
      showStatus('Please enter a valid folder path (e.g., folder or parent/child)', 'error');
      document.getElementById('folderPathError').classList.remove('hidden');
      return;
    }
    
    // Hide any previous error message
    document.getElementById('folderPathError').classList.add('hidden');
    
    // Get PAR URL from storage
    chrome.storage.sync.get(['parUrl'], function(result) {
      if (!result.parUrl) {
        showStatus('Please set a valid PAR URL in extension options', 'error');
        parMissingMessage.classList.remove('hidden');
        return;
      }
      
      // If path is root (/), use empty string for upload
      const uploadPath = selectedPath === '/' ? '' : selectedPath;
      uploadFiles(files, result.parUrl, uploadPath);
    });
  });
  
  // Function to validate folder path format
  function isValidFolderPath(path) {
    // Empty path or just / is valid (root)
    if (!path || path === '/' || path.trim() === '') return true;
    
    // Path should not end with a slash
    if (path.endsWith('/')) {
      return false;
    }
    
    // Path should not contain consecutive slashes
    if (path.includes('//')) {
      return false;
    }
    
    return true;
  }
  
  // Function to check if PAR URL is configured
  function checkParUrlConfiguration() {
    chrome.storage.sync.get(['parUrl'], function(result) {
      // Force hide loading indicator
      if (loadingIndicator) {
        loadingIndicator.classList.add('hidden');
        loadingIndicator.style.display = 'none';
      }
      
      if (!result.parUrl) {
        // No PAR URL configured
        parMissingMessage.classList.remove('hidden');
        browserMessage.classList.remove('hidden');
        uploadButton.disabled = true;
        refreshButton.disabled = true;
        createFolderButton.disabled = true;
      } else {
        // PAR URL is configured
        parMissingMessage.classList.add('hidden');
        browserMessage.classList.add('hidden');
        
        // Only enable upload button if files are selected
        uploadButton.disabled = fileUploadInput.files.length === 0;
        
        // Enable browser functionality
        refreshButton.disabled = false;
        createFolderButton.disabled = false;
        
        // Load bucket contents
        loadAllBucketContents();
      }
    });
  }
  
  // Function to load all bucket contents to find all folders
  function loadAllBucketContents() {
    // Force hide loading indicator before doing anything else
    if (loadingIndicator) {
      loadingIndicator.classList.add('hidden');
      loadingIndicator.style.display = 'none';
    }
    
    chrome.storage.sync.get(['parUrl'], function(result) {
      if (!result.parUrl) {
        // Hide loading indicator if it's visible
        if (loadingIndicator) {
          loadingIndicator.classList.add('hidden');
          loadingIndicator.style.display = 'none';
        }
        return;
      }
      
      // Show loading indicator
      if (loadingIndicator) {
        loadingIndicator.classList.remove('hidden');
        loadingIndicator.style.removeProperty('display');
      }
      
      // Set a timeout to hide the loading indicator if the fetch takes too long
      const loadingTimeout = setTimeout(() => {
        if (loadingIndicator) {
          loadingIndicator.classList.add('hidden');
          loadingIndicator.style.display = 'none';
        }
        console.log('Loading all bucket contents timed out');
      }, 5000); // 5 seconds timeout
      
      // Prepare the URL for listing all objects
      let listUrl = result.parUrl;
      
      console.log('Fetching all bucket contents from:', listUrl);
      
      // Make the request to list objects
      fetch(listUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          console.log('All bucket contents received:', data);
          // Log the structure of the first object to understand its properties
          if (data.objects && data.objects.length > 0) {
            console.log('First object structure:', JSON.stringify(data.objects[0], null, 2));
          }
          
          // Extract all folders from object paths
          extractFolders(data);
          
          // Populate the folder dropdown
          populateFolderDropdown();
          
          // Load the current path contents
          loadBucketContents(currentPath);
          
          // Hide loading indicator
          if (loadingIndicator) {
            loadingIndicator.classList.add('hidden');
            loadingIndicator.style.display = 'none';
          }
          clearTimeout(loadingTimeout);
        })
        .catch(error => {
          console.error('Error loading all bucket contents:', error);
          
          // Hide loading indicator
          if (loadingIndicator) {
            loadingIndicator.classList.add('hidden');
            loadingIndicator.style.display = 'none';
          }
          clearTimeout(loadingTimeout);
          
          // Load the current path contents anyway
          loadBucketContents(currentPath);
        })
        .finally(() => {
          // Ensure loading indicator is hidden in all cases
          if (loadingIndicator) {
            loadingIndicator.classList.add('hidden');
            loadingIndicator.style.display = 'none';
          }
          clearTimeout(loadingTimeout);
        });
    });
  }
  
  // Function to extract all folders from object paths
  function extractFolders(data) {
    // Always include root folder
    allFolders.add('/');
    
    if (data.objects && data.objects.length > 0) {
      data.objects.forEach(object => {
        // Get the name from the object
        const name = object.name || '';
        
        // Skip empty names
        if (!name) {
          return;
        }
        
        // Remove leading slash if present
        const cleanName = name.startsWith('/') ? name.substring(1) : name;
        
        // Extract folder paths
        const parts = cleanName.split('/');
        
        // If there are multiple parts, we have folders
        if (parts.length > 1) {
          let path = '';
          
          // Build each folder level
          for (let i = 0; i < parts.length - 1; i++) {
            if (i > 0) {
              path += '/';
            }
            path += parts[i];
            // Store folder path without trailing slash
            allFolders.add('/' + path);
          }
        }
      });
    }
    
    console.log('Extracted folders:', Array.from(allFolders));
  }
  
  // Function to populate the folder dropdown
  function populateFolderDropdown() {
    if (!folderDropdown) {
      return;
    }
    
    // Clear existing options except the first one (root)
    while (folderDropdown.children.length > 1) {
      folderDropdown.removeChild(folderDropdown.lastChild);
    }
    
    // Sort folders alphabetically
    const sortedFolders = Array.from(allFolders).sort();
    
    // Add folder options
    sortedFolders.forEach(folder => {
      if (folder === '/') {
        return; // Skip root as it's already there
      }
      
      // Remove trailing slash if present (for display purposes)
      const displayFolder = folder.endsWith('/') ? folder.slice(0, -1) : folder;
      
      const folderItem = document.createElement('div');
      folderItem.className = 'folder-item';
      folderItem.setAttribute('data-path', folder);
      folderItem.textContent = displayFolder;
      folderDropdown.appendChild(folderItem);
    });
    
    // Set the current path in the folder input
    if (folderInput) {
      // Remove leading and trailing slashes for display purposes (except for root)
      const displayPath = currentPath === '/' ? '' : 
                         (currentPath.startsWith('/') ? currentPath.substring(1) : currentPath);
      // Remove trailing slash if present
      const cleanDisplayPath = displayPath.endsWith('/') ? displayPath.slice(0, -1) : displayPath;
      folderInput.value = cleanDisplayPath;
    }
  }
  
  // Function to load bucket contents
  function loadBucketContents(path) {
    chrome.storage.sync.get(['parUrl'], function(result) {
      if (!result.parUrl) {
        // Hide loading indicator if it's visible
        if (loadingIndicator) {
          loadingIndicator.classList.add('hidden');
          loadingIndicator.style.display = 'none';
        }
        return;
      }
      
      // Show loading indicator
      if (loadingIndicator) {
        loadingIndicator.classList.remove('hidden');
        loadingIndicator.style.removeProperty('display');
      }
      
      // Clear file list
      fileListElement.innerHTML = '';
      
      // Set a timeout to hide the loading indicator if the fetch takes too long
      const loadingTimeout = setTimeout(() => {
        if (loadingIndicator) {
          loadingIndicator.classList.add('hidden');
          loadingIndicator.style.display = 'none';
        }
        fileListElement.innerHTML = `<div class="browser-item error-item">Loading timeout. Please try again.</div>`;
      }, 5000); // 5 seconds timeout
      
      // Prepare the URL for listing objects
      let listUrl = result.parUrl;
      
      // If path is not root, append it to the URL
      if (path !== '/') {
        // Remove leading slash for OCI paths
        const ociPath = path //.startsWith('/') ? path.substring(1) : path;
        if (listUrl.includes('?')) {
          const urlParts = listUrl.split('?');
          listUrl = `${urlParts[0]}?prefix=${encodeURIComponent(ociPath)}&${urlParts[1].split('&').slice(1).join('&')}`;
        } else {
          listUrl = `${listUrl}?prefix=${encodeURIComponent(ociPath)}`;
        }
      }
      
      console.log('Fetching bucket contents from:', listUrl);
      
      // Make the request to list objects
      fetch(listUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          console.log('Bucket contents received:', data);
          // Log the structure of the first object to understand its properties
          if (data.objects && data.objects.length > 0) {
            console.log('First object structure:', JSON.stringify(data.objects[0], null, 2));
          }
          
          // Update current path
          currentPath = path;
          
          // For display purposes, show path without leading slash (except for root)
          const displayPath = path === '/' ? '' : 
                            (path.startsWith('/') ? path.substring(1) : path);
          // Remove trailing slash if present
          const cleanDisplayPath = displayPath.endsWith('/') ? displayPath.slice(0, -1) : displayPath;
          currentPathElement.textContent = cleanDisplayPath;
          
          // Update folder input value
          if (folderInput) {
            // For display purposes, show path without leading slash (except for root)
            const displayInputPath = path === '/' ? '' : 
                                   (path.startsWith('/') ? path.substring(1) : path);
            // Remove trailing slash if present
            const cleanInputPath = displayInputPath.endsWith('/') ? displayInputPath.slice(0, -1) : displayInputPath;
            folderInput.value = cleanInputPath;
          }
          
          // Store the bucket contents
          currentBucketContents = data;
          
          // Render the file list
          renderFileList(data, path);
          
          // Hide loading indicator
          if (loadingIndicator) {
            loadingIndicator.classList.add('hidden');
            loadingIndicator.style.display = 'none';
          }
          clearTimeout(loadingTimeout);
        })
        .catch(error => {
          console.error('Error loading bucket contents:', error);
          showStatus('Error loading bucket contents: ' + error.message, 'error');
          
          // Hide loading indicator
          if (loadingIndicator) {
            loadingIndicator.classList.add('hidden');
            loadingIndicator.style.display = 'none';
          }
          clearTimeout(loadingTimeout);
          
          // Show an empty file list with error message
          fileListElement.innerHTML = `<div class="browser-item error-item">Error: ${error.message}</div>`;
        })
        .finally(() => {
          // Ensure loading indicator is hidden in all cases
          if (loadingIndicator) {
            loadingIndicator.classList.add('hidden');
            loadingIndicator.style.display = 'none';
          }
          clearTimeout(loadingTimeout);
        });
    });
  }
  
  // Function to render the file list
  function renderFileList(data, currentPath) {
    // Clear the file list
    fileListElement.innerHTML = '';
    
    // Add parent directory item if not at root
    if (currentPath !== '/') {
      const parentPath = getParentPath(currentPath);
      const parentItem = document.createElement('div');
      parentItem.className = 'browser-item';
      parentItem.innerHTML = `
        <div class="icon"><i class="fas fa-arrow-up"></i></div>
        <div class="item-name">..</div>
      `;
      parentItem.addEventListener('click', function() {
        loadBucketContents(parentPath);
      });
      fileListElement.appendChild(parentItem);
    }
    
    // Create a map to track folders
    const folders = new Map();
    
    // Process all objects to identify folders
    if (data.objects && data.objects.length > 0) {
      data.objects.forEach(object => {
        // Get the name from the object
        const name = object.name || '';
        
        // Skip empty names
        if (!name) {
          return;
        }
        
        // Remove leading slash if present
        const fullPath = name.startsWith('/') ? name.substring(1) : name;
        
        // Skip if this is not in the current path
        if (currentPath !== '/') {
          const prefix = currentPath === '/' ? '' : currentPath.substring(1); // Remove leading slash
          if (!fullPath.startsWith(prefix)) {
            return;
          }
        }
        
        // Get the relative path from current directory
        let relativePath = fullPath;
        if (currentPath !== '/') {
          const prefix = currentPath.substring(1);
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
          // Add file to the list
          const fileName = relativePath;
          
          const fileItem = document.createElement('div');
          fileItem.className = 'browser-item';
          fileItem.innerHTML = `
            <div class="icon file-icon"><i class="fas fa-file"></i></div>
            <div class="item-name">${fileName}</div>
            <div class="item-actions">
              <button class="download-file" title="Download File"><i class="fas fa-download"></i></button>
            </div>
          `;
          
          // Add download file functionality
          const downloadButton = fileItem.querySelector('.download-file');
          downloadButton.addEventListener('click', function(e) {
            e.stopPropagation();
            downloadFile(fullPath);
          });
          
          // Make the entire file item clickable for download
          fileItem.addEventListener('click', function() {
            downloadFile(fullPath);
          });
          
          fileListElement.appendChild(fileItem);
        }
      });
    }
    
    // Add folders to the list
    if (folders.size > 0) {
      folders.forEach((value, folderName) => {
        const folderPath = currentPath === '/' ? 
          '/' + folderName : 
          currentPath + '/' + folderName;
        
        // Remove any trailing slash from the display name
        const displayName = folderName.endsWith('/') ? folderName.slice(0, -1) : folderName;
        
        const folderItem = document.createElement('div');
        folderItem.className = 'browser-item';
        folderItem.innerHTML = `
          <div class="icon folder-icon"><i class="fas fa-folder"></i></div>
          <div class="item-name">${displayName}</div>
        `;
        
        // Add click event to navigate into the folder
        folderItem.addEventListener('click', function() {
          loadBucketContents(folderPath);
        });
        
        fileListElement.appendChild(folderItem);
      });
    }
    
    // Show empty message if no content
    if (fileListElement.children.length === 0) {
      fileListElement.innerHTML = '<div class="browser-item">No files or folders found</div>';
    }
  }
  
  // Function to download a file
  function downloadFile(fileName) {
    chrome.storage.sync.get(['parUrl'], function(result) {
      if (!result.parUrl) {
        showStatus('Please set a valid PAR URL in extension options', 'error');
        return;
      }
      
      // Prepare the URL for downloading the file
      let downloadUrl = result.parUrl;
      
      // If URL already has query parameters, handle that
      if (downloadUrl.includes('?')) {
        const urlParts = downloadUrl.split('?');
        downloadUrl = `${urlParts[0]}/${encodeURIComponent(fileName)}?${urlParts[1]}`;
      } else {
        downloadUrl = `${downloadUrl}/${encodeURIComponent(fileName)}`;
      }
      
      console.log('Downloading file from URL:', downloadUrl);
      
      // Create a temporary link element to trigger the download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = getFileNameFromPath(fileName); // Set the download attribute to the file name
      link.target = '_blank'; // Open in a new tab if download doesn't start automatically
      
      // Append the link to the document, click it, and remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showStatus(`Downloading ${getFileNameFromPath(fileName)}...`, 'success');
    });
  }
  
  // Function to create a folder by uploading an empty file with a folder path
  function createFolder(folderName) {
    chrome.storage.sync.get(['parUrl'], function(result) {
      if (!result.parUrl) {
        showStatus('Please set a valid PAR URL in extension options', 'error');
        return;
      }
      
      // Prepare the folder path with a placeholder file
      // Remove leading slash from current path if present
      const cleanCurrentPath = currentPath.startsWith('/') ? currentPath.substring(1) : currentPath;
      const folderPath = currentPath === '/' ? 
        folderName + '/.folder' : 
        cleanCurrentPath + '/' + folderName + '/.folder';
      
      // Prepare the URL for creating the folder
      let createUrl = result.parUrl;
      
      // If URL already has query parameters, handle that
      if (createUrl.includes('?')) {
        const urlParts = createUrl.split('?');
        const baseUrl = urlParts[0];
        const queryParams = urlParts[1];
        
        // Append the filename to the base URL
        createUrl = `${baseUrl}/${encodeURIComponent(folderPath)}?${queryParams}`;
      } else {
        // Simply append the filename
        createUrl = `${createUrl}/${encodeURIComponent(folderPath)}`;
      }
      
      console.log('Creating folder with URL:', createUrl);
      
      // Create an empty file with the folder name to represent the folder
      fetch(createUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Length': '0'
        }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          showStatus(`Folder "${folderName}" created successfully`, 'success');
          
          // Add the new folder to the list of all folders
          // Remove leading slash from current path if needed
          const cleanPath = currentPath.startsWith('/') ? currentPath.substring(1) : currentPath;
          const newFolderPath = currentPath === '/' ? 
            '/' + folderName : 
            '/' + cleanPath + '/' + folderName;
          allFolders.add(newFolderPath);
          
          // Update the folder dropdown
          populateFolderDropdown();
          
          // Reload the current directory
          loadBucketContents(currentPath);
        })
        .catch(error => {
          console.error('Error creating folder:', error);
          showStatus('Error creating folder: ' + error.message, 'error');
        });
    });
  }
  
  // Helper function to show status messages
  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.classList.remove('hidden', 'success', 'error');
    statusMessage.classList.add(type);
  }
  
  // Helper function to show the folder modal
  function showFolderModal() {
    const folderModal = document.getElementById('folderModal');
    const folderNameInput = document.getElementById('folderName');
    if (folderModal && folderNameInput) {
      folderNameInput.value = '';
      folderModal.style.display = 'flex';
      folderModal.classList.remove('hidden');
    }
  }
  
  // Helper function to hide the folder modal
  function hideFolderModal() {
    const folderModal = document.getElementById('folderModal');
    if (folderModal) {
      folderModal.style.display = 'none';
      folderModal.classList.add('hidden');
    }
  }
  
  // Helper function to get the parent path
  function getParentPath(path) {
    // Remove trailing slash if present
    if (path.endsWith('/') && path !== '/') {
      path = path.slice(0, -1);
    }
    
    // Find the last slash
    const lastSlashIndex = path.lastIndexOf('/');
    
    // If no slash found or only the root slash, return root
    if (lastSlashIndex <= 0) {
      return '/';
    }
    
    // Return the parent path
    return path.substring(0, lastSlashIndex + 1);
  }
  
  // Helper function to get file name from path
  function getFileNameFromPath(path) {
    // Find the last slash
    const lastSlashIndex = path.lastIndexOf('/');
    
    // If no slash found, return the whole path
    if (lastSlashIndex === -1) {
      return path;
    }
    
    // Return the file name
    return path.substring(lastSlashIndex + 1);
  }
  
  // Helper function to format file size
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  // Function to upload files to OCI Object Storage using PAR
  function uploadFiles(files, parUrl, uploadPath) {
    let uploadedCount = 0;
    let failedCount = 0;
    
    // Show progress container
    progressContainer.classList.remove('hidden');
    statusMessage.classList.remove('success', 'error', 'hidden');
    statusMessage.textContent = `Uploading 0/${files.length} files...`;
    
    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Create a URL for this specific file
      // Determine the object name based on upload path
      let objectName = file.name;
      if (uploadPath && uploadPath !== '/' && uploadPath.trim() !== '') {
        // Ensure path doesn't end with a slash, and add one between path and filename
        const normalizedPath = uploadPath.endsWith('/') ? uploadPath.slice(0, -1) : uploadPath;
        objectName = normalizedPath + '/' + file.name;
      }
      
      console.log('Uploading file with object name:', objectName);
      
      // Prepare the URL for uploading the file
      let uploadUrl = parUrl;
      
      // If URL already has query parameters, handle that
      if (uploadUrl.includes('?')) {
        const urlParts = uploadUrl.split('?');
        uploadUrl = `${urlParts[0]}/${encodeURIComponent(objectName)}?${urlParts[1]}`;
      } else {
        uploadUrl = `${uploadUrl}/${encodeURIComponent(objectName)}`;
      }
      
      console.log('Uploading file to URL:', uploadUrl);
      
      // Upload the file
      fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
          'Content-Length': file.size
        },
        body: file
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          uploadedCount++;
          showStatus(`Uploaded ${uploadedCount}/${files.length} files...`, 'success');
        })
        .catch(error => {
          console.error('Error uploading file:', error);
          failedCount++;
          showStatus(`Failed to upload ${failedCount} files. ${uploadedCount}/${files.length} files uploaded.`, 'error');
        })
        .finally(() => {
          // Hide progress container when all files are uploaded
          if (uploadedCount + failedCount === files.length) {
            progressContainer.classList.add('hidden');
          }
        });
    }
  }
});
