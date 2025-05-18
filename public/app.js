// Utility functions
const encryptApiKey = (key) => {
    return CryptoJS.AES.encrypt(key, 'whisper-app-secret').toString();
};

const decryptApiKey = (encryptedKey) => {
    const bytes = CryptoJS.AES.decrypt(encryptedKey, 'whisper-app-secret');
    return bytes.toString(CryptoJS.enc.Utf8);
};

// Format time as MM:SS
const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Password Prompt Component
const PasswordPrompt = ({ onSuccess }) => {
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');
    const [attempts, setAttempts] = React.useState(0);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (password === '19vpnnetwork') {
            onSuccess();
            localStorage.setItem('sessionAuth', 'true');
        } else {
            setError('Incorrect password');
            setAttempts(prev => prev + 1);
            if (attempts >= 2) {
                setPassword(''); // Clear input after 3 failed attempts
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-white flex items-center justify-center">
            <div className="p-6 max-w-sm w-full">
                <h2 className="text-xl font-semibold mb-6 text-center">Enter Password</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 border rounded mb-4"
                        placeholder="Password"
                        autoComplete="off"
                        autoFocus
                    />
                    {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600"
                    >
                        Submit
                    </button>
                </form>
            </div>
        </div>
    );
};

// Settings Modal Component
const SettingsModal = ({ isOpen, onClose, onApiKeySet }) => {
    const [apiKey, setApiKey] = React.useState('');
    const [error, setError] = React.useState('');
    const [isValidating, setIsValidating] = React.useState(false);

    React.useEffect(() => {
        // Load existing key if available
        const storedKey = localStorage.getItem('whisper_api_key');
        if (storedKey && isOpen) {
            try {
                setApiKey(decryptApiKey(storedKey));
            } catch (err) {
                // Invalid encryption, clear it
                localStorage.removeItem('whisper_api_key');
            }
        }
    }, [isOpen]);

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');
        setIsValidating(true);

        try {
            // Test the API key with a simple request
            const response = await fetch('https://api.openai.com/v1/models', {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });
            
            if (!response.ok) throw new Error('Invalid API key');
            
            // Store encrypted API key
            localStorage.setItem('whisper_api_key', encryptApiKey(apiKey));
            onApiKeySet(apiKey);
            onClose();
        } catch (err) {
            setError('Invalid API key. Please try again.');
        } finally {
            setIsValidating(false);
        }
    };

    const handleClear = () => {
        setApiKey('');
        localStorage.removeItem('whisper_api_key');
        onApiKeySet(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                <h2 className="text-xl font-semibold mb-4">Settings</h2>
                <form onSubmit={handleSave}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            OpenAI API Key
                        </label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="w-full p-2 border rounded"
                            placeholder="sk-..."
                        />
                    </div>
                    {error && <p className="text-red-500 mb-4">{error}</p>}
                    <div className="flex space-x-3">
                        <button
                            type="submit"
                            disabled={isValidating}
                            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
                        >
                            {isValidating ? 'Validating...' : 'Save'}
                        </button>
                        <button
                            type="button"
                            onClick={handleClear}
                            className="bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300"
                        >
                            Clear
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 ml-auto"
                        >
                            Close
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Voice Bars Component
const VoiceBars = ({ isRecording, isPaused, analyserNode }) => {
    const [volumes, setVolumes] = React.useState([0, 0, 0, 0, 0]);
    const animationRef = React.useRef(null);
    const dataArrayRef = React.useRef(null);

    React.useEffect(() => {
        if (analyserNode && isRecording && !isPaused) {
            // Initialize analyzer data
            const bufferLength = analyserNode.frequencyBinCount;
            if (!dataArrayRef.current) {
                dataArrayRef.current = new Uint8Array(bufferLength);
            }

            const updateVolumes = () => {
                if (!analyserNode || !isRecording || isPaused) {
                    cancelAnimationFrame(animationRef.current);
                    setVolumes([0, 0, 0, 0, 0]);
                    return;
                }

                // Get frequency data
                analyserNode.getByteFrequencyData(dataArrayRef.current);
                
                // Calculate average volume
                const sum = dataArrayRef.current.reduce((acc, val) => acc + val, 0);
                const avgVolume = sum / bufferLength;
                const normalizedVolume = Math.min(100, (avgVolume / 255) * 100);
                
                // Create slight variations for each bar for natural effect
                const newVolumes = [
                    normalizedVolume * 0.8,
                    normalizedVolume * 0.9,
                    normalizedVolume,
                    normalizedVolume * 0.9,
                    normalizedVolume * 0.8
                ];
                
                // Only update if volume is above threshold
                if (avgVolume > 5) {
                    setVolumes(newVolumes);
                } else {
                    // Static low state for silence/mute
                    setVolumes([10, 10, 10, 10, 10]);
                }
                
                animationRef.current = requestAnimationFrame(updateVolumes);
            };
            
            // Start animation loop
            updateVolumes();
            
            // Cleanup
            return () => {
                if (animationRef.current) {
                    cancelAnimationFrame(animationRef.current);
                }
            };
        } else {
            // Reset when not recording
            setVolumes([10, 10, 10, 10, 10]);
        }
    }, [analyserNode, isRecording, isPaused]);

    return (
        <div 
            className="flex justify-center items-end gap-1 h-12 mb-4" 
            role="status" 
            aria-label="Voice activity indicator"
        >
            {volumes.map((volume, i) => (
                <div
                    key={i}
                    className={`w-2 rounded-t-sm ${volume > 10 ? 'bg-blue-500' : 'bg-gray-400'}`}
                    style={{
                        height: `${Math.max(5, volume)}%`,
                        transition: volume > 10 ? 'height 0.1s ease-out' : 'none'
                    }}
                />
            ))}
        </div>
    );
};

// Loading Bar Component
const LoadingBar = () => {
    return (
        <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
            <div className="h-full bg-blue-500 animate-indeterminate"></div>
        </div>
    );
};

// Install Button Component for PWA
const InstallButton = () => {
    const [deferredPrompt, setDeferredPrompt] = React.useState(null);
    const [showInstallButton, setShowInstallButton] = React.useState(false);

    React.useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later
            setDeferredPrompt(e);
            // Show install button
            setShowInstallButton(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }
            // Clear the saved prompt as it can't be used again
            setDeferredPrompt(null);
            setShowInstallButton(false);
        });
    };

    // Only show if the install prompt is available
    if (!showInstallButton) return null;

    return (
        <button
            onClick={handleInstallClick}
            className="fixed bottom-4 left-4 flex items-center gap-2 bg-blue-500 text-white py-2 px-4 rounded-full shadow-lg hover:bg-blue-600 transition-colors z-50"
        >
            <span>📱</span>
            <span>Install App</span>
        </button>
    );
};

// Main App Component
const App = () => {
    const [isAuthenticated, setIsAuthenticated] = React.useState(localStorage.getItem('sessionAuth') === 'true');
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
    const [apiKey, setApiKey] = React.useState(null);
    const [isRecording, setIsRecording] = React.useState(false);
    const [isPaused, setIsPaused] = React.useState(false);
    const [transcription, setTranscription] = React.useState('');
    const [isTranscribing, setIsTranscribing] = React.useState(false);
    const [error, setError] = React.useState('');
    const [mediaRecorder, setMediaRecorder] = React.useState(null);
    const [audioChunks, setAudioChunks] = React.useState([]);
    const [recordingTime, setRecordingTime] = React.useState(0);
    const [audioContext, setAudioContext] = React.useState(null);
    const [analyser, setAnalyser] = React.useState(null);
    const timerRef = React.useRef(null);

    // Disable scrolling for always-on-top effect
    React.useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    React.useEffect(() => {
        // Check for stored API key
        const storedKey = localStorage.getItem('whisper_api_key');
        if (storedKey) {
            try {
                setApiKey(decryptApiKey(storedKey));
            } catch (err) {
                // Invalid encryption, clear it
                localStorage.removeItem('whisper_api_key');
            }
        }
    }, []);

    // Cleanup function for audio context and timers
    React.useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (audioContext) audioContext.close();
        };
    }, [audioContext]);

    const startRecording = async () => {
        // Check if API key is set
        if (!apiKey) {
            setError('Please set your OpenAI API key in settings first');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks = [];

            // Create audio context and analyzer
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const analyserNode = audioCtx.createAnalyser();
            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyserNode);
            
            // Configure analyser for better voice detection
            analyserNode.fftSize = 256;
            analyserNode.smoothingTimeConstant = 0.5;
            analyserNode.minDecibels = -90;
            analyserNode.maxDecibels = -10;
            
            setAudioContext(audioCtx);
            setAnalyser(analyserNode);

            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = async () => {
                const audioBlob = new Blob(chunks, { type: 'audio/wav' });
                await transcribeAudio(audioBlob);
            };

            recorder.start();
            setMediaRecorder(recorder);
            setAudioChunks(chunks);
            setIsRecording(true);
            setIsPaused(false);
            setError('');
            setRecordingTime(0);

            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error('Recording error:', err);
            setError('Microphone access denied. Please allow microphone access to record.');
        }
    };

    const pauseRecording = () => {
        if (mediaRecorder && isRecording && !isPaused) {
            mediaRecorder.pause();
            setIsPaused(true);
            clearInterval(timerRef.current);
        }
    };

    const resumeRecording = () => {
        if (mediaRecorder && isRecording && isPaused) {
            mediaRecorder.resume();
            setIsPaused(false);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
            setIsPaused(false);
            clearInterval(timerRef.current);
            setRecordingTime(0);
            setIsTranscribing(true);
        }
    };

    const transcribeAudio = async (audioBlob) => {
        setIsTranscribing(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('file', audioBlob, 'audio.wav');
            formData.append('model', 'whisper-1');

            const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                },
                body: formData
            });

            if (!response.ok) throw new Error('Transcription failed');

            const data = await response.json();
            setTranscription(data.text);
            
            // Save to history
            const history = JSON.parse(localStorage.getItem('transcription_history') || '[]');
            history.unshift({
                text: data.text,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('transcription_history', JSON.stringify(history.slice(0, 5)));
        } catch (err) {
            setError('Failed to transcribe audio. Please try again.');
        } finally {
            setIsTranscribing(false);
        }
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(transcription);
            // Show temporary success message
            const copyBtn = document.getElementById('copyBtn');
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        } catch (err) {
            setError('Failed to copy to clipboard');
        }
    };

    // If not authenticated, show password prompt
    if (!isAuthenticated) {
        return <PasswordPrompt onSuccess={() => setIsAuthenticated(true)} />;
    }

    // Main app UI with iPhone dimensions
    return (
        <div className="app-container fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[372px] h-[795px] border border-gray-200 rounded-xl overflow-hidden shadow-lg z-[9999] bg-gray-50 p-4">
            <div className="flex flex-col items-center space-y-4 h-full overflow-auto">
                <h1 className="text-2xl font-bold text-gray-800">Whisper Transcription</h1>
                
                <div className="flex flex-col items-center space-y-4">
                    <div className="flex space-x-4">
                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            disabled={!apiKey}
                            className={`px-6 py-3 rounded-full text-white font-medium ${
                                isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
                            } ${!apiKey ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isRecording ? 'Stop Recording' : 'Record Audio'}
                            {isRecording && !isPaused && (
                                <span className="ml-2 inline-block w-3 h-3 bg-red-600 rounded-full animate-pulse"></span>
                            )}
                        </button>

                        {isRecording && (
                            <button
                                onClick={isPaused ? resumeRecording : pauseRecording}
                                className={`px-6 py-3 rounded-full text-white font-medium ${
                                    isPaused ? 'bg-green-500 hover:bg-green-600' : 'bg-yellow-500 hover:bg-yellow-600'
                                }`}
                            >
                                {isPaused ? 'Resume' : 'Pause'}
                            </button>
                        )}
                    </div>

                    {isRecording && (
                        <div className="text-sm text-gray-600 recording-timer">
                            Recording: {formatTime(recordingTime)}
                        </div>
                    )}

                    {/* Voice Activity Animation */}
                    {isRecording && (
                        <VoiceBars 
                            isRecording={isRecording} 
                            isPaused={isPaused} 
                            analyserNode={analyser} 
                        />
                    )}
                </div>

                {error && (
                    <p className="text-red-500 text-center">{error}</p>
                )}

                {/* Transcription Area with Loading Bar */}
                <div className="w-full flex-grow">
                    {isTranscribing ? (
                        <div className="bg-white p-4 rounded-lg shadow min-h-[100px] flex flex-col justify-center items-center">
                            <p className="text-gray-600 mb-4">Transcribing...</p>
                            <LoadingBar />
                        </div>
                    ) : transcription ? (
                        <div className="w-full space-y-4">
                            <div className="bg-white p-4 rounded-lg shadow min-h-[100px] max-h-[300px] overflow-y-auto transcription-text">
                                <p className="text-gray-800 whitespace-pre-wrap">{transcription}</p>
                            </div>
                            <button
                                id="copyBtn"
                                onClick={copyToClipboard}
                                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded"
                            >
                                Copy to Clipboard
                            </button>
                        </div>
                    ) : (
                        !isRecording && (
                            <div className="bg-white p-4 rounded-lg shadow min-h-[100px] flex items-center justify-center">
                                <p className="text-gray-500">No transcription yet. Click Record Audio to start.</p>
                            </div>
                        )
                    )}
                </div>
                
                {/* Settings Button */}
                <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="absolute bottom-4 right-4 text-gray-500 hover:text-gray-700 p-2 rounded-full bg-white shadow"
                    aria-label="Settings"
                >
                    ⚙️
                </button>
                
                {/* Settings Modal */}
                <SettingsModal 
                    isOpen={isSettingsOpen} 
                    onClose={() => setIsSettingsOpen(false)}
                    onApiKeySet={setApiKey}
                />
            </div>
        </div>
    );
};

// PWA Install Button outside the app container
const AppWithInstallButton = () => {
    return (
        <>
            <App />
            <InstallButton />
        </>
    );
};

// Render the app
ReactDOM.render(<AppWithInstallButton />, document.getElementById('root')); 