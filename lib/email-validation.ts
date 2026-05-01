const blockedDomains = [
  "gmail.com", "googlemail.com",
  "yahoo.com", "yahoo.co.in", "yahoo.in",
  "hotmail.com", "outlook.com", "live.com", "msn.com",
  "aol.com", "icloud.com", "me.com", "mac.com",
  "protonmail.com", "proton.me",
  "zoho.com", "zohomail.com",
  "yandex.com", "yandex.ru",
  "mail.com", "email.com",
  "gmx.com", "gmx.net",
  "rediffmail.com", "rediff.com",
  "tutanota.com", "tuta.io",
  "fastmail.com",
  "hey.com",
  "inbox.com",
  "mail.ru",
];

export function isOfficialEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return !blockedDomains.includes(domain);
}

export function getEmailDomain(email: string): string {
  return email.split("@")[1]?.toLowerCase() || "";
}

export function getOfficialEmailError(email: string): string | null {
  if (!email) return null;
  if (!email.includes("@")) return "Please enter a valid email";
  if (!isOfficialEmail(email)) {
    return "Please use your official company/organisation email. Personal emails (Gmail, Yahoo, etc.) are not accepted.";
  }
  return null;
}
