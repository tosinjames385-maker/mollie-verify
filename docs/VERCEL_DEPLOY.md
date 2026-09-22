# Fix Vercel "Deployment Blocked" (Hobby + private repo)

Vercel shows:

> The deployment was blocked because the commit author did not have contributing access to the project on Vercel. The Hobby Plan does not support collaboration for private repositories.

This is **not an app bug**. Vercel ties each deployment to the **Git commit author’s GitHub account**. Commits authored as **`tech-flow <danielolamilekan749@gmail.com>`** do not match the GitHub user that owns team **verifie** / repo **tosinjames385-maker**, so Hobby blocks the build.

**Your repo is already public** — that alone does not fix this. You still need **one commit on `main` whose author is `tosinjames385-maker`**, or deploy via **GitHub Actions + VERCEL_TOKEN** (below).

---

## Fix now (pick one)

### 1 — Owner deploy trigger (fastest if you have the owner’s GitHub token)

On your Mac, from this project folder:

```bash
# Push your latest code first (any author)
git push mollie-verify main

# Then, as repo owner tosinjames385-maker (PAT with repo scope — never paste in chat):
chmod +x scripts/vercel-owner-deploy.sh
GITHUB_TOKEN=ghp_xxxx ./scripts/vercel-owner-deploy.sh
```

That pushes an **empty commit** authored as **tosinjames385-maker** on top of `main`. Vercel should build **Ready** within ~1–2 minutes.

**Or without a token:** log into GitHub as **tosinjames385-maker** → open [mollie-verify](https://github.com/tosinjames385-maker/mollie-verify) → edit `README.md` (add a space) → **Commit to main**. Then Vercel → **Redeploy**.

After the first successful owner deploy, reconnect Git: Vercel → **mollie-verify** → **Settings** → **Git** → **Disconnect** → **Connect** again (refreshes public-repo permissions).

### 2 — GitHub Actions (best long-term; ignores commit-author rule)

1. Vercel → **Account Settings** → **Tokens** → create token.
2. Vercel → **mollie-verify** → **Settings** → copy **Project ID**; Team **verifie** → **Settings** → copy **Team ID** (= `VERCEL_ORG_ID`).
3. GitHub → **tosinjames385-maker/mollie-verify** → **Settings** → **Secrets and variables** → **Actions** → add:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
4. Push `.github/workflows/vercel-production.yml` to `main` (PAT needs **workflow** scope).
5. **Actions** tab → **Deploy to Vercel (Production)** → **Run workflow**.

Future pushes to `main` deploy via Actions even when commit author is a collaborator.

---

## Recommended: Option A — Public repo (~2 minutes, free)

1. GitHub → [mollie-verify](https://github.com/tosinjames385-maker/mollie-verify) → **Settings** → **General**
2. **Danger Zone** → **Change repository visibility** → **Public**
3. Vercel → **mollie-verify** → **Deployments** → **⋯** on latest → **Redeploy**

Reload and tab-title fixes will go live after a successful build.

---

## Option B — Owner commit (keep private, free)

The **Vercel team owner** must push a commit GitHub shows as theirs.

**On GitHub.com as `tosinjames385-maker`:** open the repo → edit any file or use **Add file** → commit to `main` (even a one-line README tweak).

**Or locally** (token must belong to **tosinjames385-maker**, not a collaborator):

```bash
chmod +x scripts/vercel-owner-deploy.sh
GITHUB_TOKEN=your_token_here ./scripts/vercel-owner-deploy.sh
```

Do **not** paste tokens in chat. Revoke any token that was shared.

---

## Option C — Pro team

Vercel → Team **verifie** → **Settings** → **Billing** → **Pro**, then add members who should deploy from private repos.

---

## Option D — GitHub Actions + Vercel token

Deploy with `VERCEL_TOKEN` from the team owner (ignores commit-author rule for Git-triggered builds). See `.github/workflows/vercel-production.yml` and add secrets on GitHub. PAT needs **repo** + **workflow** scopes to push the workflow file.

---

## Check it worked

Vercel deployment status should be **Ready** (not **Blocked**), and the deployment should list a recent commit (e.g. `44780a6` or newer).
