# LiveStats

Personal Spotify Wrapped-style portfolio for **Dereck** — tops, listening habits, sessions, repeats, and a public “recommend a song” inbox.

**Live:** https://livestats-mtm26.vercel.app

## Stack

Next.js · TypeScript · Tailwind · Spotify Web API · Vercel Blob (recommendations)

## Run locally

```bash
npm install
npm run dev
```

Open http://127.0.0.1:43127

## Smoke tests

With the app running:

```bash
node scripts/smoke-test.mjs http://127.0.0.1:43127
# or against production
node scripts/smoke-test.mjs https://livestats-mtm26.vercel.app
```

## Env vars (Vercel)

| Variable | Purpose |
|---|---|
| `SPOTIFY_CLIENT_ID` | Spotify app client id |
| `SPOTIFY_CLIENT_SECRET` | Spotify app secret |
| `SPOTIFY_REFRESH_TOKEN` | Long-lived refresh for public live stats |
| `AUTH_SECRET` | Cookie signing |
| `NEXT_PUBLIC_APP_URL` | `https://livestats-mtm26.vercel.app` |
| `BLOB_READ_WRITE_TOKEN` | Auto-set when Blob store is linked |

Redirect URI in Spotify dashboard:

`https://livestats-mtm26.vercel.app/api/auth/callback`

## Sync snapshot (optional)

```bash
SPOTIFY_ACCESS_TOKEN='...' npm run sync:spotify
```

## Push to GitHub

This project currently lives on Cursor Origin. To publish on GitHub:

1. Create a new empty repo on GitHub (e.g. `livestats`).
2. From this project:

```bash
git remote add github https://github.com/<your-username>/livestats.git
git push -u github main
```

Or use the **Create repo** control in Cursor if you prefer GitHub as the source of truth.

## LinkedIn post (draft)

> Built LiveStats — a personal Spotify Wrapped for my portfolio.
> Live tops, listening sessions, time-of-day habits, on-repeat counts, and a recommend-a-song inbox for anyone who stops by.
> Check it out: https://livestats-mtm26.vercel.app
