# Customer Service Hub

A static dashboard of Gorgias customer service metrics (Jan 2025–present). No build step, no external libraries — plain HTML/CSS/JS with hand-drawn SVG charts, ready for GitHub Pages.

## Pages
- `index.html` — Overview: 2025 full-year vs. 2026 YTD KPI cards, monthly ticket volume trend
- `volume.html` — Ticket volume with weekly / monthly / yearly toggle
- `workload.html` — Ticket load, response speed, channel workload (2025 vs. 2026 YTD)
- `customer-experience.html` — CSAT, response time, resolution time (2025 vs. 2026 YTD)
- `channels.html` — Per-channel breakdown (2025 full year only — see note below)

## Data
All data lives in `data.js` as a single `CS_DATA` object, generated from four Gorgias CSV exports. Only Ticket Volume has true weekly granularity; Workload, Customer Experience, and Channels are point-in-time snapshots (current vs. previous period).

## Charts
Charts are drawn directly with SVG in `app.js` — nothing loads from a CDN, so there's no dependency that can be blocked by a network, firewall, or ad-blocker.

## Privacy / discoverability
This contains internal support metrics (ticket counts, CSAT, response times) — no customer PII, but not something to publicize. Two things are already in place to reduce accidental discovery:
- `robots.txt` at the repo root disallows all crawlers.
- Every page has `<meta name="robots" content="noindex, nofollow">`.

Neither of these is real access control — anyone with the direct link can still view everything. If you need actual restricted access (password, login), consider hosting on Netlify or Vercel instead (both support basic auth / password protection on free tiers), or keep the GitHub repo private if your plan supports private Pages.

## Deploying to GitHub Pages

1. Create a new repo on GitHub, e.g. `cs-hub`.
2. On the empty repo page, click **"uploading an existing file"**, drag in all files from this folder (`index.html`, `volume.html`, `workload.html`, `customer-experience.html`, `channels.html`, `style.css`, `app.js`, `data.js`, `robots.txt`), commit.
3. Go to **Settings → Pages**, set Source to `Deploy from a branch`, branch `main`, folder `/ (root)`. Save.
4. Visit `https://<your-username>.github.io/<repo-name>/` after a minute or two. Hard-refresh (Cmd+Shift+R) if it looks stale.

## Local preview
Open `index.html` in a browser — no server needed.

## Important
Keep a permanent copy of these files somewhere safe (inside the GitHub repo itself, or a Desktop folder). Don't delete files from wherever Claude's "Show in Folder" points to — that's temporary working storage, not a backup location.
