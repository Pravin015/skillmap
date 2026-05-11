import { COMPANY_COLORS } from "@/lib/data";

interface CompanyLogoProps {
  companyId: string;
  letter: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

export default function CompanyLogo({
  companyId,
  letter,
  size = "md",
}: CompanyLogoProps) {
  const color = COMPANY_COLORS[companyId] || "#6B7280";

  return (
    <div
      className={`${sizes[size]} flex items-center justify-center rounded-full font-bold text-white shrink-0`}
      style={{ backgroundColor: color }}
    >
      {letter}
    </div>
  );
}
