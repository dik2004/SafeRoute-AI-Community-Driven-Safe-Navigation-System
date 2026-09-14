# 🛡️ SafeRoute AI

### Community-Driven Safe Navigation System

> **Navigate smarter. Travel safer. Look out for each other.**

SafeRoute AI is a community-driven navigation platform that goes beyond traditional shortest-path navigation by considering **safety conditions, community-reported incidents, safety infrastructure, and time of travel**.

The platform helps users identify safer routes, report hazards, discover nearby safe locations, monitor journeys through **Guardian Walk**, and trigger emergency **SOS assistance** when required.

---

## 🌟 Why SafeRoute?

Traditional navigation applications primarily focus on:

**Distance + Time + Traffic**

SafeRoute introduces another important factor:

**Distance + Time + Safety**

A route that is slightly longer may provide a better safety profile because of factors such as reported incidents, available safety infrastructure, and local safety conditions.

---

## ✨ Features

| Feature                       | Description                                                  |
| ----------------------------- | ------------------------------------------------------------ |
| 🗺️ **Safe Route Planning**   | Calculates route options with safety-aware scoring           |
| 📍 **Live GPS**               | Uses browser GPS to determine the user's current location    |
| ⚠️ **Incident Reporting**     | Allows users to report hazards and unsafe situations         |
| 👍 **Community Verification** | Users can upvote/confirm reported incidents                  |
| 🛡️ **Safety Points**         | Add useful safety infrastructure to the map                  |
| 🚶 **Guardian Walk**          | Monitors a user's active walking journey                     |
| 🆘 **SOS Assistance**         | Provides emergency alert functionality                       |
| 📊 **Safety Analytics**       | Displays area-level safety information and statistics        |
| 🏆 **Guardian Points**        | Rewards users for contributing to the safety community       |
| 🔎 **Global Location Search** | Searches locations using multiple geocoding sources          |
| 🌙 **Time-Aware Safety**      | Safety calculations can consider the selected time of travel |

---

# 🗺️ How It Works

```text
                 USER
                  │
                  ▼
        ┌─────────────────────┐
        │ Select destination  │
        │ / use live GPS      │
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │   Route Planner     │
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │ Node.js / Express   │
        │      Backend        │
        └──────────┬──────────┘
                   │
          ┌────────┼─────────┐
          ▼        ▼         ▼
       OSRM      MongoDB    Safety
      Routing              Scoring
          │        │         │
          └────────┼─────────┘
                   ▼
        ┌─────────────────────┐
        │ Safety-aware routes │
        └──────────┬──────────┘
                   │
                   ▼
             USER CHOOSES
              A ROUTE
                   │
                   ▼
        ┌─────────────────────┐
        │   Guardian Walk     │
        │      (Optional)     │
        └─────────────────────┘
```

---

# 🧠 Safety Scoring

SafeRoute does not treat the shortest route as automatically being the best route.

The backend contains a dedicated:

```text
services/safetyScorer.js
```

service responsible for evaluating safety-related information.

Route calculation uses information such as:

* Route distance
* Estimated travel time
* Reported incidents
* Safety points
* Local safety conditions
* Time of day

The resulting routes can then be compared using their safety characteristics.

---

# 🛠️ Technology Stack

## Frontend

* ⚛️ React 19
* ⚡ Vite
* 🎨 Tailwind CSS
* 🗺️ Leaflet
* 📍 React Leaflet
* 🎯 Lucide React
* 🎉 Canvas Confetti

## Backend

* 🟢 Node.js
* 🚂 Express.js
* 🍃 MongoDB
* 🧩 Mongoose
* 🔐 JWT
* 🔒 bcryptjs
* 🌐 Axios
* 📡 CORS
* 📝 Morgan
* 🔑 dotenv
* 📱 Twilio

## External Services

* **OSRM** — Route calculation
* **Photon** — Location search and reverse geocoding
* **OpenStreetMap Nominatim** — Geocoding fallback
* **Twilio** — Emergency communication
* **Browser Geolocation API** — Live GPS location

---

# 📁 Project Structure

