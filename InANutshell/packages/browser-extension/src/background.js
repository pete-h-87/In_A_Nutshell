// Background service worker for browser extension

chrome.runtime.onInstalled.addListener(() => {
  console.log("InANutshell extension installed - Using UI automation approach");
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "EXTRACT_TRANSCRIPT") {
    // Simple response - UI automation will be handled in content script
    sendResponse({ success: true, message: "Ready for UI automation" });
    return true;
  }
});
