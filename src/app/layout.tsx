import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Source_Sans_3, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/shell";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", weight: ["500", "600", "700", "800"] });
const source = Source_Sans_3({ subsets: ["latin"], variable: "--font-source", weight: ["400", "500", "600", "700"] });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-plexmono", weight: ["400", "500"] });

export const metadata: Metadata = {
  title: { default: "CorpGurus", template: "%s · CorpGurus" },
  description: "The marketplace and professional network for freelance corporate trainers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${source.variable} ${plexMono.variable}`}>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
