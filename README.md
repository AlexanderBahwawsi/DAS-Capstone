# KCR Submission Manager

A web-based submission management platform for the KCR literary magazine. Supports submitters, reviewers, editors, and administrators through a role-based interface.

---
## Milestone 5 Specific
For this milestone, the static HTML pages have been wired to the live API. Login, registration, submissions, reviews, messages (with Socket.IO real-time updates), and the admin panel are all driven by backend data instead of placeholder content.

## Milestone 4 Specific
For this milestone, all backend has been implemented and should be merged to main.

## Milestone 3 Specific
This milestone contains code for all the controllers besides the message controller; admin and auth routes were also completed. Everything to look at has been merged into the main branch.

## Milestone 2 Specific
This milestone contains code for the review model, the user model, the adminController, as well as the authcontroller. The Branches to look at are the main branch for the adminController, as well as dmkay_authController for the authController code (not pushed to main yet) and sikontoure-review-model for the review model.

## Milestone 1 Specific
This milestone contains the frontend HTML for the project, as well as placeholder code for user authentication. This code is considered placeholder for now as we are still learning how to use supabase and can't properly test it yet.
This code currently has a main branch and a branch called dmkay-auth, dmkay-auth contains the placeholder code for user authentication in server/controllers/authController.js.



## Quick Start

