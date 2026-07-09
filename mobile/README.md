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

> **Verification note:** the JS, TypeScript, and config layers are verified
> here (tsc + Metro bundles for iOS/Android/web all pass). The Swift/Kotlin
> native paths (HealthKit queries, WidgetKit timeline, Health Connect
> aggregation) follow each library's documented API but must be exercised in
> a dev build on a real device — they can't be compiled in a JS-only CI.

## Building store binaries

Use EAS: `eas build --platform ios|android` (requires an Expo account).
The bundle IDs are `app.avolens.mobile` in `app.json`.
