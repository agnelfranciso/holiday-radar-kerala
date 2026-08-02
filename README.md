# Kerala Weather & Holiday Predictor

A fast, static React dashboard designed to answer the single most important question every student in Kerala asks during a storm: **"Are we getting a holiday tomorrow?"**

This app acts as a highly specialized weather tracker that bypasses the dense, unreadable PDF tables published by the India Meteorological Department (IMD) by silently parsing the data in the background and presenting it in a beautiful, responsive, and color-coded map interface.

## 🚀 How it Works

1. **The PDF Bottleneck**: The IMD is the official source for weather alerts that the government uses to declare holidays, but they publish this data locked inside a PDF.
2. **The Automation**: A background Python script (`parse_imd.py`) utilizes `pdfplumber` to download and extract the color-coded alert tables directly from the IMD PDF.
3. **The Static Frontend**: The extracted data is exported to `forecast.json`. The React frontend statically loads this data and visualizes it, completely removing the need for a live backend server or database.
4. **Self-Updating**: Powered by GitHub Actions (`.github/workflows/auto-update.yml`), the Python script runs automatically every morning at 7:00 AM IST and every night at 9:00 PM IST. The fresh data is committed back to the repository, triggering an automatic Netlify redeployment.

## 🏗️ Tech Stack
- **Frontend**: React, TypeScript, Vite, React Router, CSS (Vanilla)
- **Data Scraping**: Python, `pdfplumber`
- **Automation**: GitHub Actions
- **Deployment**: Netlify

## 💻 Running it Locally

### Prerequisites
- Node.js (for the React app)
- Python 3.x (for the data scraper)

### 1. Generate the Data (Optional)
If you want to manually pull the latest weather data:
```bash
pip install pdfplumber requests
python parse_imd.py > web-app/public/forecast.json
```

### 2. Start the Frontend
```bash
cd web-app
npm install
npm run dev
```

The app will now be running on `http://localhost:5173`.

## 📌 Disclaimer
This dashboard is a standalone experimental lab project built by Agnel Francis Olakkengil. While the creator also developed [AerisIQ](https://agnel-francis.netlify.app/work/aerisiq) (an on-device AI disaster management app), **this dashboard will NOT be included in AerisIQ**. 

AerisIQ is built for serious situational awareness and survival. This web app exists separately as a simple tool to check if you might get a day off school.
