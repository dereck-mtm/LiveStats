# LiveStats

A **public** Spotify listening page for your own habits — top artists, top tracks, and recently played — so you can share the link with friends. Visitors do not need a Spotify account.

## How it works

1. You connect Spotify once at `/owner`.
2. You add `SPOTIFY_REFRESH_TOKEN` to Vercel env (copied from the owner page).
3. The homepage fetches **your** stats from Spotify for every visitor.

## Quick start

```bash
npm install
cp .env.example .env.local
# Fill SPOTIFY_CLIENT_SECRET (and later SPOTIFY_REFRESH_TOKEN)
npm run dev
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127) for the public page and [http://127.0.0.1:43127/owner](http://127.0.0.1:43127/owner) to connect.

## Spotify dashboard

Redirect URIs:

- `http://127.0.0.1:43127/api/auth/callback`
- `https://livestats-mtm26.vercel.app/api/auth/callback`

Allowlist your Spotify user under User Management (Development mode).

## Environment variables

| Name | Purpose |
|------|---------|
| `SPOTIFY_CLIENT_ID` | App Client ID |
| `SPOTIFY_CLIENT_SECRET` | App Client Secret |
| `SPOTIFY_REFRESH_TOKEN` | **Your** refresh token — powers the public page |
| `AUTH_SECRET` | Signs owner session cookies |
| `NEXT_PUBLIC_APP_URL` | Public origin for OAuth redirects |

## Notes

- Spotify top items are affinity-ranked (not raw play counts). For lifetime play counts, request **Extended streaming history** from Spotify privacy settings and we can add an upload view later.
- Development-mode apps only allow allowlisted users to complete OAuth (you). Visitors only view the page.
