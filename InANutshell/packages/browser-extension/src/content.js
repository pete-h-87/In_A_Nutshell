// Content script that runs on YouTube pages
import { YouTubeAPI, isValidYouTubeUrl } from '@inanutshell/shared';

class YouTubeThumbnailInjector {
  constructor(contentScript) {
    this.contentScript = contentScript;
    this.observer = null;
    this.processedVideos = new Set();
  }

  init() {
    console.log('InANutshell: Initializing thumbnail menu injection...');
    this.setupMutationObserver();
    this.setupMenuClickListener();
    this.processExistingVideos();
  }

  setupMutationObserver() {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.matches?.('ytd-video-renderer, ytd-rich-item-renderer')) {
              this.injectSummaryOption(node);
            }
            
            const videoRenderers = node.querySelectorAll?.('ytd-video-renderer, ytd-rich-item-renderer');
            videoRenderers?.forEach(renderer => this.injectSummaryOption(renderer));
          }
        });
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  processExistingVideos() {
    document.querySelectorAll('ytd-video-renderer, ytd-rich-item-renderer').forEach(
      renderer => this.injectSummaryOption(renderer)
    );
  }

  injectSummaryOption(videoRenderer) {
    const videoId = this.extractVideoId(videoRenderer);
    console.log('InANutshell: Processing video renderer, videoId:', videoId);
    
    if (!videoId) {
      console.log('InANutshell: No video ID found, skipping');
      return;
    }
    
    if (this.processedVideos.has(videoId)) {
      console.log('InANutshell: Video already processed:', videoId);
      return;
    }

    const menuRenderer = videoRenderer.querySelector('ytd-menu-renderer');
    console.log('InANutshell: Menu renderer found:', !!menuRenderer);
    
    if (!menuRenderer) {
      // Try alternative approach - add button to metadata area
      console.log('InANutshell: No menu renderer, trying alternative injection');
      this.injectAlternativeButton(videoRenderer, videoId);
      return;
    }

    this.processedVideos.add(videoId);

    const topLevelButtons = menuRenderer.querySelector('#top-level-buttons');
    console.log('InANutshell: Top level buttons found:', !!topLevelButtons);
    
    if (!topLevelButtons) {
      console.log('InANutshell: No top-level-buttons, trying alternative injection');
      this.injectAlternativeButton(videoRenderer, videoId);
      return;
    }
    
    if (topLevelButtons.querySelector('.inanutshell-thumbnail-btn')) {
      console.log('InANutshell: Button already exists');
      return;
    }

    const customButton = document.createElement('ytd-toggle-button-renderer');
    customButton.className = 'style-scope ytd-menu-renderer inanutshell-thumbnail-btn';
    customButton.innerHTML = `
      <a class="yt-simple-endpoint style-scope ytd-toggle-button-renderer">
        <yt-icon-button class="style-scope ytd-toggle-button-renderer">
          <button class="style-scope yt-icon-button" aria-label="Summarize video with InANutshell" title="Summarize">
            <span style="font-size: 18px; color: var(--yt-spec-icon-inactive);">🥜</span>
          </button>
        </yt-icon-button>
      </a>
    `;

    customButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleThumbnailSummarize(videoId, videoRenderer);
    });

    topLevelButtons.appendChild(customButton);
    console.log('InANutshell: Added summary button to video:', videoId);
  }

  injectAlternativeButton(videoRenderer, videoId) {
    console.log('InANutshell: Trying alternative button injection for:', videoId);
    
    // Try to find the metadata area where we can add a floating button
    const metadata = videoRenderer.querySelector('#metadata, #meta, ytd-video-meta-block, #details');
    if (!metadata) {
      console.log('InANutshell: No metadata area found for alternative injection');
      return;
    }

    // Create a floating button that appears on hover
    const floatingButton = document.createElement('div');
    floatingButton.className = 'inanutshell-floating-btn';
    floatingButton.innerHTML = `
      <button style="
        position: absolute;
        top: 8px;
        right: 8px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        border: none;
        border-radius: 4px;
        padding: 6px 10px;
        font-size: 14px;
        cursor: pointer;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.2s;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      " title="Summarize with InANutshell">
        🥜 Summarize
      </button>
    `;

    // Show button on hover
    videoRenderer.addEventListener('mouseenter', () => {
      floatingButton.querySelector('button').style.opacity = '1';
    });
    
    videoRenderer.addEventListener('mouseleave', () => {
      floatingButton.querySelector('button').style.opacity = '0';
    });

    floatingButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleThumbnailSummarize(videoId, videoRenderer);
    });

    // Make the video renderer container relative positioned
    videoRenderer.style.position = 'relative';
    videoRenderer.appendChild(floatingButton);
    
    this.processedVideos.add(videoId);
    console.log('InANutshell: Added floating summary button to video:', videoId);
  }

  setupMenuClickListener() {
    console.log('InANutshell: Setting up three-dots menu click listener...');
    
    // Listen for clicks on three-dots menu buttons
    document.addEventListener('click', (e) => {
      const menuButton = e.target.closest('ytd-menu-renderer button, yt-icon-button button, [aria-label*="More"], [aria-label*="Action menu"]');
      if (menuButton) {
        console.log('InANutshell: Menu button clicked, waiting for dropdown...');
        setTimeout(() => this.injectIntoDropdownMenu(e.target), 200);
      }
    });
  }

  injectIntoDropdownMenu(clickedElement) {
    // Find the opened menu popup
    const menuPopup = document.querySelector('ytd-menu-popup-renderer, tp-yt-iron-dropdown[opened], .ytd-popup-container');
    if (!menuPopup) {
      console.log('InANutshell: No menu popup found');
      return;
    }

    // Check if we already injected our option
    if (menuPopup.querySelector('.inanutshell-menu-option')) {
      console.log('InANutshell: Menu option already exists');
      return;
    }

    // Find the video ID from the nearest video container
    const videoContainer = clickedElement.closest('ytd-video-renderer, ytd-rich-item-renderer');
    if (!videoContainer) {
      console.log('InANutshell: Could not find video container for menu');
      return;
    }

    const videoId = this.extractVideoId(videoContainer);
    if (!videoId) {
      console.log('InANutshell: Could not extract video ID for menu');
      return;
    }

    console.log('InANutshell: Injecting summarize option into dropdown for video:', videoId);

    // Create our menu item
    const menuItem = document.createElement('ytd-menu-service-item-renderer');
    menuItem.className = 'style-scope ytd-menu-popup-renderer inanutshell-menu-option';
    menuItem.innerHTML = `
      <tp-yt-paper-item class="style-scope ytd-menu-service-item-renderer" role="option" tabindex="0">
        <yt-icon class="style-scope ytd-menu-service-item-renderer">
          <span style="font-size: 24px; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px;">🥜</span>
        </yt-icon>
        <yt-formatted-string class="text style-scope ytd-menu-service-item-renderer">
          Summarize with InANutshell
        </yt-formatted-string>
      </tp-yt-paper-item>
    `;

    // Add click handler
    menuItem.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Close the menu
      const dropdown = document.querySelector('tp-yt-iron-dropdown[opened]');
      if (dropdown) {
        dropdown.removeAttribute('opened');
      }
      
      // Handle summarize
      this.handleThumbnailSummarize(videoId, videoContainer);
    });

    // Insert at the top of the menu
    const menuContainer = menuPopup.querySelector('#items, .style-scope.ytd-menu-popup-renderer');
    if (menuContainer && menuContainer.firstChild) {
      menuContainer.insertBefore(menuItem, menuContainer.firstChild);
      console.log('InANutshell: Successfully injected menu option for video:', videoId);
    } else {
      console.log('InANutshell: Could not find menu container to inject into');
    }
  }

  extractVideoId(videoRenderer) {
    const link = videoRenderer.querySelector('a#thumbnail, a#video-title-link, a.ytd-thumbnail');
    if (link?.href) {
      const match = link.href.match(/[?&]v=([^&]+)/);
      return match ? match[1] : null;
    }
    return null;
  }

  async handleThumbnailSummarize(videoId, videoRenderer) {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    try {
      this.contentScript.showLoadingModal();
      
      // For now, let's test with a simple mock transcript to avoid the microphone issue
      console.log('=== TRANSCRIPT EXTRACTION TEST ===');
      console.log('Video ID:', videoId);
      console.log('Video URL:', videoUrl);
      console.log('Current page URL:', window.location.href);
      
      // Mock transcript for testing - replace with real extraction later
      const mockTranscript = `This is a test transcript for video ${videoId}. In a real implementation, this would contain the actual video transcript extracted from YouTube's auto-generated captions. The transcript would be much longer and contain the actual spoken content from the video.`;
      
      console.log('=== MOCK TRANSCRIPT EXTRACTED ===');
      console.log('Transcript length:', mockTranscript.length);
      console.log('Transcript content:', mockTranscript);
      console.log('=====================================');
      
      // Store in a global variable for easy access
      window.lastExtractedTranscript = {
        videoId: videoId,
        transcript: mockTranscript,
        timestamp: new Date().toISOString(),
        source: 'mock-test'
      };
      
      console.log('✅ Transcript stored in window.lastExtractedTranscript');
      
      this.contentScript.hideLoadingModal();
      this.contentScript.showSummaryModal({
        title: 'TEST: Mock Transcript Extracted',
        content: mockTranscript,
        videoId: videoId,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Thumbnail transcript extraction failed:', error);
      this.contentScript.hideLoadingModal();
      this.contentScript.showErrorMessage(`Failed to extract transcript: ${error.message}`);
    }
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

class YouTubeContentScript {
  constructor() {
    this.youtubeAPI = new YouTubeAPI();
    this.thumbnailInjector = new YouTubeThumbnailInjector(this);
    this.init();
  }

  init() {
    // Add InANutshell button to YouTube page
    this.addSummarizeButton();
    
    // Initialize thumbnail menu injection
    this.thumbnailInjector.init();
    
    // Listen for URL changes (YouTube is SPA)
    this.watchForUrlChanges();
  }

  addSummarizeButton() {
    console.log('InANutshell: Adding summarize button...');
    
    // Find YouTube's action buttons container
    const actionsContainer = document.querySelector('#actions');
    console.log('InANutshell: Actions container found:', !!actionsContainer);
    
    if (!actionsContainer) {
      console.log('InANutshell: No actions container found, retrying in 2 seconds...');
      setTimeout(() => this.addSummarizeButton(), 2000);
      return;
    }

    // Check if button already exists
    if (document.querySelector('.inanutshell-summarize-btn')) {
      console.log('InANutshell: Button already exists');
      return;
    }

    // Create our summarize button
    const button = document.createElement('button');
    button.textContent = '🥜 Summarize';
    button.className = 'inanutshell-summarize-btn';
    button.style.cssText = 'margin: 0 8px; padding: 8px 16px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer;';
    button.onclick = () => this.handleSummarize();

    actionsContainer.appendChild(button);
    console.log('InANutshell: Button added successfully');
  }

  async handleSummarize() {
    const videoUrl = window.location.href;
    
    if (!isValidYouTubeUrl(videoUrl)) {
      this.showErrorMessage('Please navigate to a YouTube video');
      return;
    }

    // Disable button during processing
    const button = document.querySelector('.inanutshell-summarize-btn');
    if (button) {
      button.disabled = true;
      button.textContent = '🔄 Processing...';
    }

    try {
      // Show loading modal
      this.showLoadingModal();
      
      // MOCK TRANSCRIPT - No microphone access!
      console.log('=== IN-VIDEO TRANSCRIPT EXTRACTION TEST ===');
      console.log('Video URL:', videoUrl);
      
      // Extract video ID for mock
      const videoIdMatch = videoUrl.match(/[?&]v=([^&]+)/);
      const videoId = videoIdMatch ? videoIdMatch[1] : 'unknown';
      
      // Mock transcript for testing
      const mockTranscript = `This is a mock transcript for the currently playing video ${videoId}. In a real implementation, this would contain the actual video transcript extracted from YouTube's auto-generated captions without triggering microphone access. The transcript would include the full spoken content from the video.`;
      
      console.log('=== MOCK IN-VIDEO TRANSCRIPT EXTRACTED ===');
      console.log('Video ID:', videoId);
      console.log('Transcript length:', mockTranscript.length);
      console.log('Transcript content:', mockTranscript);
      console.log('==========================================');
      
      // Store in global variable
      window.lastExtractedTranscript = {
        videoId: videoId,
        transcript: mockTranscript,
        timestamp: new Date().toISOString(),
        source: 'mock-in-video-test'
      };
      
      console.log('✅ In-video transcript stored in window.lastExtractedTranscript');
      
      // Show mock result
      this.showSummaryModal({
        title: 'TEST: Mock In-Video Transcript Extracted',
        content: mockTranscript,
        videoId: videoId,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Transcript extraction failed:', error);
      this.hideLoadingModal();
      this.showErrorMessage(`Failed to extract transcript: ${error.message}`);
    } finally {
      // Re-enable button
      if (button) {
        button.disabled = false;
        button.textContent = '🥜 Summarize';
      }
    }
  }

  showLoadingModal() {
    this.hideModals(); // Remove any existing modals
    
    const modal = document.createElement('div');
    modal.className = 'inanutshell-modal';
    modal.id = 'inanutshell-loading-modal';
    
    modal.innerHTML = `
      <div class="inanutshell-modal-content">
        <div class="inanutshell-loading">
          <div class="inanutshell-spinner"></div>
          <h3>Extracting Transcript...</h3>
          <p>Please wait while we extract the video transcript</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }

  showSummaryModal(data) {
    this.hideModals(); // Remove any existing modals
    
    const modal = document.createElement('div');
    modal.className = 'inanutshell-modal';
    modal.id = 'inanutshell-summary-modal';
    
    const isTranscript = typeof data === 'object' && data.title;
    const title = isTranscript ? data.title : 'Video Summary';
    const content = isTranscript ? data.content : data;
    
    modal.innerHTML = `
      <div class="inanutshell-modal-content">
        <div class="inanutshell-modal-header">
          <h2 class="inanutshell-modal-title">${title}</h2>
          <button class="inanutshell-modal-close">&times;</button>
        </div>
        <div class="inanutshell-summary">
          <div class="transcript-content">
            ${content.length > 2000 ? 
              `<p><strong>Preview (first 2000 characters):</strong></p>
               <p>${content.substring(0, 2000)}...</p>
               <p><em>Full transcript available - ${content.length} characters total</em></p>` :
              `<p>${content}</p>`
            }
          </div>
          ${isTranscript ? `
            <div class="transcript-meta">
              <small>Video ID: ${data.videoId} | Extracted: ${new Date(data.timestamp).toLocaleString()}</small>
            </div>
          ` : ''}
        </div>
      </div>
    `;
    
    // Add close functionality
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.classList.contains('inanutshell-modal-close')) {
        this.hideModals();
      }
    });
    
    document.body.appendChild(modal);
  }

  showErrorMessage(message) {
    this.hideModals();
    
    const modal = document.createElement('div');
    modal.className = 'inanutshell-modal';
    modal.id = 'inanutshell-error-modal';
    
    modal.innerHTML = `
      <div class="inanutshell-modal-content">
        <div class="inanutshell-modal-header">
          <h2 class="inanutshell-modal-title">⚠️ Error</h2>
          <button class="inanutshell-modal-close">&times;</button>
        </div>
        <div class="inanutshell-summary">
          <p>${message}</p>
          <p><small>Please try again or check that the video has auto-generated captions available.</small></p>
        </div>
      </div>
    `;
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.classList.contains('inanutshell-modal-close')) {
        this.hideModals();
      }
    });
    
    document.body.appendChild(modal);
    
    // Auto-hide error after 5 seconds
    setTimeout(() => this.hideModals(), 5000);
  }

  hideLoadingModal() {
    const modal = document.getElementById('inanutshell-loading-modal');
    if (modal) modal.remove();
  }

  hideModals() {
    const modals = document.querySelectorAll('.inanutshell-modal');
    modals.forEach(modal => modal.remove());
  }

  watchForUrlChanges() {
    let currentUrl = window.location.href;
    setInterval(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        // Re-add button if URL changed
        setTimeout(() => {
          this.addSummarizeButton();
          this.thumbnailInjector.processExistingVideos();
        }, 1000);
      }
    }, 1000);
  }
}

// Initialize when page loads
function initializeExtension() {
  console.log('InANutshell: Initializing extension...');
  try {
    new YouTubeContentScript();
    console.log('InANutshell: Extension initialized successfully');
  } catch (error) {
    console.error('InANutshell: Initialization failed:', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  initializeExtension();
}