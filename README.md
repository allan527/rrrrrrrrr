# Texas Finance Dashboard

Personal Loan Management Dashboard for internal operations in Uganda.

## What is in this repository

This project includes:

- **Frontend**: React + TypeScript + Vite + React Router + Tailwind CSS v4
- **UI behavior**: UGX formatting, loan calculations (20%/30 days), role checks, local data mode
- **Vercel hosting config**: `vercel.json` for SPA routing + build output

---

## 1) Local development

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

---

## 2) Environment variables

Copy `.env.example` to `.env` and update values.

```bash
cp .env.example .env
```

Important frontend variables:

- `VITE_APP_NAME` – UI title text
- `VITE_OWNER_EMAIL` – owner account used for owner-only UI gates
- `VITE_DATA_MODE` – `local` (localStorage demo) or `remote` (API-backed)
- `VITE_API_BASE_URL` – API base URL for remote mode

If you enable a remote backend, configure its variables in that backend environment.

---

## 3) Deploy frontend to Vercel

### Option A: via Vercel dashboard

1. Push repository to GitHub/GitLab/Bitbucket.
2. Import project into Vercel.
3. Framework preset: **Vite**.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Add environment variables from `.env.example` (`VITE_*`).
7. Deploy.

### Option B: via Vercel CLI

```bash
npm i -g vercel
vercel
vercel --prod
```

The included `vercel.json` ensures SPA route fallback to `index.html`.

---

## 4) Production note

Current frontend logic defaults to **local mode** (`localStorage`) to make quick demos easy.
For production hosting, set:

- `VITE_DATA_MODE=remote`
- `VITE_API_BASE_URL=<your deployed API base>`

and wire data calls to your deployed API backend.

---

## 5) Core business rules implemented

- UGX formatting (`UGX 1,000,000` style)
- 20% monthly interest (`totalPayable = principal * 1.2`)
- 30-day loan duration (`endDate = startDate + 30 days`)
- Processing fee fixed at `10,000 UGX`
- Owner checks by configured email (`VITE_OWNER_EMAIL`)
- Phone normalization for Uganda numbers (`+256`/`256` → `0...`)
