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
      alert('Please navigate to a YouTube video');
      return;
    }

    try {
      // Show loading state
      this.showLoadingModal();
      
      // Extract transcript and summarize
      const transcript = await this.youtubeAPI.extractTranscript(videoUrl);
      // TODO: Add summarization logic
      
      this.showSummaryModal('Summary will appear here');
    } catch (error) {
      console.error('Summarization failed:', error);
      alert('Failed to summarize video. Please try again.');
    }
  }

  showLoadingModal() {
    // TODO: Implement loading modal
    console.log('Loading...');
  }

  showSummaryModal(summary) {
    // TODO: Implement summary modal
    console.log('Summary:', summary);
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