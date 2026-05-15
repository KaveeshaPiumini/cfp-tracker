"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import type { SessionUser } from "@/lib/types";

export default function Header() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setUser(data.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const displayName = user?.given_name 
    ? `${user.given_name} ${user.family_name ?? ""}`.trim()
    : user?.name ?? user?.email ?? user?.sub;

  const initials = user?.given_name && user?.family_name
    ? (user.given_name[0] + user.family_name[0]).toUpperCase()
    : user?.given_name
    ? user.given_name[0].toUpperCase()
    : user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email
    ? user.email[0].toUpperCase()
    : "?";

  return (
    <header className="header">
      <div className="container header-inner">
        {/* Logo */}
        <Link href="/" className="header-logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="url(#grad)"/>
            <path d="M8 14h12M8 10h8M8 18h10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="28" y2="28">
                <stop stopColor="#3b82f6"/>
                <stop offset="1" stopColor="#60a5fa"/>
              </linearGradient>
            </defs>
          </svg>
          <span>CFP Tracker</span>
        </Link>

        {/* Actions */}
        <div className="header-actions">
          <div style={{ marginRight: 12, borderRight: "1px solid var(--border)", paddingRight: 12, display: "flex", alignItems: "center" }}>
            <ThemeToggle />
          </div>
          {loading ? (
            <div className="skeleton" style={{ width: 120, height: 36, borderRadius: 99 }} />
          ) : user ? (
            <>
              <div className="user-pill">
                <div className="user-avatar" style={{ padding: user.picture ? 0 : undefined, overflow: "hidden" }}>
                  {user.picture ? (
                    <img 
                      src={user.picture} 
                      alt={displayName} 
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    initials
                  )}
                </div>
                <span style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {displayName}
                </span>
              </div>
              <a href="/api/auth/logout" className="btn btn-secondary btn-sm">
                Sign Out
              </a>
            </>
          ) : (
            <>
              <a href="/api/auth/login" className="btn btn-primary btn-sm">
                Sign In
              </a>
            </>
          )}
        </div>
      </div>
    </header>

  );
}
