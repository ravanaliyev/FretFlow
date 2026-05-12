/**
 * YIN Pitch Detection Algorithm
 * 1. Difference Function: Calculates the squared difference between the signal and its shifted version.
 * 2. Cumulative Mean Normalized Difference: Reduces the error caused by windowing.
 * 3. Absolute Thresholding: Finds the first local minimum below the threshold.
 * 4. Parabolic Interpolation: Refines the detected frequency for sub-sample accuracy.
 */
function yinDetector(buffer, sampleRate, threshold = 0.1) {
    const bufferSize = buffer.length;
    const halfBufferSize = Math.floor(bufferSize / 2);
    const yinBuffer = new Array(halfBufferSize).fill(0);

    // Step 1: Difference function
    for (let tau = 0; tau < halfBufferSize; tau++) {
        for (let i = 0; i < halfBufferSize; i++) {
            const delta = buffer[i] - buffer[i + tau];
            yinBuffer[tau] += delta * delta;
        }
    }

    // Step 2: Cumulative mean normalized difference function
    yinBuffer[0] = 1;
    let runningSum = 0;
    for (let tau = 1; tau < halfBufferSize; tau++) {
        runningSum += yinBuffer[tau];
        yinBuffer[tau] *= tau / runningSum;
    }

    // Step 3: Absolute threshold
    for (let tau = 2; tau < halfBufferSize; tau++) {
        if (yinBuffer[tau] < threshold) {
            let betterTau = tau;
            for (let i = tau + 1; i < halfBufferSize; i++) {
                if (yinBuffer[i] < yinBuffer[betterTau]) {
                    betterTau = i;
                }
            }
            return sampleRate / parabolicInterpolation(yinBuffer, betterTau);
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
    if (a === 0) return tau; // Prevent division by zero
    const b = (y3 - y1) / 2;
    return x2 - b / (2 * a);
}

class AudioProcessor {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.isRunning = false;
        this.animationId = null;
        this.onNoteDetected = () => {}; 
    }

    async start() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            this.microphone.connect(this.analyser);
            this.isRunning = true;
            this.animate();
        } catch (error) {
            console.error('Microphone access failed:', error);
            alert('Lütfen mikrofon erişimine izin verin.');
        }
    }

    stop() {
        this.isRunning = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        if (this.audioContext) this.audioContext.close();
    }

    animate() {
        if (!this.isRunning) return;
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Float32Array(bufferLength);
        this.analyser.getFloatTimeDomainData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) sum += dataArray[i] * dataArray[i];
        const rms = Math.sqrt(sum / bufferLength);
        const volume = rms * 100;

        if (volume > 2) { // Minimum ses eşiği
            const frequency = yinDetector(dataArray, this.audioContext.sampleRate);
            if (frequency > 0) {
                const note = this.frequencyToNote(frequency);
                this.onNoteDetected(frequency, note);
            }
        } else {
            this.onNoteDetected(0, '--');
        }

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    frequencyToNote(frequency) {
        const A4 = 440;
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const midiNote = Math.round(12 * Math.log2(frequency / A4)) + 69;
        const noteIndex = midiNote % 12;
        const octave = Math.floor(midiNote / 12) - 1;
        return noteNames[noteIndex] + octave;
    }
}
