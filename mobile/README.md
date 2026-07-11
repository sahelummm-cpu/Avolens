# AvoLens Mobile (React Native)

The native iOS/Android port of the AvoLens web app, built with Expo (SDK 57) +
expo-router + TypeScript. It is a 1:1 recreation of the web app: same screens,
same design tokens (light & dark), same Poppins / Plus Jakarta Sans type,
same client-side state model — plus native camera capture and real local
notifications.

## Screens (matching the web app routes)

| Route | Screen |
| --- | --- |
| `/` | Splash |
| `/onboarding` | Goal / body / activity questionnaire → computes calorie & macro targets |
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
  with the same entrance animations (ring sweep, card fade-up). Ring and
  progress-bar sweeps run on the UI thread via `react-native-reanimated`.
- **Onboarding** — "Get Started" walks through goal, sex/age, height
  (cm or ft/in), weight (kg or lb), and activity level, then computes the
  daily calorie goal (Mifflin-St Jeor × activity, adjusted for the goal)
  and a 30/40/30 macro split, and lands on the Pro paywall.
- **Exercise sync** — real Apple Health (HealthKit) and Android Health
  Connect integration. The Settings toggles request permission and, once
  connected, the Home and Progress exercise cards show today's real active
  energy, steps, active minutes, and workouts. (`src/lib/health*.ts`)
- **Home + Lock Screen widgets** — a native iOS WidgetKit widget (Home
  Screen `systemSmall`/`systemMedium` plus Lock Screen accessory families)
  and an Android home-screen widget, both showing "kcal left", macros, and
  the streak. The app pushes a fresh snapshot whenever the log changes.
  (`src/widgets/`, `targets/widget/`, `src/lib/widgets*.ts`)

## No demo data

A fresh install starts completely empty — no seeded meals, weight history,
streak, or activity. Rings, the day strip, and the Progress screen all show
designed empty states until the user logs real data. Exercise/activity cards
show a "Connect Apple Health or Google Fit" state (see below).

## App features

- **Dated history + streaks** — meals are stored per calendar day
  (`state.history`), rolling over automatically at midnight (water resets
  too). The day strip, streak counter, Progress trends, and weekly insights
  all read from real history. (`src/lib/days.ts`)
- **Edit / delete meals** — tap any card in Today's Log to edit it
  (prefilled manual-entry) or delete it (trash icon).
- **Barcode scanning** — the Barcode chip on the Scanner reads
  EAN/UPC/Code-128 via `expo-camera` and looks the product up in the free
  OpenFoodFacts database (values per 100 g). No API key needed.
- **Recents** — recently logged meals appear as one-tap chips in manual
  entry.
- **Weight goal** — set a target weight in onboarding or on Progress; the
  chart shows a dashed goal line and "X kg to go".
- **Daily log reminder** — Settings toggle for an 8 PM local notification.
- **Weekly insights** — average kcal/protein per logged day, vs last week.
- **AI Coach** — the sparkle tab opens a chat that knows today's log and
  your goals (needs the Supabase backend below, plus sign-in).

## Supabase backend (accounts, sync, AI scan + coach)

Set the two env vars (Supabase dashboard → Settings → API — use the
**legacy anon JWT key**):

```bash
cp .env.example .env
# EXPO_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
# EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Then, from the repo root with the Supabase CLI (`npx supabase login`):

```bash
npx supabase link --project-ref <ref>
npx supabase db push                          # applies supabase/migrations/*
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
npx supabase functions deploy scan coach      # deploys supabase/functions/*
```

That enables: email/password accounts (Settings → Account), state sync
(one jsonb row per user in `public.profiles`, RLS-protected,
last-write-wins), the AI meal scan (`scan` function), and the AI coach
chat (`coach` function). Without the env vars the app runs fully offline
and hides account UI.

## AI scanning (fallback)

If Supabase is **not** configured, the scanner falls back to the web app's
`/api/scan` route:

- Deployed: `EXPO_PUBLIC_API_URL=https://<your-avolens>.vercel.app`
- Local dev: run `npm run dev` in the repo root and use your machine's LAN
  address, e.g. `EXPO_PUBLIC_API_URL=http://192.168.1.20:3000`

Without either backend, the Scanner shows a clear error; barcode scanning
and manual entry still work.

## Running

```bash
cd mobile
npm install
npm start          # Expo dev server → press i / a, or scan with Expo Go
```

Camera, scheduled notifications, health sync, and widgets need a real device
and a **development build** (see below); the rest works in simulators and
Expo Go. Note that the health-sync and widget native modules mean the app can
no longer run in **Expo Go** — use a dev build.

## Development build (required for health sync + widgets)

Health sync and the widgets use native modules and native targets, so they
only run in a custom dev/production build — not Expo Go:

```bash
# one-time
npm install -g eas-cli && eas login
# generate native projects locally (applies all config plugins / targets)
npx expo prebuild --clean
# or build a dev client on EAS and install it on a device
eas build --profile development --platform ios      # or android
```

Platform setup notes:

- **iOS widget** — set `expo.ios.appleTeamId` in `app.json` to your Apple
  Developer Team ID (the `@bacons/apple-targets` plugin needs it to sign the
  WidgetKit extension). The widget + app share the App Group
  `group.app.avolens.mobile` (declared in `app.json` and
  `targets/widget/expo-target.config.js`); the SwiftUI source is
  `targets/widget/index.swift`.
- **HealthKit** — the `@kingstinct/react-native-healthkit` plugin adds the
  HealthKit entitlement + usage strings. Requires a real device and a paid
  Apple Developer account.
- **Android Health Connect** — needs the Health Connect app installed; read
  permissions are declared in `app.json`. Android's home-screen widget is
  defined in JS (`src/widgets/SummaryWidget.tsx`).
  `plugins/withHealthConnectDelegate.js` injects the required
  `HealthConnectPermissionDelegate.setPermissionDelegate(this)` into
  `MainActivity.onCreate` — without it the permission request crashes the
  app (the library's bundled Expo plugin only patches the manifest).
- **Emulator camera** — the Android emulator has no real camera, so the
  Scanner shows the emulator's rendered "virtual scene" room. That is
  expected; on a physical device the live camera appears. (You can point
  the emulator at your webcam: Extended controls → Camera → webcam0.)

> **Verification note:** the JS, TypeScript, and config layers are verified
> here (tsc + Metro bundles for iOS/Android/web all pass). The Swift/Kotlin
> native paths (HealthKit queries, WidgetKit timeline, Health Connect
> aggregation) follow each library's documented API but must be exercised in
> a dev build on a real device — they can't be compiled in a JS-only CI.

## Building store binaries

Use EAS: `eas build --platform ios|android` (requires an Expo account).
The bundle IDs are `app.avolens.mobile` in `app.json`.
