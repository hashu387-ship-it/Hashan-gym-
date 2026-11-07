# Hashan Fit: 3-month fat-loss plan and phone app (design spec)

Date: 2026-11-07
Status: draft, waiting for Hashan's review

This spec has two parts. Part A is the health plan itself, the content the app is built around. Part B is the app that carries the plan and tracks progress.

The plan is general fitness guidance, not medical advice. The app shows this note on the Plan tab, along with the warning signs listed in A6.

---

## What Hashan told us

| Item | Value |
|---|---|
| Person | Hashan, male, 32, 165 cm, 96 kg |
| Health | No known conditions or injuries |
| Gym | Body Masters, Riyadh. Some training experience |
| Work | Office 8:30 AM to 5:30 PM |
| Gym time | 7:00 PM |
| Week | Weights Sunday to Thursday, cardio Saturday, rest Friday |
| Breakfast (fixed, 7:50 AM) | 2 chapatis, 2-egg omelette, 100 g beef curry, one cup of milk tea with no sugar |
| Lunch and dinner | Mostly Sri Lankan or Indian delivery |
| Sleep now | Sleeps between 11 PM and 12 AM, wakes between 6 and 7 AM |
| Tools | Normal bathroom scale. Fitbit Air band synced to the Google Health app on an iPhone |
| Supplement | Lipo 6 Ultra, 2 capsules a day today |
| Ramadan | Will fast |
| Goal pace | Middle ground, about 1 to 1.2 kg a week. 82 to 83 kg after 3 months, 78 kg later |
| App | Phone web app (installable PWA) on Vercel, built with React + Vite. Data stays on the phone with a backup file. Fitbit auto-sync from day one |

## Assumptions

- The plan starts on **Sunday 8 November 2026**. Starting weight is 96 kg.
- An afternoon snack of Greek yogurt, laban or a whey shake is acceptable.
- Hashan's Body Masters branch is open at 7 PM (most Riyadh branches are open 24 hours, closed Friday 10 AM to 1 PM).
- All dates and times use Riyadh time (Asia/Riyadh, UTC+3).
- Ramadan 1448 is expected from Monday 8 February to Tuesday 9 March 2027. The real dates depend on the moon sighting, so the app has a setting to move them.

---

# Part A: The health plan

## A1. Numbers

- **BMI:** 35.3 today. 30.5 at 83 kg. 28.7 at 78 kg.
- **Resting burn (BMR, Mifflin-St Jeor):** about 1,840 kcal a day.
- **Daily burn with this plan:** about 2,800 kcal a day (desk job, 5 gym sessions, 10,000 steps). It falls as weight drops.
- **Daily targets (8 Nov 2026 to 6 Feb 2027):**

| Target | Amount |
|---|---|
| Calories | 1,800 kcal |
| Protein | 160 g |
| Fat | about 60 g |
| Carbs | about 155 g |
| Water | 3 to 3.5 L |

- **Calorie floor:** the target never goes below 1,600 kcal.
- **Steps:** 7,000 in week 1, 8,000 in week 2, 9,000 in week 3, and 10,000 from week 4 on.
- **Expected weight:**

| Checkpoint | Date | Weight |
|---|---|---|
| Week 4 | 4 Dec | ~91 kg |
| Week 8 | 1 Jan | ~87 kg |
| Week 13 | 5 Feb | ~83 kg |
| End of Ramadan | ~9 Mar | ~81.5 kg |
| 78 kg reached | around mid-April 2027 | 78 kg |

- **Weigh-ins:**
  - Every Friday morning, after the toilet and before eating or drinking. Same scale each time.
  - Waist at the navel, optional, on the same day.
- **Two-week check:**
  - Runs at the Friday weigh-in of weeks 4, 6, 8, 10 and 12. Weeks 1 to 3 are skipped because early water loss distorts the trend.
  - The weekly loss rate compares the current weigh-in with the one two weeks earlier.

| Weekly loss | Suggestion |
|---|---|
| Below 0.8 kg | Lower calories by 150 kcal. If that would go under 1,600, add 2,000 steps instead |
| Above 1.5 kg | Raise calories by 150 kcal |
| 0.8 to 1.5 kg | No change |

  - The app only suggests. Hashan accepts or ignores each suggestion.
  - The check doesn't run during Ramadan.

## A2. Food on a normal day

**Default breakfast at 7:50 AM.** The app fills this in automatically.

