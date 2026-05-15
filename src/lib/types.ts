// CFP Category enum matching Supabase DB
export const CFP_CATEGORIES = [
  "Identity & Access Management",
  "OAuth / OIDC / SSO",
  "Zero Trust & Authorization",
  "AI / Machine Learning",
  "Security & Privacy",
  "Web Development",
  "DevOps & Infrastructure",
  "Cloud Computing",
  "Mobile Development",
  "Data Engineering",
  "Open Source",
  "Programming Languages",
  "Networking",
  "Other",
] as const;

export type CfpCategory = (typeof CFP_CATEGORIES)[number];

export interface CFP {
  id: string;
  title: string;
  conference_name: string;
  description: string | null;
  deadline: string; // ISO date string
  location: string | null;
  is_virtual: boolean;
  url: string | null;
  categories: CfpCategory[];
  tags: string[];
  submitted_by: string | null;
  created_at: string;
}

export interface CFPFormData {
  title: string;
  conference_name: string;
  description?: string;
  deadline: string;
  location?: string;
  is_virtual: boolean;
  url?: string;
  categories: CfpCategory[];
  tags: string[];
}

export interface SessionUser {
  sub: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export interface SessionData {
  user?: SessionUser;
  accessToken?: string;
}

export interface CfpSubscription {
  id: string;
  cfp_id: string;
  user_id: string;
  user_email: string;
  notify_days: number[];
  created_at: string;
}
