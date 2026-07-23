# AvoLens

A calorie & macro tracking web app, implemented from the `Nibbl v2.dc.html` design bundle in the repo root.

## Stack

Next.js (App Router) + TypeScript, plain CSS variables for the design tokens (no Tailwind styling — see `src/app/globals.css`), client-side state persisted to `localStorage` (`src/lib/store.tsx`), and server routes under `src/app/api`: `scan` calls the Claude API for real food-photo nutrition estimation, and `foods` proxies the free [Open Food Facts](https://world.openfoodfacts.org) database for name/brand search and barcode lookup.

## Screens

- `/` — Splash / onboarding
- `/home` — Dashboard: day strip, calorie/macro ring, GLP-1/water/nutrients carousel, exercise, today's log
- `/scanner` — Camera capture → AI nutrition estimate → add to log; plus a **Barcode** mode (live scan via `BarcodeDetector` where supported, or type the number) that looks the product up in the food database
- `/progress` — Weight chart, BMI, exercise stats, streak
- `/paywall` — Pro upsell
- `/settings` — Units, dark theme, daily goal, height, connected apps
- `/manual-entry` — Manual food logging, with **live search** of the Open Food Facts database (by name or brand) to auto-fill macros

Out of scope (by design, see project history): the iOS Home Screen widget and Lock Screen mockups from the original design file are presentational-only and were not built as real app screens.

## Running locally

```bash
npm install
cp .env.example .env.local   # then fill in ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000.

Without `ANTHROPIC_API_KEY` set, every other screen works normally; the Scanner's AI step returns a clear, non-crashing error ("ANTHROPIC_API_KEY is not configured on the server.") with a "Try again" affordance, and manual food entry remains available as a fallback.

## Deploying to Vercel

1. Push this project to a GitHub repo.
2. In Vercel, **Import** that repo. The framework is auto-detected as **Next.js** — leave the build/output settings at their defaults (`next build`).
3. Under **Settings → Environment Variables**, add `ANTHROPIC_API_KEY` (needed by the `/api/scan` serverless function). Redeploy after adding it.

That's it — no database or other services to configure.

## Notes

- All user state (today's log, weight history, water/dose/reminder, theme, units, goals) lives in `localStorage` under `avolens.state.v1` — there's no backend database of your own. Food search/barcode lookups are served on demand by the `foods` route from the public Open Food Facts API (no API key required).
- Dark mode auto-detects `prefers-color-scheme` and can be manually overridden in Settings; the whole app is theme-aware via CSS variables in `globals.css`.
- The day-strip's six non-today days show static demo data (for the "calendar" visualization); only "today" is backed by real, editable state.
