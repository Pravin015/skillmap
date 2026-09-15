"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Closes any open <details> dropdown in the header when the route changes or the user clicks elsewhere. */
export function MenuAutoClose() {
  const pathname = usePathname();
  useEffect(() => {
    document.querySelectorAll<HTMLDetailsElement>("header details[open]").forEach((d) => { d.open = false; });
  }, [pathname]);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      document.querySelectorAll<HTMLDetailsElement>("header details[open]").forEach((d) => { if (!d.contains(e.target as Node)) d.open = false; });
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") document.querySelectorAll<HTMLDetailsElement>("header details[open]").forEach((d) => { d.open = false; }); };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("click", onClick); document.removeEventListener("keydown", onKey); };
  }, []);
  return null;
}
