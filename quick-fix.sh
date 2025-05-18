#!/bin/bash
set -e

echo "====== Quick Fix for CSP Violations ======"
echo "This script will fix CSP violations and redeploy the app"

# Create or update the update-headers.js script if it doesn't exist
if [ ! -f "update-headers.js" ]; then
  echo "Creating update-headers.js script..."
  cat > update-headers.js << 'EOL'
const fs = require('fs');
const path = require('path');

// Define the correct CSP for all resources
const correctCSP = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.jsdelivr.net https://cdn.tailwindcss.com; style-src 'self' 'unsafe-inline' https://unpkg.com https://cdn.tailwindcss.com; connect-src 'self' https://api.openai.com https://cdn.jsdelivr.net https://cdn.tailwindcss.com; img-src 'self' data:; manifest-src 'self';";

// Path to vercel.json
const vercelJsonPath = path.join(__dirname, 'vercel.json');

try {
  // Read the vercel.json file
  const vercelJson = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
  let updated = false;

  // Update CSP in each header configuration
  if (vercelJson.headers) {
    vercelJson.headers.forEach(headerConfig => {
      if (headerConfig.headers) {
        headerConfig.headers.forEach(header => {
          if (header.key === 'Content-Security-Policy') {
            if (header.value !== correctCSP) {
              header.value = correctCSP;
              updated = true;
              console.log(`Updated CSP for source: ${headerConfig.source}`);
            }
          }
        });
      }
    });
  }

  // Save changes if any updates were made
  if (updated) {
    fs.writeFileSync(vercelJsonPath, JSON.stringify(vercelJson, null, 2));
    console.log('Successfully updated vercel.json with the correct CSP headers.');
  } else {
    console.log('CSP headers in vercel.json are already up to date.');
  }
  
  // Now check index.html too
  const indexHtmlPath = path.join(__dirname, 'index.html');
  let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  
  // Find the CSP meta tag and update it if needed
  const cspRegex = /<meta http-equiv="Content-Security-Policy" content="([^"]+)">/;
  const match = indexHtml.match(cspRegex);
  
  if (match && match[1] !== correctCSP) {
    indexHtml = indexHtml.replace(cspRegex, `<meta http-equiv="Content-Security-Policy" content="${correctCSP}">`);
    fs.writeFileSync(indexHtmlPath, indexHtml);
    console.log('Successfully updated CSP in index.html.');
  } else if (match) {
    console.log('CSP in index.html is already up to date.');
  } else {
    console.log('No CSP meta tag found in index.html.');
  }
  
} catch (error) {
  console.error('Error updating CSP headers:', error);
  process.exit(1);
}
EOL
fi

# Update service worker version number
echo "Updating service worker cache version..."
sed -i.bak 's/const CACHE_NAME = .*/const CACHE_NAME = '\''speech-to-text-v4'\'';/' sw.js
rm -f sw.js.bak

# Run the update-headers script
echo "Updating CSP headers..."
node update-headers.js

# Create a simple package.json if it doesn't exist
if [ ! -f "package.json" ]; then
  echo "Creating basic package.json..."
  cat > package.json << 'EOL'
{
  "name": "whisper-transcription-app",
  "version": "1.0.0",
  "description": "A speech-to-text transcription app using OpenAI's Whisper API",
  "main": "app.js",
  "scripts": {
    "start": "serve public",
    "build": "bash build.sh",
    "deploy": "bash deploy.sh",
    "update-headers": "node update-headers.js",
    "fix-csp": "node update-headers.js && vercel --prod"
  }
}
EOL
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  echo "Vercel CLI not found. Please install it with: npm install -g vercel"
  echo "After installing, run: vercel --prod"
  exit 1
fi

# Confirm deployment
read -p "Do you want to deploy the fixed version to Vercel now? (y/n) " choice
case "$choice" in 
  y|Y ) 
    echo "Deploying to Vercel..."
    vercel --prod
    echo "Deployment complete!"
    ;;
  * ) 
    echo "Skipping deployment."
    echo "To deploy manually, run: vercel --prod"
    ;;
esac

echo ""
echo "====== Fix Complete ======"
echo "The CSP headers have been updated. If you skipped deployment,"
echo "make sure to deploy the changes to fix the issues."
echo ""
echo "If you still experience issues:"
echo "1. Visit /recover.html on your deployed site to clear cache"
echo "2. Or, run this script again and select 'y' to deploy" 