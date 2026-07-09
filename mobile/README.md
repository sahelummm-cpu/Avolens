# AvoLens Mobile (React Native)

The native iOS/Android port of the AvoLens web app, built with Expo (SDK 57) +
expo-router + TypeScript. It is a 1:1 recreation of the web app: same screens,
same design tokens (light & dark), same Poppins / Plus Jakarta Sans type,
same client-side state model — plus native camera capture and real local
notifications.

## Screens (matching the web app routes)

| Route | Screen |
| --- | --- |
| `/` | Splash / onboarding |
| `/home` | Dashboard: day strip, calorie/macro rings, GLP-1/water/nutrients carousel, exercise, today's log |
| `/scanner` | Native camera capture → AI nutrition estimate → add to log |
| `/progress` | Weight chart, BMI, exercise stats, streak |
| `/paywall` | Pro upsell |
| `/settings` | Units, dark theme, daily goal, height, connected apps |
| `/manual-entry` | Manual food logging |

## What's native here

- **Theme** — the exact CSS-variable palette from `src/app/globals.css` lives
  in `src/lib/theme.tsx`; auto mode follows the OS appearance
  (`Appearance` API) and can be overridden in Settings, like the web app.
- **State** — same `avolens.state.v1` shape, persisted with AsyncStorage
  instead of localStorage (`src/lib/store.tsx`).
- **Camera** — `expo-camera` replaces `getUserMedia` on the Scanner screen.
- **Notifications** — the GLP-1 reminder bell on the Home carousel now
  schedules a real weekly local notification (Wednesday 9:00) via
  `expo-notifications`; toggling it off cancels it.
- **Charts / rings** — all SVG visuals re-rendered with `react-native-svg`,
  with the same entrance animations (ring sweep, card fade-up).

## No demo data

A fresh install starts completely empty — no seeded meals, weight history,
streak, or activity. Rings, the day strip, and the Progress screen all show
designed empty states until the user logs real data. Exercise/activity cards
show a "Connect Apple Health or Google Fit" state (see below).

## AI scanning

The Anthropic call stays server-side (so no API key ships in the binary).
The app POSTs the captured photo to the web app's `/api/scan` route:

```bash
cp .env.example .env   # then set EXPO_PUBLIC_API_URL
```

- Deployed: `EXPO_PUBLIC_API_URL=https://<your-avolens>.vercel.app`
- Local dev: run `npm run dev` in the repo root and use your machine's LAN
  address, e.g. `EXPO_PUBLIC_API_URL=http://192.168.1.20:3000`

Without it, the Scanner shows a clear error and manual entry still works —
same graceful degradation as the web app.

## Running

```bash
cd mobile
npm install
npm start          # Expo dev server → press i / a, or scan with Expo Go
```

Camera and scheduled notifications need a real device (or a development
build); everything else works in simulators and Expo Go.

## Not yet built (need a custom dev build — can't run in Expo Go)

These require native modules + an EAS **development build** (they cannot be
tested in Expo Go, and generally need a real device):

- **Home Screen & Lock Screen widgets** — native WidgetKit (iOS) / Glance
  App Widgets (Android) targets driven by a config plugin, sharing data with
  the app via App Groups / shared storage. Not implemented yet.
- **Exercise sync from other devices/apps** — real Apple Health (HealthKit)
  and Google Fit / Health Connect integration. The Home and Progress
  "Connect" states are the pre-sync UI; wiring the actual data source is
  still pending.

## Building store binaries

Use EAS: `npx eas build --platform ios|android` (requires an Expo account).
The bundle IDs are `app.avolens.mobile` in `app.json`.
