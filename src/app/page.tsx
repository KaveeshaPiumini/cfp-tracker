"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import CFPCard from "@/components/CFPCard";
import CFPFilter from "@/components/CFPFilter";
import type { CFP, SessionUser } from "@/lib/types";

interface FilterState {
  category: string;
  deadline: string;
  isVirtual: string;
  search: string;
}

const DEFAULT_FILTERS: FilterState = {
  category: "",
  deadline: "upcoming",
  isVirtual: "",
  search: "",
};

export default function Home() {
  const [cfps, setCfps] = useState<CFP[]>([]);
  const [allCount, setAllCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setUser(data.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoadingAuth(false));
  }, []);

  const displayName = user?.given_name 
    ? `${user.given_name} ${user.family_name ?? ""}`.trim()
    : user?.name ?? user?.email ?? user?.sub;

  const fetchCFPs = useCallback(async (f: FilterState) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (f.category) params.set("category", f.category);
      if (f.deadline) params.set("deadline", f.deadline);
      if (f.isVirtual) params.set("is_virtual", f.isVirtual);
      if (f.search) params.set("search", f.search);

      const [filtered, all] = await Promise.all([
        fetch(`/api/cfps?${params}`).then((r) => r.json()),
        fetch("/api/cfps").then((r) => r.json()),
      ]);
      setCfps(filtered);
      setAllCount(Array.isArray(all) ? all.length : 0);
    } catch (e) {
      setError("Failed to load CFPs. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCFPs(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce filter changes
  useEffect(() => {
    const timer = setTimeout(() => fetchCFPs(filters), 300);
    return () => clearTimeout(timer);
  }, [filters, fetchCFPs]);

  // Read error from URL (e.g. auth failure)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlError = urlParams.get("error");
    if (urlError) {
      setError(
        urlError === "auth_failed"
          ? "Authentication failed. Please try again."
          : `Authentication error: ${urlError}`
      );
      window.history.replaceState({}, "", "/");
    }
  }, []);

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        {!loadingAuth && user ? (
          <div style={{ height: 32 }} />
        ) : !loadingAuth && !user ? (
          <section className="hero">
            <div className="container">
              <div
                className="hero-eyebrow"
                style={{ display: "inline-flex", marginBottom: 20 }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="5.5" fill="currentColor" opacity="0.2"/>
                  <circle cx="6" cy="6" r="2" fill="currentColor"/>
                </svg>
                Open Community Platform
              </div>
              <h1>Discover Conference<br />Call for Papers</h1>
              <p>
                Find upcoming CFPs across IAM, security, AI, cloud, and more.
                Never miss a submission deadline.
              </p>

              {/* CTA */}
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <a href="/cfp/new" className="btn btn-primary">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Submit a CFP
                </a>
                <button
                  className="btn btn-secondary"
                  onClick={() =>
                    document
                      .getElementById("filter-section")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Browse All →
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className="hero" style={{ padding: "80px 0", minHeight: 400 }}>
            <div className="container">
              <div className="skeleton" style={{ width: 300, height: 60, margin: "0 auto 20px" }} />
              <div className="skeleton" style={{ width: 400, height: 20, margin: "0 auto" }} />
            </div>
          </section>
        )}

        {/* Main content */}
        <div className="container" id="filter-section">
          {/* Error banner */}
          {error && (
            <div className="alert alert-error" style={{ marginBottom: 24 }}>
              ⚠️ {error}
            </div>
          )}

          {/* Filters - Only show for logged in users to keep landing page clean */}
          {user && (
            <CFPFilter
              filters={filters}
              onFiltersChange={setFilters}
              totalCount={allCount}
              filteredCount={cfps.length}
            />
          )}

          {/* CFP Grid */}
          {loading ? (
            <div className="cfp-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton skeleton-card" />
              ))}
            </div>
          ) : cfps.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">📭</span>
              <h3>No CFPs found</h3>
              <p>
                {allCount === 0
                  ? "There are no CFPs yet. Be the first to submit one!"
                  : "No CFPs match your current filters. Try adjusting them to see more results."}
              </p>
              <a href="/cfp/new" className="btn btn-primary">
                + Submit a CFP
              </a>
            </div>
          ) : (
            <div className="cfp-grid">
              {cfps.map((cfp, i) => (
                <div
                  key={cfp.id}
                  className="fade-in-up"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <CFPCard cfp={cfp} isLoggedIn={!!user} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--border)",
          padding: "28px 0",
          textAlign: "center",
          color: "var(--text-muted)",
          fontSize: 13,
        }}
      >
        <div className="container">
          CFP Tracker · Powered by WSO2 Thunder ⚡ · Built with Next.js & Supabase
        </div>
      </footer>
    </>
  );
}
