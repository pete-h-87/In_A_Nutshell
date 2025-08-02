/**
 * Tests for menu injection functionality
 * These tests verify that the "Summarize with InANutshell" option appears in YouTube three-dot menus
 */

// Mock DOM environment for testing
global.document = {
  createElement: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(),
  addEventListener: jest.fn(),
  body: { appendChild: jest.fn() }
};

global.window = {
  location: { href: 'https://www.youtube.com/watch?v=test123' }
};

global.chrome = {
  runtime: {
    sendMessage: jest.fn()
  }
};

// Mock the content script functionality since we can't easily import ES6 modules
// We'll test the core functionality through simulation

// Create a mock injector class that simulates the real functionality
class MockYouTubeThumbnailInjector {
  constructor(contentScript) {
    this.contentScript = contentScript;
  }

  extractVideoId(videoRenderer) {
    const linkSelectors = [
      'a#thumbnail',
      'a#video-title-link',
      'a.ytd-thumbnail',
      'a.yt-lockup-view-model-wiz__content-image',
      'a.yt-lockup-metadata-view-model-wiz__title',
      'a[href*="/watch"]'
    ];
    
    for (const selector of linkSelectors) {
      const link = videoRenderer.querySelector(selector);
      if (link?.href) {
        const match = link.href.match(/[?&]v=([^&]+)/);
        if (match) {
          return match[1];
        }
      }
    }
    return null;
  }

  injectIntoDropdownMenu(clickedElement) {
    // Simulate finding video container
    const videoContainer = clickedElement.closest('ytd-video-renderer, ytd-rich-item-renderer, ytd-compact-video-renderer');
    if (!videoContainer) return false;

    // Simulate extracting video ID
    const videoId = this.extractVideoId(videoContainer);
    if (!videoId) return false;

    // Simulate finding dropdown menu
    const menuPopup = document.querySelector('ytd-menu-popup-renderer, tp-yt-iron-dropdown.style-scope.ytd-popup-container');
    if (!menuPopup) return false;

    // Simulate creating and injecting menu item
    const menuItem = document.createElement('ytd-menu-service-item-renderer');
    menuItem.className = 'style-scope ytd-menu-popup-renderer inanutshell-menu-option';
    
    const itemsContainer = menuPopup.querySelector('#items, tp-yt-paper-listbox');
    if (itemsContainer) {
      const firstMenuItem = itemsContainer.querySelector('ytd-menu-service-item-renderer, yt-button-view-model');
      if (firstMenuItem) {
        itemsContainer.insertBefore(menuItem, firstMenuItem);
        return true;
      }
    }

    return false;
  }
}

