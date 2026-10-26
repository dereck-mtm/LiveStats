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
    <main className="min-h-screen bg-canvas px-6 py-10 text-ink sm:px-10">
      <div className="mx-auto max-w-lg">
        <Link
          href="/"
          className="text-[13px] font-medium text-blue hover:opacity-70"
        >
          ← LiveStats
        </Link>
        <h1 className="mt-10 text-[40px] font-semibold tracking-[-0.045em]">
          Live refresh
        </h1>
        <p className="mt-3 text-[17px] leading-relaxed text-secondary">
          Auto-refresh runs every 10 minutes. Add a refresh token so those
          pulls hit Spotify instead of the saved snapshot.
        </p>

        {connected && session ? (
          <p className="mt-6 rounded-2xl bg-well px-4 py-3 text-[14px]">
            Connected as <strong>{session.displayName}</strong>
          </p>
        ) : null}

        <div className="mt-10 space-y-4">
          <div className="rounded-[24px] bg-well p-6">
            <p className="text-[15px] font-semibold tracking-[-0.02em]">
              1. Connect Spotify
            </p>
            <p className="mt-2 text-[14px] text-secondary">
              Allowlist your email in the Spotify dashboard, then connect.
            </p>
            <div className="mt-5">
              {ready ? (
                <a
                  href="/api/auth/login"
                  className="inline-flex rounded-full bg-ink px-5 py-2.5 text-[14px] font-medium text-white"
                >
                  {session ? "Reconnect" : "Connect Spotify"}
                </a>
              ) : (
                <p className="text-[14px] text-[#ff3b30]">
                  Client credentials missing.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-[24px] bg-well p-6">
            <p className="text-[15px] font-semibold tracking-[-0.02em]">
              2. Add SPOTIFY_REFRESH_TOKEN on Vercel
            </p>
            <p className="mt-2 text-[14px] text-secondary">
              Then redeploy. Status:{" "}
              {publicReady ? (
                <span className="text-[#34c759]">live token set</span>
              ) : (
                <span className="text-[#ff3b30]">snapshot only</span>
              )}
            </p>
            {session ? (
              <div className="mt-4">
                <CopyToken token={session.refreshToken} />
              </div>
            ) : (
              <p className="mt-3 text-[13px] text-tertiary">
                Connect first to reveal the token.
              </p>
            )}
          </div>

          <div className="rounded-[24px] bg-well p-6">
            <p className="text-[15px] font-semibold tracking-[-0.02em]">
              3. Redirect URI
            </p>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-white/80 p-3 text-[12px]">
              https://livestats-mtm26.vercel.app/api/auth/callback
            </pre>
          </div>
        </div>
      </div>
    </main>
  );
}
