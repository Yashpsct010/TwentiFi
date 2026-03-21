# TwentiFi ⚡️

**The 20-minute life-logger for the ultra-productive.**

TwentiFi is a mobile-first lifestyle companion designed to capture the "reality of your day" in 20-minute pulses. Instead of planning your future, TwentiFi asks: **"What did you actually do?"** and uses AI to generate insights on your vibe.

---

## 🚀 Vision
Most apps focus on the future (calendars/todos). TwentiFi focuses on the **present**. By prompting you every 20 minutes, it builds a high-resolution timeline of your life, usage patterns, and productivity levels, then uses the Gemini AI to coach you into a better version of yourself.

## ✨ Key Features
- **The 20-Minute Pulse**: Integrated notification system that prompts you autonomously.
- **5-Second Logging**: Optimized UI for near-instant logging via voice or text.
- **Voice AI Transcription**: Powered natively by **Gemini 3.1 Flash-Lite** for perfect context-aware speech-to-text.
- **Gen-Z AI Insights**: Deeply personalized productivity feedback and push notification generation.
- **Interactive Streak Calendar**: Visualize your 6-month consistency in a gorgeous Leetcode-style activity grid.
- **Promotional Website**: A beautiful glassmorphism landing page located in `website/` with automated APK GitHub Action build workflows.
- **Local-First Privacy**: Your logs live in a high-performance **SQLite** database on your device.

## 🛠 Tech Stack
- **Framework**: [Expo](https://expo.dev) (React Native) + [Expo Router](https://docs.expo.dev/router/introduction) + [Vite React (Website)](https://vitejs.dev/)
- **Styling**: [NativeWind](https://www.nativewind.dev/) (Tailwind CSS for Native & Web)
- **State**: [Zustand](https://github.com/pmndrs/zustand) (Persistence via AsyncStorage)
- **Database**: [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- **AI/LLM**: Google Gemini 3.1 Flash-Lite REST API
- **Deployment**: Zero-cost automated APK generation via `.github/workflows` to GitHub Releases.

---

## 🛠 Setup & Development

### 1. Requirements
- Node.js (Latest LTS)
- Expo Go (for testing) or an Android/iOS Development Build

### 2. Installation
```bash
# Install App Dependencies
npm install

# Install Website Dependencies
cd website
npm install
```

### 3. API Keys
To unlock full AI functionality, generate a free API Key from [Google AI Studio](https://aistudio.google.com/app/apikey) and enter it during the TwentiFi app **Onboarding** or in the **Settings** screen!

### 4. Running Locally
```bash
# Start Mobile App
npx expo start -c

# Start Website
cd website
npm run dev
```

---

## 📂 Project Structure
```text
app/          # Expo Router pages (Tabs & Modals, with Onboarding)
assets/       # Images and splash screens
components/   # Reusable UI components (StreakCalendar, etc.)
services/     # SQLite, Gemini REST APIs, and Notification logic
store/        # Zustand stores for logs, user settings, and sessions
website/      # React Vite promotional website
```

## 📜 License
Private/Proprietary. Built for personal productivity excellence.
