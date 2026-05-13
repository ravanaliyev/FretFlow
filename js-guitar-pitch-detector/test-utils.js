// Signal generation utilities for testing YIN algorithm

// Generate pure sine wave
function generateSine(frequency, sampleRate = 44100, duration = 0.1) {
    const samples = Math.floor(sampleRate * duration);
    const buffer = new Float32Array(samples);
    const angularFreq = 2 * Math.PI * frequency;

    for (let i = 0; i < samples; i++) {
        buffer[i] = Math.sin(angularFreq * i / sampleRate);
    }
    return buffer;
}

// Generate guitar-like signal with harmonics
function generateGuitarLike(fundamentalFreq, sampleRate = 44100, duration = 0.1, harmonics = [1, 0.5, 0.25, 0.125]) {
    const samples = Math.floor(sampleRate * duration);
    const buffer = new Float32Array(samples);

    for (let i = 0; i < samples; i++) {
        let sample = 0;
        for (let h = 0; h < harmonics.length; h++) {
            const freq = fundamentalFreq * (h + 1);
            sample += harmonics[h] * Math.sin(2 * Math.PI * freq * i / sampleRate);
        }
        // Normalize
        const maxVal = harmonics.reduce((a, b) => a + b, 0);
        buffer[i] = sample / maxVal * 0.8;
    }
    return buffer;
}

// Generate silence (all zeros)
function generateSilence(samples = 2048) {
    return new Float32Array(samples);
}

// Generate noise
function generateNoise(sampleRate = 44100, duration = 0.1, amplitude = 0.01) {
    const samples = Math.floor(sampleRate * duration);
    const buffer = new Float32Array(samples);

    for (let i = 0; i < samples; i++) {
        buffer[i] = (Math.random() * 2 - 1) * amplitude;
    }
    return buffer;
}

// Apply Hann window to buffer
function applyWindow(buffer) {
    const windowed = new Float32Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
        const window = 0.5 * (1 - Math.cos(2 * Math.PI * i / (buffer.length - 1)));
        windowed[i] = buffer[i] * window;
    }
    return windowed;
}

// Helper to create buffer at specific frequency
// Note: YIN works better WITHOUT windowing - it's a time-domain method
function createTestBuffer(frequency, sampleRate = 44100, duration = 0.1, useWindow = false) {
    const buffer = generateSine(frequency, sampleRate, duration);
    return buffer;
}