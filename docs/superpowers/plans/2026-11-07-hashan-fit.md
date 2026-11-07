# Hashan Fit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy the Hashan Fit phone web app described in the spec. It carries the 3-month plan, tracks meals, workouts, weight and sleep, shows a how-to motion demo for every exercise, and syncs Fitbit Air data through the Google Health API.

**Architecture:**
- A React + Vite + TypeScript PWA. Static plan data lives in `src/plan`, pure rules in `src/logic`, and IndexedDB storage (through Dexie) in `src/db`.
- A few Vercel Web-standard functions in `api/` handle Google OAuth. The refresh token is kept AES-GCM-encrypted in an HttpOnly cookie, so there is no database.
- Exercise demos use public-domain start and end photos from free-exercise-db (Unlicense). The photos are resized, served from `public/demos/`, and looped with a crossfade.

**Tech Stack:** React 18, Vite 5, TypeScript 5, vite-plugin-pwa, Dexie 4 + dexie-react-hooks, Vitest + fake-indexeddb, Playwright (pre-installed), Vercel Functions (Node 22).

**Spec:** `docs/superpowers/specs/2026-11-07-hashan-fitness-design.md`. Added after the spec, at Hashan's request: a how-to demo with motion for each exercise.

## Global Constraints

- All dates are `YYYY-MM-DD` in Asia/Riyadh. The plan starts on Sunday 2026-11-08.
- The phase boundaries, targets and times are exactly those in spec A1 to A6.
- Calories never go below 1,600 kcal.
- Lipo 6 is active from 2026-11-08 to 2027-01-02, never during Ramadan, and only before 10:00 AM.
- Manual steps and sleep entries are never overwritten by sync.
- No secrets in the repo or in chat. The five env vars are `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `TOKEN_ENC_KEY`, `ALLOWED_EMAIL` and `APP_ORIGIN`.
- English only, no emojis in the UI copy, and light and dark themes.

## Review Focus

1. **Opening the app before 8 Nov, or after Ramadan.** `dayContext` must return a sensible phase (`before` or `continue`), never crash or say "week 0".
2. **A Friday with a missing weigh-in, or no weigh-in from 2 weeks ago.** The two-week check returns `null` and shows nothing. It must not produce a wrong suggestion.
3. **Restoring a backup from a different app or a corrupt file.** It is rejected with a clear message, and no existing data is changed.
4. **Fitbit sync returning days that already have manual values.** The manual values stay.
5. **A tampered or expired cookie or pairing code.** The API returns 401 with no crash. The app shows Reconnect.

---

### Task 1: Scaffold, plan data, logic

**Files:**
- `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `vercel.json`
- `src/plan/{types,foods,exercises,program,calendar}.ts`
- `src/logic/{dates,context,totals,checks,strength,ics}.ts`
- Tests in `src/logic/*.test.ts`

**Interfaces produced:**

Dates:
- `todayRiyadh(now?: Date): string`
- `riyadhHour(now?: Date): number`
- `addDays(d: string, n: number): string`
- `diffDays(a: string, b: string): number`
- `weekday(d: string): number` (0 means Sunday)

Day context:
- `dayContext(date: string, s: Settings): DayContext`
- `DayContext` has these fields: `phase: PhaseId`, `week: number|null`, `ramadanDay: number|null`, `sessionId: SessionId`, `kcalTarget`, `proteinTarget`, `stepsTarget`, `waterTargetMl`, `lipoActive`, `bed`, `wake`, `mealSlots: MealSlot[]` and `label: string`.

Workout rules:
- `prescription(item: SessionItem, phase: PhaseId): {sets, repLow, repHigh}`

Totals and checks:
- `dayTotals(meals: MealItem[]): {kcal, protein}`
- `twoWeekCheck(weighIns, date, s): CheckResult|null`
- `targetWeightAt(date, s): number`

Strength:
- `e1rm(kg, reps)`
- `progressionHint(ex: ExerciseInfo, last: SetLog[], p): string|null`

Calendar:
- `buildIcs(events: IcsEvent[]): string`
- `workDayEvents(): IcsEvent[]`
- `ramadanEvents(): IcsEvent[]`

**Tests:**
- Phase boundaries:

| Date | Expected phase |
|---|---|
| 2026-11-07 | `before` |
| 2026-11-08 | foundation, week 1 |
| 2026-12-06 | build, week 5 |
| 2027-01-03 | recovery, week 9 |
| 2027-01-10 | push, week 10 |
| 2027-02-07 | transition |
| 2027-02-08 | ramadan, day 1 |
| 2027-03-10 | eid |
| 2027-03-13 | continue |

- Steps ramp: 7000, 8000, 9000, then 10000.
- Lipo: active on 2027-01-02, inactive on 2027-01-03.
- Ramadan targets: 1950 kcal, 150 g protein, meal slots suhoor, iftar, main and afterGym.
- Two-week check:

