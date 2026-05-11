// /profile — server-side redirect router. The Header user dropdown
// links here for ALL roles. We resolve the right destination per role:
//   STUDENT      → /profile/[profileNumber]  (their public profile)
//                  or /profile/edit if they haven't created one
//   MENTOR       → /mentor/[mentorNumber]
//   HR/ORG/INSTITUTION/ADMIN → /profile/edit (no public profile)
//
// Without this page the dropdown 404'd.
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ProfileRedirect() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      profile: { select: { profileNumber: true } },
      mentorProfile: { select: { mentorNumber: true } },
    },
  });

  if (!user) redirect("/auth/login");

  // Student → public profile if it has a number, otherwise editor.
  if (user.role === "STUDENT") {
    if (user.profile?.profileNumber) {
      redirect(`/profile/${user.profile.profileNumber}`);
    }
    redirect("/profile/edit");
  }

  // Mentor → mentor profile page
  if (user.role === "MENTOR") {
    if (user.mentorProfile?.mentorNumber) {
      redirect(`/mentor/${user.mentorProfile.mentorNumber}`);
    }
    redirect("/profile/edit");
  }

  // HR / ORG / INSTITUTION / ADMIN — no public profile concept yet
  redirect("/profile/edit");
}
