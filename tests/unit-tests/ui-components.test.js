/**
 * Test for UI components that handle showing/hiding deleted files
 */

// State for deleted files visibility
let showingDeletedFiles = false;

// Mock DOM elements
document.body.innerHTML = `
<div id="fileList"></div>
<button id="toggleDeletedButton" title="Show Deleted Files"></button>
`;

// Get DOM elements
const fileListElement = document.getElementById('fileList');
const toggleDeletedButton = document.getElementById('toggleDeletedButton');

/**
 * Toggles the visibility of deleted files
 * @returns {boolean} The new state of showingDeletedFiles
 */
function toggleDeletedFilesVisibility() {
  showingDeletedFiles = !showingDeletedFiles;
  
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
  
  return showingDeletedFiles;
}

/**
 * Gets the current state of deleted files visibility
 * @returns {boolean} Whether deleted files are being shown
 */
function isShowingDeletedFiles() {
  return showingDeletedFiles;
}

/**
 * Renders the file list based on the current visibility state
 * @param {Array} files - The list of files to render
 * @param {Map} deletedFilesMap - Map of deleted files
 */
function renderFileList(files, deletedFilesMap) {
  // Clear the file list
  fileListElement.innerHTML = '';
  
  // Filter files based on deleted status and visibility
  const filesToShow = files.filter(file => {
    const isDeleted = deletedFilesMap.has(file.name);
    return showingDeletedFiles || !isDeleted;
  });
  
  // Render each file
  filesToShow.forEach(file => {
    const isDeleted = deletedFilesMap.has(file.name);
    
    const fileItem = document.createElement('div');
    fileItem.className = isDeleted ? 'browser-item deleted-file' : 'browser-item';
    fileItem.innerHTML = `
      <div class="icon file-icon"><i class="fas fa-file"></i></div>
      <div class="item-name">${file.name}</div>
    `;
    
    fileListElement.appendChild(fileItem);
  });
}

describe('UI Components for Deleted Files', () => {
  // Reset state before each test
  beforeEach(() => {
    showingDeletedFiles = false;
    document.body.classList.remove('deleted-mode-active');
    toggleDeletedButton.classList.remove('active');
    toggleDeletedButton.title = 'Show Deleted Files';
    fileListElement.innerHTML = '';
  });

  test('should toggle showing deleted files', () => {
    // Initially should be false
    expect(isShowingDeletedFiles()).toBe(false);
    
    // Toggle to true
    const result1 = toggleDeletedFilesVisibility();
    expect(result1).toBe(true);
    expect(isShowingDeletedFiles()).toBe(true);
    
    // Check that UI is updated
    expect(document.body.classList.contains('deleted-mode-active')).toBe(true);
    expect(toggleDeletedButton.classList.contains('active')).toBe(true);
    expect(toggleDeletedButton.title).toBe('Hide Deleted Files');
    
    // Toggle back to false
    const result2 = toggleDeletedFilesVisibility();
    expect(result2).toBe(false);
    expect(isShowingDeletedFiles()).toBe(false);
    
    // Check that UI is updated
    expect(document.body.classList.contains('deleted-mode-active')).toBe(false);
    expect(toggleDeletedButton.classList.contains('active')).toBe(false);
    expect(toggleDeletedButton.title).toBe('Show Deleted Files');
  });

  test('should filter out deleted files when not showing them', () => {
    // Sample files and deleted files map
    const files = [
      { name: 'file1.txt', size: 100 },
      { name: 'file2.txt', size: 200 },
      { name: 'file3.txt', size: 300 }
    ];
    
    const deletedFilesMap = new Map([
      ['file2.txt', true]
    ]);
    
    // Render with showingDeletedFiles = false
    renderFileList(files, deletedFilesMap);
    
    // Should have 2 files (file1.txt and file3.txt)
    expect(fileListElement.children.length).toBe(2);
    
    // file2.txt should not be in the list
    const fileNames = Array.from(fileListElement.querySelectorAll('.item-name'))
      .map(el => el.textContent);
    expect(fileNames).toContain('file1.txt');
    expect(fileNames).not.toContain('file2.txt');
    expect(fileNames).toContain('file3.txt');
  });

  test('should show deleted files with different styling when showing them', () => {
    // Toggle to show deleted files
    toggleDeletedFilesVisibility();
    
    // Sample files and deleted files map
    const files = [
      { name: 'file1.txt', size: 100 },
      { name: 'file2.txt', size: 200 },
      { name: 'file3.txt', size: 300 }
    ];
    
    const deletedFilesMap = new Map([
      ['file2.txt', true]
    ]);
    
    // Render with showingDeletedFiles = true
    renderFileList(files, deletedFilesMap);
    
    // Should have all 3 files
    expect(fileListElement.children.length).toBe(3);
    
    // file2.txt should have the deleted-file class
    const fileItems = Array.from(fileListElement.children);
    const deletedItems = fileItems.filter(item => item.classList.contains('deleted-file'));
    expect(deletedItems.length).toBe(1);
    expect(deletedItems[0].querySelector('.item-name').textContent).toBe('file2.txt');
  });
});
