# Emergency Recovery Guide for Whisper Transcription App

If you're experiencing a blank page or "The app is having trouble loading" message, use one of the following recovery methods to fix the issue:

## Quick Recovery URLs

Try accessing these URLs directly to bypass the issue:

1. **Direct Bypass Link (Recommended)**: 
   - [https://your-app-url/bypass.html](https://your-app-url/bypass.html)

2. **Emergency Mode**: 
   - [https://your-app-url/emergency.html](https://your-app-url/emergency.html)

3. **Recovery Page**:
   - [https://your-app-url/recover.html](https://your-app-url/recover.html)

## Manual Steps

If the links above don't resolve the issue:

1. Open your browser's Developer Tools (F12 or right-click > Inspect)
2. Go to Application tab > Storage > Clear Site Data
3. After clearing, try accessing the app again

## Root Cause

The issue is caused by Content Security Policy (CSP) violations that prevent the app from loading CDN resources. The fix involves:

1. Updating CSP headers to allow connections to cdn.jsdelivr.net and cdn.tailwindcss.com
2. Bypassing the service worker that might be caching problematic responses
3. Clearing any stale caches

## For Developers

If you're the developer maintaining this app:

1. Run: `vercel --prod` to deploy the latest fixes
2. Or execute: `bash quick-fix.sh` to apply the CSP fixes and redeploy

### Technical Details

The CSP needs to include these critical domains in connect-src directive:

```
connect-src 'self' https://api.openai.com https://cdn.jsdelivr.net https://cdn.tailwindcss.com
```

If you've already deployed the fix but users are still experiencing issues, direct them to the bypass.html page which will:
- Unregister service workers
- Clear caches
- Set the correct CSP in localStorage
- Bypass service worker registration 