"use client";

import { useState } from "react";

export function CopyToken({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-3">
      <pre className="overflow-x-auto rounded-xl bg-ink-soft p-4 text-xs text-lime break-all whitespace-pre-wrap">
        {token}
      </pre>
      <button
        type="button"
        onClick={copy}
        className="rounded-full bg-lime px-5 py-2.5 text-sm font-semibold text-ink hover:bg-lime-deep"
      >
        {copied ? "Copied" : "Copy refresh token"}
      </button>
    </div>
  );
}
