export interface DomainInfo {
  roles: string[];
  skills: string[];
  interview: string;
  fresher_friendly: boolean;
  avg_package: string;
}

export interface Company {
  id: string;
  name: string;
  logo: string;
  domains: Record<string, DomainInfo>;
}

export interface Job {
  id: number;
  company: string;
  title: string;
  domain: string;
  location: string;
  posted: string;
  deadline: string;
  type: string;
  experience: string;
  active: boolean;
}

export interface UserProfile {
  name: string;
  degree: string;
  graduationYear: string;
  domain: string;
  domainKey: string;
  companies: string[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
