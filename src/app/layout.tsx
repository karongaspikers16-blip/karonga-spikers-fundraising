import type { Metadata, Viewport } from "next";
import "@fontsource/barlow/400.css";
import "@fontsource/barlow/500.css";
import "@fontsource/barlow/600.css";
import "@fontsource/barlow/700.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/barlow-condensed/800.css";
import "./globals.css";
import { siteConfig } from "@/config/site";

const title = `Help us represent Karonga! | ${siteConfig.club.name}`;
const description = `${siteConfig.club.shortName} have qualified for the ${siteConfig.tournament.name}, ${siteConfig.tournament.dates} in ${siteConfig.tournament.venue}. Support the team with a donation or sponsorship.`;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title,
  description,
  openGraph: {
    title,
    description,
    url: "/",
    siteName: siteConfig.club.name,
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#0E263D",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
