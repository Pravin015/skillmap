// Server-side metadata for competition pages.
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const comp = await prisma.competition
    .findUnique({
      where: { slug },
      select: { title: true, description: true, coverImageUrl: true, type: true, prizes: true, registrationEnd: true },
    })
    .catch(() => null);

  if (!comp) return { title: "Competition — AstraaHire" };

  const title = `${comp.title} — AstraaHire`;
  const desc = `${comp.type} ${comp.prizes ? `· ${comp.prizes.slice(0, 60)}` : ""} · Apply by ${new Date(comp.registrationEnd).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}. ${(comp.description || "").slice(0, 100).replace(/\s+/g, " ").trim()}…`;
  const url = `https://astraahire.com/competitions/${slug}`;

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      url,
      type: "article",
      siteName: "AstraaHire",
      ...(comp.coverImageUrl ? { images: [{ url: comp.coverImageUrl }] } : {}),
    },
    twitter: { card: "summary_large_image", title, description: desc },
    alternates: { canonical: url },
  };
}

export default function CompetitionLayout({ children }: Props) {
  return children;
}
