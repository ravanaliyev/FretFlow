// Simple YIN pitch detection algorithm
function getOptimalBufferSize() {
    // 4096 samples at 44100 Hz gives ~10.7 Hz resolution
    // Enough for guitar (lowest E2 = 82 Hz, period ~535 samples)
    // Smaller buffers lack low-frequency resolution
    return 4096;
}

function yinDetector(buffer, sampleRate, threshold = 0.1) {
    const bufferSize = buffer.length;
    const halfBufferSize = Math.floor(bufferSize / 2);
    const yinBuffer = new Array(halfBufferSize).fill(0);

    let runningSum = 0;
    for (let tau = 1; tau < halfBufferSize; tau++) {
        for (let i = 0; i < halfBufferSize - tau; i++) {
            const delta = buffer[i] - buffer[i + tau];
            yinBuffer[tau] += delta * delta;
        }
        runningSum += yinBuffer[tau];
        yinBuffer[tau] *= tau / runningSum;
    }

    for (let tau = 2; tau < halfBufferSize; tau++) {
        if (yinBuffer[tau] < threshold && yinBuffer[tau] < 0.5) {
            // Find the minimum in local window
            let bestTau = tau;
            for (let t = tau + 1; t < halfBufferSize; t++) {
                if (yinBuffer[t] < yinBuffer[bestTau]) {
                    bestTau = t;
                } else {
                    break;  // Passed the minimum
                }
            }
            // Apply parabolic interpolation around the minimum for sub-sample precision
            const interpolatedTau = parabolicInterpolation(yinBuffer, bestTau);
            const confidence = 1 - yinBuffer[bestTau];
            // Only return frequency if confidence is high enough
            if (confidence < 0.3) return 0;
            let frequency = sampleRate / interpolatedTau;
            // Apply octave error correction
            frequency = correctOctave(frequency, yinBuffer, sampleRate);
            return frequency;
        }
    }
    return 0;
}

function parabolicInterpolation(yinBuffer, tau) {
    const x1 = tau - 1;
    const x2 = tau;
    const x3 = tau + 1;
    if (x1 < 0 || x3 >= yinBuffer.length) return tau;
    const y1 = yinBuffer[x1];
    const y2 = yinBuffer[x2];
    const y3 = yinBuffer[x3];
    const a = (y1 - 2 * y2 + y3) / 2;
    const b = (y3 - y1) / 2;
    return x2 - b / (2 * a);
}

function correctOctave(frequency, yinBuffer, sampleRate) {
    // Check if an octave error occurred by looking for stronger candidates
    // at half frequency (2x period) or double frequency (0.5x period)
    const currentPeriod = sampleRate / frequency;
    const halfPeriodTau = Math.round(currentPeriod * 2);
    const doublePeriodTau = Math.round(currentPeriod / 2);

    // Check octave down (currentPeriod * 2 = one octave lower)
    if (halfPeriodTau > 2 && halfPeriodTau < yinBuffer.length) {
        const halfPeriodConfidence = 1 - yinBuffer[halfPeriodTau];
        const currentConfidence = 1 - yinBuffer[Math.round(currentPeriod)];
        // If octave down has much higher confidence, use it
        if (halfPeriodConfidence > currentConfidence + 0.2) {
            return sampleRate / halfPeriodTau;
        }
    }

    // Check octave up (currentPeriod / 2 = one octave higher)
    if (doublePeriodTau > 2 && doublePeriodTau < yinBuffer.length) {
        const doublePeriodConfidence = 1 - yinBuffer[doublePeriodTau];
        const currentConfidence = 1 - yinBuffer[Math.round(currentPeriod)];
        // If octave up has much higher confidence, use it
        if (doublePeriodConfidence > currentConfidence + 0.2) {
            return sampleRate / doublePeriodTau;
        }
    }

    return frequency;
}

function frequencyToNote(frequency) {
    const A4 = 440;
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    // Calculate MIDI note number
    const midiNote = Math.round(12 * Math.log2(frequency / A4)) + 69;

    // Octave and note name
    const noteIndex = midiNote % 12;
    const octave = Math.floor(midiNote / 12) - 1;

    return noteNames[noteIndex] + octave;
}

function frequencyToNoteName(frequency) {
    // Returns just the note name without octave (e.g., "A", "C#", "E")
    const A4 = 440;
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const midiNote = Math.round(12 * Math.log2(frequency / A4)) + 69;
    const noteIndex = midiNote % 12;
    return noteNames[noteIndex];
}

