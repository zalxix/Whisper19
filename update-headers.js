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