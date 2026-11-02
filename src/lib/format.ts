import { siteConfig } from "@/config/site";

const numberFormat = new Intl.NumberFormat("en-US");

export function formatMoney(amount: number, currency = siteConfig.fundraising.currency) {
  return `${currency} ${numberFormat.format(amount)}`;
}

export function getProgress(raised: number, target: number) {
  const percent = target > 0 ? Math.min(100, (raised / target) * 100) : 0;
  const rounded = Math.round(percent * 10) / 10;
  return {
    percent: rounded,
    label: `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}%`,
    remaining: Math.max(0, target - raised),
  };
}

/** "265881049237" -> "+265 881 049 237" (Malawi numbers; other lengths are left as +digits). */
export function formatPhone(digits: string) {
  const d = digits.replace(/\D/g, "");
  return d.length === 12 && d.startsWith("265")
    ? `+265 ${d.slice(3, 6)} ${d.slice(6, 9)} ${d.slice(9)}`
    : `+${d}`;
}

export function whatsappLink(message?: string, number = siteConfig.contact.whatsappNumber) {
  const base = `https://wa.me/${number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function mailtoLink(subject: string, body?: string, email = siteConfig.contact.email) {
  const params = new URLSearchParams({ subject });
  if (body) params.set("body", body);
  return `mailto:${email}?${params.toString().replace(/\+/g, "%20")}`;
}

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Africa/Blantyre",
});

/** "2 November 2026", in Malawi time. */
export function formatDate(value: string | Date) {
  return dateFormat.format(typeof value === "string" ? new Date(value) : value);
}

/** Bytes as "312 KB" or "4.2 MB". */
export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Share links for the campaign page, or for another page of the site when `path` is given. */
export function shareLinks(
  path = "/",
  text = `${siteConfig.club.shortName} have qualified for the ${siteConfig.tournament.name}. Help them get to Mzuzu:`,
) {
  const url = path === "/" ? siteConfig.siteUrl : new URL(path, siteConfig.siteUrl).toString();
  return {
    url,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  };
}
