# Vercel environment variables

This project is a **Vite frontend**. On Vercel you only need the **`VITE_*`** variables for the live site (wallet + sign-in + images that use Supabase).

## Add in Vercel

1. **Project** → **Settings** → **Environment Variables**
2. Add each variable for **Production** (and Preview if you want)
3. **Redeploy** after saving (env vars are baked in at build time)

| Name | Example | Required |
|------|---------|----------|
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` | Yes (for X login) |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbG...` (anon public key) | Yes |
| `VITE_SOLANA_NETWORK` | `mainnet-beta` | Recommended |
| `VITE_APP_URL` | `https://mollie-verify.vercel.app` | Recommended |

Copy placeholders from [`.env.example`](../.env.example) in the repo root.

## API / admin / database

The Express server in `/server` is **not** deployed by default on Vercel static hosting. Submissions use **demo data** in the browser unless you host the API elsewhere and set `VITE_API_URL`.

For a full stack, host `server/` on Railway/Render and set `DATABASE_URL`, `SESSION_SECRET`, `FRONTEND_URL`, etc. from `.env.example`.

## Profile images

Avatars use **Dicebear** + embedded SVG fallbacks (no `randomuser.me`). No extra env vars needed for profile photos.
