import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Source_Sans_3, IBM_Plex_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/shell";
import { SITE } from "@/lib/seo";
import { Analytics } from "@/components/analytics";
import { getCurrentUser } from "@/lib/auth";
import { distinctId } from "@/lib/analytics";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", weight: ["500", "600", "700", "800"] });
const source = Source_Sans_3({ subsets: ["latin"], variable: "--font-source", weight: ["400", "500", "600", "700"] });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-plexmono", weight: ["400", "500"] });
const instrument = Instrument_Serif({ subsets: ["latin"], variable: "--font-instrument", weight: "400", style: ["normal", "italic"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `CorpGurus · ${SITE.tagline}`, template: "%s · CorpGurus" },
  description: SITE.description,
  keywords: ["corporate trainer", "freelance corporate trainer India", "hire corporate trainer", "corporate training marketplace", "freelance trainer platform", "verified corporate trainers", "L&D marketplace India"],
  applicationName: "CorpGurus",
  openGraph: { type: "website", siteName: "CorpGurus", locale: SITE.locale, url: SITE.url, title: `CorpGurus · ${SITE.tagline}`, description: SITE.description, images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: SITE.tagline }] },
  twitter: { card: "summary_large_image", site: SITE.twitter, title: `CorpGurus · ${SITE.tagline}`, description: SITE.description, images: ["/opengraph-image"] },
  robots: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  alternates: { canonical: SITE.url },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = process.env.NEXT_PUBLIC_POSTHOG_KEY ? await getCurrentUser() : null;
  return (
    <html lang="en" className={`${jakarta.variable} ${source.variable} ${plexMono.variable} ${instrument.variable}`}>
      <body>
        <Shell>{children}</Shell>
        <Analytics distinct={user ? distinctId(user.id) : null} role={user?.role ?? null} />
      </body>
    </html>
  );
}
