# ANVAYA — Intelligent Student–Alumni Networking & Mentorship Platform

> **Connect. Learn. Grow Together.**

ANVAYA is a full-stack web application that connects college students with alumni for mentorship, career guidance, job/internship opportunities, events, and learning resources.

## Tech Stack

| Layer    | Technology                                         |
| -------- | -------------------------------------------------- |
| Frontend | React, Vite, React Router, Axios, Lucide React     |
| Backend  | Node.js, Express.js, Mongoose, JWT, bcrypt          |
| Database | MongoDB Atlas (cluster: `anvaya-cluster`)           |
| Styling  | Custom CSS with ANVAYA design system                |

## Project Structure

```
major1/
├── client/          # React frontend (Vite)
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── layouts/
│       ├── context/
│       ├── services/
│       └── hooks/
├── server/          # Express backend
│   └── src/
│       ├── config/      # Database connection
│       ├── models/      # Mongoose schemas
│       ├── controllers/ # Request handlers
│       ├── routes/      # API route definitions
│       ├── middleware/   # Auth, validation, error handling
│       ├── services/    # Business logic
│       └── utils/       # Helper functions
└── README.md
```

## Getting Started

### Prerequisites

- Node.js v18+
- npm v9+
- MongoDB Atlas account with the `anvaya` database

### 1. Clone & Install

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Configure Environment

```bash
cd server
copy .env.example .env   # Windows
# cp .env.example .env   # macOS/Linux
```

Edit `server/.env` and set:
- `MONGODB_URI` — your MongoDB Atlas connection string
- `JWT_SECRET` — a random 32+ character string

### 3. Start Development Servers

```bash
# Terminal 1 — Backend (port 5000)
cd server
npm run dev

# Terminal 2 — Frontend (port 5173)
cd client
npm run dev
```

### 4. Verify

- Frontend: http://localhost:5173
- Health check: http://localhost:5000/api/health

## Features

- 🔐 JWT Authentication (register, login, protected routes)
- 👤 Student & Alumni profiles
- 🔍 Discover and search alumni
- 🤝 Mentorship requests
- 💼 Jobs & Internship listings
- 📅 Events calendar
- 📚 Learning resources
- 🧠 Intelligent alumni recommendations
- 🛡️ Admin dashboard

## License

This project is for educational purposes (college minor project).
