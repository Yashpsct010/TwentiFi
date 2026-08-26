# TwentiFi - Project Description & Architecture

## 1. Project Overview
**TwentiFi** is a mobile-first life logging application and lifestyle companion designed to capture the "reality of your day" in 20-minute pulses. While most productivity tools focus on future planning (calendars, to-do lists), TwentiFi focuses entirely on the **present**. By prompting users every 20 minutes to answer "What did you actually do?", the app builds a high-resolution, brutally honest timeline of daily behavior. Over time, it uses AI to provide deep insights, gamified streaks, and personalized coaching to help users optimize their time.

---

## 2. Technical Aspects & Tech Stack
TwentiFi is built using a modern, reactive, and mobile-first ecosystem.

- **Framework**: [Expo (React Native)](https://expo.dev/) driven by Expo Router for file-based navigation.
- **UI & Styling**: [NativeWind v4](https://www.nativewind.dev/) (Tailwind CSS for React Native) paired with React Native Reanimated for smooth micro-interactions, an animated video splash screen, and the theme-aware "Vellum Ledger" aesthetic.
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) for lightweight, fast global state (featuring specialized stores for Logs, Sessions, Milestones, Insights, Dialogs, Groups, Quotes, and Settings), persisted via AsyncStorage.
- **Local Database**: [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) for high-performance, on-device data storage.
- **AI Processing**: Google Gemini (via `@react-native-firebase/vertexai` & REST API) for voice transcription and behavioral analysis.
- **Hardware Integrations**: Expo Notifications (smart alerts for the 20-minute pulses), Expo Audio, Expo Speech Recognition, and Expo Haptics.
- **Promotional Website**: A Vite + React web application located in the `website/` directory featuring a dynamic hero video to serve as a landing page.

---

## 3. Architecture & Backend Design

TwentiFi utilizes a **Local-First, Edge-AI Architecture**. It deliberately avoids a traditional cloud backend (like Node.js + PostgreSQL) to prioritize absolute user privacy, offline capabilities, and instant response times.

### The "Backendless" AI Approach
Instead of a centralized server, the app uses **Google Gemini** as an intelligent processing layer directly on the edge (device). 
- When a user logs their activity via voice, the Expo File System temporarily holds the audio chunk, hits the Gemini API for transcription, extracts the `mood` and `productivity_rating`, and returns the structured data.
- All Gen-Z styled coaching and daily summaries are generated dynamically via prompt-engineering against the LLM, rather than pre-programmed backend logic.

### Local Database Schema (SQLite)
All user data lives entirely on their mobile device within the `the25.db` SQLite database:
- **`logs`**: Granular pulse entries. Columns: `id`, `timestamp`, `activity`, `mood` (`focused`, `neutral`, `exhausted`, `deep_work`), `productivity` (1–5), `audioUri`, `environment`, `tags` (JSON array), `remarks`, `duration`, `groupName`.
- **State & Session Persistence (AsyncStorage / Zustand)**:
  - `session-storage`: Active session state (`isActive`, `startTime`, `goals`, `activeMilestoneId`, notification IDs).
  - `milestone-storage`: Habit and Target roadmaps, tasks (`pending`, `completed`, `carried`), daily reset dates, and progress.
  - `settings-storage`: User preferences (`userName`, `startOfDay`, `endOfDay`, `loggingInterval`, `activityPrompts`, `missedLogReminders`, `geminiApiKey`, `theme`, `customTags`, `eodNotificationId`).
  - `group-storage`: User-defined project groups for AI categorization.
  - `insight-storage`: Cached AI daily summaries, advice, and productivity scores.
  - `quote-storage`: Cached daily AI quotes, authors, and visual keywords.

---

## 4. Project Flow & Core User Loop

The UX is designed around frictionless habit formation and rapid, continuous pulse logging:

1. **Initialization & Onboarding**
   - **Boot Lifecycle**: On launch, the app initializes the SQLite database (`initDB`), loads existing logs, checks for a calendar day transition to automatically reset daily habit milestones (`resetHabitsIfNewDay`), re-hydrates notifications for any ongoing active sessions, and registers scheduled End-of-Day (EOD) reminders.
   - **Onboarding Carousel**: First-time users navigate through a 5-step walkthrough (Introduction, Voice & AI Insights, Streaks, Smart Notification permissions, and Google AI Studio Gemini API Key setup).

2. **Pre-Session Setup & Milestone Alignment (Dashboard)**
   - The user opens the Home Dashboard, greeted by personalized operating hours (`startOfDay` – `endOfDay`) and a dynamic `WisdomPulse` daily AI quote.
   - The user can optionally link an active **Milestone** (Habit or Target roadmap) to automatically load pending and carried tasks into the session queue, or manage tasks directly.
   - Tasks can be expanded into actionable subtasks with one tap via Gemini AI (`expandTaskWithGemini`) or reordered via drag-and-drop.

3. **Session Start & Smart Notifications**
   - Tapping **"Start Session"** activates the session stopwatch (`sessionStore`), schedules a 2-hour forgotten timer safety reminder (`scheduleForgotTimerReminder`), and schedules recurring pulse notifications (`schedulePulseNotification`) at the user-configured interval (default 20 minutes) powered by Gen-Z prompt templates or Gemini AI generation.
   - While active, the user sees a live elapsed stopwatch (with Pause/Resume and Lap reset) and interactive checklist tasks.

4. **The Pulse Logging Flow (Modal)**
   - Triggered either manually via the "+ Log" button or by tapping a scheduled pulse/reminder notification.
   - **Voice or Text Input**: The user can dictate via speech recognition (`expo-speech-recognition` / `expo-audio`). Audio is saved persistently to local app storage (`twentifi-audio/`) and transcribed via Google Gemini API (`transcribeWithGemini`).
   - **Metadata Capture**: The user selects a mood (`focused`, `neutral`, `exhausted`, `deep_work`), productivity rating (1–5), optional environment (Home, Office, Cafe, Commute, Library, or Custom), tags, and remarks.
   - **AI Auto-Categorization**: On save, Gemini automatically analyzes the activity context and assigns it to a matching user-defined Project Group (`assignGroupWithGemini`).
   - **Pulse Reschedule**: Saving a log automatically resets and schedules the next pulse timer for seamless continuity.

5. **Session Completion & Task Carrying**
   - When the user taps **"End Session"**, completed tasks are marked done, unfinished tasks in active milestones transition to `carried` status for subsequent sessions, and active timer notifications are canceled.

6. **Timeline, Streaks & AI Coaching**
   - **Timeline & Projects**: The Timeline tab displays today's logs grouped by Project Group with inline audio playback; the Projects view aggregates historical totals and session archives across categories.
   - **Stats & Streak Calendar**: Visualizes a continuous multi-week GitHub/LeetCode-style activity streak calendar and mood distribution.
   - **AI Daily Coaching**: Gemini evaluates the daily log timeline to generate structured insights (`summary`, actionable `advice`, and overall `productivityLevel`).

7. **Data Sovereignty & Local Backup**
   - Full offline privacy: Users can export a complete `.zip` archive containing their SQLite database (`the25.db`) and all persistent voice recordings (`twentifi-audio/`), or import and merge archives from external storage.

---

## 5. CI/CD & Deployment Strategy

TwentiFi implements a zero-cost, fully automated Continuous Deployment (CD) pipeline utilizing **EAS (Expo Application Services)** and **GitHub Actions**.

### Automated APK Publishing (`.github/workflows/build-apk.yml`)
- **Action Triggers**: The pipeline naturally runs on pushes to the `main` branch or when a release is triggered.
- **EAS Local Compilation**: The GitHub Runner executes `eas build --local --platform android`, bypassing Expo's cloud waiting queues and building the Android binary (`.apk`) directly inside the CI environment.
- **Release Automation**: Utilizing the GitHub CLI (`gh release`), the pipeline automatically force-updates the `latest` tag repository and uploads the fresh APK artifact. 
- **Website Synchronicity**: The Vite landing page is hardcoded to the continuous GitHub Release direct download URL (`/releases/latest/download/twentifi.apk`). This ensures that visitors to the website instantly receive the newest, stable version of the app within minutes of code being pushed.
