import { BadgeCheck, BusFront, HandCoins, Trophy, Volleyball, type LucideIcon } from "lucide-react";
import { siteConfig, type JourneyIcon } from "@/config/site";
import { SectionHeading } from "@/components/ui/SectionHeading";

const icons: Record<JourneyIcon, LucideIcon> = {
  qualifiers: Volleyball,
  qualified: BadgeCheck,
  fundraising: HandCoins,
  travel: BusFront,
  compete: Trophy,
};

export function Journey({ currentStep }: { currentStep: number }) {
  const { journey } = siteConfig;

  return (
    <section id="journey" aria-labelledby="journey-title" className="bg-white px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          id="journey-title"
          title="Our journey"
          intro="From the regional qualifiers to the national stage. Your support carries us the rest of the way."
        />

        <ol className="relative mt-14 grid gap-8 lg:grid-cols-5 lg:gap-6">
          {/* Connecting line: vertical on mobile, horizontal on desktop */}
          <span aria-hidden className="absolute top-7 right-[10%] left-[10%] hidden h-0.5 bg-line lg:block" />

          {journey.steps.map((step, index) => {
            const number = index + 1;
            const state = number < currentStep ? "done" : number === currentStep ? "current" : "next";
            const Icon = icons[step.icon];

            const circle =
              state === "done"
                ? "bg-club text-white"
                : state === "current"
                  ? "bg-gold text-forest ring-4 ring-gold/35"
                  : "bg-white text-ink-soft border-2 border-dashed border-line";

            return (
              <li
                key={step.title}
                aria-current={state === "current" ? "step" : undefined}
                className="relative flex gap-5 lg:flex-col lg:items-center lg:gap-4 lg:text-center"
              >
                {index < journey.steps.length - 1 && (
                  <span aria-hidden className="absolute top-14 -bottom-8 left-7 w-0.5 -translate-x-1/2 bg-line lg:hidden" />
                )}
                <span className={`relative grid size-14 shrink-0 place-items-center rounded-full ${circle}`}>
                  <Icon className="size-6" aria-hidden />
                </span>
                <div className="pt-1 lg:pt-0">
                  <p className="text-sm font-semibold text-ink-soft">
                    Step {number}
                    {state === "current" && (
                      <span className="ml-2 rounded-full bg-gold px-2 py-0.5 text-xs font-bold text-forest">
                        We are here
                      </span>
                    )}
                  </p>
                  <h3
                    className={`mt-1 font-display text-2xl font-bold leading-tight ${
                      state === "next" ? "text-ink" : "text-forest"
                    }`}
                  >
                    {step.title}
                  </h3>
                  <p className="mt-1.5 leading-snug text-ink-soft">{step.description}</p>
                  {step.when && <p className="mt-2 text-sm font-semibold text-club">{step.when}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
