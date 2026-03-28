# TwentiFi - Project Description & Architecture

## 1. Project Overview
**TwentiFi** is a mobile-first life logging application and lifestyle companion designed to capture the "reality of your day" in 20-minute pulses. While most productivity tools focus on future planning (calendars, to-do lists), TwentiFi focuses entirely on the **present**. By prompting users every 20 minutes to answer "What did you actually do?", the app builds a high-resolution, brutally honest timeline of daily behavior. Over time, it uses AI to provide deep insights, gamified streaks, and personalized coaching to help users optimize their time.

---

## 2. Technical Aspects & Tech Stack
TwentiFi is built using a modern, reactive, and mobile-first ecosystem.

- **Framework**: [Expo (React Native)](https://expo.dev/) driven by Expo Router for file-based navigation.
- **UI & Styling**: [NativeWind v4](https://www.nativewind.dev/) (Tailwind CSS for React Native) paired with React Native Reanimated for smooth micro-interactions.
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) for lightweight, fast global state, persisted via AsyncStorage.
- **Local Database**: [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) for high-performance, on-device data storage.
- **AI Processing**: Google Gemini (via `@react-native-firebase/vertexai` & REST API) for voice transcription and behavioral analysis.
- **Hardware Integrations**: Expo Notifications (for the 20-minute pulses), Expo Audio, and Expo Speech Recognition.
- **Promotional Website**: A Vite + React web application located in the `website/` directory to serve as a landing page.

---

## 3. Architecture & Backend Design

TwentiFi utilizes a **Local-First, Edge-AI Architecture**. It deliberately avoids a traditional cloud backend (like Node.js + PostgreSQL) to prioritize absolute user privacy, offline capabilities, and instant response times.

### The "Backendless" AI Approach
Instead of a centralized server, the app uses **Google Gemini** as an intelligent processing layer directly on the edge (device). 
- When a user logs their activity via voice, the Expo File System temporarily holds the audio chunk, hits the Gemini API for transcription, extracts the `mood` and `productivity_rating`, and returns the structured data.
- All Gen-Z styled coaching and daily summaries are generated dynamically via prompt-engineering against the LLM, rather than pre-programmed backend logic.

### Local Database Schema (SQLite)
All user data lives entirely on their mobile device within these core relational tables:
- **`sessions`**: Tracks the user's daily active block. Columns: `id`, `date`, `start_time`, `end_time`, `created_at`.
- **`logs`**: The granular 20-minute activity entries. Columns: `id`, `session_id`, `timestamp`, `activity_text`, `mood`, `productivity_rating`.
- **`goals`**: Daily objectives set by the user during the morning routine. Columns: `id`, `session_id`, `goal_text`, `completed`.
- **`settings`**: User preferences (API keys, theme, timer intervals).

---

## 4. Project Flow & Core User Loop

The UX is designed around frictionless habit formation. **Logging must take less than 5 seconds.**

1. **Morning Setup (Session Start)**
   - The user opens the app, defines their active hours (e.g., 9 AM to 5 PM), and sets top goals for the day.
   
2. **The 20-Minute Pulse (Notification Trigger)**
   - A local, scheduled background notification fires precisely every 20 minutes from the session start time.

3. **The 5-Second Response Window**
   - The user taps the notification and enters the quick-log UI. They speak or type a quick blurb (e.g., "Debugging the API endpoint"). 
   - *If skipped for 5 minutes, an aggressive reminder notification fires.*

4. **Timeline Assembly & AI Processing**
   - The input is saved to SQLite, categorized by mood (🔥 Deep Work, 😐 Neutral, 😫 Exhausted), and appended to the beautiful Daily Timeline view.

5. **End of Day Insights**
   - The app aggregates the 20-minute blocks, calculates a daily productivity score, updates the continuous Leetcode-style activity streak, and provides AI-driven coaching based on the day's cadence.

---

## 5. CI/CD & Deployment Strategy

TwentiFi implements a zero-cost, fully automated Continuous Deployment (CD) pipeline utilizing **EAS (Expo Application Services)** and **GitHub Actions**.

### Automated APK Publishing (`.github/workflows/build-apk.yml`)
- **Action Triggers**: The pipeline naturally runs on pushes to the `main` branch or when a release is triggered.
- **EAS Local Compilation**: The GitHub Runner executes `eas build --local --platform android`, bypassing Expo's cloud waiting queues and building the Android binary (`.apk`) directly inside the CI environment.
- **Release Automation**: Utilizing the GitHub CLI (`gh release`), the pipeline automatically force-updates the `latest` tag repository and uploads the fresh APK artifact. 
- **Website Synchronicity**: The Vite landing page is hardcoded to the continuous GitHub Release direct download URL (`/releases/latest/download/twentifi.apk`). This ensures that visitors to the website instantly receive the newest, stable version of the app within minutes of code being pushed.