| Item | kcal | Protein |
|---|---|---|
| 2 chapatis (about 40 g each) | 240 | 8 g |
| 2-egg omelette, 1 tsp oil | 185 | 12.5 g |
| 100 g beef curry | 185 | 15 g |
| Milk tea, no sugar | 40 | 2 g |
| **Total** | **~650** | **~37.5 g** |

The beef curry is the least certain value. It is a planning figure for a meat-heavy home recipe, and Hashan can edit it in settings.

**The rest of the day (example, about 1,800 kcal and 155 to 160 g protein)**

| Time | Meal | Example | kcal | Protein |
|---|---|---|---|---|
| 1:00 PM | Lunch (delivery) | Chicken tikka (dry), half cup dal, salad, 1 chapati | ~520 | ~50 g |
| 4:30 PM | Snack | Greek yogurt or a whey shake, plus 1 fruit | ~200 | ~25 g |
| 8:45 PM | Dinner after the gym | Grilled fish 200 g, salad, 1 chapati | ~410 | ~47 g |

**Caffeine rules**

- Breakfast tea stays.
- No tea or coffee after 12 PM.
- No pre-workout drinks or energy drinks.

**Delivery food guide**

These are estimates for typical restaurant portions. Hashan can edit any value in the app, and every item in the app shows its calories and protein.

| Group | Item | Portion | kcal | Protein |
|---|---|---|---|---|
| Go | Tandoori chicken | half chicken, ~250 g with bone | 300 | 40 g |
| Go | Chicken tikka, dry | 6 pieces, ~200 g | 280 | 40 g |
| Go | Grilled fish or fish tikka | 200 g | 260 | 42 g |
| Go | Grilled chicken breast | 200 g | 330 | 60 g |
| Go | Chicken seekh kebab | 2 pieces | 250 | 24 g |
| Go | Egg curry | 2 eggs with gravy | 250 | 13 g |
| Go | Yellow dal | 1 cup, 200 g | 180 | 10 g |
| Go | Chapati or roti | 1 | 120 | 4 g |
| Go | Green salad | 1 bowl | 30 | 1 g |
| Go | Raita | 100 g | 70 | 3 g |
| Go | Greek yogurt, plain | 170 g | 130 | 17 g |
| Go | Laban | 1 cup, 240 ml | 100 | 8 g |
| Go | Whey shake with water | 1 scoop | 120 | 24 g |
| Go | Fruit (apple, orange or banana) | 1 | 90 | 1 g |
| Careful | Rice, half portion | 150 g cooked | 200 | 4 g |
| Careful | Chicken curry (ask for less oil) | 200 g | 300 | 25 g |
| Careful | Fish curry | 200 g | 260 | 25 g |
| Careful | Devilled chicken | 200 g | 380 | 30 g |
| Careful | Chana masala | 1 cup | 250 | 11 g |
| Careful | Palak paneer | 1 cup | 300 | 14 g |
| Careful | String hoppers | 5 | 200 | 4 g |
| Careful | Plain dosa with sambar | 1 | 250 | 7 g |
| Careful | Idli with sambar | 2 | 200 | 7 g |
| Avoid | Chicken biryani | 1 portion, ~400 g | 800 | 35 g |
| Avoid | Chicken kottu | 1 portion | 900 | 35 g |
| Avoid | Parotta | 1 | 300 | 5 g |
| Avoid | Naan | 1 | 300 | 9 g |
| Avoid | Butter chicken | 1 cup | 490 | 30 g |
| Avoid | Korma | 1 cup | 500 | 25 g |
| Avoid | Fried rice | 1 portion | 700 | 15 g |
| Avoid | Samosa | 1 | 260 | 4 g |
| Avoid | Falooda or sweet drinks | 1 glass | 400 | 8 g |

## A3. Training at Body Masters

**Time and length**

- Sunday to Thursday at 7:00 PM, about 75 minutes: roughly 60 minutes of weights, then a 15-minute incline treadmill walk (incline 8 to 12 percent, 5 to 5.5 km/h).
- Saturday at 7:00 PM: 45 to 60 minutes of easy cardio. Use the incline walk, bike or elliptical, keeping heart rate at about 113 to 132 bpm.
- Friday: rest, steps only.

**Sessions**

Main lifts are marked *. Weeks 1 to 4 use the first set count shown. Weeks 5 to 8 and 10 to 13 use the second.

Sunday, Upper A (chest, shoulders, triceps)

| Exercise | Sets x reps |
|---|---|
| Barbell bench press* | 3x8-10, later 4x6-8 |
| Seated cable row | 3x10-12 |
| Incline dumbbell press | 3x10-12 |
| Seated dumbbell shoulder press | 3x10-12 |
| Lateral raise | 3x12-15 |
| Triceps rope pushdown | 3x12-15 |

Monday, Lower A (squat focus)

| Exercise | Sets x reps |
|---|---|
| Back squat* | 3x8-10, later 4x6-8 |
| Dumbbell Romanian deadlift | 3x10-12 |
| Leg press | 3x10-12 |
| Lying leg curl | 3x12-15 |
| Standing calf raise | 3x12-15 |
| Plank | 3x30-45 s |

Tuesday, Upper B (back, biceps)

| Exercise | Sets x reps |
|---|---|
| Lat pulldown* | 3x8-10, later 4x6-8 |
| Chest-supported row | 3x8-10 |
| Machine chest press | 3x10-12 |
| Face pull | 3x12-15 |
| Dumbbell curl | 3x10-12 |
| Hammer curl | 2x12-15 |

Wednesday, Lower B (hip hinge)

| Exercise | Sets x reps |
|---|---|
| Trap bar deadlift* | 3x6-8, later 4x5-6 |
| Bulgarian split squat | 3x10 each leg |
| Hip thrust | 3x10-12 |
| Leg extension | 3x12-15 |
| Seated calf raise | 3x15 |
| Cable crunch | 3x12-15 |

Thursday, full-body circuit

- 4 rounds, with 90 seconds of rest between rounds: goblet squat x12, push-up x10-15 (incline if needed), one-arm dumbbell row x12 each side, kettlebell swing x15, farmer carry 30 m.
- Core afterwards: dead bug 3x10, side plank 2x30 s each side.

**Alternatives when a machine is busy.** One tap in the app swaps the exercise.

| Exercise | Alternatives |
|---|---|
| Bench press | Dumbbell bench, machine chest press |
| Back squat | Hack squat, Smith machine squat, goblet squat |
| Lat pulldown | Assisted pull-up, single-arm pulldown |
| Trap bar deadlift | Conventional deadlift, barbell Romanian deadlift |
| Leg press | Hack squat, goblet squat |
| Chest-supported row | T-bar row, machine row |
| Seated cable row | Machine row, one-arm dumbbell row |
| Lying leg curl | Seated leg curl |
| Hip thrust | Glute bridge machine, cable pull-through |
| Bulgarian split squat | Walking lunge, step-up |

**Phases**

| Weeks | Dates | Phase | Rule |
|---|---|---|---|
| 1-4 | 8 Nov - 5 Dec | Foundation | 3 sets. Stop each set about 3 reps before failure. Learn form |
| 5-8 | 6 Dec - 2 Jan | Build | Main lifts 4 sets. Stop about 2 reps before failure |
| 9 | 3 Jan - 9 Jan | Recovery | 2 sets per exercise, weights about 10 percent lighter |
| 10-13 | 10 Jan - 6 Feb | Push | Main lifts 4 sets at the lower rep range. Stop 1-2 reps before failure |
| - | 7 Feb | Transition | Rest day |
| Ramadan | 8 Feb - ~9 Mar | Ramadan block | See A5 |
| - | Eid, about 3 days | Rest | Light walking |
| After Eid | until 78 kg | Continue | Push-phase program, 1,800 kcal start, two-week check back on |

**Progression**

- When every set reaches the top of the rep range with good form, add weight next time: 2.5 kg for upper-body lifts, 5 kg for lower-body lifts.
- Rest 2 minutes between sets of main lifts and 75 seconds for other exercises.

## A4. Sleep and daily rhythm

**Bedtime moves earlier gradually**

| Week | Bed | Wake |
|---|---|---|
| 1 | 11:15 PM | 6:30 AM |
| 2 | 10:45 PM | 6:15 AM |
| 3 onward | 10:30 PM | 6:00 AM (7.5 hours) |

**Work-day schedule** (Hashan sets his own prayer times. Isha is around 6:40 PM, before the 7 PM gym.)

| Time | What |
|---|---|
| 6:00 AM | Wake up, a glass of water, daylight |
| 7:50 AM | Breakfast |
| 9:00 AM | Lipo 6, 1 capsule (8 Nov to 2 Jan only) |
| 1:00 PM | Lunch, then a 10-minute walk |
| 4:30 PM | Snack |
| 7:00 PM | Gym (Sunday to Thursday) or cardio (Saturday) |
| 8:45 PM | Dinner, finished by 9:15 |
| 10:00 PM | Screens away, wind down |
| 10:30 PM | Sleep |
| Friday 8:00 AM | Weigh-in |

## A5. Ramadan block (about 8 Feb to 9 Mar 2027)

**Food (about 1,900 to 2,000 kcal and 150 g protein)**

| Time | Meal | Example | kcal |
|---|---|---|---|
| ~4:15 AM | Suhoor, before Fajr (05:12 at the start, 04:51 at the end) | 3-egg omelette, 2 chapatis, laban, 750 ml water | ~650 |
| Maghrib (17:44 at the start, 18:00 at the end) | Iftar | 3 small dates, water, lentil soup | ~250 |
| ~6:30 PM | Main meal after prayer | Grilled chicken or fish, salad, a small portion of rice | ~650 |
| ~11:00 PM | After the gym | Greek yogurt or a whey shake, plus fruit | ~300 |

**Other rules**

- **Water:** 2.5 to 3 L between iftar and suhoor.
- **Training:**
  - Sunday to Wednesday at about 9:45 PM, after taraweeh. The usual Ramadan gym hours are roughly 10 PM to 2 AM, so check your branch.
  - Each session uses the first 4 exercises of that day's normal session (Upper A, Lower A, Upper B, Lower B), 3 sets each, stopping about 3 reps before failure. About 45 minutes.
  - Drop to 3 sessions a week if energy is low.
  - Saturday: a 30-minute walk after iftar.
- **Steps:** 7,000 a day.
- **Sleep:** about 11:30 PM to 4:00 AM, plus a 1.5 to 2 hour nap after Fajr or after work, about 7 hours in total.
- **No Lipo 6.**

## A6. Lipo 6 Ultra (Nutrex Lipo-6 Black Ultra Concentrate)

**What it is**

- Each capsule has 200 mg caffeine. It also has synephrine, yohimbine and rauwolscine in doses the label doesn't disclose.
- The label says not to take it within 6 hours of sleep, not to combine it with other caffeine, and to use it for at most 2 months followed by a break.

**What the evidence says**

- Caffeine gives a small fat-loss effect.
- Synephrine showed no effect on weight and raised blood pressure by about 6/4 mmHg.
- The evidence for yohimbine is weak, and it carries heart-rhythm and blood-pressure risks.
- A 200 mg dose should be taken about 13 hours before bed to avoid hurting sleep.

**Hashan's decision: keep it at 1 capsule a day**

- 1 capsule around 9:00 AM, between meals. Never after 10:00 AM. No afternoon capsule.
- Take it for 8 weeks, 8 November to 2 January, then stop. None during Ramadan.
- Measure blood pressure and resting heart rate at a pharmacy before starting, then every Friday. The app has optional fields to log them.
- Stop immediately if you get palpitations, chest pain, dizziness, a severe headache, shortness of breath or poor sleep.
- Check its SFDA registration with the SFDA "Tameni" app (barcode scan) or the SFDA hotline 19999.
- Don't combine it with pre-workouts, energy drinks, other fat burners, decongestants (pseudoephedrine, phenylephrine) or antidepressants.

---

# Part B: The app

## B1. Overview

- **Name:** Hashan Fit.
- **What it is:** a React + Vite + TypeScript web app that installs to the iPhone home screen (PWA), works offline, and is hosted on Vercel.
- **Language and users:** English only, for one user.
- **Server side:** none, except a few small Vercel functions used only for Fitbit sign-in.

## B2. Screens (bottom tab bar)

### Today (home)

- **Header:** the date and phase, for example "Week 3 of 13 - Foundation", "Ramadan - day 5", or "Starts Sunday 8 Nov".
- **Progress:**
  - Bars for calories eaten against target and protein eaten against target.
  - Steps against the week's target.
- **Meals:**
  - Breakfast is filled in with the default breakfast and needs one tap to confirm. Hashan can edit it.
  - Lunch, snack and dinner are filled by picking from the food guide (search plus Go/Careful/Avoid colour), from recent items, or from a custom entry with a name, kcal and protein. Each item has a quantity (0.5, 1, 1.5, 2).
  - In Ramadan the slots become Suhoor, Iftar, Main meal and After gym.
- **Checklist:**
  - **Lipo 6:** shown only from 8 Nov to 2 Jan, and never in Ramadan. Before 10 AM it reads "Take 1 capsule (before 10 AM)". After 10 AM, if it hasn't been taken, it reads "Skip today".
  - **Water:** a +250 ml button against the day's target.
  - **Steps:** from the band, or entered by hand.
  - **Last night's sleep:** hours and minutes, from the band or entered by hand.
  - **Workout:** opens the Workout tab.
- **Friday cards:**
  - A weigh-in card with weight, plus optional waist, blood pressure and resting heart rate.
  - When it's due, a two-week check card with a suggestion and Accept / Ignore buttons.
- **Sync line:** "Fitbit synced 10 min ago", or "Not connected" with a link to settings.

### Workout

- **Content:** today's session from A3 for the current phase. Saturday shows the cardio session, Friday shows rest, and the Ramadan block shows the Ramadan session.
- **Each exercise shows:**
  - the target sets and reps
  - last time's weight and reps for the same exercise
  - a progression hint when the last session hit the top of the range, for example "Last time 3x10 at 60 kg - try 62.5 kg"
- **Logging:**
  - Every set has kg and reps inputs and a tick.
  - Ticking a set starts a rest timer: 2:00 for main lifts, 1:15 for others. The timer shows on screen and vibrates where the device supports it.
- **Swap:** opens the alternatives list from A3. A swap is remembered for that session in the future.
- **Finish:** saves the workout with a summary of total sets and volume.
- **Other days:** Hashan can open any other day's session, for example to make up a missed day.

### Progress

- **Weight chart (hand-drawn SVG):**
  - Friday weigh-ins as points with a line.
  - The target line: 96 kg on 8 Nov down to 83 kg on 6 Feb, then 81.5 kg on 9 Mar, then 78 kg in mid-April.
- **Waist chart,** if any waist values exist.
- **Weekly averages table:** calories, protein, steps, sleep, resting heart rate, workouts done out of planned, and Lipo days.
- **Strength:** the best estimated one-rep max per main lift per week (Epley formula), shown as small line charts.
- **History:** a list of two-week check results.

### Plan

- **The plan:** the full health plan from Part A in readable sections (targets, food guide, training, sleep, Ramadan, Lipo 6, Body Masters tips), plus the disclaimer and warning signs.
- **Settings:**
  - **Profile and targets:** start date, start weight, calorie and protein targets, default breakfast items.
  - **Lipo 6:** on/off and end date.
  - **Ramadan:** start and end dates.
  - **Fitbit:** Connect, Disconnect, Sync now, and Paste pairing code.
  - **Backup:** Export backup and Restore backup.
  - **Calendar:** "Add work-day schedule to Calendar" and "Add Ramadan schedule to Calendar".

## B3. Data storage (on the phone)

- **Storage engine:** IndexedDB through the Dexie library. All dates are `YYYY-MM-DD` in Riyadh time.
- **Tables:**

| Table | Contents |
|---|---|
| `settings` | One row: start date, start weight, height, kcal target, protein target, Lipo enabled, Lipo end date, Ramadan start, Ramadan end, default breakfast, last backup time, last sync time |
| `days` | One row per date: meals list (slot, food id or custom name, kcal, protein, quantity), water ml, Lipo taken time, steps (value plus source: band or manual), sleep minutes (value plus source), sleep start and end, resting heart rate, calories burned, blood pressure (systolic and diastolic) |
| `weighIns` | Date, kg, optional waist cm |
| `workouts` | Id, date, session id, sets (exercise id, set number, kg, reps, done), swaps, finished time |
| `adjustments` | Date, previous kcal, new kcal, steps change, loss rate, accepted or ignored |

- **Manual entries win:** if Hashan typed steps or sleep by hand for a day, sync doesn't overwrite them.
- **Backup:**
  - Export writes one JSON file containing `{ app: "hashan-fit", version: 1, exportedAt, tables }`. On iPhone the share sheet lets Hashan save it to iCloud Drive.
  - Restore checks the `app` and `version` fields, shows how many records the file holds, asks for confirmation, then replaces all data.
- **Backup reminder:** a banner on Today if there has been no backup in the last 7 days.

