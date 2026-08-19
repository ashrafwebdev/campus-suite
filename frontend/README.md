# SMA Campus Suite — Frontend

A React + TypeScript + Vite single-page app for the SMA Campus Suite API
(`../` — FastAPI backend). Tailwind CSS v4 for styling, React Router for
routing, TanStack Query for server state.

## What's here so far

- **Auth**: login, JWT stored in `localStorage`, protected routes, a 401
  from the API forces a re-login.
- **Dashboard**: live counts (students, admission enquiries) pulled from
  the API.
- **Admissions**: list with status filter, create form, one-click
  "Convert to student" — the same lead → enrollment flow the backend
  enforces.
- **Students**: list, direct-enrollment form (day scholar / hosteller,
  with hostel room number).

Every other backend module (Hostel, Fees, Library, Transport, Exams,
Certificates, HR/Payroll) shows in the sidebar marked "Soon" — the API
for all of them already exists; this is a UI, not a backend, gap.

## Getting started

```bash
npm install
cp .env.example .env    # point VITE_API_URL at your backend
npm run dev
```

Requires the backend running (see `../README.md`) and reachable at
`VITE_API_URL`. The backend must allow this app's origin in its
`CORS_ORIGINS` setting — `http://localhost:5173` is the default there
already, matching Vite's default dev port.

## Building

```bash
npm run build
```

Outputs a static `dist/` — deployable to any static host (Netlify,
Vercel, Cloudflare Pages, GitHub Pages, or served by the same
reverse proxy as the API). Set `VITE_API_URL` to the deployed backend's
URL at build time, and add the deployed frontend's URL to the backend's
`CORS_ORIGINS`.

## Deploying (free, no card)

`netlify.toml` and `vercel.json` at the repo root already point at
`frontend/`, set the production `VITE_API_URL` to the live Render backend,
and add the SPA fallback rewrite React Router needs (without it, refreshing
on e.g. `/admissions` 404s on a plain static host — confirmed locally
before shipping these configs). Either platform needs only:

**Netlify:**
1. netlify.com → sign up (GitHub, no card) → **Add new site → Import an
   existing project** → pick this repo.
2. It reads `netlify.toml` automatically — base directory, build command,
   publish directory, env var, and the redirect rule are all already set.
   Just click deploy.

**Vercel:**
1. vercel.com → sign up (GitHub, no card) → **Add New → Project** → pick
   this repo.
2. It reads `vercel.json` automatically — same deal, no fields to fill in.
   Deploy.

Either way, once you have the live frontend URL, add it to the backend's
`CORS_ORIGINS` on Render (comma-separated with the existing values) and
redeploy the backend, or browser requests from the deployed frontend will
be blocked.

## Adding a page for another module

1. Add types to `src/types/api.ts` matching the backend's Pydantic schemas.
2. Add a list page under `src/pages/<module>/`, following
   `AdmissionsListPage.tsx` as a template (TanStack Query for fetching,
   Tailwind table).
3. Add a create/edit form following `AdmissionFormPage.tsx`.
4. Wire routes into `src/App.tsx` and flip the sidebar entry from
   `enabled: false` to `true` in `src/layout/AppLayout.tsx`.
