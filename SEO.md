# CorpGurus SEO plan

Research done 14 September 2026. Sources: search results for "hire freelance corporate trainer India platform" and "corporate training marketplace India freelance trainers empanelment" (Glassdoor, Indeed, SimplyHired, Guru, FreelanceIndia, WorknHire, Trainopaedia, Freelance Trainings), and an on-page review of freelancetrainings.com, the closest Indian competitor.

## What the market searches for

Two audiences, two intents:

| Audience | Intent | Example queries |
|---|---|---|
| Companies / L&D | hire | hire corporate trainer, freelance corporate trainer India, corporate trainer near me, {skill} trainer {city}, corporate training marketplace India, empanelment of freelance trainers |
| Trainers | earn | freelance corporate trainer jobs, freelance trainer platform India, corporate trainer empanelment, freelance IT trainer, become a corporate trainer India |

The job boards (Glassdoor, Indeed, SimplyHired) own the "freelance corporate trainer jobs" phrase. The competitor Freelance Trainings ranks for "L&D marketplace" and "freelance trainers" but has a generic title tag ("Freelance Trainings - Home"), no city pages and category pages only for broad topics (Soft Skills, Leadership, Technology, AI). Nobody targets **skill × city** pages ("Kubernetes trainer Bengaluru", "PAN-OS trainer Pune"), which is exactly how L&D buyers search for technical training. That is the gap CorpGurus takes.

## Keyword map

| Page | Primary keyword | Secondary |
|---|---|---|
| Home `/` | hire freelance corporate trainers India | corporate trainer marketplace, verified corporate trainers, corporate training platform India |
| `/trainers` | freelance corporate trainers directory | corporate trainer near me, certified corporate trainers |
| `/requirements` | corporate training requirements | freelance trainer jobs India, training assignments for freelancers |
| `/hire/{skill}` | hire {skill} trainer, freelance {skill} trainer India | {skill} corporate training, {skill} training company India |
| `/hire/{skill}/{city}` | {skill} trainer {city} | corporate trainer {city}, {skill} training {city} |
| `/categories/{category}` | {category} corporate trainers | {category} training India |
| `/trainers/{slug}` | {name} corporate trainer | {headline}, {skills} |
| `/requirements/{id}` | {title} | JobPosting rich result |
| `/pricing` | corporate trainer platform pricing | no commission freelance trainers |
| `/signup` | become a freelance corporate trainer | trainer empanelment |

## What is implemented

- **Titles and descriptions** on every public page via `pageMeta()` in `src/lib/seo.ts`, with canonical URLs, Open Graph and Twitter cards. Default title: "CorpGurus · Hire verified freelance corporate trainers in India".
- **Structured data (JSON-LD)**: Organization + WebSite with SearchAction and FAQPage on the home page; ProfilePage/Person on trainer profiles; JobPosting on public open requirements; Organization on company pages; FAQPage + BreadcrumbList on landing pages; ContactPoint on the contact page.
- **Programmatic landing pages**: `/hire/{skill}` for every skill and `/hire/{skill}/{city}` for every skill × city pair with at least one trainer. Each has unique H1, intro, live trainer and requirement listings, an FAQ with real numbers, related skills and city links. They are cross-linked from the home page ("Popular searches"), category pages and the footer.
- **Sitemap** (`/sitemap.xml`) with trainers, companies, open requirements, categories, skill and skill × city pages, teams and legal pages. **robots.txt** disallows private areas.
- **Open Graph image** generated at `/opengraph-image`.
- **Semantic on-page**: one H1 per page carrying the primary keyword, H2s for sections, alt text on images, breadcrumbs on landing pages, internal links between skill, city, category and profile pages.
- **Performance basics** already in place: server-rendered pages, standalone build, security headers, PWA.

## Next steps (manual)

1. Set `NEXT_PUBLIC_APP_URL` to the production domain so canonicals, sitemap and JSON-LD carry real URLs.
2. Add the site to Google Search Console and Bing Webmaster Tools; submit `/sitemap.xml`.
3. Create a Google Business Profile for "CorpGurus, Bengaluru" and add its URL to `organizationLd().sameAs` along with LinkedIn and X profiles.
4. Publish 2 to 4 long-form articles a month from the feed (trainer stories, rate guides such as "What does a Kubernetes trainer cost in India in 2026?", certification explainers). These pages should link to the matching `/hire/{skill}` page.
5. Ask verified trainers to link their CorpGurus profile from LinkedIn; ask partner companies to link from their vendor pages.
6. Track rankings for the keyword map above monthly and add city pages for cities that appear in Search Console queries but have no trainers yet (post a requirement there to seed supply).
