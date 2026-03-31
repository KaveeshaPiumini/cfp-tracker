"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      applyTheme("system");
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (localStorage.getItem("theme") === "system" || !localStorage.getItem("theme")) {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const applyTheme = (t: Theme) => {
    let resolvedTheme = t;
    if (t === "system") {
      resolvedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    document.documentElement.setAttribute("data-theme", resolvedTheme);
  };

  const handleToggle = () => {
    const themes: Theme[] = ["light", "dark", "system"];
    const nextTheme = themes[(themes.indexOf(theme) + 1) % themes.length];
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    applyTheme(nextTheme);
  };

  const getIcon = () => {
    if (theme === "light") return "☀️";
    if (theme === "dark") return "🌙";
    return "🖥️";
  };

  const getLabel = () => {
    if (theme === "light") return "Light";
    if (theme === "dark") return "Dark";
    return "System";
  };

  return (
    <button
      onClick={handleToggle}
      className="btn btn-secondary btn-sm theme-toggle-btn"
      title={`Theme: ${getLabel()}`}
      style={{
        minWidth: 40,
        height: 36,
        padding: "0 10px",
        fontSize: 16,
        display: "flex",
        alignItems: "center",
        gap: 8,
        borderRadius: 20,
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        color: "var(--text-primary)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}
    >
      <span>{getIcon()}</span>
      <span style={{ fontSize: 12, fontWeight: 600 }}>{getLabel()}</span>
    </button>
  );
}
