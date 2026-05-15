import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import SubscribeButton from "@/components/SubscribeButton";
import { getCategoryClass, formatDate, daysUntil } from "@/lib/utils";
import { getSessionUser } from "@/lib/session";
import type { CFP } from "@/lib/types";

async function getCFP(id: string): Promise<CFP | null> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/cfps/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function CFPDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [cfp, user] = await Promise.all([getCFP(id), getSessionUser()]);

  if (!cfp) notFound();

  const isOwner = user && cfp.submitted_by === user.sub;

  const days = daysUntil(cfp.deadline);
  
  const deadlineChip = () => {
    if (days < 0)
      return { label: "Expired", cls: "badge badge-muted" };
    if (days === 0)
      return { label: "Due today!", cls: "badge badge-red" };
    if (days <= 7)
      return { label: `${days} days left`, cls: "badge badge-red" };
    if (days <= 30)
      return { label: `${days} days left`, cls: "badge badge-orange" };
    return { label: `${days} days left`, cls: "badge badge-green" };
  };

  const chip = deadlineChip();

  return (
    <>
      <Header />
      <div className="detail-page">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              color: "var(--text-muted)",
              transition: "color 0.15s",
            }}
            className="back-link"
          >
            ← Back to all CFPs
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SubscribeButton cfpId={id} isLoggedIn={!!user} deadline={cfp.deadline} />
            {isOwner && (
              <Link
                href={`/cfp/${id}/edit`}
                className="btn btn-secondary btn-sm"
                style={{ padding: "6px 12px", gap: 6 }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M10.5 1.5l2 2L4 12H2v-2l8.5-8.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Edit CFP
              </Link>
            )}
          </div>
        </div>

        {/* Header */}
        <div className="detail-header">
          <div className="detail-meta">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(cfp.categories ?? []).map(cat => (
                <span key={cat} className="badge badge-purple">{cat}</span>
              ))}
            </div>
            <span className={chip.cls}>
              📅 {chip.label}
            </span>
            {cfp.is_virtual ? (
              <span className="badge badge-blue">🌐 Virtual</span>
            ) : cfp.location ? (
              <span className="badge badge-muted">📍 {cfp.location}</span>
            ) : null}
          </div>
          <h1 style={{ marginBottom: 8 }}>{cfp.title}</h1>
          <p
            style={{
              fontSize: 18,
              color: "var(--text-secondary)",
              fontWeight: 500,
            }}
          >
            {cfp.conference_name}
          </p>
        </div>

        {/* Info grid */}
        <div className="detail-section">
          <h2>Details</h2>
          <div className="detail-info-grid">
            <div className="detail-info-item">
              <span className="detail-info-label">Submission Deadline</span>
              <span className="detail-info-value">
                {formatDate(cfp.deadline)}
              </span>
            </div>
            <div className="detail-info-item">
              <span className="detail-info-label">Format</span>
              <span className="detail-info-value">
                {cfp.is_virtual ? "Virtual / Online" : cfp.location ?? "—"}
              </span>
            </div>
            <div className="detail-info-item">
              <span className="detail-info-label">Categories</span>
              <div className="detail-info-value" style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                {(cfp.categories ?? []).map(cat => (
                  <span key={cat} className="badge badge-muted" style={{ fontSize: 10 }}>{cat}</span>
                ))}
              </div>
            </div>
            <div className="detail-info-item">
              <span className="detail-info-label">Submitted</span>
              <span className="detail-info-value">
                {formatDate(cfp.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        {cfp.description && (
          <div className="detail-section">
            <h2>About this CFP</h2>
            <p>{cfp.description}</p>
          </div>
        )}

        {/* Tags */}
        {cfp.tags && cfp.tags.length > 0 && (
          <div className="detail-section">
            <h2>Tags</h2>
            <div className="cfp-tags" style={{ marginTop: 4 }}>
              {cfp.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}


        {/* CTA */}
        {cfp.url && (
          <div style={{ marginTop: 16 }}>
            <a
              href={cfp.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "14px 24px", fontSize: 15 }}
            >
              🚀 Submit to this CFP →
            </a>
          </div>
        )}
      </div>
    </>
  );
}
