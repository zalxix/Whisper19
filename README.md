# Whisper Transcription App

A simple web application that uses OpenAI's Whisper API to transcribe audio recordings in real-time. Built with React and Tailwind CSS.

## Features

- Real-time audio recording
- Transcription using OpenAI's Whisper API
- Secure API key storage
- Copy to clipboard functionality
- Transcription history (last 5 transcriptions)
- Responsive design for desktop and mobile

## Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- An OpenAI API key with access to the Whisper API
- Microphone access on your device

## Setup

1. Clone this repository or download the files
2. Open `index.html` in a web browser
3. Enter your OpenAI API key when prompted
4. Allow microphone access when requested

## Usage

1. Click the "Record Audio" button to start recording
2. Speak into your microphone
3. Click "Stop Recording" when finished
4. Wait for the transcription to complete
5. Use the "Copy to Clipboard" button to copy the transcribed text

## Security

- Your API key is encrypted and stored locally in your browser
- Audio is processed locally and only sent to OpenAI's API
- No data is stored on any server

## Limitations

- Maximum recording duration: 5 minutes
- Requires an active internet connection
- Requires a valid OpenAI API key
- Browser must support Web Audio API and Clipboard API

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Privacy

This application:
- Does not store your audio recordings
- Only sends audio to OpenAI's API for transcription
- Stores your API key locally and encrypted
- Keeps transcription history only in your browser

## License

MIT License 