// Options page script for Quick OCI Object Manager

document.addEventListener('DOMContentLoaded', function() {
  // Get references to DOM elements
  const parUrlInput = document.getElementById('parUrl');
  const saveSettingsButton = document.getElementById('saveSettings');
  const statusMessage = document.getElementById('statusMessage');
  
  // Load saved PAR URL from storage
  chrome.storage.sync.get(['parUrl'], function(result) {
    if (result.parUrl) {
      parUrlInput.value = result.parUrl;
    }
  });
  
  // Save settings to Chrome storage
  saveSettingsButton.addEventListener('click', function() {
    const parUrl = parUrlInput.value.trim();
    
    if (!parUrl) {
      showStatus('Please enter a valid PAR URL', 'error');
      return;
    }
    
    // Validate the URL format (basic validation)
    if (!parUrl.startsWith('https://') || !parUrl.includes('objectstorage')) {
      showStatus('Please enter a valid OCI Object Storage PAR URL', 'error');
      return;
    }
    
    // Save to Chrome storage
    chrome.storage.sync.set({ parUrl: parUrl }, function() {
      showStatus('Settings saved successfully', 'success');
    });
  });
  
  // Helper function to show status messages
  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.classList.remove('hidden', 'success', 'error');
    statusMessage.classList.add(type);
    
    // Hide the message after 3 seconds
    setTimeout(function() {
      statusMessage.classList.add('hidden');
    }, 3000);
  }
});
