import Link from "next/link";
import { hasSpotifyCredentials } from "@/lib/config";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const ready = hasSpotifyCredentials();

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="animate-drift pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 70% 20%, rgba(198,242,74,0.22), transparent 55%), radial-gradient(ellipse 50% 40% at 10% 80%, rgba(255,107,74,0.16), transparent 50%), linear-gradient(160deg, #07110e 0%, #0b1210 45%, #13241c 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 pb-16 pt-8 sm:px-10">
        <header className="animate-rise flex items-center justify-between">
          <p className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-fog">
            LiveStats
          </p>
          <a
            href="https://developer.spotify.com/documentation/web-api"
            className="text-sm text-mist transition hover:text-lime"
            target="_blank"
            rel="noreferrer"
          >
            Spotify Web API
          </a>
        </header>

        <section className="flex flex-1 flex-col justify-center py-16 sm:py-24">
          <div className="relative mb-10 w-fit">
            <span
              aria-hidden
              className="animate-pulse-ring absolute -inset-3 rounded-full border border-lime/40"
            />
            <p className="animate-rise rounded-full border border-lime/30 bg-lime/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-lime">
              Spotify analytics
            </p>
          </div>

          <h1 className="animate-rise-delay-1 max-w-3xl font-[family-name:var(--font-display)] text-5xl font-extrabold leading-[0.95] tracking-tight text-fog sm:text-7xl">
            LiveStats
          </h1>
          <p className="animate-rise-delay-1 mt-5 max-w-xl text-lg leading-relaxed text-mist sm:text-xl">
            Your top artists, tracks, and recent plays — pulled live from your
            Spotify account.
          </p>

          <div className="animate-rise-delay-2 mt-10 flex flex-wrap items-center gap-4">
            <a
              href="/api/auth/login"
              className="inline-flex items-center justify-center rounded-full bg-lime px-7 py-3.5 text-base font-semibold text-ink transition hover:bg-lime-deep"
            >
              {ready ? "Connect Spotify" : "Open demo dashboard"}
            </a>
            {!ready && (
              <Link
                href="/setup"
                className="text-sm font-medium text-mist underline-offset-4 transition hover:text-fog hover:underline"
              >
                How to finish OAuth setup
              </Link>
            )}
          </div>

          {error && (
            <p className="animate-rise-delay-2 mt-6 max-w-xl rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-fog">
              Sign-in issue: {error}. Check your Redirect URI and Client Secret,
              then try again.
            </p>
          )}

          {!ready && (
            <p className="animate-rise-delay-2 mt-6 max-w-xl text-sm text-mist">
              Client Secret is not set yet, so the live Spotify login is paused.
              The demo dashboard shows the UI with sample data.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
