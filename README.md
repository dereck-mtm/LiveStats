# LiveStats

Personal Spotify listening analytics — top artists, top tracks, and recently played — built with Next.js and the Spotify Web API.

## Quick start

```bash
npm install
cp .env.example .env.local
# Fill SPOTIFY_CLIENT_SECRET (and confirm CLIENT_ID)
npm run dev -- --port 43127 --hostname 127.0.0.1
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127).

Without a Client Secret, the app still runs in **demo mode** with sample data.

## Spotify dashboard checklist

1. Create/open your app at [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Set **Redirect URIs** to:
   - `http://127.0.0.1:43127/api/auth/callback` (local)
   - `https://YOUR-APP.vercel.app/api/auth/callback` (production)
3. Do **not** use a GitHub profile URL as a redirect URI.
4. Add your Spotify account under **User Management** (Development mode allowlist).
5. Copy Client ID + Client Secret into env vars (never commit the secret).

## Environment variables

| Name | Purpose |
|------|---------|
| `SPOTIFY_CLIENT_ID` | Dashboard Client ID |
| `SPOTIFY_CLIENT_SECRET` | Dashboard Client Secret |
| `AUTH_SECRET` | Signs session cookies |
| `NEXT_PUBLIC_APP_URL` | Public origin used to build the OAuth redirect |

## Deploy on Vercel

1. Push this repo and import the project in Vercel (or `vercel deploy`).
2. Add the same env vars in the Vercel project settings.
3. Set `NEXT_PUBLIC_APP_URL` to your Vercel URL.
4. Add that URL’s `/api/auth/callback` to Spotify Redirect URIs.

## Notes

- Development-mode Spotify apps only work for allowlisted users (and require Premium for Web API access under current Spotify rules).
- Top items are affinity-ranked by Spotify (not raw play counts). For lifetime play counts, use Spotify’s **Extended streaming history** export from account privacy settings.
