# Testing the InANutshell Browser Extension

## How to Test Locally

### 1. Load Extension in Chrome/Edge
1. Open Chrome/Edge and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `packages/browser-extension/` folder
5. Extension should appear in your extensions list

### 2. Test on YouTube
1. Go to any YouTube video with auto-generated captions
2. Look for the "🥜 Summarize" button near like/dislike buttons
3. Click the button to test transcript extraction

### 3. Good Test Videos
Try these types of videos for testing:
- **Tech talks/tutorials** - Usually have good auto-captions
- **News videos** - Clear speech, reliable transcripts
- **Educational content** - Good for testing longer transcripts

### 4. What to Expect
- **Loading modal** appears while extracting
- **Success**: Shows extracted transcript in modal
- **Error**: Shows error message if no transcript available

### 5. Debugging
- Open browser dev tools (F12)
- Check Console tab for logs and errors
- Look for messages like "Extracting transcript from:" and "Transcript extracted:"

### 6. Common Issues
- **No transcript button**: Video doesn't have auto-captions
- **Extraction fails**: YouTube UI might have changed
- **Button not appearing**: Extension might not be loaded

### 7. Browser Compatibility
- ✅ **Chrome** - Primary target
- ✅ **Edge** - Should work (Chromium-based)
- ⚠️ **Firefox** - May need manifest adjustments
- ⚠️ **Safari** - Would need separate version

## Next Steps After Testing
1. Fix any DOM selector issues found during testing
2. Add AI summarization service integration
3. Improve error handling and user feedback