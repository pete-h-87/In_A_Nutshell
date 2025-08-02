/**
 * Test setup file for browser extension tests
 * Sets up global mocks and utilities needed across all tests
 */

// Mock Chrome Extension APIs
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn()
    },
    onInstalled: {
      addListener: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn()
    }
  }
};

// Mock DOM APIs that might not be available in jsdom
global.MutationObserver = class MutationObserver {
  constructor(callback) {
    this.callback = callback;
  }
  
  observe() {
    return null;
  }
  
  disconnect() {
    return null;
  }
};

// Mock DOMParser for XML parsing in transcript tests
global.DOMParser = class DOMParser {
  parseFromString(str, type) {
    return {
      querySelectorAll: jest.fn(() => []),
      querySelector: jest.fn(() => null)
    };
  }
};

// Console spy setup for testing console outputs
global.consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(() => {}),
  error: jest.spyOn(console, 'error').mockImplementation(() => {}),
  warn: jest.spyOn(console, 'warn').mockImplementation(() => {})
};

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  global.consoleSpy.log.mockClear();
  global.consoleSpy.error.mockClear();
  global.consoleSpy.warn.mockClear();
});

// Cleanup after each test
afterEach(() => {
  // Clean up any DOM modifications
  if (document.body) {
    document.body.innerHTML = '';
  }
});