# Task Manager

A full-stack task management application with a fully implemented backend API and an in-progress frontend.

This project was built to explore real-world backend architecture, authentication, data modeling, and testing, with plans to complete the frontend and optional desktop support.

---

## Current State

### Backend — Complete and Functional

The backend is production-ready and fully implemented.

- REST API built with Node.js and Express
- MongoDB with Mongoose schemas
- JWT authentication (login, logout, logout-all, token expiration)
- User management (register, login, update, delete)
- Task management including:
  - Full CRUD operations
  - Dates, times, and recurrence
  - Categories
- Input validation and sanitization
- CORS configuration
- Test coverage across models, routes, middleware, and integrations

### Frontend — Incomplete / Stub

- Basic HTML, CSS, and JavaScript exist in `public/`
- React boilerplate exists in `frontend/` but is not connected to the API
- No production-ready UI yet

### Electron — Partial

- Electron-related files exist
- Desktop packaging and wiring are incomplete

---

## Tech Stack

### Backend
- Node.js
- Express 4.x
- MongoDB
- Mongoose
- JWT
- bcrypt
- express-validator
- Jest (testing)

### Frontend
- Basic HTML / JavaScript (stub)
- React (Create React App boilerplate, unused)

### Desktop (Partial)
- Electron 13.x

---

## Features Implemented

- User authentication with JWT
- Secure session handling (logout, logout-all)
- Task creation, editing, and deletion
- Task recurrence and scheduling
- Task categorization
- Per-user data isolation
- API validation and error handling
- Automated tests

---

## Known Issues / Technical Debt

### Schema Mismatch
Tasks reference a separate `Category` model, but categories are embedded in the User model.

### Dead / Unused Code
- `unused/` directory (old Category model and tests)
- `models/dbmodel.js` (duplicate database connection logic)
- Duplicate Electron files in `public/` and `frontend/`

### Unused Dependencies
- Rate limiting dependency is installed but not implemented

These are intentional cleanup targets for the rebuild phase.

---

## What Still Needs Work

### Frontend
- Replace stub UI with a real React application
- Authentication UI (login / register)
- Task CRUD interface
- Category management UI

### Backend Cleanup
- Resolve category schema mismatch
- Remove dead code and unused dependencies
- Optional: add rate limiting

### Desktop (Optional)
- Finish Electron wiring
- Decide on offline-first versus sync-based data model

---

## Project Direction

This repository represents a backend-first build with a planned frontend rebuild.

The next iteration will focus on:
- A proper React frontend
- Cleaner data models
- Optional offline-first desktop support

Development will continue incrementally with small, focused commits.

---

## Notes

This project was revisited after a system reset.

The backend remains solid. The frontend is intentionally being rebuilt rather than patched.
