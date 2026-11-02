import { Mail } from "lucide-react";
import { siteConfig } from "@/config/site";
import { whatsappLink } from "@/lib/format";
import type { Campaign } from "@/lib/campaign";
import { Logo } from "@/components/ui/Logo";
import { FacebookIcon, WhatsAppIcon } from "@/components/ui/BrandIcons";

export function Footer({ contact }: { contact: Campaign["contact"] }) {
  const { club } = siteConfig;

  const socials = [
    { label: "Facebook", href: contact.facebookUrl, icon: <FacebookIcon className="size-5" />, external: true },
    { label: "WhatsApp", href: whatsappLink(undefined, contact.whatsappNumber), icon: <WhatsAppIcon className="size-5" />, external: true },
    { label: "Email", href: `mailto:${contact.email}`, icon: <Mail className="size-5" aria-hidden />, external: false },
  ];

  return (
    <footer className="bg-forest px-5 pt-16 pb-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div>
            <Logo tone="dark" size={64} />
            <p className="mt-8 font-display text-4xl font-extrabold uppercase leading-[0.95] text-gold sm:text-5xl">
              Together, we can make it happen!
            </p>
            <p className="mt-3 text-white/75">Supporting local sports. Inspiring the next generation.</p>
          </div>

          <ul className="flex gap-3">
            {socials.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  aria-label={s.label}
                  {...(s.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="grid size-12 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-gold hover:text-forest"
                >
                  {s.icon}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-12 border-t border-white/15 pt-6 text-sm text-white/60">
          © {new Date().getFullYear()} {club.name}
        </p>
      </div>
    </footer>
  );
}
