import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { siteConfig } from "@/config/site";
import { SectionHeading } from "@/components/ui/SectionHeading";

/** "Our partners" (#partners): organisations working with the club. Hidden when the list is empty. */
export function Partners() {
  const { partners } = siteConfig;
  if (partners.length === 0) return null;

  return (
    <section id="partners" aria-labelledby="partners-title" className="px-5 pb-20 sm:pb-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading id="partners-title" title="Our partners" intro="The organisations helping us get to Mzuzu." />

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {partners.map((partner) => {
            const card = (
              <>
                <Image
                  src={partner.logo.src}
                  alt={`${partner.name} logo`}
                  width={partner.logo.width}
                  height={partner.logo.height}
                  sizes="80px"
                  className="size-20 shrink-0 rounded-xl object-contain ring-1 ring-line"
                />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 font-display text-3xl font-extrabold leading-none text-forest">
                    {partner.shortName}
                    {partner.url && <ExternalLink className="size-4 text-ink-soft" aria-hidden />}
                  </span>
                  <span className="mt-1 block font-semibold text-ink">{partner.name}</span>
                  <span className="mt-1 block text-sm leading-snug text-ink-soft">{partner.role}</span>
                </span>
              </>
            );
            const style = "flex items-center gap-4 rounded-2xl bg-white p-5 ring-1 ring-line";

            return (
              <li key={partner.name}>
                {partner.url ? (
                  <a
                    href={partner.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${style} transition-shadow hover:ring-club`}
                  >
                    {card}
                  </a>
                ) : (
                  <div className={style}>{card}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
