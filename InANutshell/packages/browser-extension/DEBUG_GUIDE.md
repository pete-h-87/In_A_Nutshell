# InANutshell Extension Debug Guide

## Testing the Thumbnail Injection Feature

### 1. Load the Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Navigate to and select: `D:\CODING\ClaudeStuff\InANutshell\packages\browser-extension\dist`

### 2. Check Extension Loading
1. Go to YouTube (youtube.com)
2. Open Chrome DevTools (F12)
3. Go to Console tab
4. Look for these messages:
   ```
   InANutshell: Initializing extension...
   InANutshell: Extension initialized successfully
   InANutshell: Initializing thumbnail menu injection...
   ```

### 3. Test Thumbnail Buttons
1. On YouTube homepage, refresh the page
2. In console, look for messages like:
   ```
   InANutshell: Processing video renderer, videoId: [VIDEO_ID]
   InANutshell: Menu renderer found: true/false
   InANutshell: Added summary button to video: [VIDEO_ID]
   ```
   OR
   ```
   InANutshell: Added floating summary button to video: [VIDEO_ID]
   ```

### 4. What to Look For
- **If menu injection works**: You'll see 🥜 icons next to the three-dots menu on video thumbnails
- **If alternative injection works**: Hover over video thumbnails to see floating "🥜 Summarize" buttons appear in top-right corner
- **If neither works**: Check console for error messages

### 5. Test the Feature
1. Click on any 🥜 button (either in menu or floating)
2. Should see loading modal: "Extracting Transcript..."
3. Should work without opening the video!

### 6. Common Issues to Check
- Extension loaded successfully?
- Console showing initialization messages?
- Any JavaScript errors in console?
- YouTube layout changes (our selectors might need updating)

### 7. Alternative Testing
If thumbnail buttons don't appear:
1. Navigate to any YouTube video page
2. Look for the main "🥜 Summarize" button (this should always work)
3. This confirms the extension is working but thumbnail injection needs fixing

## Console Debug Commands
Run these in DevTools console for manual testing:

```javascript
// Check if extension classes exist
console.log(window.YouTubeContentScript);

// Count video renderers on page
console.log('Video renderers found:', document.querySelectorAll('ytd-video-renderer, ytd-rich-item-renderer').length);

// Check for three-dots menus
console.log('Menu renderers found:', document.querySelectorAll('ytd-menu-renderer').length);

// Check for our injected buttons
console.log('InANutshell buttons found:', document.querySelectorAll('.inanutshell-thumbnail-btn, .inanutshell-floating-btn').length);
```