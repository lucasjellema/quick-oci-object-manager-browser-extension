/**
 * Main entry point for Quick OCI Object Manager sidepanel
 */
import { initializeUI } from './modules/ui.mjs';
import { log } from './modules/utils.mjs';
import { loadDeletedFilesIndex } from './modules/deletion-manager.mjs';
import { getParUrl } from './modules/storage.mjs';

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
  log('Initializing Quick OCI Object Manager sidepanel');
  
  try {
    // Load the PAR URL
    const parUrl = await getParUrl();
    
    if (parUrl) {
      // Load the deleted files index
      log('Loading deleted files index...');
      await loadDeletedFilesIndex(parUrl);
      log('Deleted files index loaded successfully');
    } else {
      log('No PAR URL configured, skipping deleted files index loading');
    }
    
    // Initialize the UI
    initializeUI();
    
    log('Initialization complete');
  } catch (error) {
    log('Error during initialization:', error);
    // Continue with UI initialization even if there was an error
    initializeUI();
  }
});
