# 🌸 Sheon AI
### Bias-Calibrated Predictive Maternal Intelligence & Care Network

---

## ✨ Overview

Sheon AI is a full-stack, production-ready maternal health platform that uses a **custom bias-calibrated AI risk engine** to detect hidden risk patterns in pregnant and postpartum women — especially in underserved, rural, and tribal regions where systemic healthcare biases lead to under-diagnosis.  
✔️ Mothers now provide their **region** at signup so the system can automatically match them with a doctor serving that area.

---

## 🏗️ Tech Stack

| Layer       | Technology                                   |
|-------------|----------------------------------------------|
| Frontend    | React 18 + Vite, TailwindCSS, Framer Motion  |
| Backend     | Node.js, Express.js                          |
| Database    | MongoDB Atlas (Mongoose ODM)                 |
| Auth        | JWT + Bcrypt                                 |
| AI          | Google Gemini API (content only)             |
| Risk Engine | Custom weighted algorithm (no external AI)   |
| SMS         | Twilio or Fast2SMS                           |
| Real-time   | Socket.IO (live chat)                        |
| PDF         | PDFKit                                       |

---

## 📁 Project Structure

```
Sheon-ai/
├── backend/
│   ├── models/              # Mongoose models
│   │   ├── User.js
│   │   ├── MotherProfile.js
│   │   ├── RiskLog.js
│   │   ├── VisitAssignment.js
│   │   ├── VisitReport.js
│   │   ├── ChatMessage.js
│   │   ├── CommunityPost.js
│   │   ├── RegionAnalytics.js
│   │   └── SMSLog.js
│   ├── routes/              # Express routes
│   │   ├── auth.js
│   │   ├── mothers.js
│   │   ├── doctors.js
│   │   ├── nurses.js
│   │   ├── admin.js
│   │   ├── risk.js
│   │   ├── chat.js
│   │   ├── community.js
│   │   ├── visits.js
│   │   ├── sms.js
│   │   └── gemini.js
│   ├── middleware/
│   │   └── auth.js          # JWT protect + role authorize
│   ├── services/
│   │   ├── riskEngine.js    # Custom bias-calibrated scoring
│   │   ├── geminiService.js # Gemini AI integration
│   │   ├── smsService.js    # Twilio / Fast2SMS
│   │   └── heatmapService.js# Regional mock data
│   ├── server.js
│   ├── seed.js              # Demo data seeder
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── components/
│   │   │   └── common/
│   │   │       ├── DashboardLayout.jsx
│   │   │       ├── RiskGauge.jsx
│   │   │       └── ChatPanel.jsx
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── mother/
│   │   │   │   ├── PrenatalDashboard.jsx
│   │   │   │   └── PostnatalDashboard.jsx
│   │   │   ├── doctor/
│   │   │   │   └── DoctorDashboard.jsx
│   │   │   ├── nurse/
│   │   │   │   └── NurseDashboard.jsx
│   │   │   └── admin/
│   │   │       └── AdminDashboard.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── .env.example
└── README.md
```

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- Google Gemini API key (optional — fallbacks built in)
- Twilio or Fast2SMS account (optional — SMS features)

---

### Step 1: Clone & Install