class AudioProcessor {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.pitchDetector = null;
        this.isRunning = false;
        this.animationId = null;
        this.lastFrequency = 0; // Keep previous frequency
        this.lastNote = '--';
        this.onNoteDetected = () => {}; // Callback function
        this.noteBuffer = null; // For song recording
        this.isRecording = false;
        this.lastRecordedNote = null;
        this.consecutiveNotes = null; // Track note consistency
    }

    startRecording() {
        if (!this.isRecording) {
            this.noteBuffer = new NoteBuffer();
            this.noteBuffer.start();
            this.isRecording = true;
            this.lastRecordedNote = null;
            this.consecutiveNotes = null;
            console.log('=== RECORDING STARTED === noteBuffer.startTime=' + this.noteBuffer.startTime);
        }
    }

    stopRecording() {
        if (this.isRecording && this.noteBuffer) {
            this.noteBuffer.end();
            this.isRecording = false;
            return this.noteBuffer;
        }
        return null;
    }

    getRecordingDuration() {
        return this.noteBuffer ? this.noteBuffer.getDuration() : 0;
    }

    async start() {
        try {
            // Create AudioContext
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Request microphone permission
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.microphone = this.audioContext.createMediaStreamSource(stream);

            // Create AnalyserNode with optimal buffer size for low frequencies
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = getOptimalBufferSize();
            this.microphone.connect(this.analyser);

            // Use YIN algorithm
            this.pitchDetector = yinDetector;

            this.isRunning = true;
            this.animate();

        } catch (error) {
            console.error('Microphone access failed:', error);
            let message = 'Microphone access denied or not supported.';
            if (error.name === 'NotAllowedError') {
                message = 'Microphone permission denied. Please allow access.';
            } else if (error.name === 'NotFoundError') {
                message = 'Microphone not found. Check your microphone.';
            } else if (error.name === 'NotReadableError') {
                message = 'Microphone is being used by another application.';
            }
            alert(message);
        }
    }

    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
        if (this.microphone) {
            this.microphone.disconnect();
        }
    }

    animate() {
        if (!this.isRunning) return;

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Float32Array(bufferLength);
        this.analyser.getFloatTimeDomainData(dataArray);

        // Calculate volume (RMS)
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / bufferLength);
        const volume = rms * 100; // Percentage

        let frequency = 0;
        let note = '--';

        // Analyze if volume is sufficient
        if (volume > 1) { // Threshold, adjustable
            frequency = this.pitchDetector(dataArray, this.audioContext.sampleRate);
            if (frequency && frequency > 0) {
                note = this.frequencyToNote(frequency);
                this.lastFrequency = frequency; // Update
                this.lastNote = note;
            } else {
                // No clear pitch detected - clear frequency
                frequency = 0;
                note = '--';
            }
        } else {
            // Volume too low - treat as silence
            frequency = 0;
            note = '--';
        }

        // Update elements - callback now includes volume
        this.onNoteDetected(frequency, note, volume);

        // Record to NoteBuffer if recording is active
        if (this.isRecording && this.noteBuffer) {
            console.log('RCK freq=' + frequency + ' note=' + note);
        }

        // Only record when a valid note is detected after stability
        if (this.isRecording && this.noteBuffer && frequency > 0 && note !== '--') {
            let now = performance.now();
            let currentNoteName = note.replace(/[0-9]/g, '');

            // Track consecutive frames with same note (within guitar range 60-1500 Hz)
            if (frequency >= 60 && frequency <= 1500) {
                if (this.consecutiveNotes && this.consecutiveNotes.name === currentNoteName) {
                    this.consecutiveNotes.count++;
                } else {
                    this.consecutiveNotes = { name: currentNoteName, count: 1 };
                }

                console.log('CNT ' + this.consecutiveNotes.count + ' name=' + currentNoteName);

                // Record if stable for 3+ frames AND (new note OR 600ms passed)
                if (this.consecutiveNotes.count >= 3) {
                    let isNewNote = !this.lastRecordedNote || currentNoteName !== this.lastRecordedNote.name;
                    let enoughTimePassed = this.lastRecordedNote && (now - this.lastRecordedNote.time) > 600;

                    console.log('CHK new=' + isNewNote + ' time=' + enoughTimePassed + ' curr=' + currentNoteName);

                    if (isNewNote || enoughTimePassed) {
                        this.lastRecordedNote = { name: currentNoteName, note, frequency, time: now };
                        this.noteBuffer.addNote(frequency, note, volume);
                        console.log('RECORDED ' + note + ' freq=' + frequency);
                    }
                }
            } else {
                // Frequency out of range - don't increment, but don't reset either
                // This prevents brief out-of-range blips from breaking detection
                console.log('OUT OF RANGE freq=' + frequency);
            }
        } else if (this.isRecording && frequency === 0) {
            // Silence - reset consecutive notes after a brief hold
            if (this.consecutiveNotes && this.consecutiveNotes.holdFrames !== undefined) {
                this.consecutiveNotes.holdFrames++;
                if (this.consecutiveNotes.holdFrames > 10) {
                    this.consecutiveNotes = null;
                    console.log('RESET - silence');
                }
            } else if (this.consecutiveNotes) {
                this.consecutiveNotes.holdFrames = 0;
            }
        }

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    frequencyToNote(frequency) {
        const A4 = 440;
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

        // Calculate MIDI note number
        const midiNote = Math.round(12 * Math.log2(frequency / A4)) + 69;

        // Octave and note name
        const noteIndex = midiNote % 12;
        const octave = Math.floor(midiNote / 12) - 1;

        return noteNames[noteIndex] + octave;
    }
}

// Create and export processor instance for HTML pages to use
const processor = new AudioProcessor();

// HTML pages should set processor.onNoteDetected callback and handle button clicks

/* Usage Example:
processor.onNoteDetected = (freq, note, volume) => {
    console.log(`Frequency: ${freq} Hz, Note: ${note}, Volume: ${volume}%`);
};
processor.start();
*/