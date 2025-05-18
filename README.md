# Whisper Transcription App

A simple web application that uses OpenAI's Whisper API to transcribe audio recordings in real-time. Built with React and Tailwind CSS, with Progressive Web App (PWA) support.

## Features

- Real-time audio recording
- Transcription using OpenAI's Whisper API
- Secure API key storage
- Copy to clipboard functionality
- Transcription history (last 5 transcriptions)
- Responsive design for desktop and mobile
- Progressive Web App (PWA) support for desktop installation
- Offline UI access (requires internet for transcription)

## Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- An OpenAI API key with access to the Whisper API
- Microphone access on your device

## Setup

### Local Development
1. Clone this repository or download the files
2. Run `bash build.sh` to set up the PWA assets
3. Run `npm start` to start the local server
4. Open `http://localhost:3000` in a web browser
5. Enter your OpenAI API key when prompted
6. Allow microphone access when requested

### Vercel Deployment
1. Install the Vercel CLI: `npm install -g vercel`
2. Run `vercel login` to authenticate
3. Run `vercel` to deploy to preview
4. Run `vercel --prod` to deploy to production

## Usage

1. Click the "Record Audio" button to start recording
2. Speak into your microphone
3. Click "Stop Recording" when finished
4. Wait for the transcription to complete
5. Use the "Copy to Clipboard" button to copy the transcribed text

## Installing as a Desktop App (PWA)

1. Open the deployed app in Chrome or Edge
2. Look for the "Install App" button in the bottom-left corner
3. Click "Install" when prompted
4. The app will be installed and can be launched from your desktop or start menu

## Security

- Your API key is encrypted and stored locally in your browser
- Audio is processed locally and only sent to OpenAI's API
- No data is stored on any server

## Limitations

- Maximum recording duration: 5 minutes
- Requires an active internet connection for transcription
- Requires a valid OpenAI API key
- Browser must support Web Audio API and Clipboard API

## Browser Support

- Chrome (recommended for PWA installation)
- Edge (supports PWA installation)
- Firefox (limited PWA support)
- Safari (limited PWA support on desktop)

## Troubleshooting

### CSS not loading in Vercel deployment
- Check the Content Security Policy in vercel.json
- Verify Tailwind CSS is properly included via CDN
- Clear your browser cache or try an incognito window

### PWA not installing
- Make sure you're using Chrome or Edge on desktop
- Check that all PWA assets are properly served (manifest.json, icons, service worker)
- Ensure the app is being served over HTTPS

## Privacy

This application:
- Does not store your audio recordings
- Only sends audio to OpenAI's API for transcription
- Stores your API key locally and encrypted
- Keeps transcription history only in your browser

## License

MIT License 