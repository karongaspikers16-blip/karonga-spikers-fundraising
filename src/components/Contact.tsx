import { Mail, Phone } from "lucide-react";
import { siteConfig } from "@/config/site";
import { formatPhone, whatsappLink } from "@/lib/format";
import type { Campaign } from "@/lib/campaign";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SampleBadge } from "@/components/ui/SampleBadge";
import { FacebookIcon, WhatsAppIcon } from "@/components/ui/BrandIcons";

export function Contact({ contact }: { contact: Campaign["contact"] }) {
  const { club } = siteConfig;

  const rows = [
    {
      icon: <WhatsAppIcon className="size-5" />,
      label: "WhatsApp",
      value: formatPhone(contact.whatsappNumber),
      href: whatsappLink(undefined, contact.whatsappNumber),
      external: true,
    },
    {
      icon: <Phone className="size-5" aria-hidden />,
      label: "Club manager (calls)",
      value: contact.phoneDisplay,
      href: `tel:${contact.phoneDisplay.replace(/[^\d+]/g, "")}`,
      external: false,
    },
    {
      icon: <Mail className="size-5" aria-hidden />,
      label: "Email",
      value: contact.email,
      href: `mailto:${contact.email}`,
      external: false,
    },
    {
      icon: <FacebookIcon className="size-5" />,
      label: "Facebook",
      value: contact.facebookName,
      href: contact.facebookUrl,
      external: true,
    },
  ];

  return (
    <section id="contact" aria-labelledby="contact-title" className="px-5 py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHeading
            id="contact-title"
            title="Get in touch"
            intro="Questions about donating, sponsorship or the team? Message us on WhatsApp for the quickest reply."
          />
          <a
            href={whatsappLink(`Hello ${club.shortName}, I would like to support the team.`, contact.whatsappNumber)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2.5 rounded-lg bg-club px-7 py-4 text-lg font-bold text-white transition-colors hover:bg-forest"
          >
            <WhatsAppIcon className="size-6" /> Chat with us on WhatsApp
          </a>
        </div>

        <div className="rounded-2xl bg-white p-6 ring-1 ring-line sm:p-8">
          <div className="flex justify-end">
            <SampleBadge show={contact.isSample} label="Sample contact details" />
          </div>
          <ul className="mt-2 divide-y divide-line">
            {rows.map((row) => (
              <li key={row.label}>
                <a
                  href={row.href}
                  {...(row.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="group flex items-center gap-4 py-5"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-club-tint text-club">
                    {row.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm text-ink-soft">{row.label}</span>
                    <span className="block break-words text-lg font-semibold text-forest group-hover:underline">
                      {row.value}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
