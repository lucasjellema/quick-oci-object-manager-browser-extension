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
  const toggleDeletedButton = document.getElementById('toggleDeletedButton');
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
  let showingDeletedFiles = false;
  let deletedFiles = [];
  
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
          // For display purposes, show path without leading slash (except for root)
          const displayPath = path === '/' ? '' : 
                            (path.startsWith('/') ? path.substring(1) : path);
          // Remove trailing slash if present
          const cleanPath = displayPath.endsWith('/') ? displayPath.slice(0, -1) : displayPath;
          folderInput.value = cleanPath;
          folderDropdown.classList.add('hidden');
          
          // Update the current folder in storage for context menu uploads
          updateCurrentFolder(cleanPath);
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
    
    // Update the current folder in storage for context menu uploads
    updateCurrentFolder(selectedPath);
    
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
      
      // Load the deleted files list first
      loadDeletedFilesList().then(() => {
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
            
            // Update current path (internal path)
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
              
              // Update the current folder in storage for context menu uploads
              updateCurrentFolder(cleanInputPath);
            }
            
            // Store the bucket contents
            currentBucketContents = data.objects || [];
            
            // Extract folders from the bucket contents
            extractFolders(data);
            
            // Display the bucket contents
            displayBucketContents(data, path);
            
            // Clear the loading timeout
            clearTimeout(loadingTimeout);
            
            // Hide loading indicator
            if (loadingIndicator) {
              loadingIndicator.classList.add('hidden');
              loadingIndicator.style.display = 'none';
            }
          })
          .catch(error => {
            console.error('Error fetching bucket contents:', error);
            
            // Clear the loading timeout
            clearTimeout(loadingTimeout);
            
            // Hide loading indicator
            if (loadingIndicator) {
              loadingIndicator.classList.add('hidden');
              loadingIndicator.style.display = 'none';
            }
            
            // Show error message
            fileListElement.innerHTML = `<div class="browser-item error-item">Error fetching bucket contents: ${error.message}</div>`;
          });
      });
    });
  }
  
  // Function to display bucket contents
  function displayBucketContents(data, path) {
    console.log("Display bucket contents called with showingDeletedFiles =", showingDeletedFiles);
    console.log("Current deleted files list:", deletedFiles);
    
    // Clear the file list
    fileListElement.innerHTML = '';
    
    // Add parent directory item if not at root
    if (path !== '/') {
      const parentPath = getParentPath(path);
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
    
    // Create a list of files to display
    const filesToDisplay = [];
    
    // Process all objects to identify folders and files
    if (data.objects && data.objects.length > 0) {
      // First, create a map of deleted files for faster lookup
      const deletedFilesMap = new Map();
      if (deletedFiles && deletedFiles.length > 0) {
        deletedFiles.forEach(file => {
          if (file.name && file.name.startsWith('.deleted/')) {
            const actualPath = file.name.substring('.deleted/'.length);
            deletedFilesMap.set(actualPath, true);
            console.log(`Added to deleted files map: ${actualPath}`);
          }
        });
      }
      console.log(`Created deleted files map with ${deletedFilesMap.size} entries`);
      
      data.objects.forEach(object => {
        // Get the name from the object
        const name = object.name || '';
        
        // Skip empty names
        if (!name) {
          return;
        }
        
        // Skip the .deleted directory and its contents
        if (name.startsWith('.deleted/')) {
          console.log('Skipping .deleted/ file:', name);
          return;
        }
        
        // Check if this file is in the deleted files map
        const isDeleted = deletedFilesMap.has(name);
        console.log(`File ${name} deleted status:`, isDeleted);
        
        // Skip deleted files unless we're showing them
        if (isDeleted && !showingDeletedFiles) {
          console.log('Hiding deleted file:', name);
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
            isDeleted: isDeleted
          });
        }
      });
    }
    
    // Add folders to the list
    if (folders.size > 0) {
      folders.forEach((value, folderName) => {
        const folderPath = path === '/' ? 
          '/' + folderName : 
          path + '/' + folderName;
        
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
    
    // Add files to the list
    filesToDisplay.forEach(file => {
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
        restoreButton.addEventListener('click', function(e) {
          e.stopPropagation();
          restoreFile(file.fullPath);
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
        downloadButton.addEventListener('click', function(e) {
          e.stopPropagation();
          downloadFile(file.fullPath);
        });
        
        // Add delete file functionality
        const deleteButton = fileItem.querySelector('.delete-file');
        deleteButton.addEventListener('click', function(e) {
          e.stopPropagation();
          deleteFile(file.fullPath);
        });
        
        // Make the entire file item clickable for download
        fileItem.addEventListener('click', function() {
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
  
  // Function to download a file
  function downloadFile(fileName) {
    chrome.storage.sync.get(['parUrl'], function(result) {
      if (!result.parUrl) {
        showStatus('PAR URL not configured', 'error');
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
      
      // Create a temporary link and click it to download the file
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName.split('/').pop(); // Extract the filename from the path
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showStatus(`Downloading file: ${fileName.split('/').pop()}`, 'success');
    });
  }
  
  // Function to create a folder by uploading an empty file with a folder path
  function createFolder(folderName) {
    chrome.storage.sync.get(['parUrl'], function(result) {
      if (!result.parUrl) {
        showStatus('PAR URL not configured', 'error');
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
  
  // Helper function to update the current folder in storage for context menu uploads
  function updateCurrentFolder(folderPath) {
    chrome.storage.sync.set({ currentFolder: folderPath });
  }
  
  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'uploadComplete') {
      // Show a notification about the upload
      const filename = message.filename;
      const folder = message.folder;
      
      // Show a success message
      showStatus(`File "${filename}" uploaded successfully via context menu`, 'success');
      
      // Check if we're currently in the folder where the file was uploaded
      const currentFolderPath = currentPath === '/' ? '' : 
                               (currentPath.startsWith('/') ? currentPath.substring(1) : currentPath);
      const cleanCurrentFolder = currentFolderPath.endsWith('/') ? 
                                currentFolderPath.slice(0, -1) : currentFolderPath;
                              
      if (cleanCurrentFolder === folder) {
        // Reload the current folder to show the new file
        loadBucketContents(currentPath);
        
        // Add a class to highlight the new file when it appears
        setTimeout(() => {
          const fileItems = document.querySelectorAll('.browser-item');
          fileItems.forEach(item => {
            const itemName = item.querySelector('.item-name');
            if (itemName && itemName.textContent === filename) {
              // Add highlight class
              item.classList.add('highlight-new-file');
              
              // Remove highlight after 3 seconds
              setTimeout(() => {
                item.classList.remove('highlight-new-file');
              }, 3000);
            }
          });
        }, 500); // Small delay to ensure the folder has loaded
      }
    }
  });
  
  // Function to load deleted files list
  function loadDeletedFilesList() {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(['parUrl'], function(result) {
        if (!result.parUrl) {
          deletedFiles = []; // Initialize as empty array if no PAR URL
          console.log('No PAR URL configured, setting deletedFiles to empty array');
          resolve();
          return;
        }
        
        // Prepare the URL for listing deleted objects
        let listUrl = result.parUrl;
        
        // If URL already has query parameters, handle that
        if (listUrl.includes('?')) {
          const urlParts = listUrl.split('?');
          listUrl = `${urlParts[0]}?prefix=.deleted/&${urlParts[1].split('&').slice(1).join('&')}`;
        } else {
          listUrl = `${listUrl}?prefix=.deleted/`;
        }
        
        console.log('Fetching deleted files list from:', listUrl);
        
        // Make the request to list objects
        fetch(listUrl)
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            console.log('Deleted files list received:', data);
            
            // Store the deleted files list
            if (data.objects && Array.isArray(data.objects)) {
              deletedFiles = data.objects.filter(obj => obj.name && obj.name.startsWith('.deleted/'));
              console.log('Filtered deleted files:', deletedFiles);
              console.log('Number of deleted files found:', deletedFiles.length);
              
              // Log each deleted file for debugging
              deletedFiles.forEach((file, index) => {
                console.log(`Deleted file ${index + 1}:`, file.name);
              });
            } else {
              console.log('No deleted files found or invalid response format');
              deletedFiles = [];
            }
            
            resolve();
          })
          .catch(error => {
            console.error('Error loading deleted files list:', error);
            deletedFiles = []; // Initialize as empty array on error
            resolve(); // Still resolve to continue loading
          });
      });
    });
  }
  
  // Function to check if a file is in the deleted files list
  function isFileDeleted(filename) {
    if (!deletedFiles || deletedFiles.length === 0) {
      console.log('No deleted files in list, returning false for:', filename);
      return false;
    }
    
    // Normalize the filename (remove any leading slash)
    const normalizedFilename = filename.startsWith('/') ? filename.substring(1) : filename;
    
    // Log for debugging
    console.log('Checking if file is deleted:', normalizedFilename);
    console.log('Deleted files count:', deletedFiles.length);
    
    for (const file of deletedFiles) {
      // Extract the actual filename from the .deleted/ path
      const deletedPath = file.name;
      if (!deletedPath || !deletedPath.startsWith('.deleted/')) {
        continue;
      }
      
      const deletedFilename = deletedPath.substring('.deleted/'.length);
      const normalizedDeletedFilename = deletedFilename.startsWith('/') ? 
                                       deletedFilename.substring(1) : deletedFilename;
      
      console.log(`Comparing: "${normalizedFilename}" with "${normalizedDeletedFilename}"`);
      
      if (normalizedFilename === normalizedDeletedFilename) {
        console.log('MATCH FOUND! File is deleted:', normalizedFilename);
        return true;
      }
    }
    
    console.log('No match found, file is not deleted:', normalizedFilename);
    return false;
  }
  
  // Function to delete a file (logical deletion)
  function deleteFile(filename) {
    if (confirm(`Are you sure you want to delete "${filename}"?`)) {
      chrome.storage.sync.get(['parUrl'], function(result) {
        if (!result.parUrl) {
          showStatus('PAR URL not configured', 'error');
          return;
        }
        
        // Create a marker file in the .deleted/ directory
        const deletedFilename = `.deleted/${filename}`;
        
        console.log('Creating deletion marker for:', filename);
        console.log('Marker file path:', deletedFilename);
        
        // Prepare the URL for uploading the marker file
        let uploadUrl = result.parUrl;
        
        // If URL already has query parameters, handle that
        if (uploadUrl.includes('?')) {
          const urlParts = uploadUrl.split('?');
          uploadUrl = `${urlParts[0]}/${encodeURIComponent(deletedFilename)}?${urlParts[1]}`;
        } else {
          uploadUrl = `${uploadUrl}/${encodeURIComponent(deletedFilename)}`;
        }
        
        console.log('Creating deletion marker at URL:', uploadUrl);
        
        // Create an empty file as a marker
        const emptyBlob = new Blob([''], { type: 'text/plain' });
        
        // Upload the marker file
        fetch(uploadUrl, {
          method: 'PUT',
          body: emptyBlob
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          console.log('Deletion marker created successfully');
          showStatus(`File "${filename}" deleted successfully`, 'success');
          
          // Update the deleted files list
          deletedFiles.push({ name: deletedFilename });
          
          // Force reload the deleted files list to ensure it's up to date
          loadDeletedFilesList().then(() => {
            // Reload the current directory to reflect the changes
            loadBucketContents(currentPath);
          });
        })
        .catch(error => {
          console.error('Error deleting file:', error);
          showStatus(`Error deleting file: ${error.message}`, 'error');
        });
      });
    }
  }
  
  // Function to restore a deleted file
  function restoreFile(filename) {
    chrome.storage.sync.get(['parUrl'], function(result) {
      if (!result.parUrl) {
        showStatus('PAR URL not configured', 'error');
        return;
      }
      
      // Find the deletion marker for this file
      const deletedFilename = `.deleted/${filename}`;
      
      console.log('Restoring file:', filename);
      console.log('Deleting marker file:', deletedFilename);
      
      // Prepare the URL for deleting the marker file
      let deleteUrl = result.parUrl;
      
      // If URL already has query parameters, handle that
      if (deleteUrl.includes('?')) {
        const urlParts = deleteUrl.split('?');
        deleteUrl = `${urlParts[0]}/${encodeURIComponent(deletedFilename)}?${urlParts[1]}`;
      } else {
        deleteUrl = `${deleteUrl}/${encodeURIComponent(deletedFilename)}`;
      }
      
      console.log('Deleting marker file at URL:', deleteUrl);
      
      // Delete the marker file
      fetch(deleteUrl, {
        method: 'DELETE'
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        console.log('Marker file deleted successfully');
        showStatus(`File "${filename}" restored successfully`, 'success');
        
        // Update the deleted files list
        deletedFiles = deletedFiles.filter(file => file.name !== deletedFilename);
        
        // Force reload the deleted files list to ensure it's up to date
        loadDeletedFilesList().then(() => {
          // Reload the current directory to reflect the changes
          loadBucketContents(currentPath);
        });
      })
      .catch(error => {
        console.error('Error restoring file:', error);
        showStatus(`Error restoring file: ${error.message}`, 'error');
      });
    });
  }
  
  // Toggle deleted files button click handler
  if (toggleDeletedButton) {
    toggleDeletedButton.addEventListener('click', function() {
      // Toggle the state
      showingDeletedFiles = !showingDeletedFiles;
      
      console.log('Toggled showing deleted files:', showingDeletedFiles);
      
      // Update UI to show toggle state
      if (showingDeletedFiles) {
        document.body.classList.add('deleted-mode-active');
        toggleDeletedButton.classList.add('active');
        toggleDeletedButton.title = 'Hide Deleted Files';
      } else {
        document.body.classList.remove('deleted-mode-active');
        toggleDeletedButton.classList.remove('active');
        toggleDeletedButton.title = 'Show Deleted Files';
      }
      
      // Force reload the deleted files list to ensure it's up to date
      loadDeletedFilesList().then(() => {
        // Then reload the current directory with the new setting
        loadBucketContents(currentPath);
        
        // Show status message
        if (showingDeletedFiles) {
          showStatus('Showing deleted files', 'success');
        } else {
          showStatus('Hiding deleted files', 'success');
        }
      });
    });
  }
});
