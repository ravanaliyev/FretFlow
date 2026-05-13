# JS Guitar Pitch Detector (Pure JS with YIN Algorithm)

This project is a real-time audio frequency detector running in the browser using Web Audio API. It analyzes audio from a microphone or jack input and converts it to musical notes in real-time. Perfect for guitar tuning and note detection.

## Features

- **Real-Time Analysis**: Continuous frequency detection with `requestAnimationFrame`.
- **YIN Algorithm**: Uses YIN (Yet Another Implementation of the Yin Algorithm) for pitch detection.
- **Noise Filtering**: RMS-based volume threshold to prevent noise analysis.
- **Modular Design**: `AudioProcessor` class with callback function for easy integration.
- **Pure JavaScript**: Works without external library dependencies.

## Technologies Used

- **Web Audio API**: For audio stream and analysis.
- **Pure JavaScript**: ES6 classes and modern JS features.
- **YIN Pitch Detection Algorithm**: Frequency detection with parabolic interpolation for accuracy.
- **RMS Noise Filtering**: Volume threshold for optimized analysis.

## Installation and Setup

1. Clone or download the project:
   ```bash
   git clone https://github.com/ravanaliyev/js-guitar-pitch-detector.git
   cd js-guitar-pitch-detector
   ```

2. Start a local HTTP server (e.g., with Python):
   ```bash
   python3 -m http.server 8000
   ```

3. Open `http://localhost:8000` in your browser.

4. Click the "Start Listening" button, allow microphone access, and produce sound.

## Usage

### Basic Usage
Include the `app.js` script in your HTML file:

```html
<!DOCTYPE html>
<html>
<body>
    <button id="startBtn">Start</button>
    <div id="output"></div>
    <script src="app.js"></script>
</body>
</html>
```

In JavaScript:

```javascript
const processor = new AudioProcessor();

// Define the callback function (must be set BEFORE calling start())
processor.onNoteDetected = (frequency, note) => {
    document.getElementById('output').textContent = `Frequency: ${frequency.toFixed(2)} Hz, Note: ${note}`;
};

// Start/Stop with button
document.getElementById('startBtn').addEventListener('click', () => {
    if (!processor.isRunning) {
        processor.start();
    } else {
        processor.stop();
    }
});
```

> **Note**: `onNoteDetected` is a class property that accepts a callback function. Set it before or after calling `start()`, and it will be invoked every frame when a frequency is detected.

### Integration as a Library
Include the `AudioProcessor` class in your project:

```javascript
import { AudioProcessor } from './path/to/AudioProcessor.js'; // Or via script tag

const detector = new AudioProcessor();
detector.onNoteDetected = (freq, note) => {
    console.log(`Detected: ${note} at ${freq} Hz`);
    // UI updates or other operations here
};
detector.start();
```

## API Reference

### AudioProcessor Class

- `constructor()`: Creates a new instance of the class.
- `start()`: Starts microphone access and analysis.
- `stop()`: Stops analysis and cleans up resources.
- `onNoteDetected(frequency, note)`: Callback function. Called with current frequency and note.

### YIN Algorithm

- Threshold: 0.1 (adjustable).
- Sample Rate: Obtained from AudioContext.
- Buffer Size: 2048 (FFT size).

## Contributing

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Contact

For questions, use [GitHub Issues](https://github.com/ravanaliyev/js-guitar-pitch-detector/issues).