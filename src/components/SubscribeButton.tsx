"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const PRESET_OPTIONS: { label: string; days: number }[] = [
  { label: "1 day before", days: 1 },
  { label: "2 days before", days: 2 },
  { label: "3 days before", days: 3 },
  { label: "5 days before", days: 5 },
  { label: "1 week before", days: 7 },
  { label: "10 days before", days: 10 },
  { label: "2 weeks before", days: 14 },
  { label: "15 days before", days: 15 },
  { label: "1 month before", days: 30 },
];

interface SubscribeButtonProps {
  cfpId: string;
  isLoggedIn: boolean;
  deadline: string;
  compact?: boolean;
}

export default function SubscribeButton({ cfpId, isLoggedIn, deadline, compact = false }: SubscribeButtonProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  
  const [showModal, setShowModal] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [currentDays, setCurrentDays] = useState<number[]>([]);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) { setLoading(false); return; }
    fetch(`/api/cfps/${cfpId}/subscribe`)
      .then((r) => r.json())
      .then((d) => {
        setSubscribed(d.subscribed);
        setCurrentDays(d.notify_days ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [cfpId, isLoggedIn]);

  // Calculate days remaining
  const daysLeft = (() => {
    const d = new Date(deadline);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  })();

  function openModal() {
    const defaultVal = daysLeft >= 7 ? 7 : (daysLeft >= 1 ? daysLeft : 1);
    setSelectedDays(subscribed ? [...currentDays] : [defaultVal]); 
    setShowModal(true);
    setError(null);
  }

  function toggleDay(days: number) {
    if (days > daysLeft) return; // Prevent selecting past dates
    setSelectedDays(prev => 
      prev.includes(days) ? prev.filter(d => d !== days) : [...prev, days].sort((a,b) => a-b)
    );
  }

  function addCustomDay() {
    const d = parseInt(customInput);
    if (isNaN(d) || d < 1 || d > 365) return;
    if (d > daysLeft) {
      setError(`Cannot set a reminder for ${d} days before (only ${daysLeft} days remaining)`);
      return;
    }
    if (!selectedDays.includes(d)) {
      setSelectedDays(prev => [...prev, d].sort((a,b) => a-b));
    }
    setCustomInput("");
    setError(null);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/cfps/${cfpId}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notify_days: selectedDays }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setSubscribed(true);
      setCurrentDays(selectedDays);
      setShowModal(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function unsubscribe() {
    setSaving(true);
    try {
      await fetch(`/api/cfps/${cfpId}/subscribe`, { method: "DELETE" });
      setSubscribed(false);
      setCurrentDays([]);
      setShowModal(false);
    } catch (err) {}
    finally { setSaving(false); }
  }

  if (loading) return <div className="skeleton" style={{ width: 100, height: 32, borderRadius: 99 }} />;

  return (
    <>
      {isLoggedIn ? (
        <button
          id={subscribed ? "subscribe-edit-btn" : "subscribe-btn"}
          className="btn btn-secondary"
          onClick={openModal}
          style={compact ? {
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 12, padding: "4px 10px", borderRadius: 99,
            background: subscribed ? "var(--success-bg, #dcfce7)" : undefined,
            color: subscribed ? "var(--success-text, #166534)" : undefined,
            border: subscribed ? "1px solid var(--success-border, #bbf7d0)" : undefined,
          } : {
            display: "inline-flex", alignItems: "center", gap: 8,
            background: subscribed ? "var(--success-bg, #dcfce7)" : undefined,
            color: subscribed ? "var(--success-text, #166534)" : undefined,
            border: subscribed ? "1px solid var(--success-border, #bbf7d0)" : undefined,
          }}
        >
          {subscribed ? `✅ ${compact ? "Subscribed" : "Subscribed"}` : `🔔 ${compact ? "Remind me" : "Subscribe for reminders"}`}
          {subscribed && !compact && (
            <span style={{ fontSize: 12, opacity: 0.75 }}>
              ({currentDays.sort((a,b)=>a-b).map(d => d === 30 ? "1mo" : d === 14 ? "2wk" : d === 7 ? "1wk" : `${d}d`).join(", ")} before)
            </span>
          )}
        </button>
      ) : (
        <a
          href="/api/auth/login"
          className="btn btn-secondary"
          style={compact
            ? { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, padding: "4px 10px", borderRadius: 99, textDecoration: "none" }
            : { display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }
          }
        >
          🔔 {compact ? "Remind me" : "Subscribe for reminders"}
        </a>
      )}

      {/* Modal */}
      {showModal && mounted && createPortal(
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.75)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16,
            backdropFilter: "blur(4px)",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div
            style={{
              background: "#1e293b", // Distinct Slate background
              borderRadius: 16,
              padding: 28,
              width: "100%",
              maxWidth: 480,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "white",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, color: "white" }}>🔔 Reminder Settings</h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                  We'll email you before the deadline.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 28, color: "rgba(255,255,255,0.4)", lineHeight: 1, padding: 4 }}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Preset grid */}
            <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
              Remind me:
            </p>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "8px",
              marginBottom: 24
            }}>
              {PRESET_OPTIONS.map((opt) => {
                const active = selectedDays.includes(opt.days);
                const isPassed = opt.days > daysLeft;
                const shortLabel = opt.label.replace(" before", "");
                
                return (
                  <button
                    key={opt.days}
                    onClick={() => toggleDay(opt.days)}
                    disabled={isPassed}
                    title={isPassed ? `This day has already passed (${daysLeft} days left)` : ""}
                    style={{
                      padding: "10px 4px",
                      borderRadius: 8,
                      border: `1px solid ${active ? "var(--accent)" : "rgba(255,255,255,0.1)"}`,
                      background: active ? "rgba(99, 102, 241, 0.2)" : "rgba(255,255,255,0.03)",
                      color: active ? "#818cf8" : isPassed ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)",
                      cursor: isPassed ? "not-allowed" : "pointer",
                      opacity: isPassed ? 0.4 : 1,
                      fontSize: 12,
                      fontWeight: active ? 600 : 500,
                      transition: "all 0.2s ease",
                      textAlign: "center",
                    }}
                  >
                    {shortLabel}
                  </button>
                );
              })}
            </div>

            {/* Custom input */}
            <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
              Custom (days):
            </p>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <input
                type="number"
                min={1}
                max={365}
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomDay()}
                placeholder="e.g. 45"
                className="form-input"
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  fontSize: 14,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "white",
                  borderRadius: 8
                }}
                id="subscribe-custom-days"
              />
              <button
                onClick={addCustomDay}
                className="btn btn-secondary btn-sm"
                style={{ flexShrink: 0, padding: "0 16px" }}
              >
                + Add
              </button>
            </div>

            {/* Selected summary */}
            {selectedDays.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 24 }}>
                {selectedDays.map((d) => (
                  <span
                    key={d}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      background: "rgba(99, 102, 241, 0.15)",
                      color: "#818cf8",
                      borderRadius: 99,
                      padding: "4px 12px",
                      fontSize: 11,
                      fontWeight: 600,
                      border: "1px solid rgba(99, 102, 241, 0.2)",
                    }}
                  >
                    {d === 30 ? "1 month" : d === 14 ? "2 weeks" : d === 7 ? "1 week" : `${d} day${d === 1 ? "" : "s"}`} before
                    <button
                      onClick={() => toggleDay(d)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 18, lineHeight: 1, color: "#818cf8", marginLeft: 4 }}
                      aria-label={`Remove ${d} days`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {error && (
              <p style={{ color: "#ef4444", fontSize: 13, margin: "0 0 16px" }}>
                ⚠️ {error}
              </p>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 20 }}>
              {subscribed && (
                <button
                  onClick={unsubscribe}
                  className="btn btn-secondary btn-sm"
                  disabled={saving}
                  style={{ color: "#ef4444", borderColor: "rgba(239,68,68,0.2)" }}
                  id="unsubscribe-btn"
                >
                  {saving ? "..." : "Unsubscribe"}
                </button>
              )}
              <button onClick={() => setShowModal(false)} className="btn btn-secondary btn-sm" disabled={saving}>
                Cancel
              </button>
              <button
                onClick={save}
                className="btn btn-primary btn-sm"
                disabled={saving || selectedDays.length === 0}
                style={{ padding: "8px 20px" }}
                id="subscribe-save-btn"
              >
                {saving ? "Saving…" : subscribed ? "Update" : "Subscribe"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
