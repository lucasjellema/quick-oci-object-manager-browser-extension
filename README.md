# Quick OCI Object Manager

A Chrome browser extension that allows users to browse, upload, and download files in Oracle Cloud Infrastructure (OCI) Object Storage using a Pre-Authenticated Request (PAR).

## Features

- Side panel interface for browsing and managing OCI Object Storage contents
- File browser with folder navigation and hierarchical structure
- Upload files to root or specific folders
- Download files directly from the browser interface
- Folder creation and management
- Support for uploading multiple files simultaneously
- Progress tracking for file uploads
- Configuration through Chrome's extension options page
- No content script required - operates independently of web page content

## How It Works

1. The extension uses a Pre-Authenticated Request (PAR) URL to authenticate with OCI Object Storage
2. Users can browse their OCI bucket contents with folder navigation
3. Files can be uploaded to the root or any folder in the bucket
4. Files can be downloaded by clicking on them in the browser
5. New folders can be created and managed within the interface
6. Upload progress is displayed in real-time

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
