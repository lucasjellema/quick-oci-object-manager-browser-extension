# Quick OCI Object Manager

A Chrome browser extension that allows users to upload files to Oracle Cloud Infrastructure (OCI) Object Storage using a Pre-Authenticated Request (PAR).

## Features

- Side panel interface for file uploads to OCI Object Storage
- Support for uploading multiple files simultaneously
- Progress tracking for file uploads
- Configuration through Chrome's extension options page
- No content script required - operates independently of web page content

## How It Works

1. The extension uses a Pre-Authenticated Request (PAR) URL to authenticate with OCI Object Storage
2. Users can select one or more files from their local file system
3. Files are uploaded directly to the specified OCI bucket using the PAR
4. Upload progress is displayed in real-time

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

3. Select files to upload using the file picker in the side panel

4. Click "Upload to OCI" to start the upload process

5. Monitor the progress and status of your uploads

## About Pre-Authenticated Requests (PARs)

A Pre-Authenticated Request (PAR) is a way to provide temporary access to objects in OCI Object Storage without requiring users to have IAM policies. To create a PAR:

1. Log in to the OCI Console
2. Navigate to Object Storage > Buckets
3. Select your bucket
4. Click "Pre-Authenticated Requests" in the left sidebar
5. Click "Create Pre-Authenticated Request"
6. Configure the PAR with appropriate permissions (Object Write for uploads)
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
