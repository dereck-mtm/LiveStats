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
    <main className="min-h-screen bg-black px-6 py-10 text-white sm:px-10">
      <div className="mx-auto max-w-lg">
        <Link
          href="/"
          className="text-[13px] font-medium text-[#1ed760] hover:opacity-70"
        >
          ← LiveStats
        </Link>
        <h1 className="mt-10 text-[40px] font-semibold tracking-[-0.045em]">
          Live refresh
        </h1>
        <p className="mt-3 text-[17px] leading-relaxed text-white/60">
          Keep the public Wrapped page pulling fresh tops, sessions, and
          repeats every 10 minutes.
        </p>

        {connected && session ? (
          <p className="mt-6 rounded-2xl bg-white/10 px-4 py-3 text-[14px]">
            Connected as <strong>{session.displayName}</strong>
          </p>
        ) : null}

        <div className="mt-10 space-y-4">
          <div className="rounded-[24px] bg-white/[0.06] p-6 ring-1 ring-white/10">
            <p className="text-[15px] font-semibold tracking-[-0.02em]">
              1. Connect Spotify
            </p>
            <p className="mt-2 text-[14px] text-white/55">
              Allowlist your email in the Spotify dashboard, then connect.
            </p>
            <div className="mt-5">
              {ready ? (
                <a
                  href="/api/auth/login"
                  className="inline-flex rounded-full bg-[#1ed760] px-5 py-2.5 text-[14px] font-semibold text-black"
                >
                  {session ? "Reconnect" : "Connect Spotify"}
                </a>
              ) : (
                <p className="text-[14px] text-[#ff6b6b]">
                  Client credentials missing.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-[24px] bg-white/[0.06] p-6 ring-1 ring-white/10">
            <p className="text-[15px] font-semibold tracking-[-0.02em]">
              2. Add SPOTIFY_REFRESH_TOKEN on Vercel
            </p>
            <p className="mt-2 text-[14px] text-white/55">
              Then redeploy. Status:{" "}
              {publicReady ? (
                <span className="text-[#1ed760]">live token set</span>
              ) : (
                <span className="text-[#ff6b6b]">snapshot only</span>
              )}
            </p>
            {session ? (
              <div className="mt-4">
                <CopyToken token={session.refreshToken} />
              </div>
            ) : (
              <p className="mt-3 text-[13px] text-white/40">
                Connect first to reveal the token.
              </p>
            )}
          </div>

          <div className="rounded-[24px] bg-white/[0.06] p-6 ring-1 ring-white/10">
            <p className="text-[15px] font-semibold tracking-[-0.02em]">
              3. Redirect URI
            </p>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-black/50 p-3 text-[12px] text-white/70">
              https://livestats-mtm26.vercel.app/api/auth/callback
            </pre>
          </div>
        </div>
      </div>
    </main>
  );
}
