# Fix Vercel "Deployment Blocked" (Hobby + private repo)

Vercel blocks deploys when the **Git commit author** is not a contributing member of the Vercel team on a **private** repository (Hobby plan).

Your commits are authored as `tech-flow <danielolamilekan749@gmail.com>`, while the repo is `tosinjames385-maker/mollie-verify` under team **verifie**.

Pick **one** of these:

## Option A — Make the GitHub repo public (fastest, free)

1. GitHub → **mollie-verify** → **Settings** → **General** → **Danger Zone** → **Change repository visibility** → **Public**
2. Vercel → **Deployments** → **Redeploy** latest `main`

Public repos on Hobby are not limited the same way for commit authors.

## Option B — Push as the repo owner (free, keep private)

On a machine logged into GitHub as **tosinjames385-maker**:

```bash
git clone https://github.com/tosinjames385-maker/mollie-verify.git
cd mollie-verify
git pull
git commit --allow-empty -m "Deploy from repo owner"
git push origin main
```

Vercel will accept deploys from commits authored by the linked GitHub owner.

## Option C — Upgrade Vercel team (keep private + multiple authors)

**Vercel** → Team **verifie** → **Settings** → **Members** → invite collaborators, or upgrade to **Pro** so Hobby collaboration limits do not apply.

## Option D — Deploy via GitHub Actions (private repo, owner token)

Uses the Vercel API token from the **project owner**, not commit author.

1. **Vercel** → Account → **Tokens** → create token (as team owner).
2. Run locally (with Vercel CLI linked to the project) or read from project **Settings → General**:
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
3. GitHub → **mollie-verify** → **Settings** → **Secrets and variables** → **Actions** → add:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
4. Push this repo (workflow is in `.github/workflows/vercel-production.yml`).
5. Optional: Vercel → Project → **Settings** → **Git** → disable **Automatic Deployments** if you only want Actions deploys.

After Option A, B, or D succeeds, production should show commit `44780a6` or newer (tab titles + SPA rewrites).
