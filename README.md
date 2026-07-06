# Doc Flow

Markdown-in, PDF-out document editor with password-protected documents and orange liquid-glass UI.

## Features

- **No OAuth** — each document has a unique `documentId` + auto-generated password
- Credentials saved in **localStorage** on this device (ID + password only; content lives on Convex)
- **Share links** encode the password opaquely: `/d/{documentId}?k={token}`
- **Edit lock** — first opener edits; others read-only until they leave
- Home sidebar lists local documents, sortable by name or date

## Local development

```bash
npm install
npx convex dev          # Terminal 1
npm run dev             # Terminal 2 → http://localhost:5173
```

Copy `.env.example` to `.env.local` and set your dev deployment URL (written by `npx convex dev`).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build → `dist/` |
| `npm run check` | Lint + typecheck |
| `npm run electron:dev` | Desktop app against the Vite dev server |
| `npm run electron:build` | Intel (x64) macOS `.dmg` / `.zip` → `release/` |

## macOS desktop (Intel)

The Electron shell targets **Intel (x64)** and **macOS 11+** (Big Sur and later). That covers older Intel hardware while still supporting modern CSS used by the UI.

```bash
# Dev (needs Convex URL in .env.local, same as the web app)
npm run electron:dev

# Package for Intel Macs (run on a Mac)
npm run electron:build
```

Artifacts land in `release/` (`Doc Flow-*.dmg` and `.zip`).

Optional env for share links from the desktop app:

- `VITE_WEB_APP_ORIGIN` — public web origin used when building share links (e.g. `https://you.github.io/contracts`). Without it, share links use the local `file://` hash URL.

## Stack

- React 19 + Vite + Tailwind + shadcn/ui
- Convex (document storage, edit locks)
- TipTap + react-markdown
- Electron (Intel macOS desktop)

## Deploy to GitHub Pages + Convex

### One-time setup

1. **Push this repo to GitHub.**

2. **Create a production Convex deployment** (if you have not already):
   ```bash
   npx convex deploy
   ```
   Follow the prompts to link a production deployment.

3. **Create a Convex deploy key** for CI:
   - [Convex Dashboard](https://dashboard.convex.dev) → your project → **Settings** → **Deploy Keys**
   - Generate a **Production** deploy key

4. **Add GitHub repository secrets** (Settings → Secrets and variables → Actions):
   | Secret | Required | Description |
   |--------|----------|-------------|
   | `CONVEX_DEPLOY_KEY` | Yes | Production deploy key from Convex |
   | `VITE_SHARE_OBFUSCATION_KEY` | Recommended | Random string so share links stay stable across deploys |

5. **Enable GitHub Pages** (Settings → Pages):
   - **Source:** GitHub Actions

6. **Optional repository variable** (Settings → Secrets and variables → Actions → Variables):
   - `VITE_BASE_PATH` — defaults to `/{repo-name}/` (e.g. `/contracts/` for `https://user.github.io/contracts/`)
   - Set to `/` if the site is served at the domain root (e.g. `user.github.io` repo or custom domain)

### What runs on push to `main`

- **CI** (`.github/workflows/ci.yml`) — lint, typecheck, build
- **Deploy** (`.github/workflows/deploy.yml`) — `npx convex deploy --cmd 'npm run build'`, then publish `dist/` to GitHub Pages

You can also trigger deploy manually from the **Actions** tab.

### If Pages deploy fails with “Deployment failed, try again later”

The **build** job succeeded (artifact uploaded); this error is from GitHub’s Pages API, not your app code.

1. **Re-run the failed Deploy workflow** — often transient ([actions/deploy-pages#418](https://github.com/actions/deploy-pages/issues/418)).
2. **Settings → Pages → Build and deployment** — source must be **GitHub Actions** (not “Deploy from a branch”).
3. **Avoid overlapping deploys** — wait for the current run to finish before pushing again (the workflow uses `cancel-in-progress: false` so deploys are not aborted mid-flight).
4. Check [GitHub Status](https://www.githubstatus.com/) for Pages incidents.

### After the first deploy

Your site will be at:

`https://<github-username>.github.io/<repo-name>/`

(e.g. `https://james.github.io/contracts/`)
