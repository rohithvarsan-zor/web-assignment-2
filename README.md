# TalentSync — Full Stack Recruitment Management System (RMS)

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-336791.svg)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-17%20Passed-success.svg)]()

TalentSync is a modern, production-grade **Full Stack Recruitment Management System** that connects candidates, recruiters, and platform administrators across the entire technical hiring lifecycle:

$$\text{Candidate Registration} \longrightarrow \text{Profile \& Resume Upload} \longrightarrow \text{Job Discovery} \longrightarrow \text{Application} \longrightarrow \text{Screening \& Shortlisting} \longrightarrow \text{Interview Scheduling} \longrightarrow \text{Hiring Decision \& Live Notifications}$$

Built with **React 19**, **Vite**, **Tailwind CSS**, **Node.js**, **Express**, and **PostgreSQL**, this platform implements role-based authorization, server-side pagination, full-text multi-parameter filtering, cryptographic audit logging, automated resume upload security, and interactive data analytics with Recharts.

---

## 1. Demo Credentials

The database seeder automatically initializes verified accounts for immediate testing:

| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@example.com` | `Admin@123` | Platform oversight, user management, audit logs, settings |
| **Recruiter** | `recruiter@example.com` | `Recruiter@123` | Apex Global Tech lead recruiter, requisition and candidate pipeline manager |
| **Recruiter 2** | `techrecruiter@example.com` | `Recruiter@123` | CloudScale Infrastructure recruiter |
| **Recruiter 3** | `hiring@innovate.io` | `Recruiter@123` | Innovate AI Labs talent lead |
| **Candidate** | `candidate@example.com` | `Candidate@123` | Senior Full Stack Engineer (Alex Rivera) with uploaded resume |
| **Candidate 2** | `priya.sharma@example.com` | `Candidate@123` | Backend Node.js Engineer (Priya Sharma) |

> **Pro-Tip**: The login page features **1-Click Quick Demo Sign-In buttons** for instant evaluation of candidate, recruiter, and administrator dashboards without manual typing.

---

## 2. Technology Stack

### Frontend
- **Framework & Tooling**: React 19, Vite 8, JavaScript (ESM)
- **Styling**: Tailwind CSS v4 with modern fluid UI tokens
- **Routing**: React Router 7 with role-guarded routes (`ProtectedRoute`, `RoleRoute`)
- **HTTP Client**: Axios with Bearer token interceptor and centralized error extraction
- **Telemetry & Charts**: Recharts (PieChart, BarChart for hiring conversion & pipeline metrics)
- **Icons**: Lucide React (Accessible SVG icons; zero emoji UI icons)

### Backend
- **Runtime**: Node.js & Express.js
- **Database Engine**: PostgreSQL 14+ with Connection Pooling via `pg`
- **Security & Middlewares**:
  - `helmet` — Secure HTTP response headers
  - `cors` — Configurable origin protection
  - `express-rate-limit` — Anti-abuse rate limiting (1000 req/15m general, 100 req/15m auth)
  - `jsonwebtoken` — Cryptographic JWT tokens containing `id`, `email`, `role`
  - `bcryptjs` — Salted password hashing (never stored plaintext)
  - `express-validator` — Strict incoming payload schema validation
  - `multer` — MIME-type verified, safe file uploads with unique filenames
  - Centralized error handling middleware with sanitized production outputs

---

## 3. Database Architecture

The relational schema is strictly normalized across 12 tables with foreign key constraints, cascading deletions, and query indexes:

```
+---------------------------------------------------------------------------------------+
|                                    DATABASE SCHEMA                                    |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|   +-------------------+          +------------------------+                           |
|   |       users       | <------- |   candidate_profiles   |                           |
|   +-------------------+          +------------------------+                           |
|             |                                                                         |
|             | <----------------- +------------------------+                           |
|             |                    |   recruiter_profiles   |                           |
|             |                    +------------------------+                           |
|             |                                                                         |
|             | <----------------- +------------------------+                           |
|             |                    |          jobs          |                           |
|             |                    +------------------------+                           |
|             |                                 |                                       |
|             +---------\                       |                                       |
|                        v                      v                                       |
|                 +--------------------------------+                                    |
|                 |          applications          | <-----+                            |
|                 +--------------------------------+       |                            |
|                                 |                        |                            |
|                                 v                        |                            |
|                 +--------------------------------+       |                            |
|                 |           interviews           | ------+                            |
|                 +--------------------------------+                                    |
|                                                                                       |
|   +------------------+    +------------------+    +-------------------+               |
|   |  notifications   |    |      skills      |    |    audit_logs     |               |
|   +------------------+    +------------------+    +-------------------+               |
|   |    saved_jobs    |    |    job_skills    |    | candidate_skills  |               |
|   +------------------+    +------------------+    +-------------------+               |
+---------------------------------------------------------------------------------------+
```

### Table Definitions
1. **`users`**: User identity (`id`, `name`, `email`, `password_hash`, `role` [candidate/recruiter/admin], `is_active`, timestamps)
2. **`candidate_profiles`**: Personal, education, and career details (`phone`, `dob`, `gender`, `location`, `qualification`, `university`, `graduation_year`, `experience_years`, `bio`, `resume_url`, `profile_photo_url`)
3. **`recruiter_profiles`**: Company details (`company_name`, `company_description`, `company_website`, `designation`, `phone`, `company_logo_url`)
4. **`jobs`**: Requisitions (`recruiter_id`, `title`, `description`, `location`, `employment_type`, `experience_required`, `salary_min`, `salary_max`, `application_deadline`, `status` [draft/published/closed])
5. **`applications`**: Applications (`job_id`, `candidate_id`, `resume_url`, `cover_letter`, `status` [applied/under_review/shortlisted/interview_scheduled/selected/rejected/withdrawn], `applied_at`) — Enforces `UNIQUE(job_id, candidate_id)`
6. **`interviews`**: Scheduling (`application_id`, `scheduled_date`, `scheduled_time`, `mode` [online/offline/phone], `location`, `meeting_link`, `interviewer_notes`, `candidate_notes`, `status` [scheduled/completed/cancelled/rescheduled])
7. **`notifications`**: Database notifications (`user_id`, `title`, `message`, `type`, `is_read`, `created_at`)
8. **`skills`**: Standard skills dictionary (`id`, `name` UNIQUE)
9. **`job_skills`**: Many-to-many relationship (`job_id`, `skill_id`)
10. **`candidate_skills`**: Many-to-many relationship (`candidate_id`, `skill_id`)
11. **`saved_jobs`**: Candidate bookmarks (`candidate_id`, `job_id`, `created_at`)
12. **`audit_logs`**: System audit trail (`user_id`, `action`, `entity_type`, `entity_id`, `details`, `created_at`)

---

## 4. Key Features & Workflows

### 👤 Candidate Workflow
- **Profile Completion Engine**: Dynamic score (0% to 100%) tracking phone, bio, education, skills, photo, and resume. Missing fields are itemized.
- **Resume & Photo Upload**: Uploads verified PDF/DOC/DOCX up to 5MB and profile photos up to 2MB with cryptographic filenames.
- **Job Discovery & Filtering**: Search by keyword, location, salary range, experience, employment type, or specific skills. Sort by newest, oldest, or salary.
- **Job Bookmarking**: Save roles for later review.
- **Application Submission**: Validates profile resume, attaches cover letter, prevents duplicate applications, and creates automated notifications for recruiter and candidate.
- **Application Tracker**: Withdraw applications where appropriate, track screening progression (`applied` $\rightarrow$ `under_review` $\rightarrow$ `shortlisted` $\rightarrow$ `interview_scheduled` $\rightarrow$ `selected` / `rejected`).
- **Interview Coordination**: View upcoming interview date, time, and meeting URL (Google Meet / Zoom). Add private candidate preparation notes.
- **Notifications**: Real-time unread badges, mark individual or all notifications as read.

### 🏢 Recruiter Workflow
- **Requisition Management**: Create, edit, publish, close, or delete draft jobs.
- **Applicant Tracking System (ATS)**: Review applications in a sortable, filterable table. Filter by job requisition or stage.
- **Secure Candidate Resumes**: Authorized resume downloading for applicants who applied to recruiter jobs.
- **Candidate Stage Progression**: Move candidates seamlessly across recruitment stages (`under_review`, `shortlisted`, `selected`, `rejected`).
- **Interview Scheduling**: Schedule interview rounds specifying date, time, mode (Online / In-Person / Phone), meeting links, and interviewer instructions. Candidate receives automatic notifications.
- **Recruiter Analytics**: Dashboard telemetry displaying Recharts status breakdown, requisition performance, and monthly volumes.

### 🛡️ Administrator Workflow
- **System Metrics**: Overview of total users, jobs, applications, and monthly growth velocity.
- **User Management**: Search and filter users by role and status. Toggle account activation / deactivation or permanently remove users (with self-deletion safeguards).
- **Global Job & Application Oversight**: Cross-enterprise monitoring of all postings and candidate applications.
- **Security Audit Logs**: Comprehensive immutable log recording `USER_REGISTERED`, `USER_LOGGED_IN`, `JOB_CREATED`, `APPLICATION_SUBMITTED`, `INTERVIEW_SCHEDULED`, etc.
- **System Settings**: Platform settings, maintenance mode toggle, and registration policies.

---

## 5. Getting Started & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **PostgreSQL**: v14.0 or higher running locally or via remote connection

### Step 1: Clone & Install Dependencies
From the repository root:
```bash
# Install root, backend, and frontend dependencies
npm run install:all
```

Or install individually:
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

### Step 2: Environment Configuration
Copy `.env.example` to `backend/.env`:
```bash
cp .env.example backend/.env
```

Verify or update the connection variables in `backend/.env`:
```env
PORT=5000
DATABASE_URL=postgres://localhost:5432/recruitment_db
JWT_SECRET=recruitment_super_secret_jwt_key_2026_production_grade
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
NODE_ENV=development
```

### Step 3: Database Setup, Migration & Seeding
Ensure PostgreSQL is running and create the database (if not existing):
```bash
# In psql or terminal
psql -c "CREATE DATABASE recruitment_db;"
```

Run schema migration and populate sample seed data:
```bash
# Run schema migration (creates all 12 tables and indexes)
npm run migrate

