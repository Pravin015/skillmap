import LegalPage from "@/components/LegalPage";
import Link from "next/link";

const syne = "font-[family-name:var(--font-syne)]";

export default function AboutPage() {
  return (
    <LegalPage title="About SkillMap" lastUpdated="12 April 2026">
      <p>SkillMap is India&apos;s first job-readiness engine — a platform that tells fresh graduates exactly what skills they need to get hired at their dream companies, shows them live job openings, and gives them a personalised AI-powered preparation roadmap.</p>

      <h2>Our Mission</h2>
      <p>Every year, 10 million graduates leave Indian colleges with degrees but no direction. They don&apos;t know what companies actually want, which ones are hiring, or how to bridge the gap between where they are and where they want to be.</p>
      <p><strong>We exist to fix that.</strong></p>
      <p>SkillMap bridges the gap between education and employment by giving graduates clarity, direction, and a concrete path to their dream job.</p>

      <h2>What We Do</h2>
      <ul>
        <li><strong>Skill Mapping:</strong> We&apos;ve mapped 50+ top companies across India with exact skill requirements for each role and domain.</li>
        <li><strong>Live Job Matching:</strong> Students see only the jobs that match their profile — no noise, no irrelevant listings.</li>
        <li><strong>AI Career Advisor:</strong> Personalised week-by-week preparation plans powered by AI that knows your target companies and current skill level.</li>
        <li><strong>Mentor Connect:</strong> Verified industry professionals from top companies available for 1-on-1 guidance.</li>
        <li><strong>Hackathon-Based Hiring:</strong> Companies can create challenges to find and hire the best talent based on demonstrated skill.</li>
      </ul>

      <h2>Who We Serve</h2>
      <ul>
        <li><strong>Students & Graduates:</strong> From B.Tech to MBA, from tier-1 to tier-3 colleges — anyone preparing for their first or next career move.</li>
        <li><strong>Companies & HR Teams:</strong> Access pre-assessed, skill-mapped candidates. Post jobs, create hackathons, and hire smarter.</li>
        <li><strong>Industry Mentors:</strong> Share your experience, earn on your terms, and help the next generation of professionals.</li>
        <li><strong>Colleges & Institutions:</strong> Give your students a competitive edge with bulk access to skill maps and preparation tools.</li>
      </ul>

      <h2>Our Values</h2>
      <ul>
        <li><strong>Clarity over confusion:</strong> We tell you exactly what you need — no vague advice.</li>
        <li><strong>Honesty over hype:</strong> Realistic timelines, honest skill assessments, genuine outcomes.</li>
        <li><strong>Access over exclusivity:</strong> Free tier available to everyone. Premium at ₹299/month — less than a pizza.</li>
        <li><strong>India-first:</strong> Built for Indian graduates, Indian companies, Indian hiring patterns.</li>
      </ul>

      <h2>Contact Information</h2>
      <p><strong>Business Name:</strong> SkillMap</p>
      <p><strong>Website:</strong> ashpranix.in</p>
      <p><strong>Email:</strong> support@skillmap.com</p>
      <p><strong>Location:</strong> India</p>

      <div className="mt-8 flex gap-3 flex-wrap">
        <Link href="/forms/contact" className={`inline-block px-5 py-2.5 rounded-xl text-sm font-bold no-underline ${syne}`} style={{ background: "var(--primary)", color: "white" }}>Contact us</Link>
        <Link href="/forms/partner" className={`inline-block px-5 py-2.5 rounded-xl text-sm font-bold no-underline border ${syne}`} style={{ borderColor: "var(--border)", color: "var(--ink)" }}>Partner with us</Link>
      </div>
    </LegalPage>
  );
}
