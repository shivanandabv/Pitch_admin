# PitchXPO Admin

Production admin UI for PitchXPO. It authenticates with JWT against the PitchXPO backend and loads applications, payments, and settings from PostgreSQL.

## Run locally

```bash
npm install
cp .env.example .env.development
npm run dev
```

Vite serves http://localhost:5174. Default API is `http://localhost:3001` via `VITE_API_BASE_URL`.

Sign in with a real Admin account from PostgreSQL (created via backend ops, e.g. `npm run seed:admin` on the server). The JWT is kept in **sessionStorage** only. This UI never uses localStorage as a data source and never ships demo applications, payments, events, categories, or users.

## Production build

Hosted at `https://pitch.best/pitchxpoconclave/admin/`.

```bash
cp .env.production.example .env.production
npm run build
```

Required build-time variables (non-secret):

- `VITE_API_BASE_URL=https://pitchxpo-backend.onrender.com`
- `VITE_BASE_PATH=/pitchxpoconclave/admin/`

Deploy the contents of `dist/` to that path. Do not ship a build that still contains `localhost:3001`.

Backend Render must allow CORS origin `https://pitch.best` and set:

`ADMIN_PASSWORD_RESET_URL=https://pitch.best/pitchxpoconclave/admin/#reset_password`
