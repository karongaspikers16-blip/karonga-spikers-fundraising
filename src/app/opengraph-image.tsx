import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";
import { formatMoney, getProgress } from "@/lib/format";
import { getCampaign } from "@/lib/campaign";

// The preview card shown when the link is shared on WhatsApp, Facebook and X.
export const alt = `Help us represent Karonga! ${siteConfig.club.name} fundraising campaign`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// The card shows the live total, so refresh it like the page.
export const revalidate = 60;

const NAVY = "#0E263D";
const GOLD = "#FFD700";

const fromRoot = (...p: string[]) => join(process.cwd(), ...p);
const fontPath = (weight: number) =>
  fromRoot("node_modules/@fontsource/barlow-condensed/files", `barlow-condensed-latin-${weight}-normal.woff`);

async function dataUrl(publicPath: string | null, mime: string) {
  if (!publicPath) return null;
  const file = await readFile(fromRoot("public", publicPath));
  return `data:${mime};base64,${file.toString("base64")}`;
}

export default async function OpengraphImage() {
  const { tournament, club, hero } = siteConfig;
  const { fundraising } = await getCampaign();
  const [display, semibold, photo, logo] = await Promise.all([
    readFile(fontPath(800)),
    readFile(fontPath(600)),
    dataUrl(hero.slides[0]?.src ?? null, "image/jpeg"),
    dataUrl(club.logo?.src ?? null, "image/png"),
  ]);
  const { percent, label } = getProgress(fundraising.raised, fundraising.target);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: NAVY,
          color: "#FFFFFF",
          fontFamily: "Barlow Condensed",
        }}
      >
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt=""
            width={1200}
            height={630}
            style={{ position: "absolute", top: 0, left: 0, width: 1200, height: 630, objectFit: "cover" }}
          />
        )}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1200,
            height: 630,
            display: "flex",
            backgroundImage: `linear-gradient(90deg, ${NAVY} 0%, rgba(14,38,61,0.88) 55%, rgba(14,38,61,0.45) 100%)`,
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            padding: "52px 72px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              {logo && club.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logo}
                  alt=""
                  height={92}
                  width={Math.round((club.logo.width / club.logo.height) * 92)}
                  style={{ marginRight: 20 }}
                />
              )}
              <div style={{ display: "flex", fontSize: 36, fontWeight: 600, color: GOLD }}>{club.name}</div>
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 112,
                fontWeight: 800,
                lineHeight: 0.9,
                marginTop: 22,
                textTransform: "uppercase",
                maxWidth: 1060,
              }}
            >
              Help us represent Karonga!
            </div>
            <div style={{ display: "flex", fontSize: 32, fontWeight: 600, marginTop: 18, color: "rgba(255,255,255,0.88)" }}>
              {`${tournament.name}, ${tournament.dates}, ${tournament.venue}`}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 34, fontWeight: 600 }}>
              <span>{`${formatMoney(fundraising.raised)} raised`}</span>
              <span style={{ color: GOLD }}>{`Target ${formatMoney(fundraising.target)}`}</span>
            </div>
            <div style={{ display: "flex", marginTop: 14, height: 22, borderRadius: 11, background: "rgba(255,255,255,0.2)" }}>
              <div style={{ display: "flex", width: `${percent}%`, borderRadius: 11, background: GOLD }} />
            </div>
            <div style={{ display: "flex", marginTop: 10, fontSize: 26, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>
              {`${label} of the way there`}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Barlow Condensed", data: display, weight: 800, style: "normal" },
        { name: "Barlow Condensed", data: semibold, weight: 600, style: "normal" },
      ],
    },
  );
}
