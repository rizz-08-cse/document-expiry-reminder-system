# Document Expiry Reminder System

A full-stack, production-oriented application designed to track personal and official documents (such as Indian Driving Licences, Passports, Vehicle Insurance, RC, and Professional Certifications) and dispatch automated expiry notifications via MSG91 SMS and in-app alerts scheduled in **Indian Standard Time (IST - Asia/Kolkata)**.

---

## 🌟 Key Capabilities

### 🛡️ Privacy & Compliance First
- **No Document Image Uploads Required:** Only metadata (Title, Type, Expiry Date, Document Number, and Notes) is collected.
- **Tenant Isolation:** Customers can only view and mutate their own documents. Cross-tenant queries are blocked at the database and middleware layers.
- **Strict Indian Phone Validation:** Automatically validates and normalizes 10-digit Indian mobile numbers (`^[6-9]\d{9}$`).

### ⏰ Intelligent Asia/Kolkata Scheduling
- Persistent `node-cron` scheduler configured for daily automated sweeps at 9:00 AM IST (`Asia/Kolkata`).
- Multi-stage notification triggers: **30 days, 7 days, 1 day before expiry, and on the exact expiry day**.
- **Unique MongoDB Idempotency Keys:** Every reminder record is identified by `<docId>_<stage>_<YYYY-MM-DD>`, preventing duplicate SMS dispatch across server restarts or repeated scheduler runs.

### 📱 Enterprise SMS Integration (MSG91 Flow API)
- Official **MSG91 Flow API** integration with DLT approved Template ID and Sender ID.
- **Zero-Cost Simulation / Demo Mode:** Default safe mode for development that logs dispatches without incurring carrier costs.
- **Safety Guards:** Never dispatches cellular SMS to test/dummy seed numbers or to users who have opted out of SMS consent.
- **Administrative Test SMS Tool:** Explicit recipient confirmation required before sending diagnostic test messages.

---

## 🛠️ Architecture & Tech Stack

```
                                 ┌─────────────────────────────────┐
                                 │       React + Vite Frontend     │
                                 │    (Responsive Tailwind/CSS)    │
                                 └────────────────┬────────────────┘
                                                  │ REST / JSON (JWT)
                                                  ▼
                                 ┌─────────────────────────────────┐
                                 │     Node.js + Express API       │
                                 │   - Role-Based Access Control   │
                                 │   - Rate Limiting & Security    │
                                 └───────┬─────────────────┬───────┘
                                         │                 │
                   ┌─────────────────────┴─────┐     ┌─────┴──────────────────┐
                   ▼                           ▼     ▼                        ▼
       ┌───────────────────────┐    ┌────────────────────┐   ┌──────────────────────┐
       │     MongoDB Atlas     │    │   Asia/Kolkata     │   │     MSG91 Engine     │
       │  (Users, Documents,   │    │  node-cron Engine  │   │  (Flow API / Safe    │
       │   Logs, Notifications)│    │ (Daily 9:00 AM IST)│   │   Simulation Mode)   │
       └───────────────────────┘    └────────────────────┘   └──────────────────────┘
```

- **Frontend:** React 18, Vite, React Router v6, Lucide Icons, Responsive CSS Design System.
- **Backend:** Node.js, Express, Mongoose, JSON Web Token (JWT), bcryptjs, express-rate-limit, node-cron.
- **Database:** MongoDB Atlas (with in-memory fallback for immediate zero-config development).
- **Scheduling:** `node-cron` with `{ timezone: 'Asia/Kolkata' }`.
- **SMS Gateway:** MSG91 Flow API with fallbacks and safe simulation mode.

---

## 📂 Project Organization

```
Document expiry reminder system/
├── client/                     # Frontend Application (React + Vite)
│   ├── src/
│   │   ├── components/         # Navbar, Sidebar, Modals, StatusBadges, ProtectedRoute
│   │   ├── context/            # AuthContext (JWT, session), ToastContext
│   │   ├── pages/              # LandingPage, LoginPage, RegisterPage, AdminLoginPage
│   │   │   ├── admin/          # AdminDashboard, AdminCustomers, AdminDocs, AdminReminders, AdminSettings
│   │   │   ├── CustomerDashboard.jsx
│   │   │   ├── DocumentsPage.jsx
│   │   │   ├── NotificationsPage.jsx
│   │   │   └── ProfilePage.jsx
│   │   ├── services/           # API fetch client with bearer auth
│   │   ├── App.jsx             # Route definitions and layouts
│   │   ├── index.css           # Responsive white & light-blue theme
│   │   └── main.jsx
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Backend REST API (Node.js + Express)
│   ├── src/
│   │   ├── config/             # Resilient MongoDB connection (Atlas / local fallback)
│   │   ├── controllers/        # authController, documentController, notificationController, adminController
│   │   ├── middleware/         # auth (JWT verification, requireAdmin, requireCustomer)
│   │   ├── models/             # User, Document, ReminderLog, Notification, AuditLog, SystemSetting
│   │   ├── routes/             # authRoutes, documentRoutes, notificationRoutes, adminRoutes
│   │   ├── services/
│   │   │   ├── reminderScheduler.js  # Persistent Asia/Kolkata cron and idempotency checks
│   │   │   └── sms/            # SMSService, MSG91Provider, SimulatedSMSProvider
│   │   ├── utils/              # phoneValidator, database seeder
│   │   ├── app.js              # Express app setup, rate limiters, CORS
│   │   └── server.js           # Server bootstrap and graceful shutdown
│   ├── tests/                  # Automated unit and API integration tests
│   ├── .env.example
│   └── package.json
│
├── .gitignore                  # Security-first exclusions (.env, node_modules, dist)
├── package.json                # Monorepo root runner
├── PROJECT_STATUS.md           # Continuous progress tracker
└── README.md                   # Full operational documentation
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js:** v18.0.0 or higher (v26+ recommended)
- **npm:** v9.0.0 or higher
- **MongoDB:** MongoDB Atlas connection string or local MongoDB instance (in development, an embedded in-memory database will automatically launch if no MongoDB URI is supplied).

### 2. Environment Setup

#### Server Configuration
Create `server/.env` based on `server/.env.example`:
```bash
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# MongoDB Connection (MongoDB Atlas or local)
MONGODB_URI=mongodb://localhost:27017/doc_expiry_system

