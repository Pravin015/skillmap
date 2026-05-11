import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";
import Script from "next/script";

const poppins = Poppins({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://astraahire.com"),
  title: {
    default: "AstraaHire — Intelligence that gets you hired",
    template: "%s | AstraaHire",
  },
  description:
    "India's AI-powered career intelligence platform. AI roadmaps, mock interviews, mentor sessions, and offer verification for fresh graduates.",
  keywords: [
    "fresher jobs India",
    "career intelligence",
    "AI mock interview",
    "TCS jobs",
    "Razorpay jobs",
    "offer letter verification",
    "campus placement",
    "fresh graduate jobs",
    "internship India",
    "AstraaHire",
  ],
  authors: [{ name: "AstraaHire" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AstraaHire",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
  openGraph: {
    title: "AstraaHire — Intelligence that gets you hired",
    description: "India's AI-powered career intelligence platform for fresh graduates.",
    url: "https://astraahire.com",
    siteName: "AstraaHire",
    type: "website",
    locale: "en_IN",
    images: [
      { url: "/icons/icon.svg", width: 1200, height: 630, alt: "AstraaHire — Career intelligence platform" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AstraaHire — Intelligence that gets you hired",
    description: "India's AI-powered career intelligence platform for fresh graduates.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#FAF7F2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="flex min-h-full flex-col font-[family-name:var(--font-body)] text-[var(--color-text-primary)]" style={{ background: "var(--color-bg)" }}>
        <Providers>
          <Header />
          <main className="flex-1 pt-24">{children}</main>
          <Footer />
        </Providers>
        <Script id="sw-register" strategy="afterInteractive">{`
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {});
          }
        `}</Script>
      </body>
    </html>
  );
}
