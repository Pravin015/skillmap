import Razorpay from "razorpay";

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

export const PLANS = {
  CAREER_READY: {
    name: "Career Ready",
    amount: 29900, // ₹299 in paise
    currency: "INR",
    description: "SkillMap Career Ready — Monthly",
    features: [
      "Unlimited AI mentor conversations",
      "Full skill gap analysis",
      "Week-by-week prep roadmap",
      "Job alerts for your matches",
      "Progress tracking dashboard",
      "Priority support",
    ],
  },
  INSTITUTION: {
    name: "College / Bootcamp",
    amount: 0, // custom pricing
    currency: "INR",
    description: "SkillMap Institution Plan — Custom",
    features: [
      "Bulk student access",
      "Placement cell dashboard",
      "Batch progress analytics",
      "Custom company targeting",
      "Dedicated account manager",
      "White-label option",
    ],
  },
} as const;
