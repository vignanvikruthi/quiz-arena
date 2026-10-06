# Architecture
Browser (frontend :8000, static HTML/CSS/JS) → REST/JSON + JWT → Express (backend :3000) → SQLite file.
Backend extras: `aiService` → Gemini (key only in `.env`, fallback labelled), `videoService` → YouTube search URLs, `emailService` → SMTP.
Flow: register → login → subject → topic → language → /ai/recommend → /videos/recommend (+ /videos/activity on click) → /quizzes/:id → /quizzes/:id/submit (grade, store attempt+answers+result, email) → result → history. Admin uses a separate admin JWT and /api/admin/*.
Frontend state: JWT + user in localStorage; current selection in sessionStorage. Results live only in SQLite.
Layout: `frontend/` pages + `js/` (common, auth, flow, quiz, admin) + `css/style.css`; `backend/` routes, services, middleware, config, database; `scripts/` setup/start + tiny static server.
