#!/bin/bash

# Create public directory if it doesn't exist
mkdir -p public

# Copy core files to public directory
cp -r index.html app.js styles.css manifest.json sw.js public/

# Create icon directory if it doesn't exist
mkdir -p icons

# Create a simple microphone icon SVG
echo "Creating a simple microphone icon..."
cat > icons/icon.svg << 'EOL'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3b82f6">
  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
</svg>
EOL

# Check if ImageMagick is installed for icon conversion
if command -v convert >/dev/null 2>&1; then
  echo "Converting SVG to PNG icons using ImageMagick..."
  convert -background none icons/icon.svg -resize 192x192 public/icon-192x192.png
  convert -background none icons/icon.svg -resize 512x512 public/icon-512x512.png
  echo "PWA icons created successfully."
else
  echo "ImageMagick not found. Manual steps to create icons:"
  echo "1. Open icons/icon.svg in a browser"
  echo "2. Screenshot or save as PNG"
  echo "3. Resize to 192x192 and 512x512 pixels"
  echo "4. Save as public/icon-192x192.png and public/icon-512x512.png"
  
  # Create placeholder text files to remind the user
  echo "PWA icon - resize to 192x192px" > public/icon-192x192.png.txt
  echo "PWA icon - resize to 512x512px" > public/icon-512x512.png.txt
fi

# Update package.json's build script to include PWA assets
if grep -q "manifest.json" package.json; then
  echo "package.json already updated to include PWA assets"
else
  echo "Updating package.json build script to include PWA assets..."
  sed -i.bak 's/"build": "mkdir -p public && cp -r index.html app.js styles.css public\/"/"build": "mkdir -p public \&\& cp -r index.html app.js styles.css manifest.json sw.js public\/ \&\& bash build.sh"/' package.json
  rm package.json.bak
fi

# Done
echo "Build completed. PWA assets prepared in public/ directory."
echo "To deploy to Vercel, run: vercel --prod" 