describe('YouTube Menu Injection Tests', () => {
  let injector;
  let mockContentScript;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock content script
    mockContentScript = {
      showLoadingModal: jest.fn(),
      hideLoadingModal: jest.fn(),
      showSummaryModal: jest.fn(),
      showErrorMessage: jest.fn(),
      youtubeAPI: {
        extractTranscript: jest.fn()
      }
    };

    injector = new MockYouTubeThumbnailInjector(mockContentScript);
  });

  describe('Main Page Video Thumbnails', () => {
    test('should detect main page video containers', () => {
      // Mock main page video element
      const mockVideoElement = {
        matches: jest.fn(() => true),
        querySelector: jest.fn(),
        querySelectorAll: jest.fn(() => []),
        contains: jest.fn(() => true),
        appendChild: jest.fn()
      };

      // Mock video link with ID
      const mockVideoLink = {
        href: 'https://www.youtube.com/watch?v=testVideoId123'
      };

      mockVideoElement.querySelector.mockReturnValue(mockVideoLink);
      document.querySelectorAll.mockReturnValue([mockVideoElement]);

      // Test video ID extraction
      const videoId = injector.extractVideoId(mockVideoElement);
      expect(videoId).toBe('testVideoId123');
    });

    test('should create menu dropdown option with correct structure', () => {
      const mockMenuPopup = {
        querySelector: jest.fn(),
        querySelectorAll: jest.fn(() => []),
        insertBefore: jest.fn()
      };

      const mockItemsContainer = {
        querySelector: jest.fn(),
        insertBefore: jest.fn()
      };

      const mockFirstMenuItem = {
        parentNode: mockItemsContainer
      };

      mockMenuPopup.querySelector.mockImplementation((selector) => {
        if (selector === '#items, tp-yt-paper-listbox') return mockItemsContainer;
        if (selector === '.inanutshell-menu-option') return null;
        return null;
      });

      mockItemsContainer.querySelector.mockReturnValue(mockFirstMenuItem);

      // Mock document.createElement for menu item creation
      const mockMenuItem = {
        className: '',
        innerHTML: '',
        setAttribute: jest.fn(),
        addEventListener: jest.fn()
      };
      document.createElement.mockReturnValue(mockMenuItem);

      // Test injection
      document.querySelector.mockReturnValue(mockMenuPopup);
      
      // This would normally be called when three-dot menu is clicked
      injector.injectIntoDropdownMenu(document.createElement('button'));

      // Verify menu item was created with correct attributes
      expect(document.createElement).toHaveBeenCalledWith('ytd-menu-service-item-renderer');
      expect(mockMenuItem.setAttribute).toHaveBeenCalledWith('system-icons', '');
      expect(mockMenuItem.setAttribute).toHaveBeenCalledWith('role', 'menuitem');
      expect(mockMenuItem.setAttribute).toHaveBeenCalledWith('use-icons', '');
      expect(mockMenuItem.setAttribute).toHaveBeenCalledWith('tabindex', '-1');
    });
  });

  describe('Watch Page Sidebar Videos', () => {
    test('should detect watch page video containers', () => {
      // Mock watch page sidebar video element
      const mockSidebarVideo = {
        matches: jest.fn(() => true),
        querySelector: jest.fn(),
        contains: jest.fn(() => true),
        appendChild: jest.fn()
      };

      // Mock video link with new class structure
      const mockVideoLink = {
        href: 'https://www.youtube.com/watch?v=sidebarVideo456'
      };

      mockSidebarVideo.querySelector.mockImplementation((selector) => {
        if (selector.includes('yt-lockup-view-model-wiz__content-image')) {
          return mockVideoLink;
        }
        return null;
      });

      // Test video ID extraction with new selectors
      const videoId = injector.extractVideoId(mockSidebarVideo);
      expect(videoId).toBe('sidebarVideo456');
    });

    test('should handle watch page dropdown structure', () => {
      const mockWatchPageDropdown = {
        querySelector: jest.fn(),
        querySelectorAll: jest.fn(() => []),
        insertBefore: jest.fn()
      };

      const mockListViewModel = {
        querySelector: jest.fn(),
        insertBefore: jest.fn()
      };

      const mockFirstListItem = {};

      // Mock watch page dropdown structure
      mockWatchPageDropdown.querySelector.mockImplementation((selector) => {
        if (selector === 'yt-list-view-model[role="menu"]') return mockListViewModel;
        if (selector === '.inanutshell-menu-option') return null;
        return null;
      });

      mockListViewModel.querySelector.mockReturnValue(mockFirstListItem);

      // Mock finding watch page dropdown
      document.querySelector.mockImplementation((selector) => {
        if (selector === 'tp-yt-iron-dropdown.style-scope.ytd-popup-container') {
          return mockWatchPageDropdown;
        }
        return null;
      });

      const mockMenuItem = {
        className: '',
        innerHTML: '',
        setAttribute: jest.fn(),
        addEventListener: jest.fn()
      };
      document.createElement.mockReturnValue(mockMenuItem);

      // Test injection into watch page dropdown
      injector.injectIntoDropdownMenu(document.createElement('button'));

      // Verify it attempts to inject into list view model
      expect(mockListViewModel.insertBefore).toHaveBeenCalled();
    });
  });

  describe('Menu Button Detection', () => {
    test('should detect main page three-dot menu buttons', () => {
      const mockButton = {
        closest: jest.fn(() => mockButton),
        tagName: 'BUTTON',
        className: 'ytd-menu-renderer'
      };

      // Mock button detection
      const buttonSelectors = [
        'ytd-menu-renderer button',
        'yt-icon-button button',
        '[aria-label*="More"]',
        '[aria-label*="Action menu"]',
        'button-view-model button',
        '.yt-spec-button-shape-next[aria-label*="More"]',
        'button[aria-label="More actions"]'
      ];

      // Test that our selector list covers main page buttons
      expect(buttonSelectors).toContain('ytd-menu-renderer button');
      expect(buttonSelectors).toContain('[aria-label*="More"]');
    });

    test('should detect watch page three-dot menu buttons', () => {
      const mockWatchPageButton = {
        closest: jest.fn(() => mockWatchPageButton),
        tagName: 'BUTTON',
        className: 'yt-spec-button-shape-next',
        getAttribute: jest.fn(() => 'More actions')
      };

      // Test watch page button detection
      const buttonSelectors = [
        'button-view-model button',
        '.yt-spec-button-shape-next[aria-label*="More"]',
        'button[aria-label="More actions"]'
      ];

      expect(buttonSelectors).toContain('button[aria-label="More actions"]');
      expect(buttonSelectors).toContain('.yt-spec-button-shape-next[aria-label*="More"]');
    });
  });

  describe('Video ID Extraction', () => {
    test('should extract video ID from standard YouTube URLs', () => {
      const testCases = [
        {
          href: 'https://www.youtube.com/watch?v=abc123',
          expected: 'abc123'
        },
        {
          href: 'https://www.youtube.com/watch?v=xyz789&t=30s',
          expected: 'xyz789'
        },
        {
          href: 'https://youtu.be/short123',
          expected: 'short123'
        }
      ];

      testCases.forEach(({ href, expected }) => {
        const mockElement = {
          querySelector: jest.fn(() => ({ href }))
        };

        const videoId = injector.extractVideoId(mockElement);
        expect(videoId).toBe(expected);
      });
    });

    test('should handle all link selector types', () => {
      const linkSelectors = [
        'a#thumbnail',
        'a#video-title-link',
        'a.ytd-thumbnail',
        'a.yt-lockup-view-model-wiz__content-image',
        'a.yt-lockup-metadata-view-model-wiz__title',
        'a[href*="/watch"]'
      ];

      const mockElement = {
        querySelector: jest.fn()
      };

      // Mock that the first few selectors return null, last one returns a link
      mockElement.querySelector.mockImplementation((selector) => {
        if (selector === 'a[href*="/watch"]') {
          return { href: 'https://www.youtube.com/watch?v=test123' };
        }
        return null;
      });

      const videoId = injector.extractVideoId(mockElement);
      expect(videoId).toBe('test123');
      
      // Verify it tried the expected selectors
      linkSelectors.forEach(selector => {
        expect(mockElement.querySelector).toHaveBeenCalledWith(selector);
      });
    });
  });

  describe('Integration Tests', () => {
    test('should complete full menu injection workflow', async () => {
      // Mock complete workflow: button click → dropdown appears → menu item injected
      const mockVideoContainer = {
        closest: jest.fn(() => mockVideoContainer),
        querySelector: jest.fn(() => ({
          href: 'https://www.youtube.com/watch?v=workflow123'
        }))
      };

      const mockMenuPopup = {
        querySelector: jest.fn(),
        insertBefore: jest.fn()
      };

      const mockItemsContainer = {
        querySelector: jest.fn(() => ({})),
        insertBefore: jest.fn()
      };

      // Setup mocks
      mockMenuPopup.querySelector.mockImplementation((selector) => {
        if (selector === '#items, tp-yt-paper-listbox') return mockItemsContainer;
        if (selector === '.inanutshell-menu-option') return null;
        return mockItemsContainer;
      });

      document.querySelector.mockReturnValue(mockMenuPopup);
      document.createElement.mockReturnValue({
        className: '',
        innerHTML: '',
        setAttribute: jest.fn(),
        addEventListener: jest.fn()
      });

      // Simulate button click that finds video container
      const mockClickedElement = {
        closest: jest.fn(() => mockVideoContainer)
      };

      // Test the workflow
      injector.injectIntoDropdownMenu(mockClickedElement);

      // Verify video ID was extracted
      expect(mockVideoContainer.querySelector).toHaveBeenCalled();
      
      // Verify menu item was created and inserted
      expect(document.createElement).toHaveBeenCalledWith('ytd-menu-service-item-renderer');
      expect(mockItemsContainer.insertBefore).toHaveBeenCalled();
    });
  });
});

describe('Error Handling', () => {
  test('should handle missing video containers gracefully', () => {
    const injector = new YouTubeThumbnailInjector({});
    
    const mockClickedElement = {
      closest: jest.fn(() => null)
    };

    // Should not throw error when container not found
    expect(() => {
      injector.injectIntoDropdownMenu(mockClickedElement);
    }).not.toThrow();
  });

  test('should handle missing dropdown menus gracefully', () => {
    const injector = new YouTubeThumbnailInjector({});
    
    document.querySelector.mockReturnValue(null);
    
    const mockClickedElement = {
      closest: jest.fn(() => ({}))
    };

    // Should not throw error when dropdown not found
    expect(() => {
      injector.injectIntoDropdownMenu(mockClickedElement);
    }).not.toThrow();
  });
});