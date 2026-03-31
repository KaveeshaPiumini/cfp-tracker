import type { CfpCategory } from "./types";

/**
 * Maps a CFP category to a CSS class for badge coloring.
 */
export function getCategoryClass(category: CfpCategory): string {
  const map: Record<string, string> = {
    "Identity & Access Management": "cat-iam",
    "OAuth / OIDC / SSO": "cat-oauth",
    "Zero Trust & Authorization": "cat-zerotrust",
    "AI / Machine Learning": "cat-ai",
    "Security & Privacy": "cat-security",
    "Web Development": "cat-web",
    "DevOps & Infrastructure": "cat-devops",
    "Cloud Computing": "cat-cloud",
  };
  return `badge ${map[category] ?? "cat-default"}`;
}

/**
 * Formats an ISO date string to a human-readable date.
 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Returns days remaining until deadline (negative if past).
 */
export function daysUntil(deadline: string): number {
  const d = new Date(deadline);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
