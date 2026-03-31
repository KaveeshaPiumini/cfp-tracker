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
      category: "Identity & Access Management",
      tags: [],
    }
  );
  const [tagInput, setTagInput] = useState("");
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

            {/* Category */}
            <div className="form-group">
              <label className="form-label">
                Category <span className="required">*</span>
              </label>
              <select
                className="form-select"
                value={form.category}
                onChange={(e) => set("category", e.target.value as CfpCategory)}
                required
              >
                {CFP_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
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
