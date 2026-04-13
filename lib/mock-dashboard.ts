export const mockMentors = [
  { id: 1, name: "Anil Verma", company: "TCS", role: "Senior Cybersecurity Analyst", color: "#00b9f2", initials: "AV", experience: "8 years", rating: 4.9, sessions: 120 },
  { id: 2, name: "Meera Iyer", company: "KPMG", role: "Cyber Risk Manager", color: "#00338d", initials: "MI", experience: "6 years", rating: 4.8, sessions: 85 },
  { id: 3, name: "Rajesh Nair", company: "Deloitte", role: "Data & AI Lead", color: "#86bc25", initials: "RN", experience: "10 years", rating: 5.0, sessions: 200 },
];

export type ApplicationStatus = "Applied" | "Under Review" | "Interview" | "Rejected" | "Offer";

export const statusColors: Record<ApplicationStatus, string> = {
  Applied: "bg-blue-100 text-blue-700",
  "Under Review": "bg-yellow-100 text-yellow-700",
  Interview: "bg-[#E0F7F7] text-[#0ABFBC]",
  Rejected: "bg-red-100 text-red-700",
  Offer: "bg-green-100 text-green-700",
};

export const mockApplications = [
  { id: 1, company: "TCS", companyColor: "#00b9f2", role: "Cybersecurity Analyst L1", appliedDate: "2 Apr 2026", status: "Interview" as ApplicationStatus, round: "Technical Round 2" },
  { id: 2, company: "KPMG", companyColor: "#00338d", role: "Cyber Risk Analyst", appliedDate: "5 Apr 2026", status: "Under Review" as ApplicationStatus, round: "Screening" },
  { id: 3, company: "Deloitte", companyColor: "#86bc25", role: "Cyber Analyst", appliedDate: "28 Mar 2026", status: "Applied" as ApplicationStatus, round: "—" },
  { id: 4, company: "Infosys", companyColor: "#007cc3", role: "Systems Engineer", appliedDate: "15 Mar 2026", status: "Rejected" as ApplicationStatus, round: "Online Test" },
  { id: 5, company: "Wipro", companyColor: "#9b59b6", role: "Project Engineer", appliedDate: "10 Mar 2026", status: "Offer" as ApplicationStatus, round: "Completed" },
];

export const mockHRInterest = [
  { id: 1, name: "Sanjay Patel", company: "TCS", role: "HR Manager - Cybersecurity", color: "#00b9f2", initials: "SP", timestamp: "2 hours ago", message: "Viewed your profile and skill map" },
  { id: 2, name: "Deepa Krishnan", company: "Deloitte", role: "Campus Recruiter", color: "#86bc25", initials: "DK", timestamp: "1 day ago", message: "Interested in your cybersecurity certifications" },
  { id: 3, name: "Amit Gupta", company: "KPMG", role: "Talent Acquisition", color: "#00338d", initials: "AG", timestamp: "3 days ago", message: "Shortlisted for upcoming drive" },
];

export interface Course {
  id: number;
  name: string;
  platform: string;
  duration: string;
  skill: string;
  url: string;
  free: boolean;
}

export const coursesMap: Record<string, Course[]> = {
  cybersecurity: [
    { id: 1, name: "CompTIA Security+ Full Course", platform: "YouTube", duration: "12 hours", skill: "CompTIA Security+", url: "#", free: true },
    { id: 2, name: "Python for Cybersecurity", platform: "Coursera", duration: "6 weeks", skill: "Python scripting", url: "#", free: true },
    { id: 3, name: "CEH Certification Prep", platform: "Udemy", duration: "40 hours", skill: "CEH certification", url: "#", free: false },
    { id: 4, name: "SIEM Tools Fundamentals", platform: "YouTube", duration: "8 hours", skill: "SIEM tools", url: "#", free: true },
    { id: 5, name: "Network Security Basics", platform: "Coursera", duration: "4 weeks", skill: "Networking basics", url: "#", free: true },
  ],
  software: [
    { id: 1, name: "DSA with Java - Complete", platform: "YouTube", duration: "50 hours", skill: "Data Structures", url: "#", free: true },
    { id: 2, name: "System Design for Beginners", platform: "YouTube", duration: "15 hours", skill: "System Design", url: "#", free: true },
    { id: 3, name: "LeetCode Patterns", platform: "NeetCode", duration: "Self-paced", skill: "LeetCode 200+", url: "#", free: true },
    { id: 4, name: "Java Programming Masterclass", platform: "Udemy", duration: "80 hours", skill: "Java", url: "#", free: false },
    { id: 5, name: "OS Fundamentals", platform: "YouTube", duration: "10 hours", skill: "OS fundamentals", url: "#", free: true },
  ],
  cloud: [
    { id: 1, name: "AWS Cloud Practitioner", platform: "AWS Training", duration: "20 hours", skill: "AWS fundamentals", url: "#", free: true },
    { id: 2, name: "Linux for Beginners", platform: "YouTube", duration: "8 hours", skill: "Linux basics", url: "#", free: true },
    { id: 3, name: "Docker & Kubernetes Crash Course", platform: "YouTube", duration: "6 hours", skill: "Docker basics", url: "#", free: true },
    { id: 4, name: "Terraform Getting Started", platform: "HashiCorp Learn", duration: "10 hours", skill: "Terraform", url: "#", free: true },
    { id: 5, name: "Shell Scripting Bootcamp", platform: "Udemy", duration: "12 hours", skill: "Shell scripting", url: "#", free: false },
  ],
  data: [
    { id: 1, name: "SQL for Data Analysis", platform: "YouTube", duration: "10 hours", skill: "SQL", url: "#", free: true },
    { id: 2, name: "Python for Data Science", platform: "Coursera", duration: "8 weeks", skill: "Python basics", url: "#", free: true },
    { id: 3, name: "Power BI Dashboard Course", platform: "YouTube", duration: "6 hours", skill: "Power BI", url: "#", free: true },
    { id: 4, name: "Statistics & Probability", platform: "Khan Academy", duration: "Self-paced", skill: "Statistics", url: "#", free: true },
    { id: 5, name: "Excel Advanced Formulas", platform: "YouTube", duration: "5 hours", skill: "Excel", url: "#", free: true },
  ],
};

export const labFeatures = [
  { title: "Mock Interviews", desc: "AI-powered mock interviews tailored to your target company's format", icon: "🎤" },
  { title: "Live Coding Labs", desc: "Hands-on coding challenges matching real interview problems", icon: "💻" },
  { title: "Company-Specific Tests", desc: "Practice tests modelled after TCS NQT, HackWithInfy, Wipro NLTH", icon: "📝" },
  { title: "Group Discussion Prep", desc: "AI-moderated GD practice for consulting roles at KPMG, Deloitte", icon: "🗣️" },
];