**Prerequisites:** [Node.js](https://nodejs.org/) (v16 or newer)

```bash
# 1. Clone the project
git clone https://github.com/dev-m-kay/DAS-Capstone.git
cd DAS-Capstone

# 2. Install dependencies
npm install

# 3. Create your .env file (see Environment Setup below)

# 4. Start the server
npm start
```

Open **http://localhost:3001** in your browser.

### Environment Setup

Copy `.env.example` to a new file called `.env` and fill in the values:

```bash
cp .env.example .env
```

Your `.env` file needs two values:

```
DATABASE_URL=postgresql://postgres.xxxxx:your-password@aws-1-us-east-1.pooler.supabase.com:5432/postgres
JWT_SECRET=change-this-to-a-random-string
```

Get the `DATABASE_URL` from the team — it's the Supabase PostgreSQL connection string (Session mode, port 5432). The `.env` file is gitignored so credentials stay local.

### Commands

| Command | What it does |
|---------|-------------|
| `npm start` | Start the full server (frontend + API + Socket.IO) on port 3001 |
| `npm run dev` | Same, but auto-restarts when you change backend files |
| `npm run frontend` | Frontend-only with live reload on port 3000 (no API) |
| `npm test` | Run the Jest test suite (controllers, routes, middleware) |

---

## Project Structure

```
CSCI4970-Capstone/
├── html/                              # Frontend pages
│   ├── index.html                     #   Login -> POST /api/auth/login
│   ├── register.html                  #   Registration -> POST /api/auth/register
│   ├── dashboard.html                 #   Submitter dashboard -> GET /api/submissions/mine
│   ├── submit.html                    #   New submission form -> POST /api/submissions (multipart)
│   ├── submissions.html               #   Submissions list -> GET /api/submissions/mine
│   ├── submission-detail.html         #   Document viewer + review + discussion
│   ├── review-queue.html              #   Reviewer queue -> GET /api/reviews/mine
│   ├── messages.html                  #   Messaging threads + Socket.IO real-time
│   └── admin.html                     #   Admin panel -> /api/admin/*
│
├── css/
│   └── styles.css                     # Shared design system
├── js/                                # Frontend integration layer
│   ├── app.js                         #   Shared: auth guard, apiFetch, sidebar, sign-out
│   ├── submissions.js                 #   Dashboard, submissions list, submit form, detail page
│   ├── reviews.js                     #   Review queue, review submit/edit on detail page
│   ├── messages.js                    #   Threads page, discussion panel, Socket.IO client
│   └── admin.js                       #   Admin panel data + actions
│
├── server/                            # Backend (Express + PostgreSQL)
│   ├── index.js                       #   Entry point — starts HTTP server + Socket.IO
│   ├── app.js                         #   Express app setup (routes, middleware, static files)
│   ├── socket.js                      #   Socket.IO server (real-time message rooms)
│   ├── config/
│   │   └── db.js                      #   Supabase PostgreSQL connection + schema
│   ├── middleware/
│   │   ├── auth.js                    #   JWT authentication
│   │   ├── roles.js                   #   Role-based access control
│   │   └── access.js                  #   Submission/resource ownership checks
│   ├── models/                        #   Database query functions
│   │   ├── User.js
│   │   ├── Submission.js
│   │   ├── Review.js
│   │   └── Message.js
│   ├── controllers/                   #   Route handler logic
│   │   ├── authController.js
│   │   ├── submissionController.js
│   │   ├── reviewController.js
│   │   ├── messageController.js
│   │   └── adminController.js
│   ├── routes/                        #   API endpoint definitions
│   │   ├── auth.js                    #   /api/auth/*
│   │   ├── submissions.js             #   /api/submissions/*
│   │   ├── reviews.js                 #   /api/reviews/*
│   │   ├── messages.js                #   /api/messages/*
│   │   └── admin.js                   #   /api/admin/*
│   └── __tests__/                     #   Jest tests (controllers, routes, middleware)
│
├── uploads/                           # Uploaded submission files (gitignored)
├── .env.example                       # Environment variable template
├── package.json
└── README.md
```

---

## Database

The database is **PostgreSQL hosted on [Supabase](https://supabase.com/)**. Tables are created automatically when the server starts for the first time.

### Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts with role (admin, editor, reviewer, submitter) |
| `submissions` | Submitted works with title, genre, status, metadata |
| `submission_files` | Files attached to each submission |
| `reviews` | Reviewer ratings and comments (one per reviewer per submission) |
| `messages` | Discussion threads tied to submissions |
| `assignments` | Maps reviewers to submissions |

### Querying the Database

All models should use the shared pool from `server/config/db.js`:

```javascript
const { pool } = require('../config/db');

// Example query
const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
```

PostgreSQL uses `$1, $2, $3` for parameterized queries (not `?` like SQLite).

---

## API Reference

All API routes are prefixed with `/api`. Protected routes require a `Bearer` token in the `Authorization` header.

### Auth

| Method | Endpoint | Body | Access |
|--------|----------|------|--------|
| POST | `/api/auth/register` | `{ first_name, last_name, email, password, bio? }` | Public |
| POST | `/api/auth/login` | `{ email, password }` | Public |
| GET | `/api/auth/me` | — | Logged in |

### Submissions

| Method | Endpoint | Body / Query | Access |
|--------|----------|-------------|--------|
| POST | `/api/submissions` | Form data: `title, genre, word_count?, bio, notes?, files[]` | Logged in |
| GET | `/api/submissions/mine` | — | Logged in |
| GET | `/api/submissions` | `?status=pending&genre=Poetry` | Admin, Editor |
| GET | `/api/submissions/:id` | — | Logged in |
| GET | `/api/submissions/:id/files` | — | Logged in |
| PUT | `/api/submissions/:id/status` | `{ status }` (pending/in_review/accepted/rejected) | Admin, Editor |

### Reviews

| Method | Endpoint | Body | Access |
|--------|----------|------|--------|
| GET | `/api/reviews/mine` | — | Reviewer, Editor |
| GET | `/api/reviews/:submissionId` | — | Logged in |
| POST | `/api/reviews/:submissionId` | `{ rating, comment? }` | Reviewer, Editor |
| PUT | `/api/reviews/:submissionId/:id` | `{ rating?, comment? }` | Own review only |

### Messages

| Method | Endpoint | Body | Access |
|--------|----------|------|--------|
| GET | `/api/messages/threads` | — | Logged in |
| GET | `/api/messages/:submissionId` | — | Logged in |
| POST | `/api/messages/:submissionId` | `{ body }` | Logged in |

### Admin

| Method | Endpoint | Body | Access |
|--------|----------|------|--------|
| GET | `/api/admin/users` | — | Admin |
| PUT | `/api/admin/users/:id/role` | `{ role }` | Admin |
| DELETE | `/api/admin/users/:id` | — | Admin |
| POST | `/api/admin/assign` | `{ submission_id, reviewer_id }` | Admin |
| DELETE | `/api/admin/assign/:subId/:reviewerId` | — | Admin |
| GET | `/api/admin/workload` | — | Admin |
| PUT | `/api/admin/submissions/bulk-status` | `{ submission_ids[], status }` | Admin |
| GET | `/api/admin/export` | — | Admin |

---

## Roles

| Role | Access |
|------|--------|
| **Submitter** | Submit work, track status, view ratings/feedback, message editors |
| **Reviewer** | Review anonymized submissions, rate & comment, discuss with editors |
| **Editor** | All reviewer abilities + accept/reject decisions, communicate with submitters |
| **Admin** | Full access: manage users, assign reviewers, bulk actions, export data |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript, Inter font |
| Backend | Node.js, Express |
| Database | PostgreSQL on Supabase |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| File Upload | Multer (stored in `/uploads`) |
| Real-time | Socket.IO (live message threads) |
| Testing | Jest |

---

## Frontend ↔ API Integration

Each HTML page is paired with a JS module under `js/` that calls the backend:

| Page | JS Module | Primary Endpoints |
|------|-----------|-------------------|
| `index.html` | inline | `POST /api/auth/login` |
| `register.html` | inline | `POST /api/auth/register` |
| `dashboard.html` | `submissions.js` | `GET /api/submissions/mine` |
| `submissions.html` | `submissions.js` | `GET /api/submissions/mine` |
| `submit.html` | `submissions.js` | `POST /api/submissions` (multipart) |
| `submission-detail.html` | `submissions.js`, `reviews.js`, `messages.js` | `GET /api/submissions/:id`, `POST /api/reviews/:id`, `GET/POST /api/messages/:id` |
| `review-queue.html` | `reviews.js` | `GET /api/reviews/mine` |
| `messages.html` | `messages.js` | `GET /api/messages/threads`, Socket.IO `join_thread` / `new_message` |
| `admin.html` | `admin.js` | `/api/admin/*` |

`js/app.js` runs on every authenticated page: it reads the JWT from `localStorage`, redirects to `index.html` if missing or expired, fetches the current user via `GET /api/auth/me`, and populates the sidebar profile + role-aware nav.

---

## Notes

- Tables are created automatically on first `npm start` — no manual SQL needed.
- The `.env` file is **required** — the server won't start without `DATABASE_URL`.
- The JWT token is stored in `localStorage` under the key `token`; clearing it (or the **Sign Out** button) logs you out.
- Uploaded files are stored in the `uploads/` folder and served at `/uploads/filename`.
- Real-time messages require the Socket.IO client served at `/socket.io/socket.io.js` — already included by Express when Socket.IO is mounted.
