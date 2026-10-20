# Project Status: Document Expiry Reminder System

## Current Phase: Phase 3 & Frontend Implementation
- **Status:** In Progress
- **Last Updated:** 2026-10-20

---

### Phase 1: Workspace & Setup
- [x] Workspace inspected (clean directory confirmed)
- [x] Environment & runtime confirmed (Node v26.4.0, npm v11.17.0, Git v2.55.0)
- [x] Security-first `.gitignore` created (blocks `.env`, `node_modules`, build outputs)
- [x] Backend dependencies installed (`express`, `mongoose`, `jsonwebtoken`, `bcryptjs`, `cors`, `dotenv`, `express-rate-limit`, `node-cron`, `mongodb-memory-server`)
- [x] Frontend dependencies installed (`react`, `react-dom`, `react-router-dom`, `lucide-react`, `vite`)
- [x] Safe `.env.example` templates created for both server and client
- [x] Resilient MongoDB connection with local development in-memory fallback and Atlas compatibility

---

### Phase 2: Authentication, RBAC & Customer Document CRUD
- [x] User model with bcrypt password hashing, Indian phone normalization (`[6-9]\d{9}`), and reminder preferences
- [x] JWT authentication with secure bearer token verification
- [x] Strict Role-Based Access Control (RBAC) middleware (`requireAdmin`, `requireCustomer`)
- [x] Document model with automatic days-remaining calculation and states: Valid, Expiring Soon, Expired, Renewed
- [x] Document CRUD with customer-scoped data isolation (customers can NEVER view or mutate other customers' records)
- [x] Document Renewal workflow with historical audit trail (`renewalHistory`)
- [x] In-app notification centre model and customer routes

---

### Phase 4: Expiry Engine & SMS Provider Architecture (Backend Completed)
- [x] Persistent cron scheduler service running in `Asia/Kolkata` timezone (daily at 9:00 AM IST)
- [x] Idempotency engine preventing duplicate SMS dispatch using compound key (`<docId>_<stage>_<YYYY-MM-DD>`)
- [x] Official MSG91 Flow API provider with sender ID, template ID, and validation
- [x] Safe Demo / Simulation Mode for zero-credential development
- [x] Safety guards: never dispatch real SMS to test/seed numbers or without customer consent
- [x] Admin manual retry mechanism with bounded attempts (max 3) and audit logging
- [x] 15/15 Automated unit and integration tests passing (`npm test`)

---

### Phase 3 & Frontend Build (Now Executing)
- [ ] Responsive white & light-blue theme with red accent for expiry warnings
- [ ] Client state management & Auth Context (JWT persistence, role-aware routing)
- [ ] Toast notification system and loading skeletons
- [ ] Public Landing Page (`/`) with features, workflow walkthrough, and quick demo access
- [ ] Customer Register (`/register`) & Login (`/login`) with demo credentials one-click autofill
- [ ] Admin Login (`/admin/login`) with demo admin credentials button
- [ ] Customer Dashboard (`/dashboard`) with live summary cards, upcoming expiries, and quick action buttons
- [ ] Document Management (`/documents`) with Search, Filter by State/Type, Add Modal, Edit Modal, Renew Modal, and Delete Confirmation
- [ ] Customer In-App Notification Center (`/notifications`) with read/unread filters and direct actions
- [ ] Profile & Preferences (`/profile`) with SMS Consent toggle and 30/7/1/expiry-day toggles
- [ ] Admin Dashboard (`/admin`) with system overview cards, customer management (suspend/reactivate), document registry, reminder log inspector with status badges, system settings, and safe test SMS tool

---

### Exact Next Steps
1. Build client design system and responsive CSS (`client/src/index.css`).
2. Build client API client and Auth Context (`client/src/services/api.js`, `client/src/context/AuthContext.jsx`).
3. Build shared UI components (Navbar, Sidebar, Modals, Status Badges, Toast, Skeletons).
4. Implement all pages and connect to live backend endpoints.
5. Verify build with `npm run build` in `client/`.
