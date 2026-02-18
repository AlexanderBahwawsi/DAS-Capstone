# KCR Submission Manager

A web-based submission management platform for the KCR literary magazine. Supports submitters, reviewers, editors, and administrators through a role-based interface.

---

## Quick Start

There are **two ways** to run this project. Pick whichever is easiest for you.

### Option A — Just Open the File (no install needed)

1. Navigate to the project folder.
2. Open the **`html`** folder and double-click **`index.html`** to open it in your default browser.
3. That's it — click through the pages using the sidebar and links.

> This works because the project is pure HTML/CSS/JS with no build step.

### Option B — Local Dev Server with Live Reload (recommended)

This gives you a proper `localhost` URL and auto-refreshes the browser whenever you save a file.

**Prerequisites:** [Node.js](https://nodejs.org/) (v16 or newer)

```bash
# 1. Clone or download the project, then open a terminal in the project folder

# 2. Install dependencies (one time only)
npm install

# 3. Start the dev server
npm start
```

The site will open automatically at **http://localhost:3000**. Any file changes you save will instantly reload in the browser.

---

## Project Structure

```
CSCI4970-Capstone/
├── css/
│   └── styles.css                # Shared design system (colors, layout, components)
├── js/
│   └── app.js                    # Shared interactivity (sidebar, search, modals)
├── html/
│   ├── index.html                # Login page
│   ├── register.html             # Account registration
│   ├── dashboard.html            # Submitter dashboard (stats, recent submissions)
│   ├── submit.html               # New submission form with file upload
│   ├── submissions.html          # All submissions list with filters & search
│   ├── submission-detail.html    # In-browser document viewer + review panel
│   ├── review-queue.html         # Reviewer queue (anonymized submissions)
│   ├── messages.html             # Messaging system (per-submission threads)
│   └── admin.html                # Admin panel (users, assignments, export)
├── package.json                  # Node.js config for live-server
└── README.md                     # This file
```

---

## Pages & Features

| Page | URL | Description |
|------|-----|-------------|
| **Login** | `index.html` | Sign-in form. Use the demo buttons to jump straight into a role. |
| **Register** | `register.html` | Create a new submitter account. |
| **Dashboard** | `dashboard.html` | Overview stats, recent submissions table, notifications. |
| **New Submission** | `submit.html` | Submission form with drag-and-drop file upload (.docx, .pdf, .png, .jpg). |
| **My Submissions** | `submissions.html` | Filterable list of all submissions with status badges and ratings. |
| **Submission Detail** | `submission-detail.html` | Split view: in-browser document preview + metadata, rating, decision, and discussion thread. |
| **Review Queue** | `review-queue.html` | Anonymized submission cards for reviewers (author hidden until review complete). |
| **Messages** | `messages.html` | Thread-based messaging tied to submissions. |
| **Admin Panel** | `admin.html` | Three tabs: All Submissions (bulk actions), User Management (RBAC), Reviewer Assignments (workload). |

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

- **HTML5** / **CSS3** / **Vanilla JavaScript** — no frameworks, no build tools
- **Inter** font (loaded from Google Fonts)
- Fully responsive (desktop, tablet, mobile)

---

## Notes

- This is a **frontend template only** — there is no backend or database yet. All data shown is placeholder/demo content.
- Form submissions, file uploads, and button actions use JavaScript alerts or page redirects to simulate behavior.
- The template is ready to be connected to a backend API (Node/Express, Django, etc.) in a future sprint.