| Weekly loss rate | Expected result |
|---|---|
| 0.5 | -150 |
| 0.5 at 1650 kcal | +2000 steps |
| 1.8 | +150 |
| 1.0 | keep |
| Missing weigh-in | `null` |

- e1rm: (100, 10) gives 133.3.
- Hint: when the top of the range is hit, upper body gets +2.5 and lower body gets +5.
- ics: the event count, `TZID=Asia/Riyadh` and the `RRULE UNTIL` dates are correct.

**Commit:** `feat: plan data and rules`

### Task 2: Exercise demos

**Files:**
- `scripts/fetch-demos.py`, a one-off script that downloads and resizes the photos to 480 px wide at quality 72
- `public/demos/<dbId>/{0,1}.jpg`
- `public/demos/CREDITS.md`
- `src/components/ExerciseDemo.tsx`

**What it covers:**
- Every `ExerciseInfo` has `demo` (the free-exercise-db id), `how: string[]` (3-4 steps), `avoid: string[]` and `muscles: string`.
- `ExerciseDemo` crossfades the two frames every 1.2 s. Tapping pauses it. Under `prefers-reduced-motion` it shows the two frames side by side.

**Test:** every exercise and alternative id used in the program exists in the catalog and has two demo files on disk.

**Commit:** `feat: exercise how-to demos`

### Task 3: Storage and backup

**Files:**
- `src/db/{db,queries,backup}.ts`
- Tests in `src/db/*.test.ts`, using fake-indexeddb

**Interfaces produced:**
- `db` with these tables:

| Table | Key |
|---|---|
| `settings` | `id` |
| `days` | `date` |
| `weighIns` | `date` |
| `workouts` | `id` |
| `adjustments` | `date` |

- `getSettings()`
- `saveSettings(patch)`
- `getDay(date)`
- `updateDay(date, fn)`
- `lastSetsFor(exerciseId, beforeDate)`
- `exportBackup(): BackupFile`
- `importBackup(data: unknown): {counts}`, which throws `BackupError`
- `applyBandData(updates: Record<string, BandDay>)`

**Tests:**
- An export followed by an import gives identical data.
- A wrong `app` value is rejected and existing data is unchanged.
- `applyBandData` keeps manual steps.

**Commit:** `feat: on-device storage and backup`

### Task 4: Screens and PWA

**Files:**
- `src/main.tsx`, `src/App.tsx`, `src/styles.css`
- `src/screens/{Today,Workout,Progress,Plan}.tsx`
- `src/components/*`
- `public/icons/*`

**What it covers:**
- Tabs: Today, Workout, Progress, Plan.
- Behaviour follows spec B2, plus a "How to" button on each exercise that opens `ExerciseDemo`.
- PWA manifest named "Hashan Fit". The service worker never caches `/api`.

**Verification:**
- `npm run build` passes.
- The Playwright smoke test `e2e/smoke.mjs` runs at a 390x844 viewport:
  1. confirm breakfast
  2. add tandoori chicken
  3. open Workout, then How to on an exercise, and check the demo image loads
  4. log a set
  5. record a weigh-in
  6. export a backup

**Commit:** `feat: app screens`

### Task 5: Fitbit sync

**Files:**
- `api/_lib/{crypto,cookies,google,handlers}.ts`
- `api/auth/start.ts`, `api/auth/callback.ts`, `api/token.ts`, `api/pair.ts`, `api/disconnect.ts`
- `src/sync/{client,map}.ts`
- Tests in `api/_lib/*.test.ts` and `src/sync/*.test.ts`

**Interfaces:**
- Handlers have the shape `(req: Request, env: Env, fetchFn: typeof fetch) => Promise<Response>`.
- Every route file exports `GET` or `POST`, which calls its handler with `process.env` and `fetch`.

**Tests:**
- Crypto: a round trip works, and a tampered value fails.
- Callback rejects a state mismatch, a wrong email, and a response with no refresh token.
- Token returns 401 with `reconnect` on `invalid_grant`, and 401 when no cookie is present.
- Pair rejects an expired code.
- Any POST with a bad Origin gets 403.
- The response mapping matches the recorded fixtures.

**Commit:** `feat: Fitbit sync via Google Health API`

### Task 6: Calendar files, docs, deploy

**Files:**
- `scripts/generate-ics.ts`, which writes `public/work-days.ics` and `public/ramadan.ics`
- `docs/health-plan.md`
- `docs/google-health-setup.md`
- `README.md`

**Steps:**
1. Run the full test suite, the build and the smoke test.
2. Push.
3. Create the Vercel project from the GitHub repo.
4. Check the production deployment loads, the manifest loads, and `/api/token` returns 503 `not_configured` before the env vars are set.

**Commit:** `chore: calendar files, docs, deploy config`
