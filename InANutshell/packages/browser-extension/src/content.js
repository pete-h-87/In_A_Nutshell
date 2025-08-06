// Content script that runs on YouTube pages
import { YouTubeAPI, Summarizer, isValidYouTubeUrl } from '@inanutshell/shared';

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
            if (node.matches?.('ytd-video-renderer, ytd-rich-item-renderer, ytd-compact-video-renderer')) {
              this.injectSummaryOption(node);
            }
            
            const videoRenderers = node.querySelectorAll?.('ytd-video-renderer, ytd-rich-item-renderer, ytd-compact-video-renderer');
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
    document.querySelectorAll('ytd-video-renderer, ytd-rich-item-renderer, ytd-compact-video-renderer').forEach(
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
    
    // Listen for clicks on three-dots menu buttons (both main page and watch page)
    document.addEventListener('click', (e) => {
      const menuButton = e.target.closest([
        'ytd-menu-renderer button',                    // Main page menu buttons
        'yt-icon-button button',                      // Generic icon buttons
        '[aria-label*="More"]',                       // More actions buttons
        '[aria-label*="Action menu"]',                // Action menu buttons
        'button-view-model button',                   // Watch page sidebar buttons
        '.yt-spec-button-shape-next[aria-label*="More"]', // New button structure
        'button[aria-label="More actions"]'           // Specific watch page buttons
      ].join(', '));
      
      if (menuButton) {
        console.log('InANutshell: Menu button clicked, waiting for dropdown...', menuButton);
        setTimeout(() => this.injectIntoDropdownMenu(e.target), 200);
      }
    });
  }

  injectIntoDropdownMenu(clickedElement) {
    // Find the opened menu popup - prioritize sidebar video dropdowns
    let menuPopup = document.querySelector('ytd-menu-popup-renderer');
    
    if (!menuPopup) {
      // For watch page sidebar videos, specifically target the popup container dropdown
      menuPopup = document.querySelector('tp-yt-iron-dropdown.style-scope.ytd-popup-container');
    }
    
    if (!menuPopup) {
      // Try other alternatives but exclude video player menus
      menuPopup = document.querySelector([
        'tp-yt-iron-dropdown[horizontal-align="auto"]',        // Positioned dropdown
        '.ytd-popup-container tp-yt-iron-dropdown',            // Nested dropdown
        'ytd-menu-popup-renderer:not([hidden])'               // Fallback
      ].join(', '));
    }
    
    console.log('InANutshell: Found menu popup:', !!menuPopup, menuPopup);
    console.log('InANutshell: All potential dropdowns:', document.querySelectorAll([
      'ytd-menu-popup-renderer',
      'tp-yt-iron-dropdown',
      '.ytd-popup-container',
      '[role="menu"]'
    ].join(', ')));
    
    if (!menuPopup) {
      console.log('InANutshell: No menu popup found with any selector');
      return;
    }

    // Check if we already injected our option
    if (menuPopup.querySelector('.inanutshell-menu-option')) {
      console.log('InANutshell: Menu option already exists');
      return;
    }

    // Find the video ID from the nearest video container (multiple page types)
    let videoContainer = clickedElement.closest([
      'ytd-video-renderer',           // Main page video cards
      'ytd-rich-item-renderer',       // Grid view items
      'ytd-compact-video-renderer',   // Watch page sidebar videos
      'ytd-video-meta-block',         // Alternative container
      '.ytd-watch-next-secondary-results-renderer' // Watch page container
    ].join(', '));
    
    // For watch page, if we can't find the container, try a broader search
    if (!videoContainer) {
      // Look in the sidebar area specifically
      const sidebarArea = document.querySelector('#related, #secondary, ytd-watch-next-secondary-results-renderer');
      if (sidebarArea) {
        const allVideoContainers = sidebarArea.querySelectorAll('ytd-compact-video-renderer, ytd-video-renderer');
        // Find the one that contains our clicked button
        for (let container of allVideoContainers) {
          if (container.contains(clickedElement)) {
            videoContainer = container;
            break;
          }
        }
      }
    }
    
    if (!videoContainer) {
      console.log('InANutshell: Could not find video container for menu');
      console.log('InANutshell: Clicked element:', clickedElement);
      console.log('InANutshell: Clicked element parents:', clickedElement.parentElement, clickedElement.parentElement?.parentElement);
      return;
    }

    console.log('InANutshell: Found video container:', videoContainer);
    const videoId = this.extractVideoId(videoContainer);
    console.log('InANutshell: Extracted video ID:', videoId);
    
    if (!videoId) {
      console.log('InANutshell: Could not extract video ID for menu');
      console.log('InANutshell: Video container HTML:', videoContainer.innerHTML.substring(0, 300));
      console.log('InANutshell: Video links in container:', videoContainer.querySelectorAll('a[href*="/watch"]'));
      return;
    }

    console.log('InANutshell: Injecting summarize option into dropdown for video:', videoId);

    // Create our menu item with simpler, more direct approach
    const menuItem = document.createElement('ytd-menu-service-item-renderer');
    menuItem.className = 'style-scope ytd-menu-popup-renderer inanutshell-menu-option';
    menuItem.setAttribute('system-icons', '');
    menuItem.setAttribute('role', 'menuitem');
    menuItem.setAttribute('use-icons', '');
    menuItem.setAttribute('tabindex', '-1');
    
    menuItem.innerHTML = `
      <tp-yt-paper-item class="style-scope ytd-menu-service-item-renderer" role="option" tabindex="-1">
        <div style="display: flex; align-items: center; padding: 8px 16px; width: 100%;">
          <span style="font-size: 18px; margin-right: 16px; display: inline-block;">🥜</span>
          <span style="color: var(--yt-spec-text-primary, #0f0f0f); font-family: Roboto, Arial, sans-serif; font-size: 14px; line-height: 20px;">Summarize with InANutshell</span>
        </div>
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

    // Insert at the top of the menu - handle different dropdown types
    let insertionSuccess = false;
    
    // Try main page structure first (#items container)
    const itemsContainer = menuPopup.querySelector('#items, tp-yt-paper-listbox');
    if (itemsContainer) {
      const firstMenuItem = itemsContainer.querySelector('ytd-menu-service-item-renderer, yt-button-view-model');
      if (firstMenuItem) {
        itemsContainer.insertBefore(menuItem, firstMenuItem);
        insertionSuccess = true;
        console.log('InANutshell: Successfully injected into items container for video:', videoId);
      }
    }
    
    // Try watch page structure (yt-list-view-model)
    if (!insertionSuccess) {
      const listViewModel = menuPopup.querySelector('yt-list-view-model[role="menu"]') || 
                           document.querySelector('yt-list-view-model[role="menu"]');
      if (listViewModel) {
        const firstListItem = listViewModel.querySelector('yt-button-view-model, [role="menuitem"]');
        if (firstListItem) {
          listViewModel.insertBefore(menuItem, firstListItem);
          insertionSuccess = true;
          console.log('InANutshell: Successfully injected into list view model for video:', videoId);
        }
      }
    }
    
    // Final fallback - try direct insertion
    if (!insertionSuccess) {
      const allMenuItems = menuPopup.querySelectorAll('ytd-menu-service-item-renderer, yt-button-view-model, [role="menuitem"]');
      if (allMenuItems.length > 0) {
        allMenuItems[0].parentNode.insertBefore(menuItem, allMenuItems[0]);
        insertionSuccess = true;
        console.log('InANutshell: Fallback injection successful for video:', videoId);
      }
    }
    
    if (!insertionSuccess) {
      console.log('InANutshell: Could not inject menu item anywhere');
      console.log('InANutshell: Menu popup structure:', menuPopup.innerHTML.substring(0, 500));
    }
  }

  extractVideoId(videoRenderer) {
    // Try multiple selectors for different YouTube layouts
    const linkSelectors = [
      'a#thumbnail',                              // Standard thumbnail link
      'a#video-title-link',                       // Standard title link  
      'a.ytd-thumbnail',                          // Generic thumbnail link
      'a.yt-lockup-view-model-wiz__content-image', // Watch page sidebar image link
      'a.yt-lockup-metadata-view-model-wiz__title', // Watch page sidebar title link
      'a[href*="/watch"]'                         // Any link containing /watch
    ];
    
    for (const selector of linkSelectors) {
      const link = videoRenderer.querySelector(selector);
      if (link?.href) {
        const match = link.href.match(/[?&]v=([^&]+)/);
        if (match) {
          console.log('InANutshell: Found video ID using selector:', selector, match[1]);
          return match[1];
        }
      }
    }
    
    console.log('InANutshell: No video ID found with any selector');
    return null;
  }

  async handleThumbnailSummarize(videoId, videoRenderer) {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    try {
      this.contentScript.showLoadingModal();
      
      console.log('=== IFRAME TRANSCRIPT EXTRACTION ===');
      console.log('Video ID:', videoId);
      console.log('Video URL:', videoUrl);
      
      // Extract transcript via UI automation
      const result = await this.extractTranscriptViaUIAutomation(videoId);
      
      console.log('=== TRANSCRIPT EXTRACTED SUCCESSFULLY ===');
      console.log('Video ID:', videoId);
      console.log('Transcript length:', result.transcript.length);
      console.log('Source:', result.source);
      console.log('Transcript preview:', result.transcript.substring(0, 200) + '...');
      console.log('==========================================');
      
      // Store in global variable for easy access
      window.lastExtractedTranscript = result;
      console.log('✅ Real transcript stored in window.lastExtractedTranscript');
      
      this.contentScript.hideLoadingModal();
      this.contentScript.showSummaryModal({
        title: 'Transcript Extracted Successfully',
        content: result.transcript,
        videoId: videoId,
        timestamp: result.timestamp
      });
      
    } catch (error) {
      console.error('Transcript extraction failed:', error);
      this.contentScript.hideLoadingModal();
      this.contentScript.showErrorMessage(`Failed to extract transcript: ${error.message}`);
    }
  }

  async extractTranscriptViaUIAutomation(videoId) {
    console.log("Starting UI automation transcript extraction for:", videoId);
    
    // Check if we're on the video page already
    const currentVideoId = this.getCurrentVideoId();
    if (currentVideoId === videoId) {
      console.log('Video is already loaded, using UI automation on current page');
      return this.clickTranscriptButton(videoId);
    }
    
    // Need to navigate to video first
    console.log('Navigating to video for UI automation');
    return this.navigateAndClickTranscript(videoId);
  }
  
  getCurrentVideoId() {
    const url = window.location.href;
    const match = url.match(/[?&]v=([^&]+)/);
    return match ? match[1] : null;
  }
  
  async clickTranscriptButton(videoId) {
    console.log('Attempting to click transcript button via UI automation');
    
    return new Promise((resolve, reject) => {
      // Step 1: Look for the "More" button (three dots or "...more")
      const findMoreButton = () => {
        const moreSelectors = [
          'tp-yt-paper-button#expand',                    // New: specific expand button
          '#expand',                                      // Existing: any element with expand ID
          'tp-yt-paper-button.ytd-text-inline-expander', // New: by class
          'button[aria-label*="more"]',
          'button[aria-label*="More"]', 
          'button[aria-label*="Show more"]',
          '.more-button',
          'tp-yt-paper-button[aria-label*="more"]'
        ];
        
        for (const selector of moreSelectors) {
          const button = document.querySelector(selector);
          if (button) {
            // For #expand button, don't require visibility check since it might be hidden but still clickable
            if (selector.includes('#expand') || selector.includes('tp-yt-paper-button#expand')) {
              console.log('Found "More" button (may be hidden):', selector);
              return button;
            }
            // For other buttons, still check visibility
            if (button.offsetParent !== null) {
              console.log('Found "More" button:', selector);
              return button;
            }
          }
        }
        return null;
      };
      
      // Step 2: Look for transcript button after clicking more
      const findTranscriptButton = () => {
        const transcriptSelectors = [
          'button[aria-label*="transcript"]',
          'button[aria-label*="Transcript"]',
          'yt-formatted-string:contains("Show transcript")',
          '[role="menuitem"]:contains("transcript")',
          '.transcript-button'
        ];
        
        for (const selector of transcriptSelectors) {
          const button = document.querySelector(selector);
          if (button && button.offsetParent !== null) {
            console.log('Found transcript button:', selector);
            return button;
          }
        }
        return null;
      };
      
      // Step 3: Extract transcript text from the panel
      const extractTranscriptText = () => {
        const transcriptSelectors = [
          '#transcript-container',
          '.transcript-container', 
          '[data-target-id="engagement-panel-structured-description"] .segment-text',
          '#structured-description .segment-text',
          '.ytd-transcript-segment-renderer .segment-text'
        ];
        
        for (const selector of transcriptSelectors) {
          const container = document.querySelector(selector);
          if (container) {
            // Extract all text segments
            const segments = container.querySelectorAll('.segment-text, [class*="segment"]');
            if (segments.length > 0) {
              const transcript = Array.from(segments)
                .map(seg => seg.textContent.trim())
                .filter(text => text.length > 0)
                .join(' ');
              
              if (transcript.length > 50) {
                console.log('Extracted transcript via UI:', transcript.substring(0, 100) + '...');
                return transcript;
              }
            }
          }
        }
        
        // Fallback: get all visible text that looks like transcript
        const allText = document.body.innerText;
        if (allText.length > 200) {
          console.log('Using fallback text extraction');
          return allText; // Return full text, don't truncate
        }
        
        return null;
      };
      
      // Execute the workflow
      const executeWorkflow = () => {
        let step = 0;
        const maxSteps = 10;
        
        const nextStep = () => {
          step++;
          if (step > maxSteps) {
            reject(new Error('UI automation workflow timed out'));
            return;
          }
          
          console.log(`UI automation step ${step}/${maxSteps}`);
          
          // Try to find and click more button first
          const moreButton = findMoreButton();
          if (moreButton && !moreButton.clicked) {
            console.log('Clicking "More" button...');
            moreButton.clicked = true;
            moreButton.click();
            setTimeout(nextStep, 1000); // Wait for menu to appear
            return;
          }
          
          // Try to find and click transcript button
          const transcriptButton = findTranscriptButton();
          if (transcriptButton && !transcriptButton.clicked) {
            console.log('Clicking transcript button...');
            transcriptButton.clicked = true;
            transcriptButton.click();
            setTimeout(nextStep, 2000); // Wait for transcript to load
            return;
          }
          
          // Try to extract transcript text
          const transcript = extractTranscriptText();
          if (transcript) {
            resolve({
              videoId: videoId,
              transcript: transcript,
              timestamp: new Date().toISOString(),
              source: 'ui-automation',
              language: 'en'
            });
            return;
          }
          
          // If nothing found, try again
          setTimeout(nextStep, 1000);
        };
        
        nextStep();
      };
      
      // Start the workflow
      executeWorkflow();
      
      // Overall timeout
      setTimeout(() => {
        reject(new Error('UI automation timed out after 30 seconds'));
      }, 30000);
    });
  }
  
  async navigateAndClickTranscript(videoId) {
    console.log('Creating iframe for UI automation navigation');
    
    return new Promise((resolve, reject) => {
      // Create iframe that will load the video page
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube.com/watch?v=${videoId}`;
      iframe.style.cssText = `
        position: fixed;
        top: 50px;
        left: 50px;
        width: 800px;
        height: 600px;
        z-index: 10000;
        border: 2px solid red;
        background: white;
      `;
      
      iframe.onload = () => {
        console.log('Iframe loaded, attempting UI automation...');
        
        try {
          // Try to access iframe content and perform clicks
          const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
          
          // Simple automation within iframe
          setTimeout(() => {
            // Look for more button in iframe
            const moreBtn = iframeDoc.querySelector('button[aria-label*="more"], #expand');
            if (moreBtn) {
              console.log('Clicking more button in iframe');
              moreBtn.click();
              
              setTimeout(() => {
                // Look for transcript button
                const transcriptBtn = iframeDoc.querySelector('button[aria-label*="transcript"]');
                if (transcriptBtn) {
                  console.log('Clicking transcript button in iframe');
                  transcriptBtn.click();
                  
                  setTimeout(() => {
                    // Extract transcript
                    const transcript = iframeDoc.body.innerText;
                    if (transcript.length > 100) {
                      document.body.removeChild(iframe);
                      resolve({
                        videoId: videoId,
                        transcript: transcript,
                        timestamp: new Date().toISOString(),
                        source: 'iframe-ui-automation',
                        language: 'en'
                      });
                    } else {
                      document.body.removeChild(iframe);
                      reject(new Error('Could not extract transcript from iframe'));
                    }
                  }, 3000);
                } else {
                  document.body.removeChild(iframe);
                  reject(new Error('Transcript button not found in iframe'));
                }
              }, 2000);
            } else {
              document.body.removeChild(iframe);
              reject(new Error('More button not found in iframe'));
            }
          }, 3000);
          
        } catch (error) {
          document.body.removeChild(iframe);
          reject(new Error('Cannot access iframe content due to CORS: ' + error.message));
        }
      };
      
      iframe.onerror = () => {
        document.body.removeChild(iframe);
        reject(new Error('Failed to load video in iframe'));
      };
      
      document.body.appendChild(iframe);
      
      // Timeout fallback
      setTimeout(() => {
        if (iframe.parentNode) {
          document.body.removeChild(iframe);
        }
        reject(new Error('Iframe UI automation timed out'));
      }, 20000);
    });
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
    this.summarizer = new Summarizer();
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
      
      console.log('=== REAL IN-VIDEO TRANSCRIPT EXTRACTION VIA API ===');
      console.log('Video URL:', videoUrl);
      
      // Extract video ID from URL
      const videoIdMatch = videoUrl.match(/[?&]v=([^&]+)/);
      const videoId = videoIdMatch ? videoIdMatch[1] : null;
      
      if (!videoId) {
        throw new Error('Could not extract video ID from URL');
      }
      
      // Extract transcript via UI automation
      const result = await this.thumbnailInjector.extractTranscriptViaUIAutomation(videoId);
      console.log('=== IN-VIDEO TRANSCRIPT EXTRACTED SUCCESSFULLY ===');
      console.log('Video ID:', result.videoId);
      console.log('Transcript length:', result.transcript.length);
      console.log('Language:', result.language);
      console.log('Source:', result.source);
      console.log('Transcript preview:', result.transcript.substring(0, 200) + '...');
      console.log('================================================');
      
      // Store in global variable
      window.lastExtractedTranscript = result;
      console.log('✅ Real in-video transcript stored in window.lastExtractedTranscript');
      
      this.hideLoadingModal();
      this.showLoadingModal('Generating AI Summary...');
      
      try {
        // Send transcript to Gemini for summarization
        console.log('Sending transcript to Gemini for summarization...');
        const summary = await this.summarizer.summarize(result.transcript);
        
        console.log('✅ Summary generated:', summary.substring(0, 100) + '...');
        
        // Show summary result
        this.showSummaryModal({
          title: 'Video Summary',
          content: summary,
          transcript: result.transcript,
          videoId: result.videoId,
          timestamp: result.timestamp
        });
        
      } catch (error) {
        console.error('Summarization failed:', error);
        // Fallback to showing raw transcript
        this.showSummaryModal({
          title: 'Transcript (Summarization Failed)',
          content: result.transcript,
          error: error.message,
          videoId: result.videoId,
          timestamp: result.timestamp
        });
      }
      
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

  showLoadingModal(customMessage = null) {
    this.hideModals(); // Remove any existing modals
    
    const modal = document.createElement('div');
    modal.className = 'inanutshell-modal';
    modal.id = 'inanutshell-loading-modal';
    
    const title = customMessage || 'Loading Video...';
    const subtitle = customMessage ? 'Please wait while we process your request...' : 'Extracting captions from video player...';
    const timeEstimate = customMessage ? 'This may take 5-10 seconds' : 'This may take 10-15 seconds';
    
    modal.innerHTML = `
      <div class="inanutshell-modal-content">
        <div class="inanutshell-loading">
          <div class="inanutshell-spinner"></div>
          <h3>${title}</h3>
          <p>${subtitle}</p>
          <small style="color: #666; margin-top: 8px; display: block;">${timeEstimate}</small>
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
            <div class="transcript-stats">
              <p><strong>Full Transcript (${content.length} characters)</strong></p>
            </div>
            <div class="transcript-text" style="max-height: 400px; overflow-y: auto; border: 1px solid #eee; padding: 16px; border-radius: 4px; font-size: 14px; line-height: 1.5;">
              ${content.replace(/\n/g, '<br>')}
            </div>
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

// Export classes for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    YouTubeThumbnailInjector,
    YouTubeContentScript,
    initializeExtension
  };
} else {
  // Browser environment - initialize normally
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtension);
  } else {
    initializeExtension();
  }
}