```text
SafeRoute-AI-Community-Driven-Safe-Navigation-System/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   │
│   │   ├── controllers/
│   │   │   ├── analyticsController.js
│   │   │   ├── incidentController.js
│   │   │   ├── routeController.js
│   │   │   ├── safetyPointController.js
│   │   │   ├── sosController.js
│   │   │   └── userController.js
│   │   │
│   │   ├── models/
│   │   │   ├── Incident.js
│   │   │   ├── SafetyPoint.js
│   │   │   └── User.js
│   │   │
│   │   ├── routes/
│   │   │   └── api.js
│   │   │
│   │   ├── seed/
│   │   │   └── seedData.js
│   │   │
│   │   ├── services/
│   │   │   ├── osrmRouting.js
│   │   │   └── safetyScorer.js
│   │   │
│   │   └── server.js
│   │
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AddSafetyPointModal.jsx
│   │   │   ├── AnalyticsDashboard.jsx
│   │   │   ├── GuardianWalk.jsx
│   │   │   ├── IncidentFeed.jsx
│   │   │   ├── IncidentModal.jsx
│   │   │   ├── LocationExplorerModal.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProfileModal.jsx
│   │   │   ├── RoutePlanner.jsx
│   │   │   ├── SafeHavens.jsx
│   │   │   ├── SafetyMap.jsx
│   │   │   └── SosModal.jsx
│   │   │
│   │   ├── data/
│   │   │   └── locationHierarchy.js
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── render.yaml
├── .gitignore
└── README.md
```

---

# 🔄 Main Application Flow

### 1. Location

The user can use their current GPS position or select a location manually.

### 2. Destination

The destination can be selected through the location search or directly from the map.

### 3. Route Calculation

The frontend sends the origin, destination, travel mode, and selected time of day to the backend.

```text
POST /api/routes/calculate
```

### 4. Safety Evaluation

The backend obtains route information and evaluates safety-related factors.

### 5. Route Selection

The user receives route options and can select the route that best fits their needs.

### 6. Guardian Walk

For walking journeys, the user can activate Guardian Walk to monitor the journey.

---

# ⚠️ Community Safety Network

SafeRoute allows users to actively contribute to the platform.

### Report an Incident

```text
User → Report Hazard → Backend → MongoDB → Community Map
```

### Confirm an Incident

```text
User → Upvote Incident → Backend → Updated Community Data
```

### Add Safety Infrastructure

```text
User → Add Safety Point → Backend → MongoDB → Safety Map
```

This creates a feedback loop where the navigation system becomes more useful as the community contributes more safety information.

---

# 🏆 Guardian Points

SafeRoute includes a community contribution/reward mechanism.

Users can earn Guardian Points for activities such as:

* Reporting hazards
* Confirming incidents
* Adding safety infrastructure

This encourages users to contribute information that can benefit other travelers.

---

# 🆘 Emergency SOS

SafeRoute includes an SOS workflow designed for emergency situations.

The frontend sends the emergency request to:

```text
POST /api/sos/trigger
```

The backend contains a dedicated SOS controller and Twilio integration for emergency communication.

> **Important:** Production deployments should configure Twilio credentials securely using server-side environment variables.

---

# 📊 Analytics

The application includes an analytics dashboard for displaying safety information.

Available backend functionality includes:

```text
GET /api/analytics/overview
GET /api/analytics/area-score
```

The analytics layer can be used to understand:

* Area safety conditions
* Incident activity
* Safety infrastructure
* Community contribution
* Overall safety statistics

---

# 🔌 API Overview

