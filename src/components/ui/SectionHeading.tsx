import type { ReactNode } from "react";

type Props = {
  id?: string;
  title: string;
  intro?: ReactNode;
  tone?: "light" | "dark";
  aside?: ReactNode;
};

export function SectionHeading({ id, title, intro, tone = "light", aside }: Props) {
  const onDark = tone === "dark";
  return (
    <div className="max-w-2xl">
      <div className="flex flex-wrap items-center gap-3">
        <h2
          id={id}
          className={`font-display text-4xl font-extrabold uppercase leading-[0.95] sm:text-5xl ${
            onDark ? "text-white" : "text-forest"
          }`}
        >
          {title}
        </h2>
        {aside}
      </div>
      {intro && (
        <p className={`mt-4 text-lg leading-relaxed ${onDark ? "text-white/80" : "text-ink-soft"}`}>{intro}</p>
      )}
    </div>
  );
}
