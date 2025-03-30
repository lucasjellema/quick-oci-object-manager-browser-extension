// Side panel script for Quick OCI Object Manager

document.addEventListener('DOMContentLoaded', function() {
  // Get references to DOM elements
  const fileUploadInput = document.getElementById('fileUpload');
  const fileListDiv = document.getElementById('fileList');
  const uploadButton = document.getElementById('uploadButton');
  const progressContainer = document.getElementById('progressContainer');
  const progressBar = document.getElementById('progressBar');
  const statusMessage = document.getElementById('statusMessage');
  const parMissingMessage = document.getElementById('parMissingMessage');
  const openOptionsLink = document.getElementById('openOptionsLink');
  
  // Check if PAR URL is configured
  checkParUrlConfiguration();
  
  // Open options page when link is clicked
  openOptionsLink.addEventListener('click', function(e) {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
  
  // Handle file selection
  fileUploadInput.addEventListener('change', function() {
    const files = fileUploadInput.files;
    
    if (files.length === 0) {
      fileListDiv.innerHTML = '<div class="file-item">No files selected</div>';
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
    
    fileListDiv.innerHTML = fileListHTML;
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
    
    // Get PAR URL from storage
    chrome.storage.sync.get(['parUrl'], function(result) {
      if (!result.parUrl) {
        showStatus('Please set a valid PAR URL in extension options', 'error');
        parMissingMessage.classList.remove('hidden');
        return;
      }
      
      uploadFiles(files, result.parUrl);
    });
  });
  
  // Function to check if PAR URL is configured
  function checkParUrlConfiguration() {
    chrome.storage.sync.get(['parUrl'], function(result) {
      if (!result.parUrl) {
        parMissingMessage.classList.remove('hidden');
        uploadButton.disabled = true;
      } else {
        parMissingMessage.classList.add('hidden');
        // Only enable upload button if files are selected
        uploadButton.disabled = fileUploadInput.files.length === 0;
      }
    });
  }
  
  // Function to upload files to OCI Object Storage using PAR
  function uploadFiles(files, parUrl) {
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
      // PAR URLs typically end with a path where the object should be stored
      // We need to append the filename to the PAR URL
      let uploadUrl = parUrl;
      
      // If PAR URL already has query parameters, we need to handle that
      if (uploadUrl.includes('?')) {
        // Extract the base URL without query parameters
        const urlParts = uploadUrl.split('?');
        const baseUrl = urlParts[0];
        const queryParams = urlParts[1];
        
        // Append the filename to the base URL
        uploadUrl = `${baseUrl}/${encodeURIComponent(file.name)}?${queryParams}`;
      } else {
        // Simply append the filename
        uploadUrl = `${uploadUrl}/${encodeURIComponent(file.name)}`;
      }
      
      // Create a PUT request to upload the file
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl, true);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      
      // Track upload progress
      xhr.upload.onprogress = function(e) {
        if (e.lengthComputable) {
          // Update progress for this file
          const percentComplete = Math.round((uploadedCount + (e.loaded / e.total)) / files.length * 100);
          progressBar.style.width = percentComplete + '%';
        }
      };
      
      // Handle completion
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          // Success
          uploadedCount++;
        } else {
          // Failure
          failedCount++;
          console.error(`Failed to upload ${file.name}: ${xhr.status} ${xhr.statusText}`);
        }
        
        // Update status message
        statusMessage.textContent = `Uploading ${uploadedCount}/${files.length} files...`;
        
        // Update progress bar
        const percentComplete = Math.round((uploadedCount + failedCount) / files.length * 100);
        progressBar.style.width = percentComplete + '%';
        
        // Check if all files have been processed
        if (uploadedCount + failedCount === files.length) {
          // All files processed
          if (failedCount === 0) {
            showStatus(`Successfully uploaded ${uploadedCount} files to OCI Object Storage`, 'success');
          } else {
            showStatus(`Uploaded ${uploadedCount} files, ${failedCount} failed. Check console for details.`, 'error');
          }
        }
      };
      
      // Handle errors
      xhr.onerror = function() {
        failedCount++;
        console.error(`Network error while uploading ${file.name}`);
        
        // Update progress bar
        const percentComplete = Math.round((uploadedCount + failedCount) / files.length * 100);
        progressBar.style.width = percentComplete + '%';
        
        // Check if all files have been processed
        if (uploadedCount + failedCount === files.length) {
          showStatus(`Uploaded ${uploadedCount} files, ${failedCount} failed. Check console for details.`, 'error');
        }
      };
      
      // Start the upload
      xhr.send(file);
    }
  }
  
  // Helper function to show status messages
  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.classList.remove('hidden', 'success', 'error');
    statusMessage.classList.add(type);
  }
});
