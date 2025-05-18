# CSP Violation Fix Instructions

These instructions will help you fix the Content Security Policy (CSP) violations that are causing blank pages on reload.

## Problem Summary
Your app is experiencing the following issues:
- Blank white page on browser reload
- CSP violations blocking CDN resources
- Error messages like: `Refused to connect to 'https://cdn.tailwindcss.com/' because it violates the following Content Security Policy directive`
- Resources failing to load with `net::ERR_FAILED`

## Manual Fix Instructions

### Step 1: Update the CSP in vercel.json
1. Open `vercel.json` in a text editor
2. Find all sections containing `"key": "Content-Security-Policy"`
3. Replace the corresponding `"value"` with:
```
"value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.jsdelivr.net https://cdn.tailwindcss.com; style-src 'self' 'unsafe-inline' https://unpkg.com https://cdn.tailwindcss.com; connect-src 'self' https://api.openai.com https://cdn.jsdelivr.net https://cdn.tailwindcss.com; img-src 'self' data:; manifest-src 'self';"
```
4. Save the file

### Step 2: Update the CSP in index.html
1. Open `index.html` in a text editor
2. Find the line containing `<meta http-equiv="Content-Security-Policy" content="`
3. Replace the entire meta tag with:
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.jsdelivr.net https://cdn.tailwindcss.com; style-src 'self' 'unsafe-inline' https://unpkg.com https://cdn.tailwindcss.com; connect-src 'self' https://api.openai.com https://cdn.jsdelivr.net https://cdn.tailwindcss.com; img-src 'self' data:; manifest-src 'self';">
```
4. Save the file

### Step 3: Update Service Worker Cache Version
1. Open `sw.js` in a text editor
2. Find the line that starts with `const CACHE_NAME = `
3. Change it to:
```javascript
const CACHE_NAME = 'speech-to-text-v4';
```
4. Save the file

### Step 4: Deploy the Changes
1. Deploy your updated files to Vercel using the Vercel CLI:
```bash
vercel --prod
```
   If you don't have the Vercel CLI, you can install it with:
```bash
npm install -g vercel
```
   Or deploy through the Vercel dashboard by uploading the updated files

### Step 5: Clear Browser Cache and Service Workers
After deployment, if you still see issues:

1. Visit `/recover.html` on your deployed site (e.g., https://your-app.vercel.app/recover.html)
2. Click the "Clear Cache & Reload" button
3. Alternatively, in your browser:
   - Open Developer Tools (F12 or Right-click > Inspect)
   - Go to Application tab > Clear Storage
   - Check all boxes and click "Clear site data"
   - Then go to Application > Service Workers
   - Click "Unregister" for any service workers listed

## What These Changes Do
1. Updates the CSP to allow connections to CDN domains
2. Increments the service worker cache version to force a refresh
3. Clears old caches that may contain problematic resources

The key addition is allowing `cdn.jsdelivr.net` and `cdn.tailwindcss.com` in the `connect-src` directive, which was previously missing.

## Verification
To verify that your changes have fixed the issue:
1. Open your app in a private/incognito window
2. Reload the page multiple times
3. Check the browser console (F12 > Console) for any remaining CSP errors
4. If any errors persist, make sure all CSP headers have been properly updated

## Need Further Help?
If you're still experiencing issues:
1. Check the browser console for specific error messages
2. Verify that all CSP headers match exactly as shown above
3. Try adding a recovery page with the functionality described in Step 5 