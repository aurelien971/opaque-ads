# Opaque Studio

Commercial SaaS platform: generate AI short-form ad creatives, manage a queue,
and publish directly to TikTok accounts users connect themselves. Next.js 15 +
Firebase (Auth / Firestore / Storage), deployed on Vercel.

## Local dev

```bash
npm install
npm run dev
```

## Environment (Vercel → Project → Settings → Environment Variables)

| Var | Purpose |
| --- | --- |
| `NEXT_PUBLIC_TIKTOK_CLIENT_KEY` | TikTok app client key (public, appears in OAuth URL) |
| `TIKTOK_CLIENT_SECRET` | TikTok app client secret (server only — never commit) |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Optional: Web App id from Firebase console |

Firebase project config defaults are baked into `lib/firebase.ts`
(project `opaque-3964b`); web API keys are public by design.

## Launch checklist

1. **Firebase console**: enable Email/Password under Authentication →
   Sign-in method. Paste `firestore.rules` and `storage.rules` into their
   consoles. Add a Web App (Project settings → Add app → Web) and set
   `NEXT_PUBLIC_FIREBASE_APP_ID`.
2. **Vercel**: `vercel login`, then `vercel --prod`. Add the env vars above.
3. **TikTok developer portal**: add the production domain as a verified URL
   property (`public/tiktokAGLUlSoHS17HgfsFqZBgNiqR7yVkjm6x.txt` is served at
   the site root; replace with the new file if TikTok issues a new code).
   Set the redirect URI to `https://<domain>/auth/tiktok/callback`.
   Terms: `/terms` · Privacy: `/privacy`.
4. **Firebase Hosting (old site)**: replace with a redirect to the new domain.

## TikTok compliance notes

The publish sheet (`components/PostComposer.tsx`) implements the Content
Posting API UX requirements: creator identity display, manual privacy
selection (no default), interaction toggles, commercial content disclosure
(Your brand / Branded content, branded content can't be private), and the
Music Usage Confirmation / Branded Content Policy declarations.
