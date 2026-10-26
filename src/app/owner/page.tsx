import Link from "next/link";
import { CopyToken } from "@/components/copy-token";
import { hasSpotifyCredentials } from "@/lib/config";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function OwnerPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string }>;
}) {
  const { connected } = await searchParams;
  const session = await getSession();
  const ready = hasSpotifyCredentials();
  const publicReady = Boolean(process.env.SPOTIFY_REFRESH_TOKEN?.trim());

  return (
    <main className="min-h-screen bg-ink px-6 py-12 text-fog sm:px-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm text-mist hover:text-lime">
          ← Public stats
        </Link>
        <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-tight">
          Share your listening
        </h1>
        <p className="mt-3 text-mist">
          Connect your Spotify once. Visitors to your LiveStats link will see{" "}
          <span className="text-fog">your</span> top artists, tracks, and
          recent plays — they do not log in.
        </p>

        {connected && session && (
          <p className="mt-6 rounded-xl border border-lime/30 bg-lime/10 px-4 py-3 text-sm">
            Connected as <strong>{session.displayName}</strong>. Finish step 2
            below so the public page stays live for everyone.
          </p>
        )}

        <ol className="mt-10 space-y-8 text-sm leading-relaxed">
          <li>
            <p className="font-semibold text-fog">1. Connect Spotify</p>
            <p className="mt-2 text-mist">
              Allowlist your Spotify email in the Developer Dashboard (User
              Management), then connect:
            </p>
            <div className="mt-4">
              {ready ? (
                <a
                  href="/api/auth/login"
                  className="inline-flex rounded-full bg-lime px-6 py-3 font-semibold text-ink hover:bg-lime-deep"
                >
                  {session ? "Reconnect Spotify" : "Connect Spotify"}
                </a>
              ) : (
                <p className="text-coral">
                  Client ID/Secret missing in env — add them first.
                </p>
              )}
            </div>
          </li>

          <li>
            <p className="font-semibold text-fog">
              2. Publish for visitors (refresh token)
            </p>
            <p className="mt-2 text-mist">
              Add this as{" "}
              <code className="text-lime">SPOTIFY_REFRESH_TOKEN</code> in Vercel
              → Project → Settings → Environment Variables, then redeploy. Keep
              it private.
            </p>
            {session ? (
              <div className="mt-4">
                <CopyToken token={session.refreshToken} />
              </div>
            ) : (
              <p className="mt-3 text-mist">
                Connect in step 1 to reveal your refresh token here.
              </p>
            )}
            <p className="mt-3 text-mist">
              Public token status:{" "}
              {publicReady ? (
                <span className="text-lime">set — visitors see live data</span>
              ) : (
                <span className="text-coral">
                  not set yet — site still shows sample/owner-only preview
                </span>
              )}
            </p>
          </li>

          <li>
            <p className="font-semibold text-fog">3. Redirect URI checklist</p>
            <p className="mt-2 text-mist">
              Spotify app Redirect URIs must include:
            </p>
            <pre className="mt-2 overflow-x-auto rounded-xl bg-ink-soft p-4 text-lime">
              https://livestats-mtm26.vercel.app/api/auth/callback
            </pre>
            <pre className="mt-2 overflow-x-auto rounded-xl bg-ink-soft p-4 text-lime">
              http://127.0.0.1:43127/api/auth/callback
            </pre>
          </li>
        </ol>

        {session && (
          <p className="mt-10 text-sm text-mist">
            <a href="/api/auth/logout" className="text-fog underline">
              Sign out
            </a>
          </p>
        )}
      </div>
    </main>
  );
}
