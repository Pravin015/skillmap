// Server-side metadata for mentor profile pages.
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ mentorNumber: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: { params: Promise<{ mentorNumber: string }> }): Promise<Metadata> {
  const { mentorNumber } = await params;
  const mentor = await prisma.mentorProfile
    .findUnique({
      where: { mentorNumber },
      select: {
        headline: true,
        bio: true,
        currentCompany: true,
        currentRole: true,
        areaOfExpertise: true,
        user: { select: { name: true, profileImage: true } },
      },
    })
    .catch(() => null);

  if (!mentor) return { title: "Mentor — AstraaHire" };

  const role = mentor.currentRole && mentor.currentCompany ? `${mentor.currentRole} at ${mentor.currentCompany}` : "verified mentor";
  const title = `${mentor.user.name} — ${role} | AstraaHire`;
  const desc = mentor.headline || mentor.bio || `${role}. Expertise: ${mentor.areaOfExpertise.slice(0, 4).join(", ")}.`;
  const url = `https://astraahire.com/mentor/${mentorNumber}`;

  return {
    title,
    description: desc.slice(0, 200),
    openGraph: {
      title,
      description: desc.slice(0, 200),
      url,
      type: "profile",
      siteName: "AstraaHire",
      ...(mentor.user.profileImage ? { images: [{ url: mentor.user.profileImage }] } : {}),
    },
    twitter: { card: "summary", title, description: desc.slice(0, 200) },
    alternates: { canonical: url },
  };
}

export default function MentorLayout({ children }: Props) {
  return children;
}
