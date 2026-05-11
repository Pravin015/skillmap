// Server-side metadata for individual job pages — gives Google + LinkedIn
// + WhatsApp share previews actual job titles instead of the generic site
// title. The page itself stays a client component.
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const job = await prisma.jobPosting
    .findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { title: true, company: true, location: true, workMode: true, description: true, slug: true },
    })
    .catch(() => null);

  if (!job) return { title: "Job — AstraaHire" };

  const title = `${job.title} at ${job.company} — AstraaHire`;
  const desc = `${job.workMode || ""} ${job.title} role at ${job.company}${job.location ? ` in ${job.location}` : ""}. ${(job.description || "").slice(0, 140).replace(/\s+/g, " ").trim()}…`;
  const url = `https://astraahire.com/jobs/${job.slug || id}`;

  return {
    title,
    description: desc,
    openGraph: { title, description: desc, url, type: "article", siteName: "AstraaHire" },
    twitter: { card: "summary_large_image", title, description: desc },
    alternates: { canonical: url },
  };
}

export default function JobLayout({ children }: Props) {
  return children;
}
