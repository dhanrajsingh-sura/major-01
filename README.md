# ANVAYA — Intelligent Student–Alumni Networking & Mentorship Platform

> **Connect. Learn. Grow Together.**

ANVAYA is a full-stack web application designed for engineering colleges to connect undergraduate students with alumni for structured mentorship, career guidance, placement preparation, and domain discovery.

---

## 1. System Architecture

```
[ Browser / Client ] ──( HTTP/REST + JWT Bearer )──> [ Express Backend (Port 5000) ]
       │                                                         │
  React 19 SPA                                            Middleware Stack
  Vite 8 Build                                            (Helmet, CORS, Morgan)
  React Router 7                                                 │
  Context API State                                      Authentication Guard
                                                          (protect, authorize)
                                                                 │
                                                       Controller Business Logic
                                                                 │
                                                      [ MongoDB Atlas Cluster ]
                                                        - users
                                                        - studentprofiles
                                                        - alumniprofiles
                                                        - mentorshiprequests
                                                        - notifications
```

---

## 2. Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite 8, React Router 7 | Responsive Single-Page Application (SPA) |
| **Styling** | Vanilla CSS with Custom Tokens | Component-scoped design system, dark-mode accents, glassmorphic headers |
| **Icons** | Lucide React | Modern, accessible iconography |
| **Backend** | Node.js (v18+), Express 5 | RESTful API server with robust error handling |
| **Security** | Helmet, CORS, bcryptjs (12 rounds) | HTTP security headers, CORS isolation, password hashing |
| **Auth** | JSON Web Tokens (`jsonwebtoken`) | Stateless bearer authentication with role authorization |
| **Database** | MongoDB Atlas, Mongoose 9 | Document database with compound indexing and validation |

---

## 3. Project Structure

```
major1/
├── client/                      # React frontend
│   ├── src/
│   │   ├── components/          # Navbar, ProtectedRoute, Modals
│   │   ├── context/             # AuthContext (user, login, register, logout)
│   │   ├── pages/               # LandingPage, LoginPage, RegisterPage,
│   │   │                        # DashboardPage, StudentProfilePage, AlumniDirectoryPage
│   │   ├── services/            # Axios API client with auth interceptors
│   │   ├── App.jsx              # Client routing configuration
│   │   └── main.jsx             # React DOM entry point
│   └── package.json
│
├── server/                      # Express backend
│   ├── src/
│   │   ├── config/              # MongoDB connection via Mongoose
│   │   ├── controllers/         # Auth, Profile, Mentorship, Notification, Recommendation
│   │   ├── middleware/          # JWT protect, role authorize
│   │   ├── models/              # User, StudentProfile, AlumniProfile, MentorshipRequest, Notification
│   │   ├── routes/              # Express routers
│   │   ├── scripts/             # Seed scripts and automated verification test suites
│   │   ├── app.js               # Express application configuration
│   │   └── server.js            # Server entry point (port listener)
│   ├── .env.example             # Sanitized environment template
│   └── package.json
│
├── phase1_report.md             # Foundation & setup audit
├── phase2_report.md             # Authentication & role dashboards audit
├── phase3_report.md             # Profile & directory audit
├── phase4_report.md             # Mentorship workflow & scheduling audit
├── phase5_report.md             # Recommendation engine audit
├── phase6_report.md             # Final release readiness report
└── README.md
```

---

## 4. Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB Atlas** cluster URL with database name `anvaya`

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/dhanrajsingh-sura/major-01.git
cd major-01

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Environment Configuration
In `server/`:
```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Edit `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/anvaya?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_random_key_at_least_32_chars
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```
> **Security Notice:** The `.env` file contains production secrets and is ignored by Git. Never commit real credentials to source control.

### 3. Seed Demo Data (Optional but Recommended)
Populates vetted alumni mentors across Google, Microsoft, Amazon, Infosys, and Razorpay:
```bash
cd server
npm run seed:alumni
```

### 4. Running the Development Servers
Open two terminal windows:

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
# Starts backend server on http://localhost:5000
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
# Starts Vite frontend on http://localhost:5173
```

---

## 5. API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Create new student or alumni account |
| `POST` | `/api/auth/login` | Public | Authenticate user & return signed JWT |
| `GET` | `/api/auth/me` | Protected | Return currently logged-in user profile |

### Profiles (`/api/profile`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/profile/me` | Protected | Fetch current user's profile |
| `PUT` | `/api/profile/me` | Protected | Update student or alumni profile details |
| `GET` | `/api/profile/alumni` | Public / Auth | Search, filter (skill, company, year) and paginate alumni |
| `GET` | `/api/profile/alumni/:id`| Public / Auth | Get specific alumni details |

