import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SkillMap — Know what it takes to get hired",
  description:
    "Tell us your dream companies. We show you open roles, skill gaps, and a personalised AI prep plan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-gray-50 font-sans text-gray-900">
        <Header />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
