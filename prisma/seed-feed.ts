import { PrismaClient } from "@prisma/client";

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600000);

/** Adds demo posts, likes, comments, reposts and follows for the seeded demo users. Safe to re-run: skips if posts exist. */
export async function seedFeed(db: PrismaClient) {
  if (await db.post.count()) { console.log("Feed already seeded, skipping."); return; }
  const byEmail = async (email: string) => {
    const u = await db.user.findUnique({ where: { email }, include: { membership: true } });
    if (!u) throw new Error(`seed-feed: missing user ${email}`);
    return u;
  };
  const ananya = await byEmail("ananya@corpgurus.demo");
  const rohit = await byEmail("rohit@corpgurus.demo");
  const sana = await byEmail("sana@corpgurus.demo");
  const vikram = await byEmail("vikram@corpgurus.demo");
  const priya = await byEmail("priya@corpgurus.demo");
  const karan = await byEmail("karan@corpgurus.demo");
  const meera = await byEmail("meera@skillbridge.demo");
  const sandeep = await byEmail("sandeep@skillbridge.demo");
  const rahul = await byEmail("rahul@techsphere.demo");
  const kavya = await byEmail("kavya@techsphere.demo");
  const lakshmi = await byEmail("lakshmi@quantumedge.demo");

  const mk = (u: { id: string; membership: { companyId: string } | null }, body: string, h: number, extra: Partial<{ imageUrl: string; docUrl: string; docName: string }> = {}) =>
    db.post.create({ data: { authorId: u.id, companyId: u.membership?.companyId ?? null, body, createdAt: hoursAgo(h), ...extra } });

  const p1 = await mk(ananya, "Wrapped a 3-day HPE VM Essentials 9.0 batch for a bank ops team yesterday. Two things that landed hardest:\n\n1. Running the VMware-to-HVM migration as a live lab instead of slides. The room went quiet in the good way.\n2. A one-page \"day-2 checklist\" they keep after the course.\n\nHappy to share the checklist template with other VME instructors here.", 30);
  const p2 = await mk(meera, "SkillBridge is now an authorised HPE training partner for the full GreenLake and VM Essentials track. We are staffing 40+ batches this quarter and looking for ASE-certified instructors in Mumbai, Delhi NCR and Bengaluru. Open requirements are on our company page.", 52);
  const p3 = await mk(rohit, "PAN-OS 11.2 tip for anyone teaching EDU-210: the App-ID cloud lookups are now on by default in the lab firewalls, which confuses learners when the policy hits differently on day 2. I disable it in the first hour and turn it on deliberately in the App-ID module.", 20);
  const p4 = await mk(sana, "Passed the AWS Solutions Architect Professional recert this morning. Third time renewing it, and the IaC questions get better every cycle. If you teach AWS, the new exam guide is worth a read even if you are not sitting it.", 8);
  const p5 = await mk(vikram, "Question for other leadership facilitators: do you insist on a pre-programme call with each participant's manager? I do, and it roughly doubles what sticks. But it adds a week to scheduling and some L&D teams push back. Curious how others handle it.", 14);
  const p6 = await mk(kavya, "TechSphere Academy is hiring freelance instructors for a Generative AI for Business Analysts series across Bengaluru and Pune. Two-day workshops, 30 participants each, enterprise Copilot licences provided. Requirement is live, apply on the platform rather than in comments please.", 26);
  const p7 = await mk(priya, "Built a shared prompt library for a BA cohort last week: requirements drafting, test-case generation, meeting synthesis. The team is still using it a week later, which is the only metric I care about for GenAI training.", 44);
  const p8 = await mk(karan, "PMP exam changes coming in Q1. I have updated my 35-hour contact course to the new ECO weighting. Outline attached for anyone comparing.", 60, { docUrl: "/uploads/demo/pmp-course-outline.pdf", docName: "PMP 35h course outline (2027 ECO).pdf" });
  const p9 = await mk(lakshmi, "Quantum Edge just completed its 50th cloud bootcamp. Thank you to every freelance instructor who delivered with us this year. Ratings across all batches: 4.7 out of 5.", 70);
  await mk(sandeep, "Repeat client wants Aruba campus switching again next month, invite-only requirement is up for instructors who have delivered Aruba for us before.", 12);

  const like = (post: { id: string }, users: { id: string }[]) => db.postLike.createMany({ data: users.map((u) => ({ postId: post.id, userId: u.id })), skipDuplicates: true });
  await like(p1, [rohit, sana, meera, sandeep, priya, karan]);
  await like(p2, [ananya, rohit, karan]);
  await like(p3, [ananya, kavya, rahul]);
  await like(p4, [ananya, priya, lakshmi, meera]);
  await like(p5, [rahul, meera, priya]);
  await like(p7, [kavya, rahul, ananya]);
  await like(p9, [sana, ananya, karan]);
  await like(p6, [priya, sana]);
  await like(p8, [vikram, rahul]);

  const cmt = (post: { id: string }, u: { id: string }, body: string, h: number) => db.postComment.create({ data: { postId: post.id, authorId: u.id, body, createdAt: hoursAgo(h) } });
  await cmt(p1, sandeep, "The bank's ops lead mentioned the checklist unprompted on the feedback call. Keep doing that.", 28);
  await cmt(p1, rohit, "Would love the template. Doing something similar for firewall cutovers.", 27);
  await cmt(p1, ananya, "Sending it over, Rohit.", 26);
  await cmt(p5, meera, "We ask for it on every leadership programme now. The pushback drops once the client sees the first cohort's retention.", 13);
  await cmt(p5, rahul, "Honest answer: we skipped it once to save a week and regretted it.", 11);
  await cmt(p3, kavya, "This is exactly the confusion we hit last batch. Thank you.", 18);
  await cmt(p4, ananya, "Congratulations Sana.", 7);

  await db.post.create({ data: { authorId: meera.id, companyId: meera.membership?.companyId, body: "This is the kind of instructor we want on every VME batch.", repostOfId: p1.id, createdAt: hoursAgo(25) } });
  await db.post.create({ data: { authorId: rahul.id, companyId: rahul.membership?.companyId, body: "", repostOfId: p7.id, createdAt: hoursAgo(40) } });

  const follow = (f: { id: string }, t: { id: string }) => db.follow.create({ data: { followerId: f.id, followingUserId: t.id } });
  const followCo = (f: { id: string }, companyId: string) => db.follow.create({ data: { followerId: f.id, companyId } });
  await Promise.all([
    follow(ananya, rohit), follow(ananya, sana), follow(ananya, vikram), follow(rohit, ananya), follow(sana, ananya), follow(priya, ananya), follow(karan, ananya), follow(meera, ananya), follow(sandeep, ananya),
    follow(kavya, rohit), follow(rahul, priya), follow(rahul, vikram), follow(lakshmi, sana), follow(meera, rohit), follow(priya, sana),
    followCo(ananya, meera.membership!.companyId), followCo(rohit, meera.membership!.companyId), followCo(rohit, rahul.membership!.companyId), followCo(sana, lakshmi.membership!.companyId), followCo(priya, rahul.membership!.companyId),
  ]);
  console.log("Feed seeded: 12 posts, likes, comments, 2 reposts, follows.");
}

if (require.main === module) {
  const db = new PrismaClient();
  seedFeed(db).catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
}
