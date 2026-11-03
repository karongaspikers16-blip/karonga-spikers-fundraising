"use client";

import { useEffect, useState } from "react";

/** "3h 12m left": time until today's challenge closes. Shows the closing time until it has loaded. */
export function ChallengeCountdown({ closesAt, label }: { closesAt: string; label: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, []);

  if (now === null) return <>Closes at {label}</>;
  const ms = Date.parse(closesAt) - now;
  if (ms <= 0) return <>Closed for today. Refresh for tomorrow&apos;s challenge!</>;
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  return (
    <>
      {hours > 0 ? `${hours}h ${minutes}m` : `${Math.max(1, minutes)}m`} left · closes at {label}
    </>
  );
}
