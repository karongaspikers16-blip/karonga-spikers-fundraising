"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

// Paths start with "/" so the links also work from the /updates pages.
const baseLinks = [
  { href: "/#home", label: "Home" },
  { href: "/#campaign", label: "Our Campaign" },
  { href: "/#progress", label: "Fundraising Progress" },
  { href: "/#sponsors", label: "Sponsors" },
  { href: "/#contact", label: "Contact" },
];

/** `showUpdates` adds the Updates link once at least one news post is published. */
export function Navbar({ showUpdates = false }: { showUpdates?: boolean }) {
  const [open, setOpen] = useState(false);
  const links = showUpdates
    ? [...baseLinks.slice(0, 4), { href: "/updates", label: "Updates" }, ...baseLinks.slice(4)]
    : baseLinks;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <a href="/#home" className="shrink-0" onClick={() => setOpen(false)}>
          <Logo />
        </a>

        <ul className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="rounded-md px-3 py-2 text-[15px] font-medium text-ink-soft transition-colors hover:text-forest"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <a
            href="/#donate"
            className="hidden rounded-lg bg-club px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-forest sm:inline-flex"
          >
            Support Our Team
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid size-10 place-items-center rounded-lg text-forest hover:bg-club-tint lg:hidden"
          >
            {open ? <X className="size-6" aria-hidden /> : <Menu className="size-6" aria-hidden />}
          </button>
        </div>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t border-line bg-white lg:hidden">
          <ul className="mx-auto max-w-6xl px-5 py-3">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-2 py-3 text-base font-medium text-ink hover:bg-mist"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="pt-2 pb-1">
              <a
                href="/#donate"
                onClick={() => setOpen(false)}
                className="flex justify-center rounded-lg bg-club px-4 py-3 text-base font-bold text-white"
              >
                Support Our Team
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
