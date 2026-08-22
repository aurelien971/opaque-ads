# OAISIS Labs

Schedule your TikTok videos; they post themselves. Next.js 15 + Firebase
(Auth / Firestore / Storage) + TikTok Content Posting API, on Vercel.

**Flow:** sign up → connect TikTok → bulk-upload videos → set posting days +
hour → the calendar fills → the scheduler publishes each video when due →
results (views/likes/comments/shares) come back into the dashboard.

## Run locally
```bash
cp .env.example .env.local   # fill it in
npm install && npm run dev
```

## Setup checklist (everything the app needs to go live)

### 1. Firebase — a NEW project just for this platform
1. console.firebase.google.com → Add project (e.g. `oaisislabs`).
2. **Authentication → Sign-in method → Email/Password → Enable.**
3. **Firestore Database → Create** (production mode, any region) → Rules tab →
   paste `firestore.rules` → Publish.
4. **Storage → Get started** → Rules tab → paste `storage.rules` → Publish.
5. **Project settings → General → Your apps → Add app → Web** (no hosting) →
   copy the `firebaseConfig` values into the six `NEXT_PUBLIC_FIREBASE_*` vars.
6. **Project settings → Service accounts → Generate new private key** → paste
   the JSON (single line) as `FIREBASE_SERVICE_ACCOUNT_B64` (the JSON file base64-encoded: `base64 -i key.json | tr -d "\n"`).

### 2. TikTok — developers.tiktok.com → your app
- Redirect URI: `https://www.oaisislabs.com/auth/tiktok/callback`
- Scopes: `user.info.basic`, `user.info.profile`, `user.info.stats`, `video.upload`, `video.publish`, `video.list` (Display API)
- Copy Client key → `NEXT_PUBLIC_TIKTOK_CLIENT_KEY`, Client secret →
  `TIKTOK_CLIENT_SECRET`. Keep `TIKTOK_POST_MODE=inbox` until the app is
  audited (unaudited apps can only deliver to the user's TikTok inbox/drafts).
- Add test users (Sandbox → Target users) for any TikTok account you'll test with.

### 3. Scheduler clock
- `CRON_SECRET` = any long random string.
- `vercel.json` runs `/api/cron/publish` once a day (Vercel Hobby only allows daily crons).
  For minute-precision, add a free job at cron-job.org: GET
  `https://www.oaisislabs.com/api/cron/publish` every 5 min with header
  `Authorization: Bearer <CRON_SECRET>`.

### 4. Vercel
Settings → Environment Variables → add everything from `.env.example` →
Redeploy. Every `git push` deploys.

## Data model
`users/{uid}` — `{ email, tiktok: { openId, displayName, accessToken, refreshToken, expiresAt, scope } }`
`posts/{id}` — `{ uid, name, caption, videoUrl, storagePath, status: draft|scheduled|posted|failed, dueAt, privacy, publishId, postedAt, mode, tiktokVideoId, stats }`
