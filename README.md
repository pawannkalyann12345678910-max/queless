# 🎫 Queless — Enterprise Digital Token & Queue Elimination Platform

> **Zero Physical Queues.** Transforming clinics, hospitals, banks, universities, and public counters into seamless digital waiting experiences with live countdowns, proximity alerts, and HDMI waiting room broadcasting.

---

## 🌟 Key Features

- **⚡ 1-Click Digital Token Booking**: Real-time turn passes issued instantly with live queue positions and estimated consultation countdowns.
- **🔒 Mandatory Profile Setup**: Clean 1-time setup for visitor contact phone numbers ensuring turn notifications reach visitors.
- **🛡️ Enterprise Google Authentication**: Secured via Firebase Authentication with zero passwords.
- **👨‍💼 Automatic Staff Control Room Routing**: Authorized staff members who log in with their Google email are automatically recognized and routed into their assigned counter control room.
- **🔊 Web Audio Chime & Voice Announcer**: Dual-harmonic counter chime followed by real-time speech synthesis (`"Now calling Token DOC-101, please proceed to Counter 1"`).
- **📺 Public HDMI Waiting Room Screen**: Standalone live screen mode for TVs/monitors displaying the active token in real-time, next 5 tokens in line, and QR code for walk-ins.
- **📊 Business Analytics Dashboard**: Real-time throughput metrics, service times, and hourly activity.
- **💾 Oracle SQL Protocol Database**: Production-grade relational SQL database schema with full ACID consistency.

---

## 🏗️ Architecture & Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti
- **Backend**: Node.js, Express REST API, Pure Relational SQL Engine (Oracle Schema compatible)
- **Authentication**: Firebase Authentication (Google OAuth 2.0)
- **Broadcasting**: Web Audio API & Web Speech API

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/pawannkalyann12345678910-max/queless.git
cd queless
```

### 2. Install dependencies
```bash
# Frontend
npm install

# Backend
cd server
npm install
cd ..
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 4. Run the development servers
```bash
# Start Backend Server (Port 5000)
node server/index.js

# Start Frontend Application (Port 3000)
npm run dev
```

Visit **http://localhost:3000** in your browser.

---

## 📺 Public HDMI Waiting Room Display

To launch the public waiting room TV display for any queue:
- **URL format**: `http://localhost:3000/display/:queueId`
- Press `F11` for fullscreen mode on connected HDMI monitors/TVs.

---

## 📄 License

MIT © 2026 Queless Platform