# Seed database (creates 1 admin, 3 recruiters, 8 candidates, 10 jobs, applications, interviews)
npm run seed
```

### Step 4: Run Application
You can run both backend and frontend concurrently from the root directory:
```bash
npm run dev
```

Or run each service individually:
```bash
# Terminal 1: Backend Server (starts on http://localhost:5000)
npm run dev:server

# Terminal 2: Frontend Client (starts on http://localhost:5173)
npm run dev:client
```

Visit **`http://localhost:5173`** in your browser.

---

## 6. Development Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Runs backend API server and Vite client concurrently |
| `npm run dev:server` | Runs backend server with `--watch` auto-reload |
| `npm run dev:client` | Runs Vite frontend development server |
| `npm run migrate` | Executes PostgreSQL schema DDL migration script |
| `npm run seed` | Seeds database with demo accounts, jobs, and applications |
| `npm run build` | Compiles frontend for production (`frontend/dist/`) |
| `npm start` | Starts backend production server |
| `npm test` | Runs the automated backend test suite (17 tests) |

---

## 7. Automated Testing

The automated test suite verifies authentication, authorization guards, job management, candidate applications, duplicate application prevention, interview scheduling, and notifications.

Run the test suite:
```bash
npm test
```

Test Results Summary:
```
✔ 1. Authentication - Login Admin
✔ 2. Authentication - Login Recruiter
✔ 3. Authentication - Register New Candidate
✔ 4. Authentication - Reject Invalid Password
✔ 5. Auth Middleware - Fetch /api/auth/me
✔ 6. Public Job Retrieval & Filtering
✔ 7. Job Creation - Authorized Recruiter
✔ 8. Job Creation - Block Candidate (Authorization check)
✔ 9. Candidate Profile Update with Skills
✔ 10. Job Application Creation
✔ 11. Duplicate Job Application Prevention
✔ 12. Application Status Update by Recruiter
✔ 13. Schedule Interview for Application
✔ 14. Candidate Notifications Retrieval
✔ 15. Admin User Management & Audit Logs
✔ 16. Unauthorized Access Rejection on Admin Route
✔ Backend API Automated Test Suite
ℹ tests 17 | pass 17 | fail 0
```

