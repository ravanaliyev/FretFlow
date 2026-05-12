# FretFlow | Interactive Student Dashboard

A modern, high-end student dashboard for guitar learning applications. Featuring a **Glassmorphism** aesthetic and real-time **Pitch Detection** using the YIN algorithm.

![Dashboard Preview](assets/bg.png) <!-- Note: Replace with a real screenshot before final push -->

## 🚀 Features

- **Glassmorphism UI**: A minimalist, premium dark theme with neon accents and semi-transparent blurred surfaces.
- **Real-time Pitch Detection**: Integrated YIN algorithm that listens to your guitar through the microphone and provides instant feedback.
- **Interactive Fretboard**: A 6-string, 12-fret simulation that guides students by highlighting the target notes for each lesson.
- **Syllabus & Progression**: A dynamic lesson grid with filtering (Difficulty/Status) and an overall progress tracker.
- **Admin Dashboard**: A built-in interface to add, edit, and manage lessons without touching the code.
- **Practice History (CRUD)**: Track your sessions and manage your learning log.

## 🛠️ Tech Stack

- **HTML5 / CSS3**: Vanilla CSS for maximum flexibility and performance.
- **JavaScript (Vanilla)**: Core logic, DOM manipulation, and Audio processing.
- **Web Audio API**: Used for real-time microphone analysis and frequency detection.

## 📦 Getting Started

This is a purely client-side application. No server setup is required.

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/guitar-dashboard.git
   ```
2. Open `index.html` in any modern web browser (Chrome or Edge recommended for best Web Audio support).
3. Allow microphone permissions when prompted to enable interactive practice.

## 🔧 Project Structure

- `index.html`: Main application entry point.
- `style.css`: Design system and glassmorphism styles.
- `script.js`: Dashboard logic and state management.
- `pitchDetector.js`: Core audio processing and YIN algorithm implementation.
- `assets/`: Background images and icons.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Feel free to fork this project and submit pull requests. For major changes, please open an issue first to discuss what you would like to change.
