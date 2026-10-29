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
      <pre className="overflow-x-auto break-all whitespace-pre-wrap rounded-xl bg-black/50 p-4 text-[12px] text-white/80">
        {token}
      </pre>
      <button
        type="button"
        onClick={copy}
        className="rounded-full bg-[#1ed760] px-5 py-2.5 text-[13px] font-semibold text-black"
      >
        {copied ? "Copied" : "Copy refresh token"}
      </button>
    </div>
  );
}
