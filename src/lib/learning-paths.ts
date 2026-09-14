/** Derived state of a learning-path step from its linked requirement. */
export function stepState(s: { requirement: { status: string } | null }) {
  if (!s.requirement) return "planned" as const;
  if (s.requirement.status === "COMPLETED") return "done" as const;
  if (s.requirement.status === "CANCELLED") return "cancelled" as const;
  if (s.requirement.status === "AWARDED") return "awarded" as const;
  return "open" as const;
}
export type StepState = ReturnType<typeof stepState>;
export const stepTone: Record<StepState, "neutral" | "lime" | "rose" | "amber" | "cyan"> = { planned: "neutral", done: "lime", cancelled: "rose", awarded: "amber", open: "cyan" };
export const stepLabel: Record<StepState, string> = { planned: "Not posted", done: "Completed", cancelled: "Cancelled", awarded: "Awarded", open: "Open" };
