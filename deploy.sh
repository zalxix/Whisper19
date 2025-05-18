#!/bin/bash
set -e

echo "====== Speech-to-Text Transcription App Deployment ======"
echo "This script prepares and deploys the app to Vercel"

# Run the update-headers script to ensure CSP headers are correct
echo "Step 1: Updating Content Security Policy headers..."
node update-headers.js

# Run the build script to prepare files
echo "Step 2: Building application..."
bash build.sh

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo "Step 3: Validating CSP headers in key files..."
# Check if CSP headers are correctly set in vercel.json
if grep -q "cdn.jsdelivr.net https://cdn.tailwindcss.com" vercel.json; then
    echo "✓ CSP headers in vercel.json are correct"
else
    echo "⚠️ CSP headers in vercel.json might be incorrect. Running update-headers.js again..."
    node update-headers.js
fi

# Check if CSP headers are correctly set in index.html
if grep -q "cdn.jsdelivr.net https://cdn.tailwindcss.com" index.html; then
    echo "✓ CSP headers in index.html are correct"
else
    echo "⚠️ CSP headers in index.html might be incorrect. Running update-headers.js again..."
    node update-headers.js
fi

echo "Step 4: Deploying to Vercel..."
vercel deploy --prod

echo "====== Deployment complete! ======"
echo "If you encounter any issues:"
echo "1. Visit the recovery page at: /recover.html"
echo "2. Or run 'npm run update-headers' to fix CSP issues"
echo "3. Then redeploy with 'npm run deploy'" 