### Mentorship (`/api/mentorship`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/mentorship/request` | Student only | Send mentorship request to alumni |
| `GET` | `/api/mentorship/my-requests` | Protected | Get incoming (alumni) or outgoing (student) requests |
| `PUT` | `/api/mentorship/:id/status` | Assigned Alumni | Accept or reject incoming mentorship request |
| `POST` | `/api/mentorship/:id/schedule` | Assigned Alumni | Schedule date, time, duration for accepted request |
| `GET` | `/api/mentorship/sessions` | Protected | List booked upcoming mentorship sessions |
| `GET` | `/api/mentorship/stats` | Protected | Live dashboard counters and completion metrics |

### In-App Notifications (`/api/notifications`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Protected | Fetch notifications & unread count |
| `PUT` | `/api/notifications/:id/read` | Protected | Mark specific notification as read |
| `PUT` | `/api/notifications/read-all` | Protected | Mark all user notifications as read |

### Recommendation Engine (`/api/recommendations`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/recommendations/alumni` | Student only | Ranked recommendations with scores & reasons |

---

## 6. Recommendation Engine (Phase 5)

ANVAYA uses an **explainable, deterministic weighted scoring model** (0–100 points maximum). Every recommendation is 100% transparent:

$$\text{Total Score} = \text{Skills (max 40)} + \text{Interests (max 30)} + \text{Career Goals (max 20)} + \text{Branch (max 10)}$$

1. **Shared Skills (40 pts max):** Phrase-level overlap between student's declared skills and alumni skills.
2. **Domain Match (30 pts max):** Student's interests mapped against alumni's mentorship expertise tags.
3. **Career Goals (20 pts max):** Free-text tokenisation with `STOP_WORDS` filtering against alumni expertise tags.
4. **Branch Relevance (10 pts max):** Student's academic branch mapped against alumni designation and company context.
5. **Zero-Score Discovery:** Mentors with no keyword overlap ($0\%$) are cleanly isolated from personalized matches and rendered under a separate **"Explore Network Mentors (General Discovery)"** section.

---

## 7. Automated Testing & Verification

Run the comprehensive 27-case regression test suite natively:
```bash
cd server
npm test
```

Expected output:
```
╔══════════════════════════════════════════════════════════════╗
║  ANVAYA Phase 6 — Comprehensive Regression Test Suite        ║
╚══════════════════════════════════════════════════════════════╝
  ✅ PASS [TC-AUTH-01] to [TC-AUTH-08] (Authentication & Authorization)
  ✅ PASS [TC-PROF-01] to [TC-PROF-02] (Profile Management)
  ✅ PASS [TC-DIR-01]  to [TC-DIR-03]  (Alumni Directory Search)
  ✅ PASS [TC-MENT-01] to [TC-MENT-09] (Mentorship & Scheduling)
  ✅ PASS [TC-NOTIF-01] to [TC-NOTIF-02] (Notifications & Unread Counter)
  ✅ PASS [TC-REC-01]  to [TC-REC-03]  (Phase 5 Recommendation Engine)

  Regression Results: 27 PASSED | 0 FAILED (Total: 27)
```

Run frontend production build verification:
```bash
cd client
npm run build
# vite build -> 0 errors
```

---

## 8. College Viva Voce Examination Pointers

1. **Explain the JWT Authentication Flow:**
   - Client sends credentials (`POST /api/auth/login`).
   - Server verifies hash with `bcrypt.compare()` and signs a JWT payload containing `{ id: user._id }` using `JWT_SECRET`.
   - Client saves token in `localStorage` and includes it in `Authorization: Bearer <token>` header for protected routes.
   - Server middleware `protect` validates token and sets `req.user`.

2. **Why deterministic scoring instead of a Machine Learning model?**
   - Colleges and regulatory bodies require explainability. With deterministic weighted scoring, every recommendation shows the exact reasons (e.g. `Shared skills (24 pts): react, node.js`). It requires zero training data, no expensive inference servers, and runs in sub-10ms latency.

3. **How do you handle cross-role security?**
   - Chained middleware: `protect` (authenticates identity) followed by `authorize('student')` (checks role). Alumni attempting to query student recommendation endpoints receive `HTTP 403 Forbidden`.
   - All update endpoints enforce tenant isolation: alumni can only update requests where `request.alumni == req.user._id`.

---

## 9. License

Developed for educational purposes as an Engineering College Major/Minor Project.
