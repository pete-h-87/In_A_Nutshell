// Background service worker for browser extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('InANutshell extension installed');
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SUMMARIZE_VIDEO') {
    handleVideoSummarization(message.videoUrl)
      .then(summary => sendResponse({ success: true, summary }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    
    return true; // Keep message channel open for async response
  }
});

async function handleVideoSummarization(videoUrl) {
  // Background processing for video summarization
  // This will integrate with shared utilities
  return 'Summary processing in background...';
}