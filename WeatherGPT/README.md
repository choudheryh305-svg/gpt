# WeatherGPT — Intelligent Multilingual Weather Assistant 🌦️🤖

An intermediate-level, AI-powered weather assistant engineered for student hackathons (such as SIH — Smart India Hackathon) and college presentations. **WeatherGPT** bridges official meteorological data from **Open-Meteo** with bilingual conversational intelligence and voice interaction in **English** and **हिन्दी (Hindi)**.

---

## 🌟 Key Features

- 📍 **Precision Weather & Geocoding**: Search any Indian or global city or use browser GPS with automatic reverse geocoding via Open-Meteo.
- 🌡️ **Comprehensive Dashboard**: Real-time temperature, "feels-like", relative humidity, wind speed & direction, rain probability, and WMO condition icons.
- 📅 **7-Day Forecast Grid**: Min/max temperatures, precipitation odds, and weather state indicators.
- 📈 **Interactive Visual Charts**: 24-hour hourly trend visualizations for temperature, rain %, and wind speeds using Chart.js.
- 🤖 **Grounded Conversational Assistant**:
  - Answers questions naturally ("Will it rain tomorrow?", "Do I need an umbrella?", "How hot will it get today?", "Is it windy?").
  - **No Hallucinations**: Strictly grounded in Open-Meteo calculations.
- 🌾 **Farmer & Rural Community Advisory**:
  - Dedicated agricultural weather summaries (e.g. crop protection during rain, spraying guidance).
  - Voice-driven Hindi query understanding: *"कल बारिश की कितनी संभावना है?"*
- 🚨 **Weather-Based Alerts**: Automatic warning banners for high rain (>60%), extreme heat (>40°C), and strong winds (>35 km/h).
- 🇮🇳 **Multilingual & Dual-Tier Voice Architecture**:
  - **Production Mode**: Digital India **BHASHINI** (MeitY) Dhruva API integration for ASR, Translation, and TTS.
  - **Development / Standalone Mode**: Seamless zero-setup fallback using Web Speech Recognition and SpeechSynthesis.
- 🌓 **Dark & Light Mode**: Modern glassmorphic theme with persistent preferences.
- ⭐ **Favorites & Search History**: Save bookmarked locations and view recent searches via LocalStorage.
- 📱 **100% Responsive Design**: Optimized for Desktop, Laptop, Tablet, and Mobile devices.

---

## 🏗️ System Architecture

```
User
  │
  ├── 🎤 Voice Input (Hindi / English)
  │     ↓
  │   BHASHINI ASR (Speech-to-Text)  [or Web Speech API fallback]
  │     ↓
  │   User Query (Text)
  │
  ├── ⌨️ Typed Input
        ↓
WeatherGPT Backend (Node.js / Express)
  ├── 1. Geocoding & Coordinates Lookup  ──>  Open-Meteo Geocoding API
  ├── 2. Weather & Forecast Retrieval    ──>  Open-Meteo Forecast API
  ├── 3. Intent & Grounded Reasoning     ──>  Intent Engine (No Hallucination)
  └── 4. Language Translation            ──>  BHASHINI IndicTrans NMT
        ↓
WeatherGPT Grounded Response
  ├── Text Response & Advisories (EN / HI)
  └── 🔊 Voice Output  ──>  BHASHINI TTS [or Web SpeechSynthesis fallback]
```

### Technical Honesty Disclosure (Section 11)
WeatherGPT obtains real-time meteorological metrics from Open-Meteo (temperature, wind, humidity, precipitation). It **does not** fabricate marine wave heights, ocean currents, or marine navigation safety zones unless a certified oceanographic marine API is integrated.

---

## 📁 Project Structure