---

## 8. API Reference

All responses conform to the standardized JSON specification:
- **Success**: `{ "success": true, "message": "...", "data": {}, "pagination": {} }`
- **Error**: `{ "success": false, "message": "...", "errors": [] }`

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a candidate or recruiter account
- `POST /api/auth/login` — Login and receive JWT token
- `GET /api/auth/me` — Retrieve authenticated user profile and notification count
- `POST /api/auth/logout` — Logout user
- `PUT /api/auth/change-password` — Change account password

### Jobs (`/api/jobs`)
- `GET /api/jobs` — Query published jobs (supports `search`, `location`, `employment_type`, `experience`, `salary_min`, `salary_max`, `skill`, `sortBy`, `page`, `limit`)
- `GET /api/jobs/:id` — Retrieve job details, requirements, and candidate application status
- `POST /api/jobs` — Create new job (Recruiter/Admin)
- `PUT /api/jobs/:id` — Update job (Owner/Admin)
- `DELETE /api/jobs/:id` — Delete draft job (Owner/Admin)
- `POST /api/jobs/:id/publish` — Publish draft job
- `POST /api/jobs/:id/close` — Close active job
- `POST /api/jobs/:id/save` — Save job bookmark (Candidate)
- `DELETE /api/jobs/:id/save` — Remove saved job (Candidate)
- `GET /api/saved-jobs` — Retrieve candidate's saved jobs

