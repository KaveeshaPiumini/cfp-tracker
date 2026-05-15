"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DatePicker from "./DatePicker";
import { CFP_CATEGORIES } from "@/lib/types";
import type { CFPFormData, CfpCategory } from "@/lib/types";

interface CFPFormProps {
  initialData?: CFPFormData;
  onSubmit: (data: CFPFormData) => Promise<void>;
  title: string;
  buttonText: string;
  isSubmitting?: boolean;
}

export default function CFPForm({
  initialData,
  onSubmit,
  title,
  buttonText,
  isSubmitting: externalSubmitting,
}: CFPFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<CFPFormData>(
    initialData ?? {
      title: "",
      conference_name: "",
      description: "",
      deadline: "",
      location: "",
      is_virtual: false,
      url: "",
      categories: [],
      tags: [],
    }
  );
  const [tagInput, setTagInput] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [internalSubmitting, setInternalSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitting = externalSubmitting ?? internalSubmitting;

  const set = (key: keyof CFPFormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (t && !form.tags.includes(t)) {
      set("tags", [...form.tags, t]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) =>
    set("tags", form.tags.filter((t) => t !== tag));

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInternalSubmitting(true);
    setError(null);
    try {
      await onSubmit(form);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setInternalSubmitting(false);
    }
  };

  return (
    <div className="form-page">
      <div className="form-page-header">
        <div
          className="hero-eyebrow"
          style={{ display: "inline-flex", marginBottom: 12 }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M5 1v8M1 5h8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          {title}
        </div>
        <h1>{buttonText === "Save Changes" ? "Edit CFP" : "Add a CFP"}</h1>
        <p>Share a Call for Papers with the community</p>
      </div>

      <div className="form-card">
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 24 }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            {/* Title + Conference */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Title <span className="required">*</span>
                </label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. Kubecon CFP 2025"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Conference Name <span className="required">*</span>
                </label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. KubeCon North America 2025"
                  value={form.conference_name}
                  onChange={(e) => set("conference_name", e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                placeholder="What topics are they looking for? Any special notes…"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>

            {/* Categories */}
            <div className="form-group" style={{ position: "relative" }}>
              <label className="form-label">
                Categories <span className="required">*</span>
              </label>
              
              {/* Dropdown Trigger */}
              <div 
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="form-input"
                style={{ 
                  minHeight: 46, 
                  height: "auto", 
                  display: "flex", 
                  flexWrap: "wrap", 
                  gap: 6, 
                  padding: "8px 12px",
                  cursor: "pointer",
                  paddingRight: 40,
                  position: "relative",
                  alignItems: "center"
                }}
              >
                {form.categories.length === 0 ? (
                  <span style={{ color: "var(--text-muted)" }}>Select categories…</span>
                ) : (
                  form.categories.map(cat => (
                    <span key={cat} className="badge badge-purple" style={{ 
                      textTransform: "none", 
                      fontSize: 12, 
                      padding: "2px 10px",
                      background: "var(--accent-glow)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6
                    }}>
                      {cat}
                      <span 
                        onClick={(e) => {
                          e.stopPropagation();
                          set("categories", form.categories.filter(c => c !== cat));
                        }}
                        style={{ cursor: "pointer", opacity: 0.7, fontSize: 14, fontWeight: 700 }}
                      >×</span>
                    </span>
                  ))
                )}
                <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", opacity: 0.5 }}>
                  {showCategoryDropdown ? "▲" : "▼"}
                </span>
              </div>

              {/* Dropdown Menu */}
              {showCategoryDropdown && (
                <>
                  <div 
                    style={{ position: "fixed", inset: 0, zIndex: 998 }} 
                    onClick={() => setShowCategoryDropdown(false)} 
                  />
                  <div style={{ 
                    position: "absolute", 
                    top: "calc(100% + 4px)", 
                    left: 0, 
                    right: 0, 
                    zIndex: 999, 
                    background: "#1e293b", 
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.1)",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                    maxHeight: 300,
                    overflowY: "auto",
                    padding: 8
                  }}>
                    {CFP_CATEGORIES.map((cat) => {
                      const active = (form.categories ?? []).includes(cat);
                      return (
                        <div
                          key={cat}
                          onClick={() => {
                            const next = active 
                              ? form.categories.filter(c => c !== cat)
                              : [...form.categories, cat];
                            set("categories", next);
                          }}
                          style={{ 
                            padding: "10px 12px",
                            borderRadius: 8,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            fontSize: 14,
                            background: active ? "rgba(59, 130, 246, 0.1)" : "transparent",
                            color: active ? "var(--accent-light)" : "var(--text-secondary)",
                            transition: "all 0.15s"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = active ? "rgba(59, 130, 246, 0.15)" : "rgba(255,255,255,0.05)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = active ? "rgba(59, 130, 246, 0.1)" : "transparent"}
                        >
                          <div style={{ 
                            width: 18, height: 18, borderRadius: 4, 
                            border: `2px solid ${active ? "var(--accent)" : "rgba(255,255,255,0.2)"}`,
                            background: active ? "var(--accent)" : "transparent",
                            display: "flex", alignItems: "center", justifyContent: "center"
                          }}>
                            {active && <span style={{ color: "white", fontSize: 12, fontWeight: 800 }}>✓</span>}
                          </div>
                          {cat}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Deadline + Location */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Submission Deadline <span className="required">*</span>
                </label>
                <DatePicker
                  value={form.deadline}
                  onChange={(val) => set("deadline", val)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. Atlanta, GA, USA"
                  value={form.location ?? ""}
                  disabled={form.is_virtual}
                  onChange={(e) => set("location", e.target.value)}
                />
              </div>
            </div>

            {/* Virtual toggle */}
            <label className="checkbox-group">
              <input
                type="checkbox"
                checked={form.is_virtual}
                onChange={(e) => {
                  set("is_virtual", e.target.checked);
                  if (e.target.checked) set("location", "");
                }}
              />
              <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                🌐 This is a virtual / online conference
              </span>
            </label>

            {/* URL */}
            <div className="form-group">
              <label className="form-label">CFP URL</label>
              <input
                className="form-input"
                type="url"
                placeholder="https://..."
                value={form.url ?? ""}
                onChange={(e) => set("url", e.target.value)}
              />
            </div>

            {/* Tags */}
            <div className="form-group">
              <label className="form-label">Tags</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Type a tag and press Enter (e.g. oidc, kubernetes)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={addTag}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={addTag}
                  style={{ flexShrink: 0 }}
                >
                  Add
                </button>
              </div>
              {form.tags.length > 0 && (
                <div className="cfp-tags" style={{ marginTop: 10 }}>
                  {form.tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="tag"
                      style={{
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        border: "none",
                        background: "rgba(255,255,255,0.07)",
                        color: "var(--text-secondary)",
                        fontFamily: "inherit",
                      }}
                    >
                      {tag} <span style={{ opacity: 0.6 }}>✕</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="form-submit-row">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => router.back()}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span
                      style={{
                        display: "inline-block",
                        width: 14,
                        height: 14,
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "white",
                        borderRadius: "50%",
                        animation: "spin 0.6s linear infinite",
                      }}
                    />
                    Saving…
                  </>
                ) : (
                  <>{buttonText} →</>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
