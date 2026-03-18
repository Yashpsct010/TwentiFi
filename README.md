# TwentiFi ⚡️

**The 25-minute life-logger for the ultra-productive.**

TwentiFi (formerly *The 25*) is a mobile-first habit tracker designed to capture the "reality of your day" in 20-minute pulses. Instead of asking what you *plan* to do, TwentiFi asks: **"What did you actually do?"**

---

## 🚀 Vision
Most apps focus on the future (calendars/todos). TwentiFi focuses on the **present**. By prompting you every 20 minutes, it builds a high-resolution timeline of your life, usage patterns, and productivity levels, then uses AI to coach you into a better version of yourself.

## ✨ Key Features
- **The 20-Minute Pulse**: Integrated notification system that prompts you every 20 minutes.
- **5-Second Logging**: Optimized UI for near-instant logging via voice or text.
- **Sarvam AI Transcription**: High-quality, context-aware speech-to-text for India-native accents and multilingual environments.
- **Gen-Z AI Insights**: Powered by **Gemini 3.1 Flash-Lite** to provide vibey, chaotic, yet deeply helpful productivity feedback.
- **Interactive Stats**: Real-time productivity scores, focus streaks, and activity breakdown charts.
- **Local-First Privacy**: Your logs live in a high-performance **SQLite** database on your device.

## 🛠 Tech Stack
- **Framework**: [Expo](https://expo.dev) (React Native) + [Expo Router](https://docs.expo.dev/router/introduction)
- **Styling**: [NativeWind](https://www.nativewind.dev/) (Tailwind CSS for Native)
- **State**: [Zustand](https://github.com/pmndrs/zustand) (Persistence via AsyncStorage)
- **Database**: [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- **AI/LLM**: Google Gemini 3.1 via **Firebase Vertex AI**
- **STT**: [Sarvam AI](https://www.sarvam.ai/) REST API

---

## 🛠 Setup & Development

### 1. Requirements
- Node.js (Latest LTS)
- Expo Go (for testing) or an Android/iOS Development Build

### 2. Installation
```bash
npm install
```

### 3. API Keys
To unlock full functionality, enter your keys in the **Settings** screen within the app:
- **Gemini API Key**: For notifications and insights.
- **Sarvam API Key**: For voice transcription accuracy.

### 4. Running Locally
```bash
# Start with version check skip (if network issues occur)
$env:EXPO_OFFLINE="1"; npx expo start -c

# Normal start
npx expo start
```

---

## 📂 Project Structure
```text
app/          # Expo Router pages (Tabs & Modals)
components/   # Reusable UI components
services/     # SQLite, Gemini, Sarvam, and Notification logic
store/        # Zustand stores for logs and sessions
hooks/        # Custom React hooks
```

## 📜 License
Private/Proprietary. Built for personal productivity excellence.
