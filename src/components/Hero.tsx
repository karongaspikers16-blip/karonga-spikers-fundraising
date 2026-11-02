import Image from "next/image";
import { BadgeCheck, CalendarDays, MapPin } from "lucide-react";
import { siteConfig } from "@/config/site";
import { CourtLines } from "@/components/ui/CourtLines";
import { HeroSlideshow } from "@/components/HeroSlideshow";

export function Hero() {
  const { hero, tournament, club } = siteConfig;

  const facts = [
    { icon: CalendarDays, label: "Dates", value: tournament.dates },
    { icon: MapPin, label: "Venue", value: tournament.venue },
    { icon: BadgeCheck, label: "Status", value: `${tournament.status} for the national tournament` },
  ];

  return (
    <section id="home" aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-forest text-white">
      {hero.slides.length > 0 ? (
        <>
          <HeroSlideshow slides={hero.slides} secondsPerSlide={hero.secondsPerSlide} />
          {/* Blue overlay keeps the headline readable: solid on phones, fading to the right on wider screens */}
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-forest/80 sm:bg-transparent sm:bg-gradient-to-r sm:from-forest sm:from-30% sm:via-forest/75 sm:to-forest/20"
          />
          <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-forest/90 to-transparent" />
        </>
      ) : (
        <CourtLines className="absolute inset-0 -z-10 h-full w-full translate-x-[38%] scale-125 opacity-60 sm:translate-x-[18%] sm:scale-110 sm:opacity-90" />
      )}

      <div className="mx-auto max-w-6xl px-5 pt-14 pb-36 sm:pt-20 md:pb-44 lg:pt-24">
        <div className="flex items-center gap-3">
          {club.logo && (
            <Image
              src={club.logo.src}
              alt=""
              width={Math.round((club.logo.width / club.logo.height) * 64)}
              height={64}
              className="h-14 w-auto drop-shadow-lg sm:h-16"
            />
          )}
          <p className="text-base font-semibold text-gold sm:text-lg">{club.name}</p>
        </div>

        <h1
          id="hero-title"
          className="mt-4 max-w-4xl font-display text-[clamp(3.25rem,11vw,8rem)] font-extrabold uppercase leading-[0.86] tracking-[-0.01em]"
        >
          Help us represent Karonga!
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/85 sm:text-xl">
          Together, we can take {club.shortName} to the {tournament.name}.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href="#donate"
            className="inline-flex items-center justify-center rounded-lg bg-gold px-7 py-4 text-lg font-bold text-forest transition-colors hover:bg-white"
          >
            Donate Now
          </a>
          <a
            href="#sponsors"
            className="inline-flex items-center justify-center rounded-lg border-2 border-white/70 px-7 py-4 text-lg font-bold text-white transition-colors hover:border-white hover:bg-white/10"
          >
            Become a Sponsor
          </a>
        </div>

        <dl className="mt-12 grid max-w-4xl gap-5 border-t border-white/20 pt-6 sm:grid-cols-3 sm:gap-8">
          {facts.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <Icon className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden />
              <div>
                <dt className="text-sm text-white/65">{label}</dt>
                <dd className="mt-0.5 font-display text-xl font-semibold leading-tight">{value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
