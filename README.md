# PitchXPO Admin

Production admin UI for PitchXPO. It authenticates with JWT against the PitchXPO backend and loads applications, payments, and settings from PostgreSQL.

## Run
```bash
npm install
npm run dev
```

Vite serves http://localhost:5174. Set `VITE_API_BASE_URL` to the backend origin (default `http://localhost:3001`).

Sign in with an admin created by backend `npm run seed:admin`. The JWT is kept in sessionStorage. Applications, payments, events, categories, and users are never stored as source of truth in localStorage.