### Applications (`/api/applications`)
- `POST /api/applications` — Submit job application (Candidate)
- `GET /api/applications/my` — Retrieve candidate's applications with status and interview info
- `GET /api/applications/:id` — Get application details (Candidate/Recruiter/Admin)
- `PUT /api/applications/:id/status` — Update stage (`under_review`, `shortlisted`, `selected`, `rejected`)
- `DELETE /api/applications/:id` — Withdraw application (Candidate)

### Candidate (`/api/candidates`)
- `GET /api/candidates/profile` — Get candidate profile and completion percentage
- `PUT /api/candidates/profile` — Update personal info, bio, education, experience, and skills
- `POST /api/candidates/resume` — Upload resume (Multer, max 5MB PDF/DOC/DOCX)
- `POST /api/candidates/photo` — Upload profile photo (Multer, max 2MB JPG/PNG)
- `GET /api/candidates/:id` — View candidate profile (Recruiter/Admin)

### Recruiter (`/api/recruiter`)
- `GET /api/recruiter/profile` — Get recruiter company profile
- `PUT /api/recruiter/profile` — Update recruiter company profile
- `POST /api/recruiter/logo` — Upload company logo
- `GET /api/recruiter/jobs` — Get recruiter's job requisitions with applicant metrics
- `GET /api/recruiter/applications` — Filterable applicant tracking pipeline
- `GET /api/recruiter/statistics` — KPI summary and chart data
- `GET /api/recruiter/resumes/:filename` — Secure authorized resume download

### Interviews (`/api/interviews`)
- `POST /api/interviews` — Schedule interview (Recruiter/Admin)
- `GET /api/interviews/my` — Get user interviews
- `GET /api/interviews/:id` — Get interview details
- `PUT /api/interviews/:id` — Reschedule, update status, or add preparation notes
- `DELETE /api/interviews/:id` — Cancel interview

### Notifications (`/api/notifications`)
- `GET /api/notifications` — Get user notifications and unread count
- `PUT /api/notifications/:id/read` — Mark notification as read
- `PUT /api/notifications/read-all` — Mark all notifications as read

### Admin (`/api/admin`)
- `GET /api/admin/statistics` — Platform metrics and telemetry
- `GET /api/admin/users` — List and filter all users
- `PUT /api/admin/users/:id/status` — Activate or deactivate user
- `DELETE /api/admin/users/:id` — Permanently remove user
- `GET /api/admin/jobs` — Global job requisition directory
- `GET /api/admin/applications` — Global candidate applications
- `GET /api/admin/audit-logs` — Immutable audit log feed
- `GET /api/admin/settings` — Get platform configuration
- `PUT /api/admin/settings` — Update platform configuration

---

## 9. Security Engineering

- **Password Hashing**: Salted bcrypt hashing with work factor 10.
- **JWT Protection**: Tokens signed with high-entropy secret, checking DB active state on every privileged request.
- **File Upload Safeguards**:
  - File extension and MIME-type validation.
  - Safe UUID/timestamp-based filenames to prevent path traversal or file overwrites.
  - Resumes stored in restricted paths; accessed only via authorized routes.
- **SQL Injection Defense**: 100% parameterized queries via `node-postgres` ($1, $2, ...).
- **Rate Limiting**: Anti-brute-force rate limits on `/api/auth/login` and `/api/auth/register`.
- **Cross-Origin Resource Policy**: Secure Helmet and CORS headers.
- **Sanitized Output**: Password hashes and internal database errors are never returned to clients.

---

## 10. Troubleshooting

### PostgreSQL Connection Error
If you receive `ECONNREFUSED` or connection errors:
1. Ensure PostgreSQL is active: `brew services start postgresql@14` (macOS) or `sudo systemctl start postgresql` (Linux).
2. Check your `DATABASE_URL` in `backend/.env`. If a password is required for your user, format as:
   `postgres://username:password@localhost:5432/recruitment_db`.
3. Verify database exists: `psql -c "CREATE DATABASE recruitment_db;"`.

### Port Conflict (Port 5000 or 5173 already in use)
1. On macOS, AirPlay Receiver may reserve port 5000. You can change `PORT=5001` in `backend/.env` and update the proxy port in `frontend/vite.config.js`.
2. Or kill the existing process: `lsof -ti :5000 | xargs kill -9`.

---

## 11. License

MIT License. Designed and engineered as an Enterprise-Grade Recruitment Management System.
