// Background script for Quick OCI Object Manager

// Listen for installation event
chrome.runtime.onInstalled.addListener(function() {
  console.log('Quick OCI Object Manager installed');
  
  // Initialize storage with default values if needed
  chrome.storage.sync.get(['parUrl'], function(result) {
    if (!result.parUrl) {
      chrome.storage.sync.set({
        parUrl: ''
      });
    }
  });
  
  // Create context menu item for images
  chrome.contextMenus.create({
    id: 'uploadImageToOCI',
    title: 'Upload Image to OCI Bucket',
    contexts: ['image']
  });
  
  // Create context menu item for links
  chrome.contextMenus.create({
    id: 'uploadLinkToOCI',
    title: 'Upload File to OCI Bucket',
    contexts: ['link']
  });
});

// Handle extension icon click to open the side panel
chrome.action.onClicked.addListener((tab) => {
  // Open the side panel when the extension icon is clicked
  chrome.sidePanel.open({ tabId: tab.id });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'uploadImageToOCI') {
    // Get the image URL
    const imageUrl = info.srcUrl;
    
    // Get the current target folder from storage
    chrome.storage.sync.get(['parUrl', 'currentFolder'], async function(result) {
      if (!result.parUrl) {
        // Show a notification that PAR URL is not configured
        chrome.action.setBadgeText({ text: '!' });
        chrome.action.setBadgeBackgroundColor({ color: '#C74634' });
        return;
      }
      
      // Get the current folder (default to root if not set)
      const currentFolder = result.currentFolder || '';
      
      try {
        // Extract filename from URL
        const filename = getFilenameFromUrl(imageUrl);
        
        // Fetch the image directly
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }
        
        // Get the blob data
        const blobData = await response.blob();
        
        // Create a File object from the blob
        const file = new File([blobData], filename, { type: blobData.type || 'image/jpeg' });
        
        // Upload the file
        await uploadFileToOCI(file, result.parUrl, currentFolder);
        
        // Show success notification
        chrome.action.setBadgeText({ text: '✓' });
        chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
        
        // Clear the badge after 3 seconds
        setTimeout(() => {
          chrome.action.setBadgeText({ text: '' });
        }, 3000);
        
        // Notify the sidepanel about the upload if it's open
        notifySidepanelAboutUpload(file.name, currentFolder);
        
      } catch (error) {
        console.error('Error uploading image:', error);
        
        // Show error notification
        chrome.action.setBadgeText({ text: '✗' });
        chrome.action.setBadgeBackgroundColor({ color: '#C74634' });
        
        // Clear the badge after 3 seconds
        setTimeout(() => {
          chrome.action.setBadgeText({ text: '' });
        }, 3000);
      }
    });
  } else if (info.menuItemId === 'uploadLinkToOCI') {
    // Get the link URL
    const fileUrl = info.linkUrl;
    
    // Get the current target folder from storage
    chrome.storage.sync.get(['parUrl', 'currentFolder'], async function(result) {
      if (!result.parUrl) {
        // Show a notification that PAR URL is not configured
        chrome.action.setBadgeText({ text: '!' });
        chrome.action.setBadgeBackgroundColor({ color: '#C74634' });
        return;
      }
      
      // Get the current folder (default to root if not set)
      const currentFolder = result.currentFolder || '';
      
      try {
        // Extract filename from URL
        const filename = getFilenameFromUrl(fileUrl);
        
        // Fetch the file directly
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }
        
        // Get the blob data
        const blobData = await response.blob();
        
        // Determine content type based on file extension
        const contentType = getContentTypeFromFilename(filename) || blobData.type || 'application/octet-stream';
        
        // Create a File object from the blob
        const file = new File([blobData], filename, { type: contentType });
        
        // Upload the file
        await uploadFileToOCI(file, result.parUrl, currentFolder);
        
        // Show success notification
        chrome.action.setBadgeText({ text: '✓' });
        chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
        
        // Clear the badge after 3 seconds
        setTimeout(() => {
          chrome.action.setBadgeText({ text: '' });
        }, 3000);
        
        // Notify the sidepanel about the upload if it's open
        notifySidepanelAboutUpload(file.name, currentFolder);
        
      } catch (error) {
        console.error('Error uploading file:', error);
        
        // Show error notification
        chrome.action.setBadgeText({ text: '✗' });
        chrome.action.setBadgeBackgroundColor({ color: '#C74634' });
        
        // Clear the badge after 3 seconds
        setTimeout(() => {
          chrome.action.setBadgeText({ text: '' });
        }, 3000);
      }
    });
  }
});

// Function to extract filename from URL
function getFilenameFromUrl(url) {
  try {
    // Try to get the filename from the URL
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
    
    // If we got a valid filename, return it
    if (filename && filename.length > 0) {
      // Remove query parameters if present
      return filename.split('?')[0];
    }
  } catch (e) {
    console.error('Error parsing URL:', e);
  }
  
  // Default filename with timestamp if we couldn't extract one
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `file-${timestamp}`;
}

// Function to determine content type based on file extension
function getContentTypeFromFilename(filename) {
  const extension = filename.split('.').pop().toLowerCase();
  const contentTypes = {
    'pdf': 'application/pdf',
    'json': 'application/json',
    'txt': 'text/plain',
    'html': 'text/html',
    'htm': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'xml': 'application/xml',
    'zip': 'application/zip',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'csv': 'text/csv'
  };
  
  return contentTypes[extension] || null;
}

// Function to upload a file to OCI Object Storage
async function uploadFileToOCI(file, parUrl, uploadPath) {
  // Determine the object name based on upload path
  let objectName = file.name;
  if (uploadPath && uploadPath.trim() !== '') {
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
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
      'Content-Length': file.size
    },
    body: file
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response;
}

// Function to notify the sidepanel about an upload
function notifySidepanelAboutUpload(filename, folder) {
  chrome.runtime.sendMessage({ action: 'uploadComplete', filename, folder });
}

// Listen for messages from the side panel to update current folder
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateCurrentFolder') {
    // Update the current folder in storage
    chrome.storage.sync.set({ currentFolder: message.folder });
    sendResponse({ success: true });
  }
});

// Listen for messages from the side panel
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'getSettings') {
    // Return settings to the side panel
    chrome.storage.sync.get(['parUrl'], function(result) {
      sendResponse(result);
    });
    return true; // Keep the message channel open for async response
  }
});