# Authentication
JWT_SECRET=your_jwt_secret_change_in_production
JWT_EXPIRES_IN=7d

# Scheduling
CRON_SCHEDULE=0 9 * * *
TIMEZONE=Asia/Kolkata

# MSG91 Provider Credentials (Leave empty for Safe Demo Simulation Mode)
MSG91_AUTH_KEY=
MSG91_TEMPLATE_ID=
MSG91_SENDER_ID=
SMS_SIMULATION_MODE=true
```

#### Client Configuration
Create `client/.env` based on `client/.env.example`:
```bash
# In local development with Vite proxy, use /api
VITE_API_BASE_URL=/api
```

### 3. Install Dependencies
```bash
# Install backend packages
cd server
npm install

# Install frontend packages
cd ../client
npm install
```

### 4. Run Automated Tests
```bash
# From workspace root
npm test
```
The test suite validates:
- Indian phone number validation and normalization (`9876543210`, `+91...`, etc.)
- Expiry calculation and state transitions (Valid, Expiring Soon, Expired, Renewed)
- Customer registration, login, and document CRUD
- Customer dashboard metric calculation
- Document renewal audit trail (`renewalHistory`)
- Role-based access control (RBAC): Customer forbidden from admin endpoints (403)
- Admin login and system metrics
- Unique idempotency key enforcement preventing duplicate reminders

### 5. Start Development Servers
In two separate terminals:

**Terminal 1 (Backend Server):**
```bash
npm run dev:server
# Server starts at http://localhost:5000
# Health check available at http://localhost:5000/api/health
```

**Terminal 2 (Frontend Client):**
```bash
npm run dev:client
# Frontend starts at http://localhost:5173
```

---

## 🔑 Pre-Seeded Demo Credentials

In development mode, the database automatically seeds realistic accounts with documents in various states:

| Role | Identifier | Password | Notes |
| :--- | :--- | :--- | :--- |
| **Customer** | `9888888888` | `Password123!` | Rajesh Sharma (Has Driving Licence, Passport, Expired Insurance) |
| **Customer** | `9111111111` | `Password123!` | Priya Patel (Has Chartered Accountant Certificate) |
| **Administrator** | `admin@system.local` | `ChangeMeAdmin123!` | Full admin privileges (System overview, logs, settings) |

*Both login screens feature quick **"Fill Demo Credentials"** buttons for one-click testing.*

---

## 📖 API Documentation

### Authentication (`/api/auth`)
- `POST /register`: Register a customer with name, valid 10-digit Indian phone, password, optional email, and SMS consent.
- `POST /login`: Authenticate customer using phone number or email and password.
- `POST /admin/login`: Authenticate administrator (enforces `role === 'admin'`).
- `GET /profile`: Get authenticated user profile and notification preferences (Bearer token required).
- `PUT /profile`: Update name, email, SMS consent toggle, and reminder timing preferences.
- `PUT /change-password`: Change current password.

### Customer Documents (`/api/documents`)
- `GET /`: List authenticated customer's documents with search, filter (by state/type), and sorting.
- `GET /dashboard`: Live metric cards (total, valid, expiringSoon, expired, renewed) and upcoming expiries.
- `GET /:id`: Retrieve single document details.
- `POST /`: Register a new document (title, documentType, customTypeName, documentNumber, issueDate, expiryDate, notes).
- `PUT /:id`: Edit document metadata.
- `POST /:id/renew`: Renew document with new expiry date (archives previous expiry into `renewalHistory`).
- `DELETE /:id`: Delete document and remove associated reminder notifications.

### Notifications (`/api/notifications`)
- `GET /`: List in-app notifications (optional `?unreadOnly=true`).
- `PUT /:id/read`: Mark single notification as read.
- `PUT /read-all`: Mark all notifications as read.
- `DELETE /:id`: Delete notification.

### Admin Operations (`/api/admin`) *(Guarded by `requireAdmin`)*
- `GET /dashboard`: System-wide metrics, customer status, document counts, reminder logs, and SMS provider health.
- `GET /customers`: Paginated customer directory with search and status filters.
- `GET /customers/:id`: View customer profile and document list.
- `PUT /customers/:id/status`: Suspend or reactivate customer account with audit logging.
- `GET /documents`: Paginated registry of all documents across all users.
- `GET /reminders`: Detailed reminder dispatch log inspector.
- `POST /reminders/:id/retry`: Authorized manual retry for failed reminder entries (bounded to 3 attempts).
- `POST /trigger-check`: Trigger on-demand manual expiry check sweep.
- `GET /settings`: Inspect system settings and SMS gateway status.
- `PUT /settings`: Update SMS simulation mode and reminder stage intervals.
- `POST /test-sms`: Dispatch authorized test SMS with mandatory recipient confirmation.

---

## 📲 MSG91 Integration & Production Setup

### Understanding MSG91 Requirements
In compliance with Indian Telecom regulations (TRAI DLT):
1. **Entity Registration:** Your business must be registered on a DLT portal (e.g. Jio, Airtel, Vil).
2. **Sender ID (Header):** 6-character registered alphanumeric sender ID (e.g. `DOCEXP`).
3. **Template ID:** Registered DLT content template with approved variables (e.g. `doc_name`, `expiry_date`, `days_left`).
4. **Auth Key:** Generated from MSG91 dashboard (`https://control.msg91.com/`).

