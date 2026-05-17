/**
 * YIN Pitch Detection Algorithm
 * An advanced time-domain fundamental frequency estimation algorithm.
 * Implements three key stages to reliably identify absolute musical pitches while preventing subharmonic errors:
 * 
 * Step 1: Difference Function
 * - Measures the difference between the original signal buffer and a time-shifted (lagged by tau) copy of itself.
 * - Formula: d_t(tau) = sum_{i=1}^{W} (x_i - x_{i+tau})^2
 * 
 * Step 2: Cumulative Mean Normalized Difference Function
 * - Reduces subharmonic locks by dividing the raw difference function by its average running sum.
 * - Prevents the algorithm from falsely latching onto octaves.
 * 
 * Step 3: Absolute Thresholding
 * - Scans the normalized values for the first local minimum that falls below a pre-set threshold (default 0.1).
 * - Employs parabolic interpolation on adjacent buffer points to calculate precise fractional frequencies.
 * 
 * @param buffer - Floating point array representing audio samples.
 * @param sampleRate - Sample rate of active AudioContext (typically 44100Hz or 48000Hz).
 * @param threshold - Absolute threshold below which local minima are accepted.
 * @returns The estimated fundamental frequency in Hertz (Hz), or 0 if undetected.
 */
function yinDetector(buffer: Float32Array, sampleRate: number, threshold = 0.1): number {
    const bufferSize = buffer.length;
    const halfBufferSize = Math.floor(bufferSize / 2);
    const yinBuffer = new Array(halfBufferSize).fill(0);

    // STEP 1: Compute Difference Function
    // Quantifies distance between the original wave segment and itself when lagged by 'tau'
    for (let tau = 0; tau < halfBufferSize; tau++) {
        for (let i = 0; i < halfBufferSize; i++) {
            const delta = buffer[i] - buffer[i + tau];
            yinBuffer[tau] += delta * delta;
        }
    }

    // STEP 2: Cumulative Mean Normalized Difference
    // Prevents octave error tracking by dividing values by a running average
    yinBuffer[0] = 1;
    let runningSum = 0;
    for (let tau = 1; tau < halfBufferSize; tau++) {
        runningSum += yinBuffer[tau];
        yinBuffer[tau] *= tau / runningSum;
    }

    // STEP 3: Absolute Threshold & Minima Search
    // Scans for early dips under the threshold, applying parabolic interpolation for high precision
    for (let tau = 2; tau < halfBufferSize; tau++) {
        if (yinBuffer[tau] < threshold) {
            let betterTau = tau;
            // Search for local minimum
            for (let i = tau + 1; i < halfBufferSize; i++) {
                if (yinBuffer[i] < yinBuffer[betterTau]) {
                    betterTau = i;
                }
            }
            // Interpolate peaks parabolically and convert to Hertz (Hz)
            return sampleRate / parabolicInterpolation(yinBuffer, betterTau);
        }
    }
    return 0;
}

/**
 * Parabolic Interpolation helper.
 * Fits a parabola to three adjacent buffer points to pinpoint the exact fractional peak,
 * boosting precision beyond integer samples.
 */
function parabolicInterpolation(yinBuffer: number[], tau: number): number {
    const x1 = tau - 1;
    const x2 = tau;
    const x3 = tau + 1;
    if (x1 < 0 || x3 >= yinBuffer.length) return tau;
    
    const y1 = yinBuffer[x1];
    const y2 = yinBuffer[x2];
    const y3 = yinBuffer[x3];
    
    const a = (y1 - 2 * y2 + y3) / 2;
    if (a === 0) return tau;
    const b = (y3 - y1) / 2;
    return x2 - b / (2 * a);
}

/**
 * AudioProcessor Class
 * Coordinates hardware microphone streams and handles real-time guitar pitch detection:
 * - Prompts users for permission to capture audio streams.
 * - Chains a lowpass hardware filter (BiquadFilterNode at 1000Hz) to cut high-frequency ambient noises.
 * - Extracts time-domain buffers via an AnalyserNode (FFT Size 4096).
 * - Calculates raw RMS (root-mean-square) volumes, ignoring signals below a 0.8 volume threshold.
 * - Feeds active signals to the YIN detector, smoothing pitch flutter over a sliding buffer.
 */
