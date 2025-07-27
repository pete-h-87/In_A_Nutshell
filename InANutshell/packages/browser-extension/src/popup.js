// Popup script for browser extension
document.addEventListener('DOMContentLoaded', async () => {
  const summarizeBtn = document.getElementById('summarizeBtn');
  const status = document.getElementById('status');

  // Check if current tab is YouTube
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const isYouTube = tab.url.includes('youtube.com/watch');

  if (isYouTube) {
    status.textContent = 'Ready to summarize!';
    summarizeBtn.disabled = false;
  } else {
    status.textContent = 'Please navigate to a YouTube video';
    summarizeBtn.disabled = true;
  }

  summarizeBtn.addEventListener('click', async () => {
    if (!isYouTube) return;

    summarizeBtn.textContent = 'Summarizing...';
    summarizeBtn.disabled = true;
    status.textContent = 'Processing video transcript...';

    try {
      // Send message to content script
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'SUMMARIZE_VIDEO',
        videoUrl: tab.url
      });

      if (response.success) {
        status.textContent = 'Summary ready!';
        // TODO: Display summary in popup or open modal
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      status.textContent = 'Failed to summarize video';
      console.error('Summarization error:', error);
    } finally {
      summarizeBtn.textContent = 'Summarize Current Video';
      summarizeBtn.disabled = false;
    }
  });
});