#!/bin/bash
set -e

# Ensure output directory exists
mkdir -p public

# Copy all necessary files to the public directory
echo "Copying files to public directory..."
cp -f index.html public/
cp -f app.js public/
cp -f styles.css public/
cp -f manifest.json public/
cp -f sw.js public/

# Copy icons to public directory
echo "Copying icons..."
if [ -d "icons" ]; then
  cp -r icons/* public/
else
  echo "No icons directory found, skipping..."
fi

# Create a simple recover page
echo "Creating recovery page..."
cat > public/recover.html << EOL
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recovery - Whisper Transcription App</title>
    <style>
        body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            text-align: center;
        }
        h1 {
            color: #3b82f6;
        }
        button {
            background-color: #3b82f6;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 10px;
        }
        .error {
            background-color: #fee2e2;
            border-left: 4px solid #ef4444;
            padding: 10px;
            margin: 20px 0;
            text-align: left;
        }
    </style>
</head>
<body>
    <h1>Whisper Transcription App - Recovery</h1>
    <p>This page helps recover from common issues with the app.</p>
    
    <div class="error">
        <p><strong>Problem:</strong> Blank page or loading issues after app update.</p>
    </div>
    
    <p>Click the button below to clear cache and service workers:</p>
    
    <button id="clearBtn">Clear Cache & Reload</button>
    
    <script>
        document.getElementById('clearBtn').addEventListener('click', async () => {
            try {
                // Unregister service workers
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (let registration of registrations) {
                        await registration.unregister();
                        console.log('Service worker unregistered');
                    }
                }
                
                // Clear caches
                if ('caches' in window) {
                    const cacheNames = await caches.keys();
                    await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
                    console.log('Caches cleared');
                }
                
                // Reload the main page
                window.location.href = '/';
            } catch (error) {
                console.error('Recovery failed:', error);
                alert('Recovery failed: ' + error.message);
            }
        });
    </script>
</body>
</html>
EOL

# Run update-headers script to ensure proper CSP configuration
echo "Updating content security policy headers..."
node update-headers.js

echo "Build completed successfully!" 