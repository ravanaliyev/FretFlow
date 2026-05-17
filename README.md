# 🎸 FretFlow — The Free, Fun, and Effective Way to Learn Guitar!

<div align="center">

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-64748B?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-074D5B?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)](https://www.framer.com/motion/)

**A premium real-time pitch-detection, interactive fretboard learning, and gamified practice platform entirely run in the browser.**

[Features](#-key-features--user-journey) • [Design](#-uiux-design-aesthetic) • [Architecture](#-technical-architecture--engineering-superiority) • [Tech Stack](#-tech-stack) • [Installation](#-local-setup-guide)

</div>

---

## 📖 About The Project

**FretFlow** is a next-generation **EdTech (Educational Technology)** platform that makes learning guitar free, fun, and scientifically effective. 

By resolving key pain points of traditional guitar education—such as prohibitive tutoring costs, lack of instant feedback, and rapid drop-offs in motivation—FretFlow introduces an interactive experience. At its core is a real-time pitch-detection audio engine that captures analog signals from the user's computer microphone, evaluating their frequency and timing in milliseconds.

---

## ✨ Key Features & User Journey

Here is the structured learning path and interactive experience when a user interacts with FretFlow:

1. **📚 Sequential Curricular Roadmap:**
   * Organizes progression into distinct levels. Students begin with open strings (Level 1: Foundations), learn fretting techniques (Level 2: Fret Mastery), and play famous chords and melodies (Level 3: Melodies), unlocking subsequent levels with XP.
2. **🎯 Interactive Fretboard Practice:**
   * Users play scrolling guitar tabs on their physical instrument. The built-in pitch analyzer scans input 60 times a second to verify hits against specific timestamps, providing instant visual accuracy metrics.
3. **🎵 Real-Time Chromatic Tuner:**
   * Calibrates the instrument immediately. Translates analog microphone samples into absolute frequency pitches, displaying deviations in "Cents" on a beautiful interactive gauge dial.
4. **👂 Gamified Ear Training:**
   * Synthesizes warm analog sounds using the Web Audio API to play reference tones, prompting users with multiple-choice ear quizzes to build absolute pitch recognition.
5. **⏱️ High-Precision Metronome:**
   * Offers a stable, programmable metronome using a lookahead clock loop that prevents browser background thread throttling and preserves tempo integrity.
6. **🏆 Rich Gamification & Achievements:**
   * Tracks daily learning streaks, calculates progression levels, logs metrics into SVG charts, and rewards players with 12 unlockable achievement badges.
7. **⚔️ Real-Time Multiplayer Duels:**
   * Enables players to create duel lobby rooms, invite friends via matchmaking codes, and challenge each other to hit songs, tracking real-time completion scores and accuracy percent rankings.

---

## 💎 UI/UX Design Aesthetic: "Liquid Glass"

FretFlow adopts a state-of-the-art **Liquid Glassmorphism** design language:

* **Shedding the Minimalist Look:** Immersive glass panels (`backdrop-filter: blur`), glowing neon string shadow gradients, and a deep-space dark theme.
* **Animated Environments:** Up-drifting background music floating particles, glowing guitar strings that vibrate upon cursor hover, and smooth frame translations.
* **Typographic Excellence:** Styled entirely using premium typography, custom visual icons, and sleek Framer Motion micro-animations that respond to active keystrokes without performance lag.

---

## 🏗️ Technical Architecture & Engineering Superiority

### 🧩 The 13-Component Atomic UI Architecture
FretFlow's dashboard is architected using **Strict Single-Responsibility Separation of Concerns (SoC)**, cleanly isolating the user interface into **13 independent atomic sub-components** for maximum modularity and clean-code maintainability:

1. **`Tuner.tsx`** - Logarithmic deviation and needle gauge tuner math.
2. **`Songs.tsx`** - Playhead scroll timeline and rhythm-game collision physics.
3. **`Metronome.tsx`** - Lookahead scheduling scheduler loop clock.
4. **`EarTraining.tsx`** - Web Audio oscillator generator synthesis and quizzes.
5. **`AnalyticsChart.tsx`** - SVG linear coordinate practice charts mapping.
6. **`BadgesSection.tsx`** - Achievements grids and overlays detailing milestones.
7. **`LessonGrid.tsx`** - Paginated curriculum search, difficulty filters, and admin controls.
8. **`LevelRoadmap.tsx`** - Roadmap rank levels and XP boundaries.
9. **`Leaderboard.tsx`** - 3D podium tiers showing global XP rankings.
10. **`ProfileDropdown.tsx`** - Lefty flipped visual orientation and notation preferences.
11. **`LevelMenu.tsx`** - Interactive levels deck selector cards.
12. **`QuickResume.tsx`** - Direct visual resume pointers.
13. **`MotivationQuote.tsx`** - Randomized guitar quote arrays.

### 🎙️ Audio Processing & The YIN Pitch Detection Algorithm
Analog audio captured via standard `MediaStreamAudioSourceNode` is routed through a hardware-emulated **1000Hz Lowpass Biquad Filter** to eliminate string squeaks and ambient room hums. The filtered buffer is then evaluated by the **YIN Fundamental Frequency Estimator**:
1. **Difference Function:** Analyzes distance metrics between the signal and its time-lagged copy:
   $$d_t(\tau) = \sum_{i=1}^{W} (x_i - x_{i+\tau})^2$$
2. **Cumulative Mean Normalized Difference:** Division of the difference function by its running average sum to prevent subharmonic octave-locking errors.
3. **Absolute Thresholding & Parabolic Interpolation:** Locates the first local minima falling below a preset threshold (default `0.1`) and fits a parabola to sample peaks to estimate exact fractional frequencies.
4. **Pitch-to-Note Translation:** Converted into a MIDI pitch relative to standard $A_4 = 440\text{ Hz}$:
   $$\text{midi} = \text{round}\left(12 \times \log_2\left(\frac{f}{440}\right)\right) + 69$$

### 🛠️ Production Build Statistics
* **Zero Warnings Policy:** Builds production distribution assets with **0 errors and 0 warnings**.
* **Strict Typing:** Completely removes unsafe `any` typings, using interfaces across all HTTP queries and state properties.
* **Instant Hot Moduling:** Powered by Vite, compiling updates in just **662ms**.
* **Token Rotation Queue:** Secure JWT access renewal queueing that captures ongoing fetch requests during silent token refresh processes, resolving them concurrently upon success.

---

## 🛠️ Tech Stack

### Frontend
* **Core:** React (v18) + TypeScript
* **Build System:** Vite
* **Styling & Motion:** Tailwind CSS + Framer Motion (Micro-animations)
* **Audio Engineering:** Web Audio API (AnalyserNode, BiquadFilterNode, OscillatorNode)
* **Routing:** React Router DOM (v6)

### Backend
* **Runtime:** Node.js
* **Framework:** Express.js + TypeScript
* **Database:** SQLite (Relational structure and optimized schema layouts)
* **Authentication:** JWT (Dual Access & Refresh Token rotation)
* **Validation:** Zod Schemas

---

## 💻 Local Setup Guide

Follow these clear terminal steps to launch the FretFlow platform locally:

### 1. Clone The Repository
```bash
git clone https://github.com/ravanaliyev/FretFlow.git
cd FretFlow
```

### 2. Configure & Start The Frontend
```bash
# Install frontend package dependencies
npm install

# Start the Vite local development server
npm run dev
```
*The client application will run at **http://localhost:5173**.*

### 3. Configure & Start The Backend Server
Open a new terminal window and navigate to the backend subdirectory:
```bash
# Navigate to backend directory
cd guitar-backend

# Install backend dependencies
npm install

# Setup environmental configurations
cp .env.example .env
```
*Note: Open the `.env` file in your preferred editor to customize the `JWT_SECRET` key.*

```bash
# Initialize SQLite schemas, run seeds, and start Express server
npm run dev
```
*The Express server will dynamically bootstrap the SQLite database, seed all standard achievement badges and lesson curricula, and run at **http://localhost:3000**.*

---

<div align="center">
Tune your instrument, play your first note, and master the guitar with FretFlow! 🎸
</div>
