# OAISIS Labs

Schedule your TikTok videos; they post themselves. Next.js 15 + Firebase
(Auth / Firestore / Storage) + TikTok Content Posting API, on Vercel.

**Flow:** sign up → connect TikTok → bulk-upload videos → set posting days +
hour → the calendar fills → the scheduler publishes each video when due →
results (views/likes/comments/shares) come back into the dashboard.

Two kinds of post are supported:

- **Videos** — uploaded to TikTok with `FILE_UPLOAD` (the file is pushed from
  the server, so the host doesn't matter).
- **Slideshows** — `mediaType: "PHOTO"` with a list of slides. TikTok only
  accepts `PULL_FROM_URL` for photos, so each slide is served from *this*
  domain via `/api/media/<storage path>` and the request carries
  `auto_add_music: true` — TikTok picks a licensed track and attaches it, which
  is the only way a slideshow can have sound (a JPEG can't carry audio).
  **`auto_add_music` only applies in `DIRECT_POST`.** While `TIKTOK_POST_MODE=inbox`
  the photo init takes title + description only, the slideshow lands in the
  account's drafts, and the sound is picked there by hand.

Every post carries `is_aigc` (TikTok's AI-generated label) unless a post sets
`aigc: false`. This pipeline produces AI-edited pictures of real-looking people,
which TikTok requires to be disclosed — and undeclared AIGC is one of the things
that makes a post ineligible for the For You feed, and therefore unpromotable.

The Opaque Ads Mac app writes straight into this same `posts` collection
(`source: "opaque-ads"`), so generated creatives ride the same clock.

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
- **URL Ownership Verification** (required for slideshows): add the property
  `https://www.oaisislabs.com/` and verify it with the txt file already in
  `public/`. Photo posts are pulled by TikTok from `/api/media/…` on this
  domain — without the verified prefix, TikTok refuses the pull.
- `NEXT_PUBLIC_SITE_URL` must match the verified domain (defaults to
  `https://www.oaisislabs.com`).

### 3. Scheduler clock
- `CRON_SECRET` = any long random string.
- `.github/workflows/scheduler.yml` hits `/api/cron/publish` every 30 minutes (~1,440 free minutes/mo on private repos; switch to cron-job.org for 5-min precision at scale). Add repo secret `CRON_SECRET`. `vercel.json` adds a daily sweep as backup.
  For minute-precision, add a free job at cron-job.org: GET
  `https://www.oaisislabs.com/api/cron/publish` every 5 min with header
  `Authorization: Bearer <CRON_SECRET>`.

### 4. Vercel
Settings → Environment Variables → add everything from `.env.example` →
Redeploy. Every `git push` deploys.

## Data model
`users/{uid}` — `{ email, tiktok: { openId, displayName, accessToken, refreshToken, expiresAt, scope } }`
`posts/{id}` — `{ uid, name, caption, hashtags, status: draft|scheduled|posted|failed, dueAt, privacy, publishId, postedAt, mode, tiktokVideoId, stats }`
 · videos add `{ videoUrl, storagePath }`
 · slideshows add `{ mediaType: "PHOTO", photoUrls[], photoPaths[], autoAddMusic }`
 · every post may set `aigc` (default true → `is_aigc` on the TikTok call)
 · creatives pushed from the Mac app add `{ source: "opaque-ads", template, adId, runId }`