| Method | Endpoint                     | Purpose                       |
| ------ | ---------------------------- | ----------------------------- |
| GET    | `/api/health`                | Backend health check          |
| POST   | `/api/routes/calculate`      | Calculate safety-aware routes |
| GET    | `/api/incidents`             | Retrieve incidents            |
| POST   | `/api/incidents`             | Report an incident            |
| PATCH  | `/api/incidents/:id/upvote`  | Confirm an incident           |
| PATCH  | `/api/incidents/:id/resolve` | Resolve an incident           |
| GET    | `/api/safety-points`         | Retrieve safety points        |
| POST   | `/api/safety-points`         | Add safety point              |
| GET    | `/api/analytics/overview`    | Retrieve overview statistics  |
| GET    | `/api/analytics/area-score`  | Retrieve area safety score    |
| GET    | `/api/user/profile`          | Retrieve user profile         |
| PUT    | `/api/user/profile`          | Update user profile           |
| POST   | `/api/user/points`           | Award Guardian Points         |
| POST   | `/api/sos/trigger`           | Trigger SOS                   |
| POST   | `/api/sos/cancel`            | Cancel SOS                    |

---

# 🚀 Getting Started

## Prerequisites

Make sure you have:

* Node.js
* npm
* MongoDB
* Git

---

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/dik2004/SafeRoute-AI-Community-Driven-Safe-Navigation-System.git
```

```bash
cd SafeRoute-AI-Community-Driven-Safe-Navigation-System
```

---

## 2️⃣ Backend Setup

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create:

```text
backend/.env
```

Add the required environment variables:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_API_KEY_SID=your_twilio_api_key_sid
TWILIO_API_SECRET=your_twilio_api_secret
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

Then start the server:

```bash
npm start
```

For development:

```bash
npm run dev
```

---

## 3️⃣ Frontend Setup

Open a second terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

For local development, the frontend can use:

```env
VITE_API_URL=http://localhost:5000
```

Start Vite:

```bash
npm run dev
```

---

# 🔐 Environment Variables & Security

Sensitive credentials are **not stored in the repository**.

The project uses environment variables for backend configuration and third-party services.

### Never commit:

```text
.env
.env.local
.env.*.local
```

API credentials such as Twilio secrets and database credentials should remain **server-side**.

For production deployment, configure them through the hosting provider's environment-variable settings.

---

# ☁️ Deployment

The repository contains:

```text
render.yaml
```

which defines the project's Render deployment configuration.

### Backend

```text
Root Directory: backend
Build Command: npm install
Start Command: npm start
```

### Frontend

```text
Root Directory: frontend
Build Command: npm install && npm run build
Publish Directory: ./dist
```

The frontend uses:

```text
VITE_API_URL
```

to communicate with the deployed backend.

---

# 🖼️ Screenshots

> Add screenshots of the main application screens here.

Recommended screenshots:

### 🗺️ Safety Map

```text
Add screenshot here
```

### 🛣️ Route Planner

```text
Add screenshot here
```

### ⚠️ Incident Reporting

```text
Add screenshot here
```

### 🚶 Guardian Walk

```text
Add screenshot here
```

### 🆘 SOS

```text
Add screenshot here
```

### 📊 Analytics Dashboard

```text
Add screenshot here
```

You can later replace these placeholders with:

```markdown
![Safety Map](./screenshots/safety-map.png)
```

---

# 🎥 Demo

### Live Application

**Frontend:** Add deployed frontend URL here

**Backend API:** Add deployed backend URL here

### Demo Video

Add your project demonstration video here when available.

---

# 🔮 Future Enhancements

* 🤖 Machine-learning-based risk prediction
* 📈 Historical safety trend analysis
* 🚨 Integration with official emergency services
* 📱 Dedicated Android/iOS application
* 🔔 Push notifications
* 🧠 Predictive incident hotspots
* 👥 Improved real-time community reporting
* 🗺️ More advanced geospatial analysis
* 🔒 Enhanced privacy controls for location data
* 🌐 More comprehensive global safety datasets

---

# 🎯 Project Vision

SafeRoute AI aims to transform navigation from:

> **"How do I get there fastest?"**

to:

> **"How can I get there safely?"**

By combining navigation technology, geospatial data, community reporting, safety scoring, and emergency assistance, SafeRoute creates a navigation experience where **users don't just navigate places — they help make those places safer for everyone.**

---

## 👩‍💻 Author

**Diksha**
B.Tech — Computer Science & Engineering

---

## 📄 License

This project was developed for educational and project purposes.

