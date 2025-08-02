// YouTube transcript extraction via DOM manipulation
class YouTubeAPI {
  constructor() {
    this.transcriptSelectors = {
      moreButton: '.yt-spec-button-shape-next--text, [data-testid="expand"], #expand, [aria-label*="more"], [aria-label*="Show more"]',
      transcriptButton: '[aria-label="Show transcript"], [aria-label*="transcript" i], .yt-spec-button-shape-next[aria-label*="transcript" i]',
      transcriptPanel: '#segments-container, [data-testid="transcript"], .ytd-transcript-segment-list-renderer, #transcript',
      transcriptSegments: '.ytd-transcript-segment-renderer, [data-testid="transcript-segment"], .segment',
      transcriptText: '.segment-text, .ytd-transcript-segment-renderer .text, .segment-text'
    };
    this.maxRetries = 5;
    this.retryDelay = 1000;
  }

  async extractTranscript(videoUrl) {
    try {
      const videoId = this.parseVideoId(videoUrl);
      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }

      // Check if we're on the correct video page
      if (!window.location.href.includes(videoId)) {
        throw new Error('Not on the correct video page');
      }

      // Step 1: Click "Show more" to expand description
      await this.clickShowMore();
      
      // Step 2: Click "Show transcript" button
      await this.clickTranscriptButton();
      
      // Step 3: Wait for transcript panel to load
      await this.waitForTranscriptPanel();
      
      // Step 4: Extract transcript text
      const transcript = await this.extractTranscriptText();
      
      return {
        videoId,
        transcript,
        timestamp: new Date().toISOString(),
        source: 'youtube-dom'
      };
    } catch (error) {
      console.error('Transcript extraction failed:', error);
      throw new Error(`Failed to extract transcript: ${error.message}`);
    }
  }

  async clickShowMore() {
    return this.retryAction(async () => {
      const moreButton = document.querySelector(this.transcriptSelectors.moreButton);
      if (moreButton && !moreButton.getAttribute('aria-expanded')) {
        moreButton.click();
        await this.delay(500);
        return true;
      }
      return true; // Already expanded or not needed
    }, 'clicking show more button');
  }

  async clickTranscriptButton() {
    return this.retryAction(async () => {
      // Try multiple selectors for transcript button
      const selectors = [
        '[aria-label*="transcript" i]',
        '[aria-label*="Show transcript" i]',
        'button:has-text("Show transcript")',
        'button:has-text("Transcript")',
        '.style-scope.ytd-video-secondary-info-renderer button[aria-label*="transcript" i]'
      ];

      for (const selector of selectors) {
        const button = document.querySelector(selector);
        if (button && button.offsetParent !== null) { // Check if visible
          button.click();
          await this.delay(1000);
          return true;
        }
      }
      
      throw new Error('Transcript button not found or not visible');
    }, 'clicking transcript button');
  }

  async waitForTranscriptPanel() {
    return this.retryAction(async () => {
      const panel = document.querySelector(this.transcriptSelectors.transcriptPanel);
      if (panel && panel.offsetParent !== null) {
        // Wait for content to load
        await this.delay(1000);
        const segments = panel.querySelectorAll(this.transcriptSelectors.transcriptSegments);
        if (segments.length > 0) {
          return true;
        }
      }
      throw new Error('Transcript panel not loaded');
    }, 'waiting for transcript panel');
  }

  async extractTranscriptText() {
    const panel = document.querySelector(this.transcriptSelectors.transcriptPanel);
    if (!panel) {
      throw new Error('Transcript panel not found');
    }

    // Try different methods to extract text
    const segments = panel.querySelectorAll(this.transcriptSelectors.transcriptSegments);
    let transcript = '';

    if (segments.length > 0) {
      // Method 1: Extract from individual segments
      segments.forEach(segment => {
        const textElement = segment.querySelector(this.transcriptSelectors.transcriptText) || segment;
        const text = textElement.textContent || textElement.innerText;
        if (text && !text.includes(':')) { // Skip timestamps
          transcript += text.trim() + ' ';
        }
      });
    } else {
      // Method 2: Extract all text from panel
      transcript = panel.textContent || panel.innerText;
    }

    // Clean up transcript
    transcript = this.cleanTranscript(transcript);
    
    if (!transcript || transcript.length < 50) {
      throw new Error('Transcript appears to be empty or too short');
    }

    return transcript;
  }

  cleanTranscript(text) {
    return text
      // Remove timestamps (00:00, 0:00, etc.)
      .replace(/\d{1,2}:\d{2}/g, '')
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      // Remove leading/trailing whitespace
      .trim()
      // Remove common transcript artifacts
      .replace(/\[Music\]/gi, '')
      .replace(/\[Applause\]/gi, '')
      .replace(/\[Laughter\]/gi, '');
  }

  async retryAction(action, actionName) {
    for (let i = 0; i < this.maxRetries; i++) {
      try {
        const result = await action();
        return result;
      } catch (error) {
        console.log(`Attempt ${i + 1} failed for ${actionName}:`, error.message);
        if (i === this.maxRetries - 1) {
          throw error;
        }
        await this.delay(this.retryDelay);
      }
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  parseVideoId(url) {
    // Extract video ID from YouTube URL
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  // Check if transcript is available for current video
  async isTranscriptAvailable() {
    try {
      await this.clickShowMore();
      const transcriptButton = document.querySelector(this.transcriptSelectors.transcriptButton);
      return transcriptButton && transcriptButton.offsetParent !== null;
    } catch {
      return false;
    }
  }
}

export default YouTubeAPI;