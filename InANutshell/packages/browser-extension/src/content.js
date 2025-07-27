// Content script that runs on YouTube pages
import { YouTubeAPI, isValidYouTubeUrl } from '@inanutshell/shared';

class YouTubeContentScript {
  constructor() {
    this.youtubeAPI = new YouTubeAPI();
    this.init();
  }

  init() {
    // Add InANutshell button to YouTube page
    this.addSummarizeButton();
    
    // Listen for URL changes (YouTube is SPA)
    this.watchForUrlChanges();
  }

  addSummarizeButton() {
    // Find YouTube's action buttons container
    const actionsContainer = document.querySelector('#actions');
    if (!actionsContainer) return;

    // Create our summarize button
    const button = document.createElement('button');
    button.innerHTML = '🥜 Summarize';
    button.className = 'inanutshell-summarize-btn';
    button.onclick = () => this.handleSummarize();

    actionsContainer.appendChild(button);
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
      
      // Check if transcript is available
      const isAvailable = await this.youtubeAPI.isTranscriptAvailable();
      if (!isAvailable) {
        throw new Error('No transcript available for this video');
      }
      
      // Extract transcript
      console.log('Extracting transcript from:', videoUrl);
      const result = await this.youtubeAPI.extractTranscript(videoUrl);
      
      console.log('Transcript extracted:', {
        videoId: result.videoId,
        length: result.transcript.length,
        preview: result.transcript.substring(0, 100) + '...'
      });
      
      // For now, show the transcript (TODO: Add AI summarization)
      this.showSummaryModal({
        title: 'Transcript Extracted Successfully',
        content: result.transcript,
        videoId: result.videoId,
        timestamp: result.timestamp
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
        setTimeout(() => this.addSummarizeButton(), 1000);
      }
    }, 1000);
  }
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new YouTubeContentScript());
} else {
  new YouTubeContentScript();
}