"use client";

import { useEffect } from "react";

/** Re-checks a pending online payment after a few seconds (the server verifies it with PayChangu). */
export function RecheckSoon({ href, seconds = 8 }: { href: string; seconds?: number }) {
  useEffect(() => {
    const timer = setTimeout(() => window.location.assign(href), seconds * 1000);
    return () => clearTimeout(timer);
  }, [href, seconds]);

  return <p className="mt-4 text-sm text-ink-soft">Checking again automatically…</p>;
}
