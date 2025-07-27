# InANutshell

A comprehensive project built from scratch to demonstrate development workflows and best practices.

## Project Overview

InANutshell is a cross-platform YouTube video summarization app built with industry-standard monorepo architecture. The app allows users to get instant AI-powered summaries of YouTube videos through mobile sharing (iOS/Android) and browser extensions.

## Getting Started

### Prerequisites

- Windows environment with PowerShell
- Git for version control
- [Additional prerequisites will be added as the project develops]

### Installation

1. Clone the repository:
   ```powershell
   git clone https://github.com/pete-h-87/In_A_Nutshell.git
   cd In_A_Nutshell
   ```

2. Install dependencies for all packages:
   ```powershell
   npm install
   ```

3. For mobile development:
   ```powershell
   npm run dev:mobile
   ```

4. For browser extension development:
   ```powershell
   npm run dev:extension
   ```

## Project Structure

```
InANutshell/
├── README.md                           # Project documentation (this file)
├── TASKS.md                            # Task tracking and project milestones
├── CLAUDE.md                           # Development context and notes
├── package.json                        # Root workspace configuration
└── packages/
    ├── shared/                         # Shared utilities and APIs
    │   ├── src/
    │   │   ├── youtube-api.js          # YouTube transcript extraction
    │   │   ├── summarizer.js           # AI summarization logic
    │   │   └── utils.js                # Common utility functions
    │   └── package.json
    ├── mobile/                         # React Native app
    │   ├── App.js                      # Main app component
    │   ├── index.js                    # App entry point
    │   ├── app.json                    # App configuration
    │   └── package.json
    └── browser-extension/              # Browser extension
        ├── manifest.json               # Extension manifest
        ├── src/
        │   ├── content.js              # YouTube page integration
        │   ├── background.js           # Extension service worker
        │   ├── popup.html              # Extension popup UI
        │   ├── popup.js                # Popup functionality
        │   └── styles.css              # Extension styles
        └── package.json
```

## Usage

### Mobile App (React Native)
- Share a YouTube video to the InANutshell app
- App will extract transcript and generate summary
- View summary in modal popup

### Browser Extension
- Install extension in Chrome/Firefox
- Navigate to any YouTube video
- Click the "🥜 Summarize" button or use extension popup
- Get instant video summary without leaving the page

### Development Commands

```powershell
# Install all dependencies
npm run install:all

# Build all packages
npm run build:all

# Run tests for all packages
npm run test:all

# Development modes
npm run dev:mobile      # Start React Native development
npm run dev:extension   # Start extension development with watch mode

# Build for production
npm run build:mobile    # Build mobile app
npm run build:extension # Build extension for distribution
```

## Development

This project uses a **monorepo architecture** with npm workspaces:

### Architecture
This monorepo follows industry standards used by companies like Meta, Shopify, and Discord:

- **`packages/shared/`**: Common utilities for YouTube API and AI summarization
- **`packages/mobile/`**: React Native app for iOS and Android with share extension support  
- **`packages/browser-extension/`**: Cross-browser extension for Chrome, Firefox, and Safari

### Monorepo Benefits
- **Code Sharing**: YouTube API and summarization logic shared across platforms
- **Unified Development**: Single repository for all platforms with coordinated releases
- **Industry Standard**: Matches patterns used by major tech companies for cross-platform apps

### Development Workflow
- Task tracking via TASKS.md
- Development context maintained in CLAUDE.md
- Regular commits with descriptive messages
- PowerShell-based workflow
- Shared code between platforms via `@inanutshell/shared` package

### Technology Stack
- **Mobile**: React Native, JavaScript/TypeScript
- **Extension**: Vanilla JavaScript, Chrome Extension APIs
- **Shared**: ES6 modules, common utilities
- **AI**: OpenAI API or similar for summarization
- **YouTube**: Transcript extraction via YouTube APIs

## Contributing

[Contributing guidelines will be added as the project matures]

## License

[License information to be determined]

## Changelog

### v1.0.0 - Initial Monorepo Setup
- ✅ Industry-standard monorepo architecture established
- ✅ Workspace configuration with npm workspaces
- ✅ Shared utilities package structure (`@inanutshell/shared`)
- ✅ React Native mobile app foundation
- ✅ Browser extension framework with manifest v3
- ✅ Documentation and development workflow
- ✅ Git repository with proper .gitignore