export class AudioProcessor {
    private audioContext: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private microphone: MediaStreamAudioSourceNode | null = null;
    private filter: BiquadFilterNode | null = null;
    public isRunning = false;
    private animationId: number | null = null;
    
    // Callback event listener when a pitch is successfully mapped
    public onNoteDetected: (frequency: number, note: string) => void = () => {}; 
    private recentNotes: string[] = []; // History array to stabilize pitch jitters

    /**
     * Initializes hardware microphone access, connects filters, and starts the processing loop.
     */
    async start() {
        try {
            // Instantiate AudioContext cross-browser
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            // Request hardware mic stream permissions
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.microphone = this.audioContext.createMediaStreamSource(stream);

            // Set up a lowpass filter at 1000Hz to eliminate string squeaks or high-frequency ambient noise
            this.filter = this.audioContext.createBiquadFilter();
            this.filter.type = 'lowpass';
            this.filter.frequency.setValueAtTime(1000, this.audioContext.currentTime);

            // Configure AnalyserNode with high sample resolution (4096 fftSize)
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 4096;

            // Chain Node: Mic Source -> Lowpass Filter -> Analyser
            this.microphone.connect(this.filter);
            this.filter.connect(this.analyser);

            this.isRunning = true;
            this.animate();
        } catch (error) {
            console.error('Microphone access failed:', error);
            throw error;
        }
    }

    /**
     * Disconnects nodes, closes audio context, and halts anim frame loops.
     */
    stop() {
        this.isRunning = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        if (this.audioContext) this.audioContext.close();
    }

    /**
     * High-frequency animation frame callback.
     * Computes RMS sound pressure volumes, executes pitch checks, and runs smoothing.
     */
    private animate() {
        if (!this.isRunning || !this.analyser || !this.audioContext) return;
        
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Float32Array(bufferLength);
        this.analyser.getFloatTimeDomainData(dataArray);

        // Calculate Root Mean Square (RMS) volume level
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) sum += dataArray[i] * dataArray[i];
        const rms = Math.sqrt(sum / bufferLength);
        const volume = rms * 100;

        // Perform YIN Pitch Detection only if signal exceeds the minimum threshold limit
        if (volume > 0.8) { 
            const frequency = yinDetector(dataArray, this.audioContext.sampleRate);
            // Limit checks to frequencies under 2000Hz (encompassing standard guitar registers)
            if (frequency > 0 && frequency < 2000) {
                const rawNote = this.frequencyToNote(frequency);
                
                // Keep the last 3 note scans to prevent pitch detection jitters
                this.recentNotes.push(rawNote);
                if (this.recentNotes.length > 3) this.recentNotes.shift();
                
                const mostFrequent = this.getMostFrequent(this.recentNotes);
                this.onNoteDetected(frequency, mostFrequent);
            }
        } else {
            // Signal too quiet: reset buffers
            this.recentNotes = [];
            this.onNoteDetected(0, '--');
        }

        // Keep loop ticking
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    /**
     * Helper returning the most common note string inside the sliding history buffer.
     */
    private getMostFrequent(arr: string[]): string {
        const counts: Record<string, number> = {};
        let maxCount = 0;
        let mostFrequent = arr[0];
        
        for (const item of arr) {
            counts[item] = (counts[item] || 0) + 1;
            if (counts[item] > maxCount) {
                maxCount = counts[item];
                mostFrequent = item;
            }
        }
        return mostFrequent;
    }

    /**
     * Maps fundamental Hertz frequencies to standard scientific musical notes (e.g. "E2", "A4").
     * Uses standard A4 = 440 Hz reference. Formula: midi = round(12 * log2(freq / 440)) + 69
     */
    private frequencyToNote(frequency: number): string {
        const A4 = 440;
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const midiNote = Math.round(12 * Math.log2(frequency / A4)) + 69;
        const noteIndex = midiNote % 12;
        const octave = Math.floor(midiNote / 12) - 1;
        return noteNames[noteIndex] + octave;
    }
}
