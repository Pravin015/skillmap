// POST /api/competitions/[slug]/register
//
// Two-step flow when entryFee > 0:
//   1. Frontend POSTs without payment fields → we create a Razorpay
//      order, save a Payment row, return checkout details.
//   2. Frontend opens Razorpay checkout with those details. On success
//      it POSTs back with razorpay_order_id / payment_id / signature.
//      We verify the HMAC, mark Payment captured, register the user.
//
// Free competitions skip step 1 entirely and register straight away.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRazorpay } from "@/lib/razorpay";
import crypto from "crypto";

interface RegisterBody {
  teamName?: string | null;
  // Sent on the second call after Razorpay checkout completes:
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  const userEmail = (session?.user as { email?: string })?.email;
  const userName = (session?.user as { name?: string })?.name;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const body: RegisterBody = await req.json().catch(() => ({} as RegisterBody));
  const { teamName, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

  const competition = await prisma.competition.findUnique({
    where: { slug },
    include: { _count: { select: { participants: true } } },
  });

  if (!competition) return NextResponse.json({ error: "Competition not found" }, { status: 404 });
  if (competition.status !== "OPEN" && competition.status !== "LIVE") {
    return NextResponse.json({ error: "Registration is not open" }, { status: 400 });
  }
  if (new Date() > new Date(competition.registrationEnd)) {
    return NextResponse.json({ error: "Registration deadline has passed" }, { status: 400 });
  }
  if (competition._count.participants >= competition.maxParticipants) {
    return NextResponse.json({ error: "Competition is full" }, { status: 400 });
  }

  // Already registered? bail early.
  const existing = await prisma.competitionParticipant.findUnique({
    where: { competitionId_userId: { competitionId: competition.id, userId } },
  });
  if (existing) return NextResponse.json({ error: "Already registered" }, { status: 400 });

  const isPaid = competition.entryFee && competition.entryFee > 0;

  // ─── PAID FLOW ────────────────────────────────────────────────────
  if (isPaid) {
    // Step 2: payment proof submitted — verify and register.
    if (razorpay_order_id && razorpay_payment_id && razorpay_signature) {
      const expectedSig = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      const sigOk =
        expectedSig.length === razorpay_signature.length &&
        crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(razorpay_signature));
      if (!sigOk) {
        return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
      }

      // Pull the Payment record to confirm ownership + amount + intent.
      const payment = await prisma.payment.findUnique({ where: { razorpayOrderId: razorpay_order_id } });
      if (!payment) return NextResponse.json({ error: "Payment record missing" }, { status: 400 });
      if (payment.userId !== userId) {
        console.warn(`[competitions/register] User ${userId} tried to claim payment ${payment.id} owned by ${payment.userId}`);
        return NextResponse.json({ error: "Payment record missing" }, { status: 400 });
      }
      if (payment.amount !== competition.entryFee) {
        return NextResponse.json({ error: "Payment amount does not match entry fee" }, { status: 400 });
      }
      // Description carries the competition slug as the intent marker
      // ("competition:<slug>") — defeats reusing a subscription payment.
      if (payment.description !== `competition:${competition.slug}`) {
        return NextResponse.json({ error: "Payment is for a different purpose" }, { status: 400 });
      }

      // Atomic: capture payment + create participant.
      const [, participant] = await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: {
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            status: "CAPTURED",
          },
        }),
        prisma.competitionParticipant.create({
          data: {
            competitionId: competition.id,
            userId,
            teamName: teamName || null,
            role: competition.teamSize > 1 ? "TEAM_LEADER" : "INDIVIDUAL",
          },
        }),
      ]);

      return NextResponse.json({ participant }, { status: 201 });
    }

    // Step 1: no payment proof yet — create a Razorpay order and return
    // the checkout details for the frontend SDK to open.
    try {
      const order = await getRazorpay().orders.create({
        amount: competition.entryFee!,
        currency: "INR",
        receipt: `comp_${competition.id.slice(0, 8)}_${userId.slice(0, 8)}_${Date.now()}`,
        notes: {
          userId,
          competitionId: competition.id,
          competitionSlug: competition.slug,
          purpose: "competition_entry",
        },
      });

      await prisma.payment.create({
        data: {
          userId,
          razorpayOrderId: order.id,
          amount: competition.entryFee!,
          currency: "INR",
          status: "CREATED",
          plan: "FREE",
          description: `competition:${competition.slug}`,
          receipt: typeof order.receipt === "string" ? order.receipt : null,
        },
      });

      return NextResponse.json({
        requiresPayment: true,
        orderId: order.id,
        amount: competition.entryFee,
        currency: "INR",
        keyId: process.env.RAZORPAY_KEY_ID,
        name: userName,
        email: userEmail,
        title: competition.title,
      });
    } catch (err) {
      console.error("Competition payment-order creation failed:", err);
      return NextResponse.json({ error: "Couldn't initiate payment. Try again." }, { status: 500 });
    }
  }

  // ─── FREE FLOW ───────────────────────────────────────────────────
  const participant = await prisma.competitionParticipant.create({
    data: {
      competitionId: competition.id,
      userId,
      teamName: teamName || null,
      role: competition.teamSize > 1 ? "TEAM_LEADER" : "INDIVIDUAL",
    },
  });

  return NextResponse.json({ participant }, { status: 201 });
}
