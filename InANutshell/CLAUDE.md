# Claude Context - InANutshell Project

## Project Overview
- **Name**: InANutshell
- **Type**: Cross-platform YouTube video summarization app
- **Architecture**: Industry-standard monorepo (npm workspaces)
- **Platforms**: iOS, Android (React Native), Browser Extension
- **Status**: Monorepo Setup Complete
- **Created**: 2025-07-27

## Project Structure
```
InANutshell/                              # Root monorepo
├── README.md                             # Project documentation
├── TASKS.md                              # Task tracking and roadmap
├── CLAUDE.md                             # This file - context for Claude
├── package.json                          # Root workspace configuration
├── .gitignore                            # Git ignore rules
└── packages/                             # All sub-packages
    ├── shared/                           # @inanutshell/shared
    │   ├── src/
    │   │   ├── youtube-api.js            # YouTube transcript extraction
    │   │   ├── summarizer.js             # AI summarization logic
    │   │   ├── utils.js                  # Common utilities
    │   │   └── index.js                  # Package exports
    │   └── package.json
    ├── mobile/                           # @inanutshell/mobile
    │   ├── App.js                        # React Native main component
    │   ├── index.js                      # App entry point
    │   ├── app.json                      # App configuration
    │   └── package.json
    └── browser-extension/                # @inanutshell/browser-extension
        ├── manifest.json                 # Extension manifest (v3)
        ├── src/
        │   ├── content.js                # YouTube page integration
        │   ├── background.js             # Service worker
        │   ├── popup.html                # Extension popup UI
        │   ├── popup.js                  # Popup functionality
        │   └── styles.css                # Extension styles
        └── package.json
```

## Development Notes
- **Monorepo Architecture**: Follows industry standards (Meta/Shopify/Discord pattern)
- **Technology Stack**: React Native + Browser Extensions + Shared JavaScript utilities
- **Code Sharing**: YouTube API and AI summarization logic shared across platforms
- **Workspace Management**: npm workspaces for unified dependency management
- **Cross-Platform**: Single codebase supports iOS, Android, and web browsers
- **Phase**: Ready for Phase 1 development (API integrations)

## Commands & Scripts

### Root Workspace Commands
```bash
npm install                    # Install all dependencies
npm run build:all             # Build all packages
npm run test:all              # Test all packages
npm run dev:mobile            # Start React Native development
npm run dev:extension         # Start extension development
npm run build:mobile          # Build mobile app
npm run build:extension       # Build extension for distribution
```

### Development Workflow
1. Work in individual packages (`packages/mobile/`, `packages/browser-extension/`)
2. Share common code via `packages/shared/`
3. Import shared utilities: `import { YouTubeAPI } from '@inanutshell/shared'`
4. Test changes across all platforms

## Important Context
- **Working directory**: D:\CODING\ClaudeStuff\InANutshell
- **Platform**: Windows (win32)
- **Shell Preference**: PowerShell (use PowerShell commands when possible)
- **Git Repository**: https://github.com/pete-h-87/In_A_Nutshell.git
- **Monorepo Status**: ✅ Complete and follows industry standards
- **Next Phase**: API integration and core functionality development

## Architecture Validation
✅ **Industry Standard**: Matches patterns used by:
- Meta (React Native + web)
- Shopify (mobile + extensions)
- Discord (cross-platform apps)
- Netflix (monorepo structure)

✅ **Professional Grade**: Ready for production development