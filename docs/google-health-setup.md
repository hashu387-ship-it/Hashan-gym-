# Connect your Fitbit Air to Hashan Fit

This guide connects your Fitbit Air band to the Hashan Fit app. After this, your steps, sleep, calories burned and resting heart rate come into the app by themselves.

It takes about 20 minutes. You only do it once.

**Why so many steps?** Google must know that the app is yours. So you make your own small "app" in Google Cloud. Then you give its keys to Vercel, where Hashan Fit lives. Go slowly, one step at a time.

> **Keep your secrets private.** In this guide you will make a Client secret and an encryption key. Treat them like passwords. **Never paste them into a chat with anyone. That includes Claude.** Only put them into the Vercel dashboard.

**Tip:** steps 2 to 8 are easier on a computer, because the screens are big. Steps 9 to 11 are on your iPhone.

---

## Step 1. Before you start

Make sure you have these:

1. **Your Google account.** Use the same account you use in the Google Health app.
2. **The Google Health app on your iPhone.** Your Fitbit Air must already be syncing in that app. Open it now and check that today's steps are there.
3. **Your Vercel login.** This is the account that hosts Hashan Fit.
4. **Your app's web address.** Claude gives you this. It looks like `hashan-fit.vercel.app`.
5. **Hashan Fit on your iPhone home screen.**

In this guide, the app's address is written as `<your-app-domain>`. Each time you see it, type your real address instead. Do not type the `<` and `>` signs.

---

## Step 2. Create a Google Cloud project

1. Open https://console.cloud.google.com/ and sign in with your Google account.
2. If Google asks you to accept the terms, tick the box and click **Agree and continue**.
3. At the top of the page, click the **project picker**. It is next to the "Google Cloud" logo. It may say **Select a project**.
4. In the window that opens, click **New project** (top right).
5. In **Project name**, type `Hashan Fit`.
6. Leave **Location** as "No organization".
7. Click **Create**.
8. Wait a few seconds. Click the project picker again and choose **Hashan Fit**.

Check that the top bar now shows "Hashan Fit" before you go on.

---

## Step 3. Enable the Google Health API

1. Click the **menu button** at the top left (the three lines).
2. Click **APIs & Services**, then **Library**.
3. In the search box, type `Google Health API` and press Enter.
4. Click **Google Health API** in the results.
5. Click **Enable**.

> **If it does not work, stop here.** If you cannot enable it, or Google says it is not accepting new projects, stop and tell Claude. That is OK. The app still works. You just type your steps and sleep by hand.

---

## Step 4. Set up the OAuth consent screen

This is the page Google shows when you sign in. It tells you which app is asking for your data.

### 4a. App details

1. Click the **menu button**, then **APIs & Services**, then **OAuth consent screen**. The page may be called **Google Auth Platform**.
2. If you see "Google Auth Platform not configured yet", click **Get started**.
3. **App information:**
   - **App name:** `Hashan Fit`
   - **User support email:** choose your email.
   - Click **Next**.
4. **Audience:** choose **External**. Click **Next**.
5. **Contact information:** type your email. This is the developer contact. Click **Next**.
6. **Finish:** tick the box to agree to the Google API Services User Data Policy. Click **Continue**, then **Create**.

### 4b. Add the scopes

Scopes are the permissions the app asks for. They are all read-only. The app can read your data. It cannot change it.

1. In the left menu, click **Data Access**.
2. Click **Add or remove scopes**. A panel opens with a list.
3. In the list, tick these two rows:
   - `openid`
   - `.../auth/userinfo.email` (this is the `email` scope)
4. Scroll to the bottom of the panel, to **Manually add scopes**. Paste these three lines:

   ```
   https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly
   https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly
   https://www.googleapis.com/auth/googlehealth.sleep.readonly
   ```

5. Click **Add to table**. Check that the three new rows are ticked.
6. Click **Update**.
7. Back on the Data Access page, scroll down and click **Save**.

When you finish, the app must have exactly these five scopes, and no others:

- `https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly`
- `https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly`
- `https://www.googleapis.com/auth/googlehealth.sleep.readonly`
- `openid`
- `email`

### 4c. Add yourself as a test user

1. In the left menu, click **Audience**.
2. Under **Test users**, click **Add users**.
3. Type your Google email. Click **Save**.

**If your screen looks different:** Google sometimes shows an older version. It has steps across the top: "OAuth consent screen", "Scopes", "Test users", "Summary". Choose **External** first, then fill in the same things on each page. Click **Save and continue** after each one.

---

## Step 5. Create the OAuth client

1. Click the **menu button**, then **APIs & Services**, then **Credentials**.
2. At the top, click **Create credentials**, then **OAuth client ID**.
3. **Application type:** choose **Web application**.
4. **Name:** type `Hashan Fit`.
5. Leave **Authorized JavaScript origins** empty.
6. Under **Authorized redirect URIs**, click **Add URI** and type:

   ```
   https://<your-app-domain>/api/auth/callback
   ```

   For example, if Claude gives you `hashan-fit.vercel.app`, type:

   ```
   https://hashan-fit.vercel.app/api/auth/callback
   ```

   Check it carefully. It starts with `https://`. It has no spaces. It has no `/` at the end.

7. Click **Create**.
8. A window shows your **Client ID** and **Client secret**. Copy both. Keep them in a private note on your own phone or computer for now.
9. Click **OK**.

> **Copy the Client secret now.** Google may not show it again. If you lose it, open the client on the Credentials page and add a new secret.

**About the address:** the real domain is the Vercel address that Claude gives you, for example `hashan-fit.vercel.app`. If the address ever changes, come back here and update the redirect URI.

---

## Step 6. Make the encryption key

The app keeps your Fitbit connection in a locked form. This key locks and unlocks it.

The key must be **32 random bytes, base64-encoded**. There are two ways to make one:

- **Easiest:** open https://generate-secret.vercel.app/32 in your browser. The page shows one line of random letters and numbers. Copy it.
- **Alternative:** on any computer, open a terminal (on a Mac, open the **Terminal** app). Run this command and copy the line it prints:

  ```
  openssl rand -base64 32
  ```

Make a new key only for this. Do not use a password you already have. Keep it private, like the Client secret.

---

## Step 7. Add the Vercel environment variables

1. Go to the Vercel dashboard: https://vercel.com/dashboard. Log in.
2. Click your **Hashan Fit** project.
3. Click **Settings** at the top.
4. Click **Environment Variables** in the left menu.
5. Add these five variables. For each one:
   - Type the name in **Key**.
   - Paste the value in **Value**.
   - Under **Environments**, choose **Production** only.
   - Click **Save**.

| Variable | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | the Client ID from step 5 |
| `GOOGLE_CLIENT_SECRET` | the Client secret from step 5 |
| `TOKEN_ENC_KEY` | the key from step 6 |
| `ALLOWED_EMAIL` | your Google email |
| `APP_ORIGIN` | `https://<your-app-domain>`, with no trailing slash |

A few tips:

- Do not add spaces before or after a value.
- `ALLOWED_EMAIL` must be the same Google account you use in the Google Health app.
- `APP_ORIGIN` looks like `https://hashan-fit.vercel.app`. There is no `/` at the end.
- If you see a **Sensitive** switch, you can turn it on. Then Vercel hides the value.

6. **Redeploy.** The new variables only work after a new deployment.
   - Click **Deployments** at the top.
   - Find the newest deployment, at the top of the list.
   - Click the **...** menu on the right of it.
   - Click **Redeploy**, then click **Redeploy** again in the window.
   - Wait until it says **Ready**.

> **Never paste these values into a chat with anyone, including Claude.** If Claude needs to check your setup, tell it the names of the variables you added. Never the values.

When step 7 is done, you can delete your private note with the secrets.

---

## Step 8. Publish the app

**Why:** right now your Google app is in "Testing" mode. In Testing, Google ends the connection every 7 days. When you publish it, the connection stays.

1. In Google Cloud, click the **menu button**, then **APIs & Services**, then **OAuth consent screen**. (This is **Google Auth Platform**.)
2. In the left menu, click **Audience**.
3. Under **Publishing status** you see **Testing**. Click **Publish app**.
4. Click **Confirm**.
5. The status now says **In production**.

You do not need to send the app to Google for verification. It is only for you.

### The "unverified app" warning

When you connect in step 9, Google shows a warning: "Google hasn't verified this app". **This is expected for a personal app.**

- Tap **Advanced**.
- Then tap **Go to Hashan Fit (unsafe)**.

Google says "unsafe" only because it has not checked the app. You made this app yourself, and only your email can use it. So it is fine to continue.

### If Google will not let you publish

That is OK. Stay in Testing. The app still works.

The only difference: the connection ends every 7 days. The app will show "Fitbit connection expired - Reconnect". Tap **Reconnect** once a week.

---

## Step 9. Connect from the app

Now use your iPhone.

1. Open **Hashan Fit** from your home screen. Use the home-screen icon, not Safari.
2. Tap the **Plan** tab, then **Settings**, then **Fitbit**.
3. Tap **Connect Fitbit**.
4. Google's sign-in page opens. Sign in with the **same Google account** you use in the Google Health app.
5. If you see the "unverified app" warning, tap **Advanced**, then **Go to Hashan Fit (unsafe)**.
6. Google shows what the app wants to read. If there is a box next to each item, tick all of them. Then tap **Allow** (or **Continue**).
7. You come back to the app. It shows "Fitbit connected".

---

## Step 10. If it opens in Safari instead of the app

Sometimes the iPhone finishes the sign-in in Safari, not in the app. Then the app does not know that you connected. This is easy to fix.

1. The success page in Safari shows a **pairing code** with a **Copy** button. Tap **Copy**.
2. Go back to the home-screen app. (Leave Safari and tap the Hashan Fit icon.)
3. Tap **Plan**, then **Settings**, then **Fitbit**, then **Paste pairing code**.
4. Paste the code and confirm.

The code **expires after 15 minutes**. If it is too late, tap **Connect Fitbit** again and start over.

The pairing code is private, like a password. Do not share it.

---

## Step 11. Check it worked

1. Open the **Today** tab.
2. Look at the sync line. It shows "Fitbit synced ..." (for example, "Fitbit synced 10 min ago").
3. Your steps and last night's sleep fill in from the band.

**If the numbers look old:** the data only appears after the Google Health app has synced your band. So open the **Google Health app** first and let it sync. Then go back to Hashan Fit and tap **Plan**, then **Settings**, then **Fitbit**, then **Sync now**.

Good to know:

- The app also syncs by itself when you open it, if the last sync was more than 15 minutes ago.
- If you typed your steps or sleep by hand for a day, the app keeps your number. Sync does not change it.

---

## Step 12. Troubleshooting

| You see | What to do |
|---|---|
| "Fitbit connection expired" | Tap **Reconnect**. |
| "Not configured" | An environment variable is missing, or you did not redeploy. Check all five in step 7, then redeploy. |
| "Account not linked" | Open the Google Health app and finish its setup. Then try again. |
| "Wrong account" | Sign in with the email you set in `ALLOWED_EMAIL`. |
| You want to disconnect | Tap **Plan**, then **Settings**, then **Fitbit**, then **Disconnect**. |

If you are stuck, tell Claude which step you are on and what the screen says. Remember: share the names of things, never the secret values.
