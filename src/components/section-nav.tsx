"use client";

import { useEffect, useState } from "react";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "artists", label: "Artists" },
  { id: "tracks", label: "Tracks" },
  { id: "always-on", label: "Always on" },
  { id: "habits", label: "Habits" },
  { id: "sessions", label: "Sessions" },
  { id: "repeats", label: "On repeat" },
  { id: "recommend", label: "Recommend" },
] as const;

export function SectionNav() {
  const [active, setActive] = useState<string>("overview");
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const sections = TABS.map((t) => document.getElementById(t.id)).filter(
      (el): el is HTMLElement => Boolean(el),
    );

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) {
          setActive(visible[0].target.id);
        }
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0.1, 0.25, 0.5],
      },
    );

    for (const el of sections) observer.observe(el);

    const onScroll = () => setStuck(window.scrollY > window.innerHeight * 0.55);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  function jump(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActive(id);
  }

  return (
    <nav
      aria-label="Page sections"
      className={`fixed inset-x-0 top-0 z-40 border-b transition ${
        stuck
          ? "border-white/10 bg-black/85 backdrop-blur-xl"
          : "border-transparent bg-gradient-to-b from-black/70 to-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-[1120px] gap-1 overflow-x-auto px-4 py-3 sm:px-10 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => jump(tab.id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium tracking-[-0.01em] transition ${
                isActive
                  ? "bg-white text-black"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
