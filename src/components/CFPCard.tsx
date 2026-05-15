import Link from "next/link";
import type { CFP, CfpCategory } from "@/lib/types";
import SubscribeButton from "./SubscribeButton";

function getDeadlineInfo(deadline: string) {
  const d = new Date(deadline);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: "Expired", cls: "expired", expired: true };
  if (diffDays === 0) return { label: "Due today!", cls: "urgent", expired: false };
  if (diffDays <= 7) return { label: `${diffDays}d left`, cls: "urgent", expired: false };
  if (diffDays <= 30) return { label: `${diffDays}d left`, cls: "soon", expired: false };
  return { label: `${diffDays}d left`, cls: "ok", expired: false };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function CFPCard({
  cfp,
  isLoggedIn = false,
}: {
  cfp: CFP;
  isLoggedIn?: boolean;
}) {
  const deadline = getDeadlineInfo(cfp.deadline);
  // Consistent premium dark gradient for multi-topic tickets
  const headerGradient = "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)";

  return (
    <div className="cfp-card ticket-card" style={{ 
      display: "flex", 
      flexDirection: "column", 
      padding: 0, 
      overflow: "hidden",
      border: "none",
      background: "var(--bg-card)",
      boxShadow: "var(--shadow-card)",
      height: "100%",
    }}>
      {/* Top Section: "The Ticket Header" */}
      <Link href={`/cfp/${cfp.id}`} style={{ textDecoration: "none" }}>
        <div style={{ 
          background: headerGradient, 
          padding: "20px 24px", 
          color: "white",
          position: "relative",
          borderBottom: "1px solid rgba(255,255,255,0.05)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, flex: 1 }}>
              {(cfp.categories ?? []).slice(0, 3).map(cat => (
                <span key={cat} style={{ 
                  fontSize: 9, 
                  fontWeight: 800, 
                  textTransform: "uppercase", 
                  letterSpacing: "0.02em",
                  background: "rgba(255,255,255,0.08)",
                  padding: "2px 6px",
                  borderRadius: 4,
                  color: "rgba(255,255,255,0.8)",
                  whiteSpace: "nowrap"
                }}>
                  {cat}
                </span>
              ))}
              {(cfp.categories ?? []).length > 3 && (
                <span style={{ 
                  fontSize: 9, 
                  fontWeight: 800, 
                  background: "rgba(255,255,255,0.05)",
                  padding: "2px 6px",
                  borderRadius: 4,
                  color: "rgba(255,255,255,0.5)"
                }}>
                  +{(cfp.categories ?? []).length - 3}
                </span>
              )}
            </div>
            <div className={`cfp-deadline-chip ${deadline.cls}`} style={{ 
              background: "rgba(255,255,255,0.95)", 
              color: deadline.cls === "urgent" ? "#dc2626" : "#0f172a",
              border: "none",
              fontSize: 11,
              fontWeight: 700,
              whiteSpace: "nowrap",
              padding: "2px 10px"
            }}>
              {deadline.label}
            </div>
          </div>
          <div style={{ minHeight: 48 }}>
            <h3 style={{ margin: 0, fontSize: 18, color: "white", lineHeight: 1.3 }}>{cfp.title}</h3>
          </div>
          <p style={{ margin: "4px 0 0", opacity: 0.8, fontSize: 13, fontWeight: 500 }}>{cfp.conference_name}</p>
        </div>
      </Link>

      {/* Perforation Line */}
      <div style={{ 
        height: 1, 
        borderTop: "2px dashed var(--border)", 
        margin: "0 12px", 
        position: "relative" 
      }}>
        <div style={{ position: "absolute", left: -20, top: -8, width: 16, height: 16, borderRadius: "50%", background: "var(--bg-primary)" }} />
        <div style={{ position: "absolute", right: -20, top: -8, width: 16, height: 16, borderRadius: "50%", background: "var(--bg-primary)" }} />
      </div>

      {/* Bottom Section: Details */}
      <div style={{ padding: "20px 24px 24px", flex: 1, display: "flex", flexDirection: "column" }}>
        <Link href={`/cfp/${cfp.id}`} style={{ textDecoration: "none", color: "inherit", flex: 1 }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 16px", marginBottom: 16, color: "var(--text-secondary)", fontSize: 13 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>📅 {formatDate(cfp.deadline)}</span>
            {cfp.location && <span style={{ display: "flex", alignItems: "center", gap: 6 }}>📍 {cfp.location}</span>}
            {cfp.is_virtual && <span className="badge badge-blue" style={{ fontSize: 10, padding: "2px 7px" }}>Virtual</span>}
          </div>
          
          {cfp.description && (
            <p style={{ 
              fontSize: 13, 
              color: "var(--text-secondary)", 
              lineHeight: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              marginBottom: 16
            }}>
              {cfp.description}
            </p>
          )}

          {cfp.tags && cfp.tags.length > 0 && (
            <div className="cfp-tags" style={{ marginBottom: 20 }}>
              {cfp.tags.slice(0, 3).map(tag => (
                <span key={tag} className="tag" style={{ background: "var(--bg-secondary)", border: "none" }}>#{tag}</span>
              ))}
              {cfp.tags.length > 3 && <span className="tag" style={{ background: "transparent", border: "none" }}>+{cfp.tags.length - 3}</span>}
            </div>
          )}
        </Link>

        {/* Footer Action */}
        {!deadline.expired && (
          <div style={{ 
            marginTop: "auto", 
            paddingTop: 16, 
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <SubscribeButton cfpId={cfp.id} isLoggedIn={isLoggedIn} deadline={cfp.deadline} compact />
            <Link href={`/cfp/${cfp.id}`} className="btn btn-secondary btn-sm" style={{ padding: "6px 12px", fontSize: 12 }}>
              Details →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
