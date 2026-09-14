"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LANG_COOKIE, isLang } from "@/lib/i18n";

/** Footer language switcher. */
export async function setLang(fd: FormData) {
  const lang = String(fd.get("lang"));
  if (!isLang(lang)) return;
  const jar = await cookies();
  jar.set(LANG_COOKIE, lang, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
}
