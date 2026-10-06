# QUIZ ARENA — WATCH • LEARN • PLAY
Full-stack local quiz platform: pick a subject/topic, difficulty, and video language → get matching video recommendations → take a generated quiz → result saved in SQLite (and emailed if configured).

## Technology
HTML5 / CSS3 / vanilla JS (frontend) · Node.js + Express (backend) · SQLite via better-sqlite3 · Gemini (called from backend only) · nodemailer · JWT + bcrypt.

## Installation & running (Windows)
1. Install Node.js LTS (https://nodejs.org).
2. Double-click `scripts\setup.bat` (installs dependencies, creates `.env`, seeds the DB).
3. Double-click `scripts\start.bat` → opens http://localhost:8000.
Manual: `cd backend && npm install && node database/seed.js && node server.js`, then in another terminal `node scripts/frontend-server.js`.

- Frontend: http://localhost:8000 · Backend: http://localhost:3000 · Database: `backend/database/quiz-arena.db`

## Admin login
Open `admin-login.html` (link in header). Email `admin@quizarena.local` · Password `Admin@123` (change it for any real use).

## Environment variables (`backend/.env`, never committed)
`GEMINI_API_KEY`, `GEMINI_MODEL`, `JWT_SECRET`, `SMTP_HOST/PORT/USER/PASS/FROM`. See `.env.example`.
- A valid Gemini key is required to generate quiz questions for topics without a saved question set. Transient model-capacity errors retry with `GEMINI_FALLBACK_MODEL` (defaults to `gemini-2.5-flash-lite`).
- The backend reads `backend/.env` directly. Restart it after changing keys. `GET http://localhost:3000/api/health` reports whether Gemini and SMTP settings are present without returning secret values.
- SMTP sends quiz results first. If SMTP is not configured or fails, EmailJS is attempted from the result page. Set your EmailJS public key, service ID, and template ID in `frontend/js/emailjs-config.js`; configure the template recipient as `{{to_email}}` and its subject as `{{email_subject}}`. For the styled body, use `{{subject}}`, `{{concept}}`, `{{language}}`, `{{round}}`, `{{score}}`, `{{percentage}}`, `{{grade}}`, and `{{watched_videos}}`; `{{message}}` contains the complete result details. Quiz subject/topic aliases `{{quiz_subject}}` and `{{quiz_topic}}` are also sent. EmailJS public keys are intended for browser use; never put Gemini or SMTP secrets in frontend files.
- For a hosted backend, set `window.QUIZ_ARENA_API_URL` before `js/common.js` loads to the backend API base URL, ending in `/api`.

## API
POST `/api/auth/register`, `/api/auth/login` · GET `/api/subjects`, `/api/subjects/:id/topics` · POST `/api/ai/recommend` · POST `/api/videos/recommend`, `/api/videos/activity` · GET `/api/videos/activity` · GET `/api/quizzes`, `/api/quizzes/:id` · POST `/api/quizzes/:id/submit` · GET `/api/results/:userId`, `/api/results/detail/:id` · POST `/api/admin/login` · GET `/api/admin/users|results|activity|stats`.
Quiz ID = topic ID. Correct answers never leave the server; scoring happens in the backend (pass mark 50%).

## Database tables
users, admins, subjects, topics, questions, quiz_attempts, quiz_answers, results, learning_activity (see `backend/database/schema.sql`). The seed activates 40 CSE subjects and 80 topics, retaining existing quiz questions and learner history. When a topic has no saved questions for the selected difficulty, the backend generates and caches an English question set. Quizzes contain up to 15 questions and have a 10-minute timer. Difficulty levels are Basic, Intermediate, and Advanced. English, Telugu, Hindi, Tamil, and Malayalam are supported for language-specific YouTube searches; quiz questions remain in English. Videos are shown directly after language selection; no AI explanation page is required.

## Troubleshooting
- "Cannot reach the backend": start the backend (`scripts\start.bat`).
- `npm install` fails on better-sqlite3: use Node LTS (20/22) and re-run setup.
- Port busy: change `PORT` in `.env` (and `API` in `frontend/js/common.js`).
