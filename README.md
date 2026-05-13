# 🎸 FretFlow | Modern Guitar Learning Experience

FretFlow is a premium, interactive web application designed to revolutionize the way students learn guitar. By combining high-fidelity design with real-time audio processing, FretFlow provides a seamless path from discovery to mastery.

![FretFlow Preview](https://raw.githubusercontent.com/ravanaliyev/FretFlow/main/public/preview.png) *(Note: Add a real preview image to public/ folder for best results)*

## ✨ Features

- **🎯 Real-Time Pitch Detection:** Powered by the **YIN Algorithm**, providing instant feedback on your playing with high accuracy.
- **🛣️ Level-Based Curriculum:** A structured path that guides students from basic string discovery to complex melodies.
- **🎸 Interactive Fretboard:** A high-fidelity, responsive fretboard that highlights target notes across all strings, helping students master the entire neck.
- **🌓 Premium Aesthetics:** A sleek "Dark Mode" interface with glassmorphism, smooth animations (Framer Motion), and a modern layout.
- **📊 Progress Tracking:** Monitor your completion percentage and practice history as you level up your skills.
- **🔑 Seamless Auth Experience:** Beautifully animated landing and login pages to welcome users to their learning journey.

## 🚀 Tech Stack

- **Core:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Audio Logic:** Custom Web Audio API implementation with YIN pitch detection.

## 🛠️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ravanaliyev/FretFlow.git
   cd FretFlow
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5173` (or the port specified in the terminal).

## 📁 Project Structure

- `src/screens/landing`: High-fidelity landing page components.
- `src/screens/login`: Animated authentication cards and sections.
- `src/screens/dashboard`: The main student dashboard and practice environment.
- `src/utils`: Audio processing and pitch detection logic.
- `legacy/`: Preserved original project files for reference.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
Developed with ❤️ for guitarists everywhere.
