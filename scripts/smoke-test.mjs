#!/usr/bin/env node
/**
 * Extensive smoke tests against a running LiveStats base URL.
 * Usage: node scripts/smoke-test.mjs [baseUrl]
 */
const base = (process.argv[2] || "http://127.0.0.1:43127").replace(/\/$/, "");

const results = [];
function ok(name, pass, detail = "") {
  results.push({ name, pass, detail });
  const mark = pass ? "PASS" : "FAIL";
  console.log(`${mark}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function json(path, init) {
  const res = await fetch(`${base}${path}`, init);
  const text = await res.text();
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { res, body, text };
}

async function main() {
  console.log(`Smoke testing ${base}\n`);

  // Home
  {
    const res = await fetch(`${base}/`);
    const html = await res.text();
    ok("GET / 200", res.status === 200, String(res.status));
    ok("Home has LiveStats brand", html.includes("LiveStats"));
    ok("Home has section nav labels", /Artists|On repeat|Recommend/.test(html));
    ok("Home has section ids", /id=\"artists\"|id=\"recommend\"/.test(html));
    ok("No analytics jargon", !html.includes("Rank affinity"));
    ok("Has Always in rotation", html.includes("Always in rotation"));
    ok("Has Recommend a song", html.includes("Recommend a song"));
  }

  // Stats API — all ranges
  for (const range of ["short_term", "medium_term", "long_term"]) {
    const { res, body } = await json(`/api/stats?range=${range}`);
    ok(`stats ${range} 200`, res.status === 200);
    ok(`stats ${range} shape`, Boolean(body?.artists && body?.tracks && body?.alwaysOn && body?.sessions && body?.clock && body?.repeats));
    ok(`stats ${range} artists>0`, (body?.artists?.length || 0) > 0, String(body?.artists?.length));
    ok(`stats ${range} no sticky`, body?.sticky === undefined);
    ok(`stats ${range} source`, body?.source === "live" || body?.source === "snapshot", body?.source);
  }

  // Invalid range falls back
  {
    const { res, body } = await json(`/api/stats?range=nope`);
    ok("invalid range still 200", res.status === 200);
    ok("invalid range defaults medium", body?.range === "medium_term", body?.range);
  }

  // Recommend GET
  {
    const { res, body } = await json(`/api/recommend`);
    ok("GET /api/recommend 200", res.status === 200);
    ok("recommend items array", Array.isArray(body?.items));
  }

  // Recommend POST validation
  {
    const { res, body } = await json(`/api/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    ok("POST recommend empty 400", res.status === 400, String(res.status));
    ok("POST recommend error msg", Boolean(body?.error));
  }

  // Recommend POST happy path (local / --write only — avoid polluting prod inbox)
  const allowWrite =
    process.argv.includes("--write") ||
    base.includes("127.0.0.1") ||
    base.includes("localhost");
  if (allowWrite) {
    const { res, body } = await json(`/api/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackId: "smoke_track_1",
        trackName: "Smoke Test Track",
        artists: "Test Artist",
        fromName: "QA Bot",
        note: "automated smoke",
      }),
    });
    ok("POST recommend 201", res.status === 201, String(res.status));
    ok(
      "POST recommend returns item",
      body?.item?.trackName === "Smoke Test Track",
    );
  } else {
    ok("POST recommend skipped on remote", true, "pass --write to enable");
  }

  // Search
  {
    const { res, body } = await json(`/api/search?q=charli`);
    ok("search charli 200", res.status === 200);
    ok("search returns items", Array.isArray(body?.items));
    ok("search has hits", (body?.items?.length || 0) > 0, String(body?.items?.length));
  }
  {
    const { res, body } = await json(`/api/search?q=a`);
    ok("search too short empty", res.status === 200 && Array.isArray(body?.items) && body.items.length === 0);
  }

  // Owner / setup pages
  for (const path of ["/owner", "/setup"]) {
    const res = await fetch(`${base}${path}`);
    ok(`GET ${path} 200`, res.status === 200, String(res.status));
  }

  // Auth login redirects to Spotify or demo
  {
    const res = await fetch(`${base}/api/auth/login`, { redirect: "manual" });
    ok(
      "login redirects",
      res.status === 307 || res.status === 302,
      String(res.status),
    );
    const loc = res.headers.get("location") || "";
    ok(
      "login location spotify or home",
      loc.includes("accounts.spotify.com") || loc.includes("/"),
      loc.slice(0, 80),
    );
  }

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    console.log("Failures:");
    for (const f of failed) console.log(` - ${f.name}: ${f.detail}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
