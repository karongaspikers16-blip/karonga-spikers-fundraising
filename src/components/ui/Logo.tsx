import Image from "next/image";
import { siteConfig } from "@/config/site";

type Props = {
  tone?: "light" | "dark";
  showName?: boolean;
  /** Height of the badge in pixels. */
  size?: number;
};

/** Club badge. Uses `club.logo` from site config, or a KS monogram until a real logo is added. */
export function Logo({ tone = "light", showName = true, size = 48 }: Props) {
  const { club } = siteConfig;
  const onDark = tone === "dark";

  return (
    <span className="flex items-center gap-2.5">
      {club.logo ? (
        <Image
          src={club.logo.src}
          alt=""
          width={Math.round((club.logo.width / club.logo.height) * size)}
          height={size}
          className="shrink-0"
          style={{ height: size, width: "auto" }}
        />
      ) : (
        <span
          aria-hidden
          style={{ width: size, height: size }}
          className={`grid shrink-0 place-items-center rounded-full border-2 font-display text-lg font-extrabold tracking-tight ${
            onDark ? "border-gold bg-gold text-forest" : "border-forest bg-forest text-gold"
          }`}
        >
          KS
        </span>
      )}
      {showName && (
        <span className="leading-none">
          <span className={`block font-display text-xl font-bold ${onDark ? "text-white" : "text-forest"}`}>
            {club.shortName}
          </span>
          <span className={`block text-xs font-medium ${onDark ? "text-white/70" : "text-ink-soft"}`}>
            Volleyball Club
          </span>
        </span>
      )}
      <span className="sr-only">{club.name}</span>
    </span>
  );
}
