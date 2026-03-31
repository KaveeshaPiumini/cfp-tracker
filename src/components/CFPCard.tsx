import Link from "next/link";
import type { CFP } from "@/lib/types";
import { getCategoryClass } from "@/lib/utils";

function getDeadlineInfo(deadline: string) {
  const d = new Date(deadline);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: "Expired", cls: "expired" };
  if (diffDays === 0) return { label: "Due today!", cls: "urgent" };
  if (diffDays <= 7) return { label: `${diffDays}d left`, cls: "urgent" };
  if (diffDays <= 30) return { label: `${diffDays}d left`, cls: "soon" };
  return {
    label: `${diffDays}d left`,
    cls: "ok",
  };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function CFPCard({ cfp }: { cfp: CFP }) {
  const deadline = getDeadlineInfo(cfp.deadline);
  const catClass = getCategoryClass(cfp.category);

  return (
    <Link href={`/cfp/${cfp.id}`} className="cfp-card" style={{ textDecoration: "none" }}>
      {/* Header row */}
      <div className="cfp-card-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="cfp-card-title">{cfp.title}</h3>
        </div>
        <div
          className={`cfp-deadline-chip ${deadline.cls}`}
          style={{ flexShrink: 0 }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M5 3v2l1.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {deadline.label}
        </div>
      </div>

      {/* Conference name */}
      <div className="cfp-card-conference">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 1l1.5 3H11L8.5 6.5 9.5 10 6 8 2.5 10l1-3.5L1 5h3.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
        </svg>
        {cfp.conference_name}
        {cfp.is_virtual && (
          <span className="badge badge-blue" style={{ fontSize: 10, padding: "2px 7px" }}>
            Virtual
          </span>
        )}
        {cfp.location && !cfp.is_virtual && (
          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
            · {cfp.location}
          </span>
        )}
      </div>

      {/* Description */}
      {cfp.description && (
        <p className="cfp-card-description">{cfp.description}</p>
      )}

      {/* Meta: category + deadline date */}
      <div className="cfp-card-meta">
        <span className={`badge ${catClass}`}>{cfp.category}</span>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          📅 {formatDate(cfp.deadline)}
        </span>
      </div>

      {/* Tags */}
      {cfp.tags && cfp.tags.length > 0 && (
        <div className="cfp-tags">
          {cfp.tags.slice(0, 5).map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
          {cfp.tags.length > 5 && (
            <span className="tag">+{cfp.tags.length - 5}</span>
          )}
        </div>
      )}
    </Link>
  );
}