```bash
# Clone the repo
git clone <your-repo-url>
cd Sheon-ai

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### Step 2: MongoDB Atlas Setup

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Create a database user (save username + password)
4. Whitelist your IP (or use `0.0.0.0/0` for development)
5. Click **Connect → Drivers** → copy the connection string

---

### Step 3: Configure Environment Variables

```bash
cd backend
cp ../.env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/Sheon
JWT_SECRET=your_long_random_secret_here
GEMINI_API_KEY=your_gemini_key          # optional
SMS_PROVIDER=twilio                     # or fast2sms
TWILIO_ACCOUNT_SID=ACxxx               # if using twilio
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
```

---

### Step 4: Seed the Database

```bash
cd backend
node seed.js
```

This creates all demo accounts + sample data.

---

### Step 5: Run the Application

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# → Server running on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# → App running on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🔑 Demo Login Credentials

| Role    | Email                     | Password    |
|---------|---------------------------|-------------|
| 👑 Admin  | admin@Sheon.com    | Admin@1234  |
| ⚕️ Doctor | doctor@demo.com           | Demo@1234   |
| 🩺 Nurse  | nurse@demo.com            | Demo@1234   |
| 💜 Mother (High Risk, Prenatal) | mother@demo.com | Demo@1234 |
| 💜 Mother (Moderate Risk) | mother2@demo.com | Demo@1234 |
| 💜 Mother (Postnatal) | mother3@demo.com | Demo@1234 |

---

## 🧠 Risk Engine Logic

The custom risk engine uses a **weighted scoring formula** with 5 factors:

| Factor | Weight | Scoring Range |
|--------|--------|--------------|
| Blood Pressure | 28% | Normal=10, Hypertension=80, Severe=100 |
| Hemoglobin | 22% | Normal=10, Moderate Anemia=75, Severe=100 |
| Blood Sugar | 20% | Normal=10, Gestational Diabetes=70 |
| Age | 15% | Optimal=10, Adolescent=80, Advanced=75 |
| Distance to Hospital | 15% | Proximate=5, Remote=65, Critical=90 |

**Bias Adjustment Multipliers:**
- Urban: 1.0x
- Semi-Urban: 1.15x
- Rural: 1.35x
- Hilly: 1.40x
- Tribal/Adivasi: 1.50x

**Silent Risk Detection** identifies dangerous symptom combinations:
- Headache + swelling → preeclampsia flag
- Visual disturbance + elevated BP → hypertensive crisis
- Epigastric pain + high BP → HELLP syndrome risk

---

## 🌟 Key Features by Role

### Mother (Prenatal)
- AI bias-calibrated risk score with explainable breakdown
- Animated circular risk gauge
- Comparison: calibrated vs uncalibrated score
- Weekly baby growth updates (Gemini)
- Personalized nutrition panel
- Trimester-based exercise plan
- Safe medication guidance
- Nurse visit request
- Community mom chat
- Private doctor chat (real-time Socket.IO)
- Automatic SMS on high risk

### Mother (Postnatal)
- Mood tracking with PPD detection
- Feeding log (type, duration)
- Sleep tracker
- Baby vaccination schedule
- Gemini emotional support messages
- Recovery guidance

### Doctor Portal
- High-risk mothers list with filters
- Region-based filtering (doctors only see mothers in their own region by default)
- Assign nurse to mother
- Emergency escalation with SMS
- Lab reminder SMS dispatch
- Real-time patient chat (urgent flag → SMS)
- Analytics dashboard

### Nurse Portal
- My assigned visits list
- Start visit with GPS location log
- Vitals capture form (BP, temp, weight, SpO2, pulse)
- Symptom observations + recommendations
- Submit report → triggers risk recalculation
- New risk level returned instantly

### Admin Control Center
- System-wide stats dashboard
- Pending approvals (doctor/nurse) with region assignment
- Create doctor/nurse accounts
- Regional heatmap with bias factors
- Prevented complication simulator
- SMS test panel + logs
- One-click PDF hospital report

---

## 🔌 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | Public | Mother self-registration |
| POST | /api/auth/login | Public | Login all roles |
| GET | /api/auth/me | Token | Get current user |
| POST | /api/auth/admin/create-staff | Admin | Create doctor/nurse |
| GET | /api/mothers/profile | Mother | Get own profile |
| PUT | /api/mothers/profile | Mother | Update vitals |
| POST | /api/mothers/feeding-log | Mother | Log feeding |
| POST | /api/mothers/mood-log | Mother | Log mood + PPD check |
| POST | /api/risk/calculate | Any Auth | Calculate risk score |
| GET | /api/risk/history/:id | Any Auth | Risk history |
| GET | /api/doctors/high-risk-mothers | Doctor | High risk list |
| POST | /api/doctors/assign-nurse | Doctor | Assign nurse + SMS |
| POST | /api/doctors/escalate | Doctor | Emergency escalation |
| GET | /api/nurses/my-visits | Nurse | My visits |
| PUT | /api/nurses/visits/:id/start | Nurse | Start visit |
| POST | /api/nurses/visits/:id/report | Nurse | Submit report |
| GET | /api/admin/dashboard-stats | Admin | System stats |
| GET | /api/admin/pending-approvals | Admin | Pending accounts |
| PUT | /api/admin/approve/:id | Admin | Approve user |
| GET | /api/admin/heatmap | Admin | Regional heatmap |
| GET | /api/admin/complication-simulator | Admin | Prevention sim |
| GET | /api/admin/generate-report | Admin | Download PDF |
| GET | /api/gemini/baby-update | Any Auth | Gemini baby update |
| GET | /api/gemini/nutrition | Any Auth | Nutrition plan |
| POST | /api/gemini/emotional-support | Any Auth | Support message |
| GET | /api/chat/:roomId/messages | Any Auth | Chat history |
| POST | /api/chat/:roomId/send | Any Auth | Send message |
| GET | /api/community/posts | Any Auth | Community posts |
| POST | /api/community/posts | Any Auth | Create post |

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Soft Lavender | `#C8A2FF` |
| Deep Violet | `#5B2EFF` |
| Warm Coral | `#FF6F61` |
| Background | `#0A0614` |
| Surface | `#130D24` |
| Card | `#1C1335` |
| Border | `#2D1F4E` |

---

## 📦 Build for Production

```bash
# Backend
cd backend
NODE_ENV=production node server.js

# Frontend
cd frontend
npm run build
# → dist/ folder ready for static hosting (Vercel, Netlify, etc.)
```

---

## 🏥 About Sheon AI

Sheon addresses India's maternal mortality challenge head-on. By correcting for regional healthcare biases — rural mothers receive 1.35x risk amplification, tribal areas 1.5x — the system ensures that distance, access disparities, and socioeconomic factors are factored into every risk assessment. The result: no mother's risk goes undetected because of where she lives.

**"Every mother deserves care — not just those near a hospital."**

---

*Built with 💜 for India's mothers.*
#   S h e o n - a i  
 #   S h e o n - a i  
 #   S h e o n - a i  
 