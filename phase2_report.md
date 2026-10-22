# ANVAYA — Phase 2 Completion Report
**Intelligent Student–Alumni Networking & Mentorship Platform**

---

## 1. Executive Summary

Phase 2 (**Functional Login and Registration**) has been successfully implemented and verified end-to-end. The application now supports secure user onboarding for both **Students** and **Alumni**, persistent session handling via JSON Web Tokens (JWT), client-side and server-side validation, and protected routes.

---

## 2. Deliverables & Implemented Architecture

### A. Backend Architecture (`server/src/`)
1. **User Model ([User.js](file:///c:/Users/LENOVO/Music/major1/server/src/models/User.js))**:
   - Mongoose schema with `name`, `email` (unique index, lowercase), `password` (hashed with `bcryptjs`, 12 salt rounds, `select: false`), and `role` (`'student' | 'alumni' | 'admin'`).
   - Modern Mongoose `async pre('save')` hook for hashing on creation/modification.
   - Instance methods: `comparePassword(candidate)` and `toSafeObject()`.
2. **Auth Controller ([auth.controller.js](file:///c:/Users/LENOVO/Music/major1/server/src/controllers/auth.controller.js))**:
   - `register`: Validates inputs, rejects duplicate emails with HTTP 409, creates user in MongoDB Atlas, issues signed JWT token.
   - `login`: Verifies user existence and password hash using `bcrypt.compare`, issues signed JWT token. Prevents email enumeration attacks with unified error messaging.
   - `getMe`: Extracts verified `req.user` and returns safe profile object.
3. **Auth Middleware ([auth.middleware.js](file:///c:/Users/LENOVO/Music/major1/server/src/middleware/auth.middleware.js))**:
   - Extracts Bearer token from `Authorization` header.
   - Verifies JWT signature against `JWT_SECRET`.
   - Attaches user to `req.user` for downstream routes.
4. **Auth Routes ([auth.routes.js](file:///c:/Users/LENOVO/Music/major1/server/src/routes/auth.routes.js))**:
   - Mounted at `/api/auth` in [app.js](file:///c:/Users/LENOVO/Music/major1/server/src/app.js).

### B. Frontend Architecture (`client/src/`)
1. **Global Auth State ([AuthContext.jsx](file:///c:/Users/LENOVO/Music/major1/client/src/context/AuthContext.jsx))**:
   - Provides `user`, `loading`, `error`, `isAuthenticated`, `login`, `register`, and `logout`.
   - Persists JWT token in browser `localStorage` under `anvaya_token`.
   - Automatically verifies session on reload by calling `/api/auth/me`.
   - Interceptors in `api.js` automatically attach the Bearer token to all outbound Axios requests.
2. **Login Page ([LoginPage.jsx](file:///c:/Users/LENOVO/Music/major1/client/src/pages/LoginPage.jsx))**:
   - Split-screen UI with University Royal Blue (`#1D4ED8`) branding panel and responsive form card.
   - Client-side validation, password show/hide toggle, loading spinner, and error banner.
3. **Register Page ([RegisterPage.jsx](file:///c:/Users/LENOVO/Music/major1/client/src/pages/RegisterPage.jsx))**:
   - Interactive role selection cards for **Student** vs **Alumni**.
   - Validates name, email regex, 6+ character password, and matching confirm password.
4. **Protected Route & Dashboard ([ProtectedRoute.jsx](file:///c:/Users/LENOVO/Music/major1/client/src/components/ProtectedRoute.jsx) & [DashboardPage.jsx](file:///c:/Users/LENOVO/Music/major1/client/src/pages/DashboardPage.jsx))**:
   - Guards authenticated routes; shows loading state during session verification.
   - Personalized user welcome banner with role badges (`Student` or `Alumni Mentor`).
   - Functional logout button that flushes local credentials and redirects to `/login`.
5. **Aesthetic Stylesheet ([AuthPages.css](file:///c:/Users/LENOVO/Music/major1/client/src/pages/AuthPages.css) & [DashboardPage.css](file:///c:/Users/LENOVO/Music/major1/client/src/pages/DashboardPage.css))**:
   - Implements Royal Blue (`#1D4ED8`), Warm Amber Gold (`#F59E0B`), and Teal Cyan (`#06B6D4`).

---

## 3. Test Verification Results

| Test Scenario | Target Endpoint | Expected Behavior | Result |
| :--- | :--- | :--- | :--- |
| **New User Registration** | `POST /api/auth/register` | Create user in MongoDB, return 201 + JWT | **PASSED** (ID generated, token issued) |
| **Duplicate Email Prevention** | `POST /api/auth/register` | Return 409 Conflict with error message | **PASSED** ("An account with this email already exists") |
| **Invalid Password Rejection** | `POST /api/auth/login` | Return 401 Unauthorized | **PASSED** ("Invalid email or password") |
| **Valid Login Authentication** | `POST /api/auth/login` | Return 200 OK + JWT + user profile | **PASSED** (JWT token returned) |
| **Token Verification Profile** | `GET /api/auth/me` | Return authenticated user data | **PASSED** ("Aarav Sharma (student)") |
| **Unauthenticated Route Guard** | `GET /api/auth/me` | Block request without token | **PASSED** ("Not authorized — no token provided") |
| **Production Bundle Compilation** | `npm run build` | Error-free bundle output | **PASSED** (Built in 805ms) |

---

## 4. Viva Voce Cheat-Sheet for Phase 2

### Q1: Why use bcrypt with salt rounds instead of hashing passwords with SHA-256 or MD5?
> **Answer:** "SHA-256 and MD5 are general-purpose cryptographic hash functions designed to be fast, making them vulnerable to brute-force and rainbow table attacks. `bcrypt` uses an adaptive key derivation algorithm with computational 'salting' and 'work factor' (rounds). Salting adds random data to every password so two identical passwords have completely different hashes, and the work factor intentionally slows down attackers while remaining negligible for a legitimate user."

### Q2: How does JWT authentication work and where is the state stored?
> **Answer:** "JWT (JSON Web Token) is a stateless authentication mechanism. Upon successful authentication, the server signs a payload containing the user ID with a secret key (`JWT_SECRET`) and returns the token. The React frontend stores this in `localStorage` and transmits it in the HTTP `Authorization: Bearer <token>` header. The server verifies the signature without needing to store session records in server memory or a Redis session store."

### Q3: What is the purpose of `select: false` on the password field in Mongoose?
> **Answer:** "In Mongoose, setting `select: false` prevents the password field from being included in query results (e.g., `User.find()`) by default. This ensures password hashes are never accidentally serialized into JSON API responses. When we need to verify a password during login, we explicitly include it using `.select('+password')`."

### Q4: How does React Router protect routes?
> **Answer:** "We use a `<ProtectedRoute />` component that checks `isAuthenticated` from `AuthContext`. If the user is unauthenticated, it renders `<Navigate to="/login" replace />`. If the user is authenticated, it renders `<Outlet />` which displays the nested child route (like `<DashboardPage />`)."