### Switching from Simulation to Production SMS
1. Obtain your credentials from MSG91.
2. In `server/.env`, set:
   ```bash
   MSG91_AUTH_KEY=your_msg91_auth_key_here
   MSG91_TEMPLATE_ID=your_dlt_approved_template_id
   MSG91_SENDER_ID=your_approved_6_char_sender_id
   SMS_SIMULATION_MODE=false
   ```
3. Restart the server. Dispatches will now route through `https://control.msg91.com/api/v5/flow/`.

---

## 🚢 Deployment Guide

### Recommended Infrastructure
- **Frontend:** Vercel (Single-Page App hosting)
- **Backend:** Render (Web Service) or Railway
- **Database:** MongoDB Atlas (Free M0 or Production Cluster)

### 1. MongoDB Atlas Setup
1. Sign in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free cluster (M0) in the `ap-south-1` (Mumbai) region.
3. In **Network Access**, add `0.0.0.0/0` (or Render's outbound IP range).
4. In **Database Access**, create a user with read/write privileges.
5. Copy the connection string:
   `mongodb+srv://<username>:<password>@cluster0.mongodb.net/doc_expiry_production?retryWrites=true&w=majority`

### 2. Backend Deployment on Render
> **Important:** Scheduled cron jobs (`node-cron`) require an **always-on** server. On free hosting plans that sleep after inactivity, the daily 9:00 AM IST cron job will not fire while the server is asleep. For reliable production scheduling, choose a standard always-on instance or set up an external cron ping (e.g. Cron-Job.org) that triggers `POST /api/admin/trigger-check` with an admin secret header.

1. Connect your repository to Render as a **Web Service**.
2. Set **Root Directory** to `server`.
3. Set **Build Command** to:
   ```bash
   npm install
   ```
4. Set **Start Command** to:
   ```bash
   npm start
   ```
5. Add the Environment Variables:
   - `NODE_ENV=production`
   - `PORT=10000`
   - `MONGODB_URI=<your-mongodb-atlas-uri>`
   - `JWT_SECRET=<generate-a-strong-random-secret>`
   - `CLIENT_URL=https://<your-vercel-app>.vercel.app`
   - `TIMEZONE=Asia/Kolkata`
   - `CRON_SCHEDULE=0 9 * * *`
   - `SMS_SIMULATION_MODE=true` (or `false` with MSG91 credentials)

### 3. Frontend Deployment on Vercel
1. Import your repository into [Vercel](https://vercel.com).
2. Set **Root Directory** to `client`.
3. Framework Preset: **Vite**.
4. Set Environment Variables:
   - `VITE_API_BASE_URL=https://<your-render-backend-name>.onrender.com/api`
5. Click **Deploy**.
6. Once deployed, ensure the production frontend URL is updated in the Render backend's `CLIENT_URL` environment variable for CORS.

---

## 🔒 Security Summary
- **No Plaintext Passwords:** Passwords are salted and hashed with bcrypt (10 rounds).
- **Stateless Authentication:** Signed JWT tokens with 7-day expiration.
- **Strict Role-Based Middleware:** Admin routes reject non-admin users with 403 Forbidden.
- **Brute-Force Rate Limiting:** 30 attempts per 15 minutes on authentication endpoints.
- **Secrets Protection:** All secrets, keys, and credentials are kept out of source code and blocked via `.gitignore`.
