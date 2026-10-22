# ANVAYA — Phase 3 Completion Report
**Student Profiles and Alumni Directory**

---

## 1. Executive Summary

Phase 3 (**Student Profiles and Alumni Directory**) has been successfully implemented and tested end-to-end without breaking Phase 1 landing pages or Phase 2 authentication.

Students can now view and edit their academic profile (branch, year, skills, interests, bio, career goals, social links). Both students and guests can explore the **Alumni Directory** with live search (across name, company, role, skills), dynamic filters (company, skill, batch), pagination, and an interactive mentorship request modal. A safe database seeder was implemented to populate verified alumni records into the `anvaya` database on MongoDB Atlas.

---

## 2. Architecture & File Breakdown

### A. Database Models (`server/src/models/`)
1. **[User.js](file:///c:/Users/LENOVO/Music/major1/server/src/models/User.js)**:
   - Core identity entity storing `name`, `email` (unique index), `password` (bcrypt hash), `role` (`student | alumni | admin`), and timestamps.
2. **[StudentProfile.js](file:///c:/Users/LENOVO/Music/major1/server/src/models/StudentProfile.js)**:
   - Linked to `User` via `user: { type: ObjectId, ref: 'User', unique: true, required: true }`.
   - Fields: `branch`, `academicYear` (1st to 4th Year, Postgraduate), `skills` (array), `interests` (array), `bio`, `careerGoals`, `githubUrl`, `linkedinUrl`, `portfolioUrl`.
3. **[AlumniProfile.js](file:///c:/Users/LENOVO/Music/major1/server/src/models/AlumniProfile.js)**:
   - Linked to `User` via `user: { type: ObjectId, ref: 'User', unique: true, required: true }`.
   - Fields: `graduationYear` (indexed), `company` (indexed), `designation`, `experience`, `skills` (indexed), `expertise` (mentorship topics), `bio`, `location`, `linkedinUrl`, `availableForMentorship`.
   - Compound text index for fuzzy search across company, role, skills, and bio.

### B. REST API Endpoints (`server/src/controllers/profile.controller.js` & `server/src/routes/profile.routes.js`)
Mounted at `/api/profile` in [app.js](file:///c:/Users/LENOVO/Music/major1/server/src/app.js):

| Endpoint | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/api/profile/me` | `GET` | Authenticated | Retrieves current user's profile based on their role (`student` or `alumni`). |
| `/api/profile/me` | `PUT` | Authenticated | Updates current user's profile and name. Restricts updates to the authenticated user's ID (`req.user._id`). |
| `/api/profile/alumni` | `GET` | Public/Auth | Searches & filters alumni directory with pagination (`page`, `limit`), returning distinct filter options (`companies`, `skills`, `graduationYears`). Never leaks passwords. |
| `/api/profile/alumni/:id` | `GET` | Public/Auth | Returns single alumni detail with populated user attributes (`name`, `email`, `avatar`, `role`). |
| `/api/profile/seed-alumni` | `POST` | Admin/Dev | Safely populates 6 realistic Indian alumni profiles into the `anvaya` MongoDB Atlas database. |

### C. Seeding Script
- **[seedAlumni.js](file:///c:/Users/LENOVO/Music/major1/server/src/scripts/seedAlumni.js)**: Executable via `npm run seed:alumni` in `server/`. Explicitly targets `{ dbName: 'anvaya' }` to prevent test-database collision.

### D. Frontend Components & Pages (`client/src/`)
1. **[AppNavbar.jsx](file:///c:/Users/LENOVO/Music/major1/client/src/components/AppNavbar.jsx)** & **[AppNavbar.css](file:///c:/Users/LENOVO/Music/major1/client/src/components/AppNavbar.css)**:
   - Unified persistent navigation bar with active route highlighting, user profile badge with role pill (`Student` vs `Alumni Mentor`), mobile sub-bar, and one-click logout.
2. **[StudentProfilePage.jsx](file:///c:/Users/LENOVO/Music/major1/client/src/pages/StudentProfilePage.jsx)** & **[StudentProfilePage.css](file:///c:/Users/LENOVO/Music/major1/client/src/pages/StudentProfilePage.css)**:
   - Dual-mode profile view/edit with optimistic saving.
   - Tag chips for technical skills and interests.
   - Clean forms for academic branch, year, bio, career aspirations, and portfolio URLs.
3. **[AlumniDirectoryPage.jsx](file:///c:/Users/LENOVO/Music/major1/client/src/pages/AlumniDirectoryPage.jsx)** & **[AlumniDirectoryPage.css](file:///c:/Users/LENOVO/Music/major1/client/src/pages/AlumniDirectoryPage.css)**:
   - Live search input + dynamic filter dropdowns (Company, Skill, Batch) populated directly from MongoDB distinct aggregations.
   - Alumni mentor cards with badges, company tags, locations, skill pills, and mentorship topics.
   - Interactive "Request Mentorship" modal with student introduction message.
   - Dynamic empty state with one-click "Seed 6 Demo Alumni" action for viva examiners.
4. **[DashboardPage.jsx](file:///c:/Users/LENOVO/Music/major1/client/src/pages/DashboardPage.jsx)**:
   - Integrated with `AppNavbar` and cards linking directly to `/alumni` and `/profile`.
5. **[App.jsx](file:///c:/Users/LENOVO/Music/major1/client/src/App.jsx)**:
   - Added protected routes for `/profile` and `/alumni`.

---

## 3. Test Verification Results

All tests executed live against the running backend and MongoDB Atlas:

| # | Test Case | Target Endpoint / Command | Result |
| :- | :--- | :--- | :--- |
| 1 | **Directory Fetch** | `GET /api/profile/alumni` | **PASSED** (Returned 6 alumni, 6 companies, 32 skills) |
| 2 | **Search Query** | `GET /api/profile/alumni?search=Google` | **PASSED** (Matched Priya Sharma @ Google India) |
| 3 | **Skill Filter** | `GET /api/profile/alumni?skill=Python` | **PASSED** (Matched Divya Iyer & Sneha Reddy) |
| 4 | **Company Filter** | `GET /api/profile/alumni?company=Microsoft` | **PASSED** (Matched Rohan Verma @ Microsoft) |
| 5 | **Graduation Year Filter** | `GET /api/profile/alumni?graduationYear=2019` | **PASSED** (Matched Priya Sharma, Batch 2019) |
| 6 | **Single Alumni Detail** | `GET /api/profile/alumni/:id` | **PASSED** (Populated user info, verified `hasPassword: false`) |
| 7 | **Authenticated Profile GET** | `GET /api/profile/me` | **PASSED** (Retrieved Aarav Sharma student profile) |
| 8 | **Authenticated Profile PUT** | `PUT /api/profile/me` | **PASSED** (Updated branch, year, skills, goals) |
| 9 | **Unauthorized Update Block** | `PUT /api/profile/me` (no token) | **PASSED** (Returned HTTP 401 Unauthorized) |
| 10 | **Client Production Build** | `npm run build` | **PASSED** (Built in 759ms with 0 errors) |

---

## 4. Viva Voce Cheat-Sheet for Phase 3

### Q1: What is the relationship between `User`, `StudentProfile`, and `AlumniProfile` in your database?
> **Answer:** "We use a **1-to-1 normalized reference relationship**. The `User` model handles core authentication (email, password hash, role). Rather than combining everything into a massive schema with sparse null fields, role-specific attributes live in `StudentProfile` (branch, academic year, career goals) and `AlumniProfile` (company, designation, graduation year, mentorship expertise). Both reference `User` through `user: { type: ObjectId, ref: 'User', unique: true }`. In MongoDB, we use Mongoose `.populate('user', 'name email avatar')` to join documents efficiently while omitting passwords."

### Q2: How does the MERN stack workflow function between React, Express, and MongoDB for the Alumni Directory?
> **Answer:**
> 1. **React (Client):** `AlumniDirectoryPage` manages search and filter state. When filters change, it triggers Axios via `api.get('/profile/alumni?company=Google')`.
> 2. **Express (Server):** `profile.routes.js` routes the request to `getAlumniDirectory` in `profile.controller.js`. The controller parses query parameters and builds a Mongoose query condition object.
> 3. **MongoDB Atlas (Database):** Mongoose queries the `alumniprofiles` collection using indexes, populates the linked `users` collection, and returns the filtered document array with pagination metadata.
> 4. **React (Re-render):** The JSON payload updates the component's state, rendering responsive alumni cards with skill pills and contact actions.

### Q3: How do you prevent users from updating other people's profiles?
> **Answer:** "Authorization is scoped strictly to the JWT session. When the client calls `PUT /api/profile/me`, the request passes through `auth.middleware.js` which verifies the JWT signature and extracts `req.user._id`. The controller updates the profile using `{ user: req.user._id }`. Because the ID comes from the verified token and not a user-modifiable query parameter or body field, a student can never tamper with someone else's profile."
