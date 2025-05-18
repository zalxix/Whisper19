// This is a recovery script that can be used to fix a blank page issue.
// If the app is showing a blank page, access this with:
// https://speech-to-text-app.vercel.app/recover.js?fix=true

(function() {
  // Check if URL contains the 'fix' parameter
  if (window.location.search.includes('fix=true')) {
    console.log('Running recovery script...');
    
    // Helper function to create a simple UI
    function createRecoveryUI(message, autofix = false) {
      // Create a simple recovery UI
      document.body.innerHTML = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; border: 1px solid #ccc; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
          <h1 style="color: #3b82f6;">Speech-to-Text App Recovery</h1>
          <p>${message}</p>
          <div id="log" style="background: #f0f0f0; padding: 10px; border-radius: 4px; max-height: 200px; overflow: auto; margin: 10px 0; font-family: monospace;"></div>
          <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button id="fixBtn" style="background: #3b82f6; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; font-weight: bold;">Fix Now</button>
            <button id="clearBtn" style="background: #ef4444; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; font-weight: bold;">Clear All</button>
            <button id="homeBtn" style="background: #10b981; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; font-weight: bold;">Go to Home</button>
          </div>
        </div>
      `;
      
      // Helper function to log messages
      function log(message) {
        const logElement = document.getElementById('log');
        if (logElement) {
          logElement.innerHTML += `<div>${message}</div>`;
          logElement.scrollTop = logElement.scrollHeight;
        }
      }
      
      // Fix function to clear service workers and caches
      async function fixApp() {
        log('Starting recovery process...');
        
        // Step 1: Unregister service workers
        if ('serviceWorker' in navigator) {
          try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            log(`Found ${registrations.length} service worker(s)...`);
            
            for (let registration of registrations) {
              await registration.unregister();
              log(`Unregistered service worker: ${registration.scope}`);
            }
          } catch (err) {
            log(`Error unregistering service workers: ${err.message}`);
          }
        } else {
          log('Service Worker API not available in this browser');
        }
        
        // Step 2: Clear caches
        if ('caches' in window) {
          try {
            const cacheNames = await caches.keys();
            log(`Found ${cacheNames.length} cache(s)...`);
            
            for (let cacheName of cacheNames) {
              await caches.delete(cacheName);
              log(`Deleted cache: ${cacheName}`);
            }
          } catch (err) {
            log(`Error clearing caches: ${err.message}`);
          }
        } else {
          log('Cache API not available in this browser');
        }
        
        log('Recovery completed successfully.');
        log('You can now return to the app by clicking "Go to Home".');
      }
      
      // Attach event listeners
      document.getElementById('fixBtn').addEventListener('click', fixApp);
      
      document.getElementById('clearBtn').addEventListener('click', () => {
        log('Clearing all stored data...');
        try {
          localStorage.clear();
          log('LocalStorage cleared');
          
          if (indexedDB && indexedDB.databases) {
            indexedDB.databases().then(databases => {
              databases.forEach(db => {
                indexedDB.deleteDatabase(db.name);
                log(`IndexedDB database deleted: ${db.name}`);
              });
            });
          } else {
            log('IndexedDB.databases() not available in this browser');
          }
          
          log('All stored data cleared successfully');
        } catch (err) {
          log(`Error clearing data: ${err.message}`);
        }
      });
      
      document.getElementById('homeBtn').addEventListener('click', () => {
        window.location.href = '/';
      });
      
      // Automatically run fix if requested
      if (autofix) {
        log('Auto-fix enabled. Running recovery automatically...');
        setTimeout(fixApp, 500);
      }
    }
    
    // Create the recovery UI
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      createRecoveryUI('The recovery tool will fix blank page issues by clearing service worker caches.', false);
    } else {
      window.addEventListener('DOMContentLoaded', () => {
        createRecoveryUI('The recovery tool will fix blank page issues by clearing service worker caches.', false);
      });
    }
  } else {
    console.log('Recovery script loaded but not activated. Add ?fix=true to URL to run recovery.');
  }
})(); 