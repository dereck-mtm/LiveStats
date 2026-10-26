import Link from "next/link";
import { getRedirectUri } from "@/lib/config";

export default function SetupPage() {
  const redirectUri = getRedirectUri();

  return (
    <main className="min-h-screen bg-ink px-6 py-12 text-fog sm:px-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm text-mist hover:text-lime">
          ← Back
        </Link>
        <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-tight">
          Finish Spotify setup
        </h1>
        <p className="mt-3 text-mist">
          Your Client ID is already wired in. Two dashboard fixes unlock live
          login.
        </p>

        <ol className="mt-10 space-y-8 text-sm leading-relaxed">
          <li>
            <p className="font-semibold text-fog">1. Fix Redirect URIs</p>
            <p className="mt-2 text-mist">
              In the Spotify Developer Dashboard → LiveStats → Settings, remove{" "}
              <code className="text-lime">https://github.com/dereck-mtm</code>{" "}
              from Redirect URIs. That URL is your GitHub profile, not an OAuth
              callback.
            </p>
            <p className="mt-3 text-mist">Add exactly:</p>
            <pre className="mt-2 overflow-x-auto rounded-xl bg-ink-soft p-4 text-lime">
              {redirectUri}
            </pre>
            <p className="mt-2 text-mist">
              After Vercel deploy, also add{" "}
              <code className="text-lime">
                https://YOUR-APP.vercel.app/api/auth/callback
              </code>
              .
            </p>
          </li>
          <li>
            <p className="font-semibold text-fog">2. Add Client Secret</p>
            <p className="mt-2 text-mist">
              Copy the Client Secret from the dashboard (never paste it in chat).
              Set it as <code className="text-lime">SPOTIFY_CLIENT_SECRET</code>{" "}
              in <code className="text-lime">.env.local</code> and in Vercel
              project env vars.
            </p>
          </li>
          <li>
            <p className="font-semibold text-fog">3. Allow your user</p>
            <p className="mt-2 text-mist">
              Development mode only allows allowlisted accounts. Under User
              Management, add the Spotify email you will sign in with.
            </p>
          </li>
          <li>
            <p className="font-semibold text-fog">4. Optional Website field</p>
            <p className="mt-2 text-mist">
              The Website field can stay as your GitHub or become your Vercel
              URL. Only Redirect URIs must match the callback path above.
            </p>
          </li>
        </ol>

        <div className="mt-10 flex flex-wrap gap-4">
          <a
            href="/api/auth/login"
            className="rounded-full bg-lime px-6 py-3 font-semibold text-ink hover:bg-lime-deep"
          >
            Try connect / demo
          </a>
          <Link
            href="/dashboard?demo=1"
            className="rounded-full border border-white/15 px-6 py-3 font-semibold text-fog hover:border-lime/40"
          >
            Open demo dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
