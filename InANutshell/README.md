# InANutshell

A comprehensive project built from scratch to demonstrate development workflows and best practices.

## Project Overview

InANutshell is a YouTube video summarization tool built with industry-standard monorepo architecture. **Phase 1** focuses on a browser extension for instant video summaries. **Phase 2** will add mobile apps with share extension functionality.

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

### Browser Extension (Phase 1 - Current Focus)
- Install extension in Chrome (load unpacked for development)
- Navigate to any YouTube video with auto-captions
- Click the "🥜 Summarize" button injected on the page
- Get instant video transcript extraction and AI summary
- View results in modal overlay without leaving YouTube

### Mobile App (Phase 2 - Future)
- Share YouTube videos to the InANutshell app
- Automatic transcript extraction and AI summarization
- Quick summary viewing in modal popup

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

- **`packages/browser-extension/`**: Chrome extension with YouTube integration (Phase 1 focus)
- **`packages/shared/`**: Common utilities for YouTube transcript extraction and AI summarization
- **`packages/mobile/`**: React Native app for iOS and Android (Phase 2 - future development)

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

### v1.0.0 - Browser Extension Foundation
- ✅ Industry-standard monorepo architecture established
- ✅ Browser extension framework with manifest v3
- ✅ YouTube transcript extraction via DOM manipulation
- ✅ Extension content script with modal UI
- ✅ Shared utilities package structure (`@inanutshell/shared`)
- ✅ Development workflow and documentation
- 🚧 **Current**: Fixing ES6 import issues for browser compatibility
- 📋 **Next**: AI integration and Chrome Web Store deployment