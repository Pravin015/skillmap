import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const pwd = await bcrypt.hash("Demo@123", 12);

  console.log("🚀 Creating demo accounts...\n");

  // ═══ 1. STUDENT ═══
  const student = await prisma.user.upsert({
    where: { email: "student@demo.skillmap.com" },
    update: {},
    create: { name: "Aarav Sharma", email: "student@demo.skillmap.com", password: pwd, role: "STUDENT", phone: "+91 9876543210", degree: "B.Tech/BE", gradYear: "2025" },
  });
  await prisma.studentProfile.upsert({
    where: { userId: student.id },
    update: {},
    create: {
      userId: student.id, profileNumber: "SM26DEMO001",
      collegeName: "IIT Bombay", experienceLevel: "FRESHER", fieldOfInterest: "Cybersecurity",
      bio: "Final year B.Tech student passionate about cybersecurity. Looking for entry-level SOC analyst or penetration testing roles. Completed CEH certification and multiple CTF competitions.",
      academicScore: "8.5", academicType: "CGPA",
      salaryMin: 5, salaryMax: 10, availableToJoin: true, joinDate: "Immediately",
      skills: ["Python", "Network Security", "SIEM Tools", "Linux", "CompTIA Security+", "CEH", "SQL", "Penetration Testing"],
      githubUrl: "https://github.com/aarav-demo", linkedinUrl: "https://linkedin.com/in/aarav-demo",
      profileScore: 78,
    },
  });
  console.log("✅ Student: student@demo.skillmap.com / Demo@123");

  // ═══ 2. MENTOR ═══
  const mentor = await prisma.user.upsert({
    where: { email: "mentor@demo.skillmap.com" },
    update: {},
    create: { name: "Rajesh Nair", email: "mentor@demo.skillmap.com", password: pwd, role: "MENTOR", phone: "+91 9876543211" },
  });
  await prisma.mentorProfile.upsert({
    where: { userId: mentor.id },
    update: {},
    create: {
      userId: mentor.id, mentorNumber: "MN26DEMO001", status: "VERIFIED", verifiedAt: new Date(),
      headline: "Senior Cybersecurity Analyst at TCS — 8 years of experience in SOC operations and threat intelligence",
      bio: "I've spent 8 years in cybersecurity across TCS, Wipro, and a startup. I help fresh graduates understand what companies actually look for, how to crack interviews, and build the right skillset. I've mentored 120+ students and helped 40+ land their first cybersecurity job.",
      currentCompany: "TCS", currentRole: "Senior Cybersecurity Analyst", collegeName: "NIT Trichy",
      yearsOfExperience: 8, companiesWorked: ["TCS", "Wipro", "CyberArk"],
      areaOfExpertise: ["Cybersecurity", "SOC Operations", "Threat Intelligence", "Penetration Testing"],
      menteesHelped: 120, rating: 4.8, totalSessions: 200, compensation: "PAID",
      sessionRate: 500, groupSessionRate: 300, availability: "5 hours/week",
      mentorTopics: ["Interview Prep", "Career Guidance", "Resume Review", "CEH Preparation", "SOC Analyst Roadmap"],
      linkedinUrl: "https://linkedin.com/in/rajesh-nair-demo",
    },
  });
  console.log("✅ Mentor: mentor@demo.skillmap.com / Demo@123");

  // ═══ 3. HR ═══
  // First create company
  const company = await prisma.user.upsert({
    where: { email: "company@demo.skillmap.com" },
    update: {},
    create: { name: "TechCorp India", email: "company@demo.skillmap.com", password: pwd, role: "ORG", organisation: "TechCorp India", phone: "+91 9876543212" },
  });
  console.log("✅ Company: company@demo.skillmap.com / Demo@123");

  const hr = await prisma.user.upsert({
    where: { email: "hr@demo.skillmap.com" },
    update: {},
    create: { name: "Priya Kapoor", email: "hr@demo.skillmap.com", password: pwd, role: "HR", organisation: "TechCorp India", phone: "+91 9876543213" },
  });
  console.log("✅ HR: hr@demo.skillmap.com / Demo@123");

  // ═══ 4. INSTITUTION ═══
  const institution = await prisma.user.upsert({
    where: { email: "institution@demo.skillmap.com" },
    update: {},
    create: { name: "Delhi Technical University", email: "institution@demo.skillmap.com", password: pwd, role: "INSTITUTION", organisation: "Delhi Technical University", phone: "+91 9876543214" },
  });
  console.log("✅ Institution: institution@demo.skillmap.com / Demo@123");

  // ═══ 5. DUMMY JOB POSTS ═══
  const job1 = await prisma.jobPosting.create({
    data: {
      postedById: hr.id, title: "Cybersecurity Analyst L1", company: "TechCorp India",
      location: "Bangalore / Pune", workMode: "Hybrid", salaryMin: 5, salaryMax: 8,
      experienceLevel: "Fresher", urgency: "Within 15 days", jobType: "Full-time",
      domain: "Cybersecurity", department: "Security Operations",
      description: "We are looking for a L1 Cybersecurity Analyst to join our SOC team.\n\nResponsibilities:\n- Monitor security alerts and incidents\n- Perform initial triage of security events\n- Document and escalate security incidents\n- Assist in vulnerability assessments\n\nRequirements:\n- B.Tech in CS/IT or related field\n- Basic understanding of networking and security\n- Knowledge of SIEM tools (Splunk, QRadar)\n- CEH or CompTIA Security+ certification preferred\n- Good communication skills",
      skills: ["CompTIA Security+", "SIEM Tools", "Python", "Networking", "CEH"],
      perks: "Health insurance, WFH flexibility, learning budget, gym membership",
      deadline: new Date("2026-05-30"), openings: 5, status: "ACTIVE",
    },
  });

  const job2 = await prisma.jobPosting.create({
    data: {
      postedById: hr.id, title: "Full Stack Developer", company: "TechCorp India",
      location: "Bangalore", workMode: "Remote", salaryMin: 8, salaryMax: 15,
      experienceLevel: "1 year", urgency: "Urgent (ASAP)", jobType: "Full-time",
      domain: "Software Development", department: "Engineering",
      description: "Join our engineering team to build scalable web applications.\n\nResponsibilities:\n- Develop frontend using React/Next.js\n- Build backend APIs with Node.js\n- Database design and optimization\n- Code reviews and testing\n\nRequirements:\n- 1+ year experience in full-stack development\n- Proficiency in React, Node.js, TypeScript\n- Experience with PostgreSQL or MongoDB\n- Understanding of CI/CD pipelines",
      skills: ["React", "Node.js", "TypeScript", "PostgreSQL", "Next.js", "Docker"],
      perks: "Remote-first, stock options, conference budget",
      deadline: new Date("2026-05-15"), openings: 3, status: "ACTIVE",
    },
  });

  const job3 = await prisma.jobPosting.create({
    data: {
      postedById: hr.id, title: "Data Analyst Intern", company: "TechCorp India",
      location: "Mumbai / Remote", workMode: "Hybrid", salaryMin: 3, salaryMax: 5,
      experienceLevel: "Fresher", urgency: "Within 30 days", jobType: "Internship",
      domain: "Data & Analytics", department: "Business Intelligence",
      description: "6-month internship in our BI team.\n\nWhat you'll do:\n- Analyze business data and create dashboards\n- Write SQL queries for data extraction\n- Build Power BI reports\n- Present findings to stakeholders\n\nRequirements:\n- Final year student or recent graduate\n- Strong SQL skills\n- Experience with Power BI or Tableau\n- Basic Python for data analysis",
      skills: ["SQL", "Power BI", "Python", "Excel", "Statistics"],
      perks: "Stipend, PPO opportunity, mentorship",
      deadline: new Date("2026-06-15"), openings: 10, status: "ACTIVE",
    },
  });
  console.log("✅ 3 Job postings created");

  // ═══ 6. DUMMY APPLICATION ═══
  await prisma.application.upsert({
    where: { jobId_userId: { jobId: job1.id, userId: student.id } },
    update: {},
    create: { jobId: job1.id, userId: student.id, status: "INTERVIEW", scoreMatch: 72 },
  });
  console.log("✅ Student applied to Cybersecurity Analyst (status: INTERVIEW)");

  // ═══ 7. DUMMY EVENT ═══
  await prisma.event.create({
    data: {
      createdById: mentor.id, title: "Cybersecurity Career Roadmap 2026",
      description: "A comprehensive session on how to break into cybersecurity as a fresher in 2026.\n\nTopics covered:\n- Current job market landscape\n- Most in-demand certifications\n- Building your first home lab\n- Preparing for SOC analyst interviews\n- Common mistakes freshers make",
      agenda: "1. Introduction (10 min)\n2. Market overview (15 min)\n3. Certification roadmap (20 min)\n4. Home lab setup demo (15 min)\n5. Interview tips (15 min)\n6. Q&A (15 min)",
      benefits: "- Clear roadmap from zero to job-ready\n- Free resource list shared\n- Certificate of participation\n- Access to recording for 30 days",
      date: new Date("2026-04-25T18:00:00+05:30"), duration: "90 minutes",
      eventType: "VIRTUAL", pricing: "FREE", maxParticipants: 200,
      joinLink: "https://meet.google.com/demo-link-123",
      category: "Career Guidance", tags: ["cybersecurity", "fresher", "career"],
      status: "APPROVED", approvedAt: new Date(),
    },
  });

  await prisma.event.create({
    data: {
      createdById: mentor.id, title: "Resume Review Workshop — Cybersecurity Edition",
      description: "Get your cybersecurity resume reviewed live by an industry expert.\n\nBring your resume and get actionable feedback on:\n- Format and structure\n- Skills section optimization\n- Project descriptions\n- What recruiters actually look for",
      date: new Date("2026-05-02T19:00:00+05:30"), duration: "60 minutes",
      eventType: "VIRTUAL", pricing: "PAID", price: 19900, maxParticipants: 30,
      joinLink: "https://zoom.us/demo-paid-session",
      category: "Resume Review", tags: ["resume", "cybersecurity", "workshop"],
      status: "APPROVED", approvedAt: new Date(),
    },
  });
  console.log("✅ 2 Events created (1 free, 1 paid)");

  // ═══ 8. DUMMY BLOG POST ═══
  await prisma.blogPost.create({
    data: {
      slug: "top-5-cybersecurity-certifications-freshers-2026",
      title: "Top 5 Cybersecurity Certifications for Freshers in 2026",
      content: `<h2>Why Certifications Matter</h2>
<p>In cybersecurity, certifications carry significant weight — especially for freshers. They prove to employers that you have verified, structured knowledge even without years of experience.</p>

<h2>1. CompTIA Security+</h2>
<p>The gold standard entry-level cert. Covers network security, threats, cryptography, and identity management. Most SOC analyst job descriptions list this as "preferred" or "required."</p>
<p><strong>Difficulty:</strong> Moderate | <strong>Cost:</strong> ~$400 | <strong>Free prep:</strong> Professor Messer on YouTube</p>

<h2>2. CEH (Certified Ethical Hacker)</h2>
<p>Focuses on offensive security — penetration testing methodology, tools, and techniques. TCS, Wipro, and Infosys specifically ask for CEH in their cybersecurity JDs.</p>
<p><strong>Difficulty:</strong> Moderate-Hard | <strong>Cost:</strong> ~$1,200 | <strong>Alternative:</strong> eJPT by INE ($250)</p>

<h2>3. AWS Certified Cloud Practitioner</h2>
<p>Cloud security is the fastest-growing domain. This cert gives you a foundation in AWS services and security best practices. Many cybersecurity roles now require cloud knowledge.</p>

<h2>4. Google Cybersecurity Certificate</h2>
<p>Free on Coursera (audit mode). Covers SIEM, Linux, Python for security, and incident response. Perfect for absolute beginners with zero budget.</p>

<h2>5. OSCP (for ambitious freshers)</h2>
<p>The hardest cert on this list but the most respected. If you crack OSCP as a fresher, you'll stand out from 99% of applicants. Requires strong hands-on penetration testing skills.</p>

<h2>My Recommendation</h2>
<p>Start with <strong>CompTIA Security+</strong> → then <strong>CEH</strong> → then specialize based on your interest (cloud, pentesting, or SOC). Don't try to get all certs at once. Focus, certify, apply, repeat.</p>`,
      excerpt: "A practical guide to the most valuable cybersecurity certifications for fresh graduates in 2026, with cost, difficulty, and free prep resources for each.",
      authorId: mentor.id, authorName: "Rajesh Nair", authorRole: "MENTOR",
      status: "PUBLISHED", publishedAt: new Date(),
      tags: ["cybersecurity", "certifications", "career", "freshers"],
      category: "Skill Building", readTime: 5, views: 142,
    },
  });

  await prisma.blogPost.create({
    data: {
      slug: "how-we-hire-at-techcorp-india",
      title: "How We Hire at TechCorp India — An HR's Perspective",
      content: `<h2>Our Hiring Process</h2>
<p>At TechCorp India, we've streamlined our hiring to find the best talent efficiently. Here's exactly what happens when you apply.</p>

<h2>Stage 1: Application Screening</h2>
<p>We use SkillMap's AI matching to score every application. If your skill match is above 60%, you move to screening. We look at:</p>
<ul>
<li>Relevant skills matching the JD</li>
<li>Academic background</li>
<li>Certifications</li>
<li>Project experience on GitHub</li>
</ul>

<h2>Stage 2: Technical Assessment</h2>
<p>For technical roles, we use SkillMap's Lab module — a timed MCQ assessment. 10 questions, 30 minutes. You need 70% to pass.</p>

<h2>Stage 3: Technical Interview</h2>
<p>45-minute video call with a senior engineer. We test problem-solving, not memorized answers. Expect scenario-based questions.</p>

<h2>Stage 4: HR Round</h2>
<p>Cultural fit, salary expectations, joining timeline. This is where we check if you'll thrive in our team.</p>

<h2>Tips from Me</h2>
<p><strong>Do:</strong> Keep your SkillMap profile complete, add real projects, get certified.</p>
<p><strong>Don't:</strong> Apply to 100 jobs randomly. Target 5 companies, prepare deeply for each.</p>`,
      excerpt: "An insider look at TechCorp India's hiring process — from application to offer. Tips directly from our HR team.",
      authorId: hr.id, authorName: "Priya Kapoor", authorRole: "HR",
      status: "PUBLISHED", publishedAt: new Date(),
      tags: ["hiring", "interview", "tips", "hr-perspective"],
      category: "Industry Insights", readTime: 4, views: 89,
    },
  });
  console.log("✅ 2 Blog posts created");

  // ═══ 9. LAB TEMPLATE ═══
  const lab = await prisma.labTemplate.create({
    data: {
      title: "Cybersecurity Fundamentals", domain: "Cybersecurity",
      description: "Test your basic cybersecurity knowledge — network security, threats, encryption, and security tools.",
      difficulty: "EASY", timeLimit: 20, passingScore: 60, status: "PUBLISHED",
      createdById: company.id,
    },
  });

  const questions = [
    { q: "What does CIA stand for in cybersecurity?", a: "Confidentiality, Integrity, Availability", b: "Computer Intelligence Agency", c: "Cyber Investigation Authority", d: "Central Information Access", correct: "A", exp: "The CIA triad is the foundation of information security." },
    { q: "Which protocol is used for secure web browsing?", a: "HTTP", b: "FTP", c: "HTTPS", d: "SMTP", correct: "C", exp: "HTTPS uses TLS/SSL encryption for secure communication." },
    { q: "What type of attack involves sending fake emails to steal credentials?", a: "DDoS", b: "SQL Injection", c: "Phishing", d: "Man-in-the-middle", correct: "C", exp: "Phishing uses social engineering via deceptive emails." },
    { q: "What is the purpose of a firewall?", a: "Encrypt data", b: "Filter network traffic", c: "Store passwords", d: "Create backups", correct: "B", exp: "Firewalls monitor and filter incoming/outgoing network traffic." },
    { q: "Which tool is commonly used for network scanning?", a: "Photoshop", b: "Nmap", c: "Excel", d: "WordPress", correct: "B", exp: "Nmap is the most popular network scanning and discovery tool." },
    { q: "What does VPN stand for?", a: "Virtual Private Network", b: "Very Protected Node", c: "Verified Public Network", d: "Visual Processing Network", correct: "A", exp: "VPN creates an encrypted tunnel for secure internet access." },
    { q: "Which of these is a strong password?", a: "password123", b: "admin", c: "Xy9!mK2@pL", d: "12345678", correct: "C", exp: "Strong passwords use mix of uppercase, lowercase, numbers, and symbols." },
    { q: "What is SQL injection?", a: "A database backup method", b: "Inserting malicious SQL code into queries", c: "A programming language", d: "A network protocol", correct: "B", exp: "SQL injection exploits vulnerabilities in database queries." },
    { q: "What does SIEM stand for?", a: "Security Information and Event Management", b: "Secure Internet Email Management", c: "System Integration Enterprise Module", d: "Software Installation and Environment Manager", correct: "A", exp: "SIEM tools aggregate and analyze security logs and events." },
    { q: "Which encryption type uses the same key for encryption and decryption?", a: "Asymmetric", b: "Hashing", c: "Symmetric", d: "Quantum", correct: "C", exp: "Symmetric encryption (AES, DES) uses one shared key." },
  ];

  for (let i = 0; i < questions.length; i++) {
    await prisma.labProblem.create({
      data: {
        labTemplateId: lab.id, question: questions[i].q,
        optionA: questions[i].a, optionB: questions[i].b,
        optionC: questions[i].c, optionD: questions[i].d,
        correctAnswer: questions[i].correct, explanation: questions[i].exp, order: i + 1,
      },
    });
  }
  console.log("✅ Lab template 'Cybersecurity Fundamentals' with 10 MCQs created");

  // ═══ 10. SECOND STUDENT (for more realistic data) ═══
  const student2 = await prisma.user.upsert({
    where: { email: "student2@demo.skillmap.com" },
    update: {},
    create: { name: "Meera Patel", email: "student2@demo.skillmap.com", password: pwd, role: "STUDENT", phone: "+91 9876543215", degree: "BCA", gradYear: "2026" },
  });
  await prisma.studentProfile.upsert({
    where: { userId: student2.id },
    update: {},
    create: {
      userId: student2.id, profileNumber: "SM26DEMO002",
      collegeName: "Christ University", experienceLevel: "FRESHER", fieldOfInterest: "Data & Analytics",
      bio: "BCA student with a passion for data analytics. Skilled in SQL, Python, and Power BI. Looking for data analyst internships.",
      academicScore: "9.1", academicType: "CGPA",
      salaryMin: 3, salaryMax: 6, availableToJoin: true, joinDate: "30 days",
      skills: ["SQL", "Python", "Power BI", "Excel", "Statistics", "Tableau"],
      linkedinUrl: "https://linkedin.com/in/meera-demo",
      profileScore: 65,
    },
  });
  // Apply to data analyst job
  await prisma.application.upsert({
    where: { jobId_userId: { jobId: job3.id, userId: student2.id } },
    update: {},
    create: { jobId: job3.id, userId: student2.id, status: "APPLIED", scoreMatch: 85 },
  });
  console.log("✅ Student 2: student2@demo.skillmap.com / Demo@123 (applied to Data Analyst)");

  console.log("\n══════════════════════════════════════");
  console.log("  DEMO ACCOUNTS SUMMARY");
  console.log("══════════════════════════════════════");
  console.log("  Password for all: Demo@123\n");
  console.log("  🎓 Student:     student@demo.skillmap.com");
  console.log("  🎓 Student 2:   student2@demo.skillmap.com");
  console.log("  🧑‍🏫 Mentor:      mentor@demo.skillmap.com");
  console.log("  👥 HR:          hr@demo.skillmap.com");
  console.log("  🏢 Company:     company@demo.skillmap.com");
  console.log("  🏫 Institution: institution@demo.skillmap.com");
  console.log("  🛡️ Admin:       admin@skillmap.com / admin123");
  console.log("══════════════════════════════════════\n");
  console.log("  📋 3 Job postings (Cyber, FullStack, Data)");
  console.log("  📩 2 Applications (Aarav→Cyber, Meera→Data)");
  console.log("  🎤 2 Events (1 free, 1 paid)");
  console.log("  📝 2 Blog posts (by mentor + HR)");
  console.log("  🧪 1 Lab template (10 MCQs)");
  console.log("══════════════════════════════════════\n");
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