## B4. Fitbit Air sync (Google Health API)

### Why this route

- The legacy Fitbit Web API was shut down on 30 October 2026.
- The Google Fit APIs are deprecated.
- A web app can't read Apple Health.
- The Google Health API (`health.googleapis.com/v4`) is the remaining route. It allows browser calls (CORS), but turning a sign-in into long-lasting access needs a client secret, which must stay on a server. That's the reason for the Vercel functions.

### One-time setup (Hashan, about 20 minutes, following `docs/google-health-setup.md`)

1. Create a Google Cloud project and enable the Google Health API.
2. Set up the OAuth consent screen (External) and add his own Google account as a user.
3. Create a "Web application" OAuth client with the redirect URI `https://<app-domain>/api/auth/callback`.
4. In the Vercel dashboard, add the environment variables `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `TOKEN_ENC_KEY` (a random 32-byte key; the guide shows how to make one), `ALLOWED_EMAIL` (his Google email) and `APP_ORIGIN`. These secrets never go into chat or into the repo.
5. Move the consent screen from "Testing" to "In production" without verification. In Testing mode, Google ends the connection every 7 days. In production it shows an "unverified app" warning once, which is expected for a personal app. If Google doesn't allow this, the app stays in Testing, and Hashan taps Reconnect once a week when the app asks.

### Scopes (read-only)

- `googlehealth.activity_and_fitness.readonly`
- `googlehealth.health_metrics_and_measurements.readonly`
- `googlehealth.sleep.readonly`
- `openid email`, used to confirm the account matches `ALLOWED_EMAIL`

### Vercel functions (Node, in `api/`)

| Route | What it does |
|---|---|
| `GET /api/auth/start` | Creates `state` and a PKCE verifier, stores them in a short-lived signed cookie, and redirects to Google sign-in with `access_type=offline` and `prompt=consent` |
| `GET /api/auth/callback` | Checks `state`, exchanges the code using the client secret, checks the signed-in email equals `ALLOWED_EMAIL`, encrypts the refresh token (AES-256-GCM with `TOKEN_ENC_KEY`), and stores it in an `HttpOnly; Secure; SameSite=Lax; Path=/api` cookie that lasts 180 days. Then redirects to the app, which shows "Fitbit connected". The callback page also shows a pairing code (see the fallback below) |
| `POST /api/token` | Reads the cookie, decrypts it, refreshes with Google, and returns `{ access_token, expires_in }`. If Google says the connection is no longer valid, it clears the cookie and returns 401 `{ reconnect: true }` |
| `POST /api/pair` | Takes a pairing code (the encrypted refresh token), checks that it decrypts, and sets the same cookie in the calling context |
| `POST /api/disconnect` | Revokes the token at Google and clears the cookie |

All POST routes reject requests whose `Origin` is not `APP_ORIGIN`.

### iPhone sign-in fallback

If the Google sign-in started from the home-screen app comes back in Safari instead of the app, the cookie ends up in the wrong place.

- The callback page always shows the pairing code with a Copy button.
- Hashan pastes it into Plan > Settings > Fitbit > "Paste pairing code".
- The app sends it to `/api/pair`, which sets the cookie inside the home-screen app.

### Client sync

- **Access token:** comes from `/api/token` and is kept in memory until it expires. It is never written to storage.
- **What's read, for the last 14 days:**

| Data | Source |
|---|---|
| Steps | Daily totals (`steps` data type, daily roll-up) |
| Calories burned | Daily totals (`total-calories` data type, daily roll-up) |
| Resting heart rate | Daily value, if the API exposes it. Otherwise the field stays empty |
| Sleep | The main sleep session that ended on each date: start, end, minutes asleep (`sleep` data type) |

- **Endpoint details:** the exact request paths and response shapes are confirmed against developers.google.com/health/endpoints in the first sync task, and recorded as test fixtures.
- **When it syncs:** when the app opens (if the last sync was more than 15 minutes ago), and from the Sync now button.
- **What's written:** results go into `days` with source `band`, without overwriting manual values.
- **Delay:** data appears only after the Google Health app on the iPhone has synced the band. The app says this next to the sync line.

### Failure handling

- **No network:** the sync line shows the last sync time. Everything else works offline.
- **401 with reconnect:** a banner reads "Fitbit connection expired - Reconnect".
- **Google blocks API access for new projects:** the Fitbit section says sync isn't available. Steps and sleep stay as quick manual entries, and nothing else changes.

## B5. Calendar reminders

Two static `.ics` files are generated from the plan data by a build script and served from `public/`. Opening one on the iPhone offers "Add All" to the Calendar app, and each event has an alert at its start time. No push server is needed.

**`work-days.ics`** (8 Nov 2026 to 6 Feb 2027)

| Time | Event | Days |
|---|---|---|
| 6:00 AM | Wake | every day |
| 7:50 AM | Breakfast | every day |
| 9:00 AM | Lipo 6 | until 2 Jan only |
| 1:00 PM | Lunch | every day |
| 4:30 PM | Snack | every day |
| 7:00 PM | Gym | Sunday to Thursday |
| 7:00 PM | Cardio | Saturday |
| 10:00 PM | Wind down | every day |
| 10:30 PM | Sleep | every day |
| 8:00 AM | Weigh-in | Friday |

The week 1 and 2 sleep times follow A4.

**`ramadan.ics`** (8 Feb to 9 Mar 2027)

| Time | Event | Days |
|---|---|---|
| 4:15 AM | Suhoor | every day |
| 5:45 PM | Iftar (shifts from 17:44 to 18:00 across the month; check your prayer app) | every day |
| 9:45 PM | Gym | Sunday to Wednesday |
| 11:30 PM | Sleep | every day |

## B6. Code layout

```
src/
  plan/        static plan data: program.ts, foods.ts, schedule.ts, phases.ts
  logic/       pure functions: dates (Riyadh), phaseFor(date), targetsFor(date),
               dayTotals, twoWeekCheck, estimated 1RM, progression hint
  db/          Dexie schema, queries, backup export/import
  sync/        Google Health client and response mapping
  screens/     Today, Workout, Progress, Plan (with Settings)
  components/  shared UI (bars, cards, SVG line chart, rest timer)
