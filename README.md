# LiveStats

Personal Spotify listening analytics — a listen.fm-style portfolio dashboard for **my** habits: affinity charts, track-length mix, sticky artists across time windows, and ranked top lists.

**Live:** https://livestats-mtm26.vercel.app

## Stack

Next.js · TypeScript · Tailwind · Recharts · Spotify Web API snapshot

## Run locally

```bash
npm install
npm run dev
```

Open http://127.0.0.1:43127

## Refresh your data

From the Spotify Web API console (or OAuth), grab a token with `user-top-read`, then:

```bash
SPOTIFY_ACCESS_TOKEN='...' npm run sync:spotify
```

Or with a refresh token:

```bash
SPOTIFY_CLIENT_ID=... SPOTIFY_CLIENT_SECRET=... SPOTIFY_REFRESH_TOKEN=... npm run sync:spotify
```

This overwrites `src/data/public-stats.json`. Commit + redeploy to update the public site.

## Why a snapshot?

This is a portfolio project: the site presents analyzed listening data with charts. A checked-in snapshot keeps the demo stable for recruiters; re-running `sync:spotify` updates it with current habits.