```
WeatherGPT/
├── backend/
│   ├── server.js               # Express server entry point & static host
│   ├── routes/
│   │   ├── weather.js          # Open-Meteo proxy endpoints (geocode, forecast, reverse)
│   │   ├── chat.js             # Conversational logic with weather data grounding
│   │   └── voice.js            # BHASHINI ASR, Translation & TTS proxy routes
│   └── services/
│       ├── openMeteoService.js # Open-Meteo API communication & WMO code mapper
│       ├── intentService.js    # Grounded intent parser (English & Hindi)
│       └── bhashiniService.js  # Digital India BHASHINI Dhruva API handler
│
├── frontend/
│   ├── index.html              # WeatherGPT Dashboard & Chatbot UI
│   ├── css/
│   │   ├── style.css           # Modern glassmorphism, themes & typography
│   │   └── responsive.css      # Mobile, tablet, & laptop breakpoints
│   └── js/
│       ├── app.js              # Application coordinator & language switcher
│       ├── weather.js          # Weather fetching & dashboard DOM manager
│       ├── charts.js           # Chart.js hourly visualizer
│       ├── chatbot.js          # Chatbot controller & recommendation renderer
│       ├── voice.js            # Voice recording & dual-mode TTS
│       └── storage.js          # LocalStorage manager (Favorites & Recents)
│
├── .env.example                # Template for environment configuration
├── .env                        # Local environment variables
├── .gitignore                  # Prevents committing secrets or dependencies
├── package.json                # Project dependencies & scripts
└── README.md                   # Documentation & SIH presentation guide
```

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18+ recommended)
- Modern web browser (Chrome, Edge, Firefox, or Safari)

### 1. Installation
Open your terminal in the `WeatherGPT` folder and install dependencies:
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

### 3. Open in Browser
Visit **`http://localhost:3000`** in your browser.

---

## 🇮🇳 Digital India BHASHINI Configuration

WeatherGPT is designed with a **zero-blocker approach**:
- **Without BHASHINI keys**: The app functions **100% out of the box** using the browser's native Web Speech Recognition & SpeechSynthesis APIs.
- **With BHASHINI keys**: The app connects to the official Government of India MeitY Dhruva API.

### How to obtain official BHASHINI credentials:
1. Register on the official portal: [https://bhashini.gov.in/](https://bhashini.gov.in/) or [https://ulca.bhashini.gov.in/](https://ulca.bhashini.gov.in/)
2. Request access under **API Access / Inference Services**.
3. Once approved, copy your credentials into your `.env` file:
   ```env
   BHASHINI_USER_ID=your_user_id
   BHASHINI_API_KEY=your_ulca_api_key
   BHASHINI_INFERENCE_KEY=your_inference_api_key
   ```
4. Restart your server (`npm start`). WeatherGPT will automatically route voice and translation through the official MeitY Dhruva pipeline!

---

## 🧪 Testing Checklist

| Feature | Test Action | Expected Result |
| :--- | :--- | :--- |
| **City Search** | Search "Meerut" or "Delhi" | Weather card, 7-day forecast & charts update |
| **Geolocation** | Click "My Location" | Fetches GPS coordinates and displays local weather |
| **Theme Toggle** | Click 🌙 / ☀️ in navbar | Switches instantly between Dark & Light themes |
| **Language Switch** | Select "हिन्दी" in dropdown | All dashboard labels and responses switch to Hindi |
| **Voice Input** | Click 🎤 and say *"कल बारिश होगी?"* | Recognized text appears and WeatherGPT answers in Hindi |
| **Voice Output** | Click 🔊 "Listen" on any answer | Speech synthesis plays the answer aloud |
| **Chat Grounding** | Ask "Do I need an umbrella?" | Answers accurately based on actual rain probability |
| **Weather Alerts** | Search a city with high rain/heat | Alert banner displays with advisory notes |

---

## 🎤 SIH Presentation Pitch Script

> *"Respected judges, WeatherGPT is an intelligent, voice-first multilingual weather assistant designed to democratize weather access for everyday citizens, farmers, and rural communities.*
> 
> *Instead of confusing numbers and complex meteorological charts, users can simply speak in their mother tongue — such as asking 'कल बारिश होगी क्या?' — and WeatherGPT provides an honest, data-grounded answer in spoken Hindi using live Open-Meteo data and Digital India BHASHINI language technology.*
> 
> *Our architecture cleanly decouples the meteorological data provider from the language and voice layer, ensuring zero hallucinated predictions and reliable operation across desktop, tablet, and mobile devices."*