api/           Vercel functions: auth/start, auth/callback, token, pair, disconnect
               plus a shared crypto helper
scripts/       generate-ics.ts
public/        icons, manifest assets, generated .ics files
docs/          health-plan.md (Part A as a readable document),
               google-health-setup.md, this spec
```

- **Libraries:** React, Vite, TypeScript, vite-plugin-pwa (offline and install), Dexie. Charts are hand-drawn SVG, so there's no chart library.
- **iPhone install support:** `apple-touch-icon`, `apple-mobile-web-app-capable` and a dark-mode-aware theme.

## B7. Testing

- **Unit tests (Vitest):**
  - Riyadh dates and the week/phase calculation for every phase boundary in A3.
  - Targets per date: steps ramp, Lipo window, Ramadan.
  - Day totals.
  - Two-week check rules, including the 1,600 floor.
  - Estimated 1RM and the progression hint.
  - Backup export then import gives identical data, and a bad file is rejected.
  - Google Health response mapping, using recorded fixture files.
  - Token encryption round-trip, and tampered tokens fail to decrypt.
  - Each API route with Google mocked: state mismatch, wrong email, `invalid_grant`, bad Origin.
  - `.ics` generation: event count, times and date ranges.
- **Phone-size check (Playwright, iPhone viewport):** open Today, confirm breakfast, add a lunch item, log a set in Workout, record a weigh-in, export a backup.
- **On Hashan's iPhone (manual, once):** install to the home screen, connect Fitbit (or pair by code), see synced steps, add the calendar files.

## B8. Deployment

- The GitHub repo `hashu387-ship-it/Hashan-gym-` is connected to a Vercel project. Vercel builds on every push to the main branch.
- Hashan adds the environment variables in the Vercel dashboard.
- The build runs the tests and the `.ics` generator.

## B9. Build order

1. Plan data and logic, with tests.
2. Today, Workout and Plan screens, local storage, backup, PWA install. First Vercel deploy. While this happens, Hashan does the Google setup, which shows early whether Google will accept the project.
3. Progress screen and the two-week check.
4. Calendar files.
5. Fitbit sync: functions, client and pairing fallback.
6. `docs/health-plan.md` and `docs/google-health-setup.md`, then the iPhone check.

## B10. Not included (on purpose)

Native iOS or Android app, push notifications, cloud database or login, multiple users, Arabic language, progress photos, barcode scanning, automatic food lookup, and syncing HRV, SpO2 or skin temperature. Any of these can be added later.
