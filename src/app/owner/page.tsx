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
    <main className="min-h-screen px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-xl">
        <Link href="/" className="text-sm font-medium text-accent hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-[-0.03em] text-ink">
          Live refresh setup
        </h1>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
          The dashboard auto-refreshes every 10 minutes. For true live Spotify
          pulls (not just the saved snapshot), connect once and add your refresh
          token to Vercel.
        </p>

        {connected && session ? (
          <p className="mt-6 rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm shadow-[var(--shadow)]">
            Connected as <strong>{session.displayName}</strong>.
          </p>
        ) : null}

        <ol className="mt-8 space-y-8 text-sm leading-relaxed text-ink-soft">
          <li className="panel p-5">
            <p className="font-semibold text-ink">1. Connect Spotify</p>
            <p className="mt-2">
              Allowlist your email in the Spotify dashboard, then connect:
            </p>
            <div className="mt-4">
              {ready ? (
                <a
                  href="/api/auth/login"
                  className="inline-flex rounded-full bg-ink px-5 py-2.5 font-medium text-white"
                >
                  {session ? "Reconnect" : "Connect Spotify"}
                </a>
              ) : (
                <p className="text-coral">Client credentials missing in env.</p>
              )}
            </div>
          </li>

          <li className="panel p-5">
            <p className="font-semibold text-ink">2. Add SPOTIFY_REFRESH_TOKEN</p>
            <p className="mt-2">
              Paste into Vercel → LiveStats → Environment Variables, then
              redeploy. After that,{" "}
              <code className="rounded bg-black/5 px-1">/api/stats</code> pulls
              fresh tops about every 10 minutes.
            </p>
            {session ? (
              <div className="mt-4">
                <CopyToken token={session.refreshToken} />
              </div>
            ) : (
              <p className="mt-3 text-muted">Connect first to reveal the token.</p>
            )}
            <p className="mt-3">
              Status:{" "}
              {publicReady ? (
                <span className="font-medium text-teal">live token configured</span>
              ) : (
                <span className="font-medium text-coral">
                  using snapshot until token is set
                </span>
              )}
            </p>
          </li>

          <li className="panel p-5">
            <p className="font-semibold text-ink">3. Redirect URI</p>
            <pre className="mt-2 overflow-x-auto rounded-xl bg-[#f0f0f2] p-3 text-[0.8rem] text-ink">
              https://livestats-mtm26.vercel.app/api/auth/callback
            </pre>
          </li>
        </ol>
      </div>
    </main>
  );
}
