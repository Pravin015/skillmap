import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";

/**
 * Interface language. English is the source of truth; Hindi covers the shell, home page, sign-in/sign-up
 * and the most common labels. Untranslated keys fall back to English so nothing ever renders blank.
 * Stored in the `cg_lang` cookie (one year), switchable from the footer.
 */
export const LANGS = { en: "English", hi: "हिन्दी" } as const;
export type Lang = keyof typeof LANGS;
export const LANG_COOKIE = "cg_lang";

const en = {
  // shell
  "nav.feed": "Feed", "nav.trainers": "Trainers", "nav.requirements": "Requirements", "nav.companies": "Companies", "nav.categories": "Categories", "nav.pricing": "Pricing",
  "nav.signin": "Sign in", "nav.join": "Join CorpGurus", "nav.dashboard": "Dashboard", "nav.messages": "Messages", "nav.network": "Network", "nav.settings": "Settings", "nav.signout": "Sign out", "nav.search": "Search trainers, requirements, companies",
  "footer.tagline": "The professional network for freelance corporate trainers.", "footer.language": "Language",
  // home
  "home.eyebrow": "The professional network for freelance corporate trainers",
  "home.title": "Hire verified corporate trainers. Or get hired by companies that value expertise.",
  "home.body": "Companies post training requirements with dates, delivery mode, participants and budget. Trainers ask questions in the open, apply with a rate and get shortlisted. Every profile carries certifications verified by CorpGurus and ratings from completed engagements.",
  "home.cta.post": "Post a requirement", "home.cta.join": "Join as a trainer",
  "home.bullet1": "Free to post your first requirements", "home.bullet2": "Certifications reviewed by our staff", "home.bullet3": "Day rates visible only to companies", "home.bullet4": "Two-way ratings after every engagement",
  "home.glance": "Platform at a glance", "home.stat.trainers": "Trainers", "home.stat.companies": "Companies & partners", "home.stat.open": "Open requirements", "home.stat.verified": "Verified certifications",
  "home.step.post": "Post", "home.step.post.b": "dates, mode, budget", "home.step.shortlist": "Shortlist", "home.step.shortlist.b": "compare applicants", "home.step.award": "Award", "home.step.award.b": "rate afterwards",
  "home.categories": "Browse by category", "home.categories.all": "All categories →", "home.open": "open",
  "home.f1.t": "Requirements, not job posts", "home.f1.b": "Dates, delivery mode, participants, budget and language are stated up front, so trainers can judge fit in seconds.",
  "home.f2.t": "Questions in the open", "home.f2.b": "Clarifications are public comments. The company answers once, every applicant benefits, and the best fit shows early.",
  "home.f3.t": "Verified, not self-declared", "home.f3.b": "Certifications are reviewed by CorpGurus staff and company email domains are verified. Badges mean something.",
  "home.f4.t": "Reputation that compounds", "home.f4.b": "Both sides rate each other after every completed engagement. Your history travels with you.",
  "home.latest.eyebrow": "Open now", "home.latest": "Latest training requirements", "home.latest.all": "All requirements →",
  "home.verified.eyebrow": "Verified", "home.verified": "Trainers companies keep rebooking", "home.verified.all": "Browse all →",
  "home.companies.eyebrow": "For companies and training partners", "home.companies.t": "Staff every batch from a bench you trust.", "home.companies.b": "Invite-only requirements for repeat clients, saved shortlists, and a team of recruiters on one company page. Training partners post without limits.", "home.companies.cta": "Create a company account",
  "home.trainers.eyebrow": "For trainers", "home.trainers.t": "Your certifications, verified. Your rate, respected.", "home.trainers.b": "Day rates are visible only to signed-in companies. Apply with a proposed rate and hear back promptly when a batch is awarded.", "home.trainers.cta": "Build your profile",
  "home.hero.pre": "One marketplace.", "home.hero.em": "Hundreds of verified corporate trainers", "home.hero.post": "for any batch, anywhere in India.",
  "home.trusted": "Trusted by companies and training partners",
  "home.ways.eyebrow": "Two ways to hire", "home.ways.pre": "Find trainers", "home.ways.em": "for every kind of training,", "home.ways.post": "choose how you want to hire.",
  "home.journeys.pre": "One platform,", "home.journeys.em": "two simple journeys.",
  "home.cats.pre": "Find the perfect trainer.", "home.cats.em": "Whatever you're rolling out,", "home.cats.post": "someone here can deliver it.",
  "home.latest.pre": "Discover.", "home.latest.em": "The right requirement for any skill,", "home.latest.post": "on demand in one place.",
  "home.testi.pre": "Loved by companies and trainers.", "home.testi.em": "Testimonials",
  "home.quote.pre": "In their own words.", "home.quote.em": "Straight from the engagement.",
  "home.faq.pre": "All your questions,", "home.faq.em": "answered.",
  "home.blog.pre": "Explore updates and stories", "home.blog.em": "from the feed.",
  "home.help.pre": "Need help?", "home.help.em": "Get in touch.",
  "home.cta.pre": "Turn your training plans", "home.cta.em": "into delivered batches.",
  // auth
  "login.eyebrow": "Welcome back", "login.title": "Sign in to CorpGurus", "login.body": "Pick up where you left off.", "login.email": "Email", "login.password": "Password", "login.submit": "Sign in", "login.pending": "Signing in…", "login.new": "New here?", "login.create": "Create an account",
  // common
  "common.day": "day", "common.days": "days", "common.participants": "participants", "common.verified": "Verified", "common.apply": "Apply", "common.save": "Save", "common.cancel": "Cancel",
} as const;

export type TKey = keyof typeof en;

const hi: Partial<Record<TKey, string>> = {
  "nav.feed": "फ़ीड", "nav.trainers": "ट्रेनर", "nav.requirements": "आवश्यकताएँ", "nav.companies": "कंपनियाँ", "nav.categories": "श्रेणियाँ", "nav.pricing": "मूल्य",
  "nav.signin": "साइन इन", "nav.join": "CorpGurus से जुड़ें", "nav.dashboard": "डैशबोर्ड", "nav.messages": "संदेश", "nav.network": "नेटवर्क", "nav.settings": "सेटिंग्स", "nav.signout": "साइन आउट", "nav.search": "ट्रेनर, आवश्यकताएँ, कंपनियाँ खोजें",
  "footer.tagline": "फ्रीलांस कॉर्पोरेट ट्रेनरों का प्रोफ़ेशनल नेटवर्क।", "footer.language": "भाषा",
  "home.eyebrow": "फ्रीलांस कॉर्पोरेट ट्रेनरों का प्रोफ़ेशनल नेटवर्क",
  "home.title": "सत्यापित कॉर्पोरेट ट्रेनर हायर करें। या उन कंपनियों से काम पाएँ जो विशेषज्ञता की कद्र करती हैं।",
  "home.body": "कंपनियाँ तारीख़, डिलीवरी मोड, प्रतिभागी और बजट के साथ ट्रेनिंग की आवश्यकता पोस्ट करती हैं। ट्रेनर खुले में सवाल पूछते हैं, अपनी दर के साथ आवेदन करते हैं और शॉर्टलिस्ट होते हैं। हर प्रोफ़ाइल पर CorpGurus द्वारा सत्यापित प्रमाणपत्र और पूरे हुए असाइनमेंट की रेटिंग होती है।",
  "home.cta.post": "आवश्यकता पोस्ट करें", "home.cta.join": "ट्रेनर के रूप में जुड़ें",
  "home.bullet1": "पहली आवश्यकताएँ पोस्ट करना निःशुल्क", "home.bullet2": "प्रमाणपत्रों की समीक्षा हमारी टीम करती है", "home.bullet3": "दैनिक दर केवल कंपनियों को दिखती है", "home.bullet4": "हर असाइनमेंट के बाद दोतरफ़ा रेटिंग",
  "home.glance": "प्लेटफ़ॉर्म एक नज़र में", "home.stat.trainers": "ट्रेनर", "home.stat.companies": "कंपनियाँ और पार्टनर", "home.stat.open": "खुली आवश्यकताएँ", "home.stat.verified": "सत्यापित प्रमाणपत्र",
  "home.step.post": "पोस्ट", "home.step.post.b": "तारीख़, मोड, बजट", "home.step.shortlist": "शॉर्टलिस्ट", "home.step.shortlist.b": "आवेदकों की तुलना", "home.step.award": "अवार्ड", "home.step.award.b": "बाद में रेटिंग",
  "home.categories": "श्रेणी के अनुसार देखें", "home.categories.all": "सभी श्रेणियाँ →", "home.open": "खुली",
  "home.f1.t": "जॉब पोस्ट नहीं, आवश्यकताएँ", "home.f1.b": "तारीख़, डिलीवरी मोड, प्रतिभागी, बजट और भाषा पहले से स्पष्ट होते हैं, ताकि ट्रेनर सेकंडों में फ़िट परख सकें।",
  "home.f2.t": "सवाल खुले में", "home.f2.b": "स्पष्टीकरण सार्वजनिक टिप्पणियाँ हैं। कंपनी एक बार जवाब देती है, हर आवेदक को लाभ मिलता है और सही फ़िट जल्दी दिखता है।",
  "home.f3.t": "सत्यापित, स्व-घोषित नहीं", "home.f3.b": "प्रमाणपत्रों की समीक्षा CorpGurus की टीम करती है और कंपनी के ईमेल डोमेन सत्यापित होते हैं। बैज का मतलब होता है।",
  "home.f4.t": "प्रतिष्ठा जो बढ़ती जाती है", "home.f4.b": "हर पूरे असाइनमेंट के बाद दोनों पक्ष एक-दूसरे को रेट करते हैं। आपका इतिहास आपके साथ चलता है।",
  "home.latest.eyebrow": "अभी खुली", "home.latest": "नवीनतम ट्रेनिंग आवश्यकताएँ", "home.latest.all": "सभी आवश्यकताएँ →",
  "home.verified.eyebrow": "सत्यापित", "home.verified": "ट्रेनर जिन्हें कंपनियाँ बार-बार बुक करती हैं", "home.verified.all": "सभी देखें →",
  "home.companies.eyebrow": "कंपनियों और ट्रेनिंग पार्टनरों के लिए", "home.companies.t": "हर बैच के लिए भरोसेमंद बेंच से ट्रेनर चुनें।", "home.companies.b": "नियमित क्लाइंट के लिए केवल-आमंत्रण आवश्यकताएँ, सहेजी गई शॉर्टलिस्ट और एक कंपनी पेज पर रिक्रूटरों की टीम। ट्रेनिंग पार्टनर बिना सीमा के पोस्ट करते हैं।", "home.companies.cta": "कंपनी खाता बनाएँ",
  "home.trainers.eyebrow": "ट्रेनरों के लिए", "home.trainers.t": "आपके प्रमाणपत्र सत्यापित। आपकी दर का सम्मान।", "home.trainers.b": "दैनिक दर केवल साइन-इन की हुई कंपनियों को दिखती है। प्रस्तावित दर के साथ आवेदन करें और बैच अवार्ड होते ही जवाब पाएँ।", "home.trainers.cta": "अपनी प्रोफ़ाइल बनाएँ",
  "home.hero.pre": "एक मार्केटप्लेस।", "home.hero.em": "सैकड़ों सत्यापित कॉर्पोरेट ट्रेनर", "home.hero.post": "भारत में कहीं भी, किसी भी बैच के लिए।",
  "home.trusted": "कंपनियों और ट्रेनिंग पार्टनरों का भरोसा",
  "home.ways.eyebrow": "हायर करने के दो तरीके", "home.ways.pre": "ट्रेनर खोजें", "home.ways.em": "हर तरह की ट्रेनिंग के लिए,", "home.ways.post": "जैसे चाहें वैसे हायर करें।",
  "home.journeys.pre": "एक प्लेटफ़ॉर्म,", "home.journeys.em": "दो आसान रास्ते।",
  "home.cats.pre": "सही ट्रेनर खोजें।", "home.cats.em": "आप जो भी रोल आउट कर रहे हों,", "home.cats.post": "यहाँ कोई न कोई उसे डिलीवर कर सकता है।",
  "home.latest.pre": "खोजें।", "home.latest.em": "हर स्किल के लिए सही आवश्यकता,", "home.latest.post": "एक ही जगह पर।",
  "home.testi.pre": "कंपनियों और ट्रेनरों की पसंद।", "home.testi.em": "प्रशंसापत्र",
  "home.quote.pre": "उन्हीं के शब्दों में।", "home.quote.em": "सीधे असाइनमेंट से।",
  "home.faq.pre": "आपके सभी सवालों के", "home.faq.em": "जवाब।",
  "home.blog.pre": "फ़ीड से अपडेट और कहानियाँ", "home.blog.em": "देखें।",
  "home.help.pre": "मदद चाहिए?", "home.help.em": "संपर्क करें।",
  "home.cta.pre": "अपनी ट्रेनिंग योजनाओं को", "home.cta.em": "पूरे हुए बैच में बदलें।",
  "login.eyebrow": "फिर से स्वागत है", "login.title": "CorpGurus में साइन इन करें", "login.body": "जहाँ छोड़ा था वहीं से शुरू करें।", "login.email": "ईमेल", "login.password": "पासवर्ड", "login.submit": "साइन इन", "login.pending": "साइन इन हो रहा है…", "login.new": "नए हैं?", "login.create": "खाता बनाएँ",
  "common.day": "दिन", "common.days": "दिन", "common.participants": "प्रतिभागी", "common.verified": "सत्यापित", "common.apply": "आवेदन करें", "common.save": "सहेजें", "common.cancel": "रद्द करें",
};

const dictionaries: Record<Lang, Partial<Record<TKey, string>>> = { en, hi };

export const isLang = (v: string | undefined): v is Lang => !!v && v in LANGS;

/** Current interface language from the cookie (default English). */
export const getLang = cache(async (): Promise<Lang> => {
  const v = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(v) ? v : "en";
});

/** Translator bound to the current request's language. Usage: `const t = await getT(); t("nav.feed")`. */
export const getT = cache(async () => {
  const lang = await getLang();
  const dict = dictionaries[lang];
  return (key: TKey) => dict[key] ?? en[key];
});
