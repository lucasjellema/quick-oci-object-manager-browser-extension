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
});

// Handle extension icon click to open the side panel
chrome.action.onClicked.addListener((tab) => {
  // Open the side panel when the extension icon is clicked
  chrome.sidePanel.open({ tabId: tab.id });
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
