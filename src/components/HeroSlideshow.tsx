"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";
import type { SiteConfig } from "@/config/site";

type Props = {
  slides: SiteConfig["hero"]["slides"];
  secondsPerSlide: number;
};

const FADE_MS = 1200;

/**
 * Background photos for the hero. Each photo fades in and drifts slowly closer
 * while it is on screen. Starts paused for visitors who ask for reduced motion.
 */
export function HeroSlideshow({ slides, secondsPerSlide }: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = slides.length;
  const current = slides[index];

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPaused(true);
  }, []);

  // A timeout per slide (rather than one interval) restarts the clock when someone picks a photo.
  useEffect(() => {
    if (paused || total < 2) return;
    const id = window.setTimeout(() => setIndex((i) => (i + 1) % total), secondsPerSlide * 1000);
    return () => window.clearTimeout(id);
  }, [index, paused, total, secondsPerSlide]);

  if (total === 0) return null;

  return (
    <>
      <div aria-hidden className="absolute inset-0 -z-20 overflow-hidden">
        {slides.map((slide, i) => {
          const active = i === index;
          return (
            <Image
              key={slide.src}
              src={slide.src}
              alt=""
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover will-change-[opacity,transform]"
              style={{
                objectPosition: slide.position,
                opacity: active ? 1 : 0,
                transform: active ? "scale(1.06)" : "scale(1)",
                // The slow drift only runs on the visible photo; the outgoing one resets after it has faded out.
                transition: active
                  ? `opacity ${FADE_MS}ms ease, transform ${secondsPerSlide * 1000 + FADE_MS}ms ease-out`
                  : `opacity ${FADE_MS}ms ease, transform 0s linear ${FADE_MS}ms`,
              }}
            />
          );
        })}
      </div>

      <div className="absolute top-3 right-4 z-10 flex items-center gap-3">
        {current.credit && <p className="text-xs text-white/70">Photo: {current.credit}</p>}
        {total > 1 && (
          <div className="flex items-center rounded-full bg-black/30 px-1.5 backdrop-blur-sm">
            {slides.map((slide, i) => (
              <button
                key={slide.src}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show photo ${i + 1} of ${total}`}
                aria-current={i === index}
                className="group grid h-7 place-items-center px-1"
              >
                <span
                  className={`block h-1.5 rounded-full transition-all duration-300 ${
                    i === index ? "w-5 bg-gold" : "w-1.5 bg-white/60 group-hover:bg-white"
                  }`}
                />
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? "Play slideshow" : "Pause slideshow"}
              className="grid size-7 place-items-center text-white/80 hover:text-white"
            >
              {paused ? <Play className="size-3.5" aria-hidden /> : <Pause className="size-3.5" aria-hidden />}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
