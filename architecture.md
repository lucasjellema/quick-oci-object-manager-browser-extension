# Quick OCI Object Manager - Architecture Diagram

This document visualizes the architecture and component interactions of the Quick OCI Object Manager Chrome extension.

## Component Interaction Diagram

```mermaid
graph TD
    subgraph "Chrome Browser"
        User[User]
        WebPage[Web Page]
        
        subgraph "Extension Components"
            Options[Options Page]
            SidePanel[Side Panel]
            Background[Background Script<br>Service Worker]
            ContentScript[Content Script]
            Storage[Chrome Storage]
        end
        
        subgraph "External Services"
            OCI[OCI Object Storage]
        end
    end
    
    %% User interactions
    User -->|1. Opens options| Options
    User -->|2. Configures PAR URL| Options
    User -->|3. Clicks extension icon| Background
    User -->|4. Browses/uploads files| SidePanel
    User -->|5. Right-clicks on image/link| WebPage
    
    %% Options interactions
    Options -->|Saves PAR URL| Storage
    
    %% Background script interactions
    Background -->|Reads PAR URL| Storage
    Background -->|Opens| SidePanel
    Background -->|Handles context menu clicks| ContentScript
    Background -->|Fetches & uploads files| OCI
    Background -->|Notifies about uploads| SidePanel
    
    %% Side panel interactions
    SidePanel -->|Reads PAR URL| Storage
    SidePanel -->|Browses/uploads/downloads files| OCI
    SidePanel -->|Updates current folder| Storage
    
    %% Content script interactions
    ContentScript -->|Acknowledges messages| Background
    WebPage -->|Provides image/file URLs| ContentScript
    
    %% Storage data flow
    Storage -->|Provides PAR URL| Background
    Storage -->|Provides PAR URL| SidePanel
    Storage -->|Provides current folder| Background
    
    %% OCI interactions
    OCI -->|Returns file listings| SidePanel
    OCI -->|Returns file content| SidePanel
    OCI -->|Returns upload status| Background
    OCI -->|Returns upload status| SidePanel
    
    %% Style definitions
    classDef browser fill:#f9f9f9,stroke:#333,stroke-width:1px;
    classDef extension fill:#e1f5fe,stroke:#01579b,stroke-width:1px;
    classDef external fill:#e8f5e9,stroke:#2e7d32,stroke-width:1px;
    classDef user fill:#fff3e0,stroke:#e65100,stroke-width:1px;
    
    %% Apply styles
    class WebPage browser;
    class Options,SidePanel,Background,ContentScript,Storage extension;
    class OCI external;
    class User user;
```

## Data Flow Diagram

```mermaid
sequenceDiagram
    participant User
    participant WebPage
    participant ContentScript
    participant Background as Background Script
    participant SidePanel
    participant Storage as Chrome Storage
    participant OCI as OCI Object Storage
    
    %% Initial setup
    User->>Storage: Save PAR URL (via Options)
    
    %% Side panel usage flow
    User->>Background: Click extension icon
    Background->>Storage: Get PAR URL
    Storage-->>Background: Return PAR URL
    Background->>SidePanel: Open side panel
    SidePanel->>Storage: Get PAR URL
    Storage-->>SidePanel: Return PAR URL
    SidePanel->>OCI: Request bucket contents
    OCI-->>SidePanel: Return file listing
    SidePanel->>Storage: Save current folder
    
    %% File upload from side panel
    User->>SidePanel: Select files & folder
    SidePanel->>Storage: Get PAR URL
    Storage-->>SidePanel: Return PAR URL
    SidePanel->>OCI: Upload files
    OCI-->>SidePanel: Return upload status
    SidePanel->>OCI: Refresh bucket contents
    OCI-->>SidePanel: Return updated file listing
    
    %% Context menu upload flow
    User->>WebPage: Right-click on image/link
    User->>WebPage: Select "Upload to OCI Bucket"
    WebPage->>Background: Context menu event
    Background->>ContentScript: Check image/file URL
    ContentScript-->>Background: Acknowledge
    Background->>Storage: Get PAR URL & current folder
    Storage-->>Background: Return PAR URL & folder
    Background->>OCI: Fetch & upload file
    OCI-->>Background: Return upload status
    Background->>SidePanel: Notify about upload
    SidePanel->>OCI: Refresh bucket contents (if needed)
    OCI-->>SidePanel: Return updated file listing
    SidePanel->>User: Show success notification & highlight file
```

## Component Descriptions

### Background Script (Service Worker)
- Initializes the extension and context menus
- Handles extension icon clicks to open the side panel
- Processes context menu events for image and file link uploads
- Communicates with the content script to get image/file URLs
- Fetches and uploads files to OCI Object Storage
- Notifies the side panel about successful uploads

### Side Panel
- Provides the main user interface for browsing and managing files
- Displays bucket contents with folder navigation
- Handles file uploads from the user's device
- Manages folder creation and selection
- Receives notifications about context menu uploads
- Refreshes and highlights newly uploaded files

### Content Script
- Runs in the context of web pages
- Acknowledges messages from the background script
- Enables context menu functionality for images and file links

### Chrome Storage
- Stores the PAR URL configured in the options page
- Stores the current folder selection for context menu uploads
- Provides persistent storage across browser sessions

### Options Page
- Allows the user to configure the PAR URL
- Saves settings to Chrome Storage

### OCI Object Storage
- External service that stores and serves files
- Accessed via the Pre-Authenticated Request (PAR) URL
- Provides file listing, upload, and download capabilities
