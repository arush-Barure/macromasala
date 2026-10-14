# MacroMasala

A minimal, mobile-first meal and activity tracker, hosted on [GitHub Pages](https://arush-barure.github.io/macromasala/).

## What works

- **Today:** calories and percentage-of-target rings for protein, carbs and fat; date navigation; editable daily meal diary.
- **Log meal:** Indian food library, serving adjustments, custom foods, editable macros, notes and photo attachments.
- **Activity:** manual workout logging, duration, distance, energy, exercise notes, Strava activity links and `activities.csv` imports with duplicate detection.
- **Profile:** name, email, body measurements, BMI, weigh-ins, Cut / Maintain / Gain intention, manually editable macro and calorie goals.
- **Settings:** validated JSON backup and restore, local-data deletion and future AI connection settings.
- **iPhone:** responsive layout, safe-area navigation, Home Screen icons and offline app shell.

The app has no sign-in or cloud sync. Profile email is a local detail. Data stays in the browser's localStorage, including meal photos. Export a backup before clearing browser data or switching device/browser/Home Screen contexts. The update migrates `macromasala_v1` to `macromasala_v2` without deleting the old copy. Deleting all data explicitly removes both versions.

## Photo AI: prepared for a future update

As requested, AI is not connected in this release. Photos can be uploaded and logged with manually entered macros. The future endpoint contract and security requirements are documented in [server/README.md](server/README.md). The client already supports a configured backend, editable review of its estimates, timeouts and errors. No provider API keys are shipped, collected or stored by the app. No automated Strava sync is connected.

## Run and verify

No build or runtime dependencies are needed. Node 20+ is needed for tests; Python 3 for local preview.

```sh
npm test
npm start
```

Open http://127.0.0.1:4173. Keep the repository root as the GitHub Pages publishing directory on `main`. There is no framework build step. The service worker refreshes same-origin app assets using network-first requests and removes old MacroMasala caches; personal records remain in localStorage. Bump the cache version in `sw.js` for future deployments.

On iPhone: open the live link in Safari → Share → Add to Home Screen. After a first online visit, the app works offline except for an optional external AI endpoint. Fonts fall back to system fonts offline.

## Notes

Nutrition values are rough serving estimates. Goals are user-set and are not a medical prescription. The 2000 kcal / 120 g protein / 230 g carbs / 67 g fat defaults are editable starting examples. Selecting Cut, Maintain or Gain does not silently adjust targets. Workout energy is recorded separately and does not increase food targets. Current targets apply when viewing past days.

Strava CSV import expects the original English `activities.csv` export: Activity ID, Activity Date, Activity Name, Activity Type, Elapsed Time (seconds), first Distance column (kilometres), and optional Calories. Review distances against the original activity. Imports preserve the recorded calendar date and skip duplicate IDs and invalid rows.
