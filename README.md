# Quick OCI Object Manager

A Chrome browser extension that allows users to browse, upload, and download files in Oracle Cloud Infrastructure (OCI) Object Storage using a Pre-Authenticated Request (PAR).

## Features

- Side panel interface for browsing and managing OCI Object Storage contents
- File browser with folder navigation and hierarchical structure
- Upload files to root or specific folders
- Download files directly from the browser interface
- Folder creation and management
- Logical file deletion with recycle bin functionality
- Support for uploading multiple files simultaneously
- Context menu integration for uploading images and files from web pages
- Oracle-themed red color scheme for a professional appearance
- Progress tracking for file uploads
- Configuration through Chrome's extension options page
- Real-time notifications and visual feedback

## How It Works

1. The extension uses a Pre-Authenticated Request (PAR) URL to authenticate with OCI Object Storage
2. Users can browse their OCI bucket contents with folder navigation
3. Files can be uploaded to the root or any folder in the bucket
4. Files can be downloaded by clicking on them in the browser
5. New folders can be created and managed within the interface
6. Files can be "deleted" without physically removing them from the bucket
7. Images and files from web pages can be uploaded directly via context menu
8. Upload progress and success notifications are displayed in real-time

### Logical Deletion Feature

The extension implements a "recycle bin" approach to file deletion:

1. **How It Works**
   - Files are never physically deleted from your OCI bucket
   - Instead, a central index file (`logically-deleted-files.json`) tracks which files are marked as deleted
   - This provides a safety net against accidental deletions

2. **User Interface**
   - Files can be deleted by clicking the trash icon next to them
   - A toggle button in the toolbar lets you show/hide deleted files
   - When viewing deleted files, they appear with strikethrough and reduced opacity
   - Deleted files can be restored by clicking the restore button

3. **Technical Implementation**
   - The extension maintains a JSON index file in your bucket that lists all deleted files
   - This index is loaded when the extension starts and updated when files are deleted or restored
   - The file browser filters out deleted files unless you explicitly choose to view them
   - All operations are performed via the PAR URL, maintaining security

This approach gives you the benefits of a recycle bin without requiring special permissions or server-side changes to your OCI Object Storage.

For a detailed visualization of the extension's architecture and component interactions, see the [Architecture Document](architecture.md).

## Installation

### From Source

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/quick-oci-object-manager.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" using the toggle in the top-right corner

4. Click "Load unpacked" and select the directory containing the extension

5. The extension should now appear in your browser toolbar

### From Chrome Web Store

*(Coming soon)*

## Usage

1. Click the extension icon in the toolbar to open the side panel

2. Configure your OCI Object Storage PAR URL:
   - Click the "extension options" link in the side panel, or
   - Right-click the extension icon and select "Options"
   - Enter your PAR URL and click "Save Settings"

3. Browse your bucket contents:
   - Navigate through folders by clicking on them
   - Return to parent folders using the ".." navigation
   - Refresh the current view using the refresh button

4. Upload files:
   - Select files to upload using the file picker
   - Choose a destination folder or enter a custom folder path
   - Click "Upload to OCI" to start the upload process
   - Monitor the progress and status of your uploads

5. Download files:
   - Click on any file in the browser to download it
   - Or use the download button next to each file

6. Create folders:
   - Click the "Create Folder" button
   - Enter a folder name in the dialog
   - Click "Create" to create the folder

7. Upload web content via context menu:
   - Right-click on any image on a web page and select "Upload Image to OCI Bucket"
   - Right-click on any file link (PDF, JSON, etc.) and select "Upload File to OCI Bucket"
   - The file will be uploaded to your currently selected folder
   - If the sidepanel is open, you'll see a notification and the file will be highlighted

## About Pre-Authenticated Requests (PARs)

A Pre-Authenticated Request (PAR) is a way to provide temporary access to objects in OCI Object Storage without requiring users to have IAM policies. To create a PAR:

1. Log in to the OCI Console
2. Navigate to Object Storage > Buckets
3. Select your bucket
4. Click "Pre-Authenticated Requests" in the left sidebar
5. Click "Create Pre-Authenticated Request"
6. Configure the PAR with appropriate permissions (Object Read/Write for full functionality)
7. Copy the generated URL and use it in the extension options

## Project Structure

- `manifest.json` - The extension manifest file that contains metadata and configuration
- `sidepanel.html` - The HTML file for the extension's side panel UI
- `sidepanel.js` - JavaScript for the side panel functionality
- `background.js` - Background script that handles extension lifecycle events
- `options.html` - The HTML file for the extension's options page
- `options.js` - JavaScript for the options page functionality
- `styles/` - Directory containing CSS files
  - `sidepanel.css` - Styles for the side panel
  - `options.css` - Styles for the options page
- `images/` - Directory for extension icons and images

## Testing

The extension includes a comprehensive testing suite with both unit tests and end-to-end tests:

### Unit Tests

Unit tests focus on individual components and functions, particularly the logical deletion system:

```bash
# Navigate to the tests directory
cd tests

# Run all unit tests
npm run test:unit

# Run specific unit test files
npx jest unit-tests/system-files.test.js
npx jest unit-tests/deleted-files.test.js
```

### End-to-End Tests

End-to-end tests use Playwright to test the extension in a real browser environment:

```bash
# Navigate to the tests directory
cd tests

# Run all end-to-end tests
npm run test

# Start the mock server for manual testing
npm run mock-server
```

### Running All Tests

To run both unit tests and end-to-end tests:

```bash
# Navigate to the tests directory
cd tests

# Run all tests
npm run test:all
```

## Development

To contribute to this project:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Oracle Cloud Infrastructure (OCI) for providing the Object Storage service
- Chrome Extensions API for enabling side panel functionality
