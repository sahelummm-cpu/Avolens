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
- **Onboarding** — "Get Started" walks through name, goal, body stats,
  **weekly pace** (loss/gain rate → deficit), **diet split** (balanced /
  high-protein / low-carb / keto), and activity level, then shows a
  **plan summary** — computed daily calories, macros, and a goal ETA —
  with reminder/health opt-in toggles and a Terms/Privacy consent line
  before the paywall. Goals use Mifflin-St Jeor × activity, adjusted by
  the chosen pace (7700 kcal ≈ 1 kg).
- **Sign in with Google & Apple** — the auth screen offers email/password
  plus Google (in-app browser OAuth) and Apple (native on iOS). See the
  provider setup note under the Supabase section.
- **Exercise sync** — real Apple Health (HealthKit) and Android Health
  Connect integration. The Settings toggles request permission and, once
  connected, the Home and Progress exercise cards show today's real active
  energy, steps, active minutes, and workouts. (`src/lib/health*.ts`)
- **Home + Lock Screen widgets** — the Nibbl v2 widget suite, native on both
  platforms. Three widgets: a **Summary** ring card (calorie/protein/carbs
  ring with "kcal LEFT" in the center, the AvoLens brand, and Protein/Carbs
  progress bars), a **Streak** card (🔥 N day streak), and a **Water** card
  (💧 N.N L water today). On iOS these are three WidgetKit widgets in a
  `WidgetBundle` — Home Screen `systemSmall`/`systemMedium` plus Lock Screen
  accessories, so the Lock Screen can show the Calories / Water / Streak
  circulars and a rectangular macro line side by side. On Android they are
  three `react-native-android-widget` home-screen widgets. The app pushes a
  fresh snapshot (calories, macros, streak, water) whenever the log changes.
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
- **Food database search** — manual entry searches the free OpenFoodFacts
  database (debounced); pick a result and it prefills with the food's
  per-100g nutrition. (`src/lib/foods.ts`)
- **Portion / serving sizes** — database and barcode foods log by weight
  (grams), and all macros scale to the amount eaten — so the barcode scan
  reflects your actual portion, not a flat per-100g value.
- **Log to any day** — the entry screen has a day selector (Today,
  Yesterday, last 7 days) so you can backfill a forgotten meal.
- **Quick-add calories** — a "calories only" toggle for rough entries
  without macros.
- **Barcode scanning** — the Barcode chip on the Scanner reads
  EAN/UPC/Code-128 via `expo-camera`, looks the product up in
  OpenFoodFacts, and lets you adjust the portion before logging.
- **Favorites + recents** — star any food to pin it as a one-tap chip;
  recently logged meals also appear automatically (brand-new users get a
  short "Suggested" starter list instead).
- **Meal grouping** — Today's Log groups entries by Breakfast / Lunch /
  Dinner / Snack with a per-meal calorie subtotal, and "copy yesterday's
  meals" repeats a day in one tap.
- **Weight goal** — set a target weight in onboarding or on Progress; the
  chart shows a dashed goal line and "X kg to go".
- **Daily log reminder** — Settings toggle for an 8 PM local notification.
- **Weekly insights** — average kcal/protein per logged day, vs last week.
- **AI Coach** — the sparkle tab opens a chat that knows today's log and
  your goals (needs the Supabase backend below, plus sign-in).
- **GLP-1 medication tracker** — pick your medication (Semaglutide,
  Tirzepatide, Liraglutide, Dulaglutide) with its real dose ladder and
  weekly/daily cadence, choose the dose day + time (reminder follows it,
  with a missed-dose follow-up ~14h later), tap "Mark as taken" to log the
  injection with rotation-suggested sites, and see an adherence card
  (streak + last 8 cycles) plus injection markers on the weight chart.
  Hidden entirely via onboarding answer or Settings → GLP-1 tracking.
  (`src/lib/meds.ts`)

## Progress analytics

The Trends tab (`app/progress.tsx`, `src/lib/progress.ts`) includes:

- **Smoothed weight trend line** (EMA) over the raw weigh-ins, plus a
  **goal projection** — least-squares slope → "you'll reach your goal
  around <date> (~N weeks)".
- **Net calories & deficit** (when health is connected): eaten − burned,
  and the deficit vs. your target with an estimated kg/week.
- **Protein trend + adherence** — 7-day protein chart and "hit protein
  X/7 days" / "on calorie target X/7 days".
- **Logging heatmap** — a month calendar of logged days.
- **Achievements** — streak / weight-loss / consistency badges.
- **Body measurements** — waist/chest/hips/arm/thigh over time with change.
- **Progress photos** — camera/library pictures with a before/after view,
  uploaded to a private Supabase bucket (`progress-photos`, see below) and
  kept locally when signed out.
- **Export & share** — CSV export of your log/weight/measurements
  (`expo-sharing`) and a shareable progress summary.

## Settings

- **Profile** — real account (email / "Guest"), editable display name, sex,
  age, and activity level.
- **Goals** — edit daily calories, macro targets (with quick splits:
  balanced / high-protein / low-carb / keto), and water goal; plus
  **Recalculate from my stats** which re-runs Mifflin-St Jeor from your
  current weight/age/activity.
- **Reminders** — meal-log reminder with a configurable time, and the
  GLP-1 tracking toggle.
- **Data & privacy** — export CSV, clear logged data, and **delete
  account** (calls the `delete-account` edge function to remove the user
  + data, then wipes local state).
- **About** — version, privacy policy / terms links, contact support,
  rate the app. (Edit the placeholder URLs/email at the top of
  `app/settings.tsx`.)

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
                                              # (incl. the progress-photos bucket)
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
npx supabase functions deploy scan coach delete-account   # deploys supabase/functions/*
```

### Google / Apple sign-in setup

In the Supabase dashboard → Authentication → Providers, enable **Google**
and **Apple** and fill in their credentials (Google OAuth client, Apple
Services ID / key). Then under Authentication → URL Configuration add the
app's redirect URL to the allow-list:

```
avolens://auth-callback
```

Apple sign-in on iOS uses the native id-token flow (the app's
`expo-apple-authentication` + `usesAppleSignIn` are already configured);
Google (and Apple on Android) use the in-app browser OAuth flow. Without
provider config the buttons show but return a clear "not configured"
message.

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
