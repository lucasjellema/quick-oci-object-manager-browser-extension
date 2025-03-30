// Content script for Quick OCI Object Manager
// This is a minimal content script that's required for the extension to work
// The actual image fetching is now done directly in the background script

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Just acknowledge that we received the message
  // This is needed to ensure the context menu works properly
  sendResponse({ success: true });
  return true;
});