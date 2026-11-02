"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HandCoins, LayoutDashboard, Medal, Newspaper, Settings } from "lucide-react";
import type { StaffRole } from "@/lib/auth";

const items = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, roles: ["admin", "secretary", "treasurer"] },
  { href: "/admin/contributions", label: "Contributions", icon: HandCoins, roles: ["admin", "treasurer"] },
  { href: "/admin/updates", label: "Updates", icon: Newspaper, roles: ["admin", "secretary", "treasurer"] },
  { href: "/admin/sponsors", label: "Sponsors", icon: Medal, roles: ["admin", "secretary", "treasurer"] },
  { href: "/admin/settings", label: "Settings", icon: Settings, roles: ["admin"] },
] satisfies { href: string; label: string; icon: unknown; roles: StaffRole[] }[];

/** Section tabs under the admin header. Scrolls sideways on narrow phones. */
export function AdminNav({ role }: { role: StaffRole }) {
  const pathname = usePathname();
  const visible = items.filter((item) => (item.roles as StaffRole[]).includes(role));

  return (
    <nav aria-label="Admin sections" className="border-t border-line">
      <ul className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-2 sm:px-4">
        {visible.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-semibold ${
                  active ? "border-club text-forest" : "border-transparent text-ink-soft hover:text-forest"
                }`}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
