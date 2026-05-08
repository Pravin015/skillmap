// Server-side metadata for course detail pages.
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const course = await prisma.course
    .findUnique({
      where: { slug },
      select: { title: true, description: true, coverImageUrl: true, difficulty: true, duration: true, _count: { select: { modules: true } } },
    })
    .catch(() => null);

  if (!course) return { title: "Course — AstraaHire" };

  const title = `${course.title} — AstraaHire`;
  const desc = `${course.difficulty} · ${course._count.modules} modules${course.duration ? ` · ${course.duration}` : ""}. ${(course.description || "").slice(0, 140).replace(/\s+/g, " ").trim()}…`;
  const url = `https://astraahire.com/courses/${slug}`;

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      url,
      type: "website",
      siteName: "AstraaHire",
      ...(course.coverImageUrl ? { images: [{ url: course.coverImageUrl }] } : {}),
    },
    twitter: { card: "summary_large_image", title, description: desc, ...(course.coverImageUrl ? { images: [course.coverImageUrl] } : {}) },
    alternates: { canonical: url },
  };
}

export default function CourseLayout({ children }: Props) {
  return children;
}
