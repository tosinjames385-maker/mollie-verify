# Vercel environment variables

This project is a **Vite frontend**. On Vercel you only need the **`VITE_*`** variables for the live site (wallet + sign-in + images that use Supabase).

## Add in Vercel

1. **Project** → **Settings** → **Environment Variables**
2. Add each variable for **Production** (and Preview if you want)
3. **Redeploy** after saving (env vars are baked in at build time)

| Name | Example | Required |
|------|---------|----------|
| `VITE_SUPABASE_URL` | `https://jdnfpchddosbxejezkgk.supabase.co` | Yes (for X login). **Never** `YOUR_PROJECT_REF` |
| `VITE_SUPABASE_ANON_KEY` | anon public JWT (`eyJ...`) | Yes |
| `VITE_SOLANA_NETWORK` | `mainnet-beta` | Recommended |
| `VITE_APP_URL` | `https://mollie-verify.vercel.app` | Recommended |
| `VITE_API_URL` | `https://your-api.onrender.com` | **Yes for admin wallet monitor** |

Copy values from [`.env.example`](../.env.example). Do **not** paste `YOUR_PROJECT_REF` into Vercel — that host does not exist and X login fails with “This site can’t be reached”.

In **Supabase → Authentication → URL configuration** add:

- Site URL: `https://www.verifiedjup.ag`
- Redirect URLs:
  - `https://www.verifiedjup.ag/**`
  - `https://www.verifiedjup.ag/auth/x/callback`
  - `https://verifiedjup.ag/**`

Enable the **X** provider (not the older **Twitter** provider) in Supabase Auth.

## Admin wallet monitor

**Wallet Connect** in `/admin/wallet-connect` reads from **`GET /api/admin/wallet-connections/live`**. That route only exists on the Express server (`npm run dev:server` / port **3001**), not on static Vercel.

- **Local demo:** run `npm run dev` (client + server). Connect a wallet on the token page; admin updates every ~1.5s.
- **Production site on Vercel:** deploy `server/` somewhere, set **`VITE_API_URL`** to that host (no trailing slash), set **`FRONTEND_URL`** on the API to your Vercel URL, set **`ADMIN_PASSWORD`** on the API to match the admin UI (`brutal.force.attac` by default), then **redeploy Vercel**.

## Profile images

Avatars use **Dicebear** + embedded SVG fallbacks (no `randomuser.me`). No extra env vars needed for profile photos.
