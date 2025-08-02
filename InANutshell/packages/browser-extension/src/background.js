// Background service worker for browser extension

// YouTube API configuration
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

chrome.runtime.onInstalled.addListener(() => {
  console.log("InANutshell extension installed");

  // Check if API key is configured
  if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === "your_youtube_api_key_here") {
    console.warn(
      "YouTube API key not configured. Please set YOUTUBE_API_KEY in .env file"
    );
  } else {
    console.log("YouTube API key loaded successfully");
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "EXTRACT_TRANSCRIPT") {
    extractTranscript(message.videoId)
      .then((transcript) => sendResponse({ success: true, transcript }))
      .catch((error) => sendResponse({ success: false, error: error.message }));

    return true; // Keep message channel open for async response
  }
});

async function extractTranscript(videoId) {
  try {
    console.log("Extracting transcript for video:", videoId);

    // Step 1: Get available captions for the video
    const captionsResponse = await fetch(
      `${YOUTUBE_API_BASE}/captions?part=snippet&videoId=${videoId}&key=${YOUTUBE_API_KEY}`
    );

    if (!captionsResponse.ok) {
      throw new Error(
        `Failed to get captions list: ${captionsResponse.status}`
      );
    }

    const captionsData = await captionsResponse.json();
    console.log("Available captions:", captionsData);

    if (!captionsData.items || captionsData.items.length === 0) {
      throw new Error("No captions available for this video");
    }

    // Step 2: Find the best caption track (prefer auto-generated English)
    let bestCaption =
      captionsData.items.find(
        (item) =>
          item.snippet.language === "en" && item.snippet.trackKind === "asr"
      ) ||
      captionsData.items.find((item) => item.snippet.language === "en") ||
      captionsData.items[0]; // Fallback to first available

    console.log("Selected caption track:", bestCaption);

    // Step 3: Download the caption content
    const captionResponse = await fetch(
      `${YOUTUBE_API_BASE}/captions/${bestCaption.id}?key=${YOUTUBE_API_KEY}&fmt=srv1`
    );

    if (!captionResponse.ok) {
      throw new Error(`Failed to download captions: ${captionResponse.status}`);
    }

    const captionText = await captionResponse.text();
    console.log("Raw caption data:", captionText.substring(0, 200) + "...");

    // Step 4: Parse and clean the transcript
    const cleanTranscript = parseTranscript(captionText);

    return {
      videoId: videoId,
      transcript: cleanTranscript,
      timestamp: new Date().toISOString(),
      source: "youtube-api",
      language: bestCaption.snippet.language,
    };
  } catch (error) {
    console.error("Transcript extraction failed:", error);
    throw error;
  }
}

function parseTranscript(rawCaptions) {
  try {
    // Parse XML-style caption format and extract text
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(rawCaptions, "text/xml");

    // Extract text from all text nodes
    const textNodes = xmlDoc.querySelectorAll("text");
    const transcriptParts = Array.from(textNodes)
      .map((node) => node.textContent.trim())
      .filter((text) => text.length > 0);

    // Join and clean up the transcript
    const transcript = transcriptParts
      .join(" ")
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .replace(/\n+/g, " ") // Replace newlines with spaces
      .trim();

    console.log("Parsed transcript length:", transcript.length);
    return transcript;
  } catch (error) {
    console.error("Failed to parse transcript:", error);
    // Fallback: return raw text with basic cleanup
    return rawCaptions
      .replace(/<[^>]*>/g, " ") // Remove XML tags
      .replace(/\s+/g, " ") // Clean up spaces
      .trim();
  }
}
