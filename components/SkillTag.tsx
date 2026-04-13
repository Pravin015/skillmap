interface SkillTagProps {
  skill: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  interactive?: boolean;
}

export default function SkillTag({
  skill,
  checked = false,
  onChange,
  interactive = false,
}: SkillTagProps) {
  if (interactive) {
    return (
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-sm transition-colors hover:bg-gray-50 select-none">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-gray-300 text-[#0ABFBC] focus:ring-[#0ABFBC]"
        />
        <span className={checked ? "text-[#0ABFBC] line-through" : "text-gray-700"}>
          {skill}
        </span>
      </label>
    );
  }

  return (
    <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
      {skill}
    </span>
  );
}
