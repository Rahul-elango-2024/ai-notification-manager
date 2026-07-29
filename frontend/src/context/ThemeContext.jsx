import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

const API_URL = "http://localhost:5000";

const ACCENT_MAP = {
  blue: { primary: "#0284c7", hover: "#0369a1", active: "#075985", light: "rgba(2, 132, 199, 0.12)", border: "rgba(2, 132, 199, 0.3)" },
  green: { primary: "#10b981", hover: "#059669", active: "#047857", light: "rgba(16, 185, 129, 0.12)", border: "rgba(16, 185, 129, 0.3)" },
  purple: { primary: "#8b5cf6", hover: "#6d28d9", active: "#5b21b6", light: "rgba(139, 92, 246, 0.12)", border: "rgba(139, 92, 246, 0.3)" },
  orange: { primary: "#f59e0b", hover: "#d97706", active: "#b45309", light: "rgba(245, 158, 11, 0.12)", border: "rgba(245, 158, 11, 0.3)" },
  red: { primary: "#ef4444", hover: "#b91c1c", active: "#991b1b", light: "rgba(239, 68, 68, 0.12)", border: "rgba(239, 68, 68, 0.3)" },
  slate: { primary: "#64748b", hover: "#334155", active: "#1e293b", light: "rgba(100, 116, 139, 0.12)", border: "rgba(100, 116, 139, 0.3)" },
};

function resolveAccent(colorInput) {
  if (!colorInput) return ACCENT_MAP.blue;
  const key = colorInput.toLowerCase().trim();
  if (ACCENT_MAP[key]) return ACCENT_MAP[key];

  if (key === "#22c55e" || key === "#10b981") return ACCENT_MAP.green;
  if (key === "#a855f7" || key === "#8b5cf6") return ACCENT_MAP.purple;
  if (key === "#f97316" || key === "#f59e0b") return ACCENT_MAP.orange;
  if (key === "#ef4444") return ACCENT_MAP.red;
  if (key === "#64748b") return ACCENT_MAP.slate;

  return ACCENT_MAP.blue;
}

function applyThemeToDom(theme, accentColor, compactLayout) {
  const root = document.documentElement;

  // 1. Resolve Effective Theme (Dark / Light / System)
  let effectiveTheme = theme;
  if (theme === "system") {
    effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  if (!effectiveTheme) effectiveTheme = "dark";

  root.setAttribute("data-theme", effectiveTheme);
  root.setAttribute("data-compact", compactLayout ? "true" : "false");

  // 2. Resolve Accent Color Tokens (Strictly for interactive highlights, buttons, links, tabs, badges, progress bars)
  const accent = resolveAccent(accentColor);
  root.style.setProperty("--primary", accent.primary);
  root.style.setProperty("--primary-color", accent.primary);
  root.style.setProperty("--primary-hover", accent.hover);
  root.style.setProperty("--primary-active", accent.active);
  root.style.setProperty("--primary-light", accent.light);
  root.style.setProperty("--primary-border", accent.border);

  // 3. Cache to localStorage for zero-flicker load on refresh
  try {
    localStorage.setItem("app_theme", theme);
    localStorage.setItem("app_accent_color", accentColor || "#0284c7");
    localStorage.setItem("app_compact_layout", compactLayout ? "true" : "false");
  } catch (e) {
    // Ignore localStorage quota errors
  }
}

// Synchronous bootloader to prevent visual flicker before React mount
try {
  const initialTheme = localStorage.getItem("app_theme") || "dark";
  const initialAccent = localStorage.getItem("app_accent_color") || "#0284c7";
  const initialCompact = localStorage.getItem("app_compact_layout") === "true";
  applyThemeToDom(initialTheme, initialAccent, initialCompact);
} catch (e) {}

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("app_theme") || "dark");
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem("app_accent_color") || "#0284c7");
  const [compactLayout, setCompactLayout] = useState(() => localStorage.getItem("app_compact_layout") === "true");

  // Instant DOM Theme Update Helper
  const applyTheme = useCallback((newTheme, newAccent, newCompact) => {
    const t = newTheme !== undefined ? newTheme : theme;
    const a = newAccent !== undefined ? newAccent : accentColor;
    const c = newCompact !== undefined ? newCompact : compactLayout;

    setTheme(t);
    setAccentColor(a);
    setCompactLayout(c);

    applyThemeToDom(t, a, c);
  }, [theme, accentColor, compactLayout]);

  // Initial Sync with Backend Settings
  useEffect(() => {
    applyThemeToDom(theme, accentColor, compactLayout);

    async function syncBackendSettings() {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${API_URL}/api/settings`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.appearance) {
            const dbTheme = data.appearance.theme || "dark";
            const dbAccent = data.appearance.accentColor || "#0284c7";
            const dbCompact = Boolean(data.appearance.compactLayout);

            setTheme(dbTheme);
            setAccentColor(dbAccent);
            setCompactLayout(dbCompact);
            applyThemeToDom(dbTheme, dbAccent, dbCompact);
          }
        }
      } catch (err) {
        // Network offline or unauthenticated fallback
      }
    }

    syncBackendSettings();
  }, []);

  // System Theme Preference Change Listener
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      applyThemeToDom("system", accentColor, compactLayout);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, accentColor, compactLayout]);

  const value = useMemo(
    () => ({
      theme,
      accentColor,
      compactLayout,
      applyTheme,
    }),
    [theme, accentColor, compactLayout, applyTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
