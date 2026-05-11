// Soft card with an icon square + title + body. For "What we stand for" style sections.
interface ValueCardProps {
  icon: React.ReactNode;
  title: string;
  body: string;
}

export default function ValueCard({ icon, title, body }: ValueCardProps) {
  return (
    <div className="card-soft">
      <div className="mega-menu-icon mb-4">{icon}</div>
      <h3 className="font-semibold mb-2 text-base" style={{ color: "var(--ink)" }}>{title}</h3>
      <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{body}</p>
    </div>
  );
}
