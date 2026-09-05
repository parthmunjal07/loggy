"use client";
// components/ThemeToggle.tsx
// Theme toggle button for switching between Light and Dark mode.

import { useEffect, useState } from "react";
import { Sun, Moon } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("loggy-theme") as "dark" | "light" | null;
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("loggy-theme", nextTheme);

    const root = document.documentElement;
    root.setAttribute("data-theme", nextTheme);
    if (nextTheme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
    }

    window.dispatchEvent(new Event("loggy-theme-change"));
  };

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-lg border border-[var(--border)] bg-[var(--surface-1)]" />
    );
  }

  const isDark = theme === "dark";

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      whileHover={reduce ? {} : { scale: 1.05 }}
      whileTap={reduce ? {} : { scale: 0.95 }}
      className="w-8 h-8 rounded-lg flex items-center justify-center border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
      style={{
        background: "var(--surface-1)",
        borderColor: "var(--border)",
        color: "var(--text-secondary)",
      }}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {isDark ? (
        <Sun size={16} weight="bold" className="text-amber-400 hover:text-amber-300 transition-colors" />
      ) : (
        <Moon size={16} weight="bold" className="text-indigo-600 hover:text-indigo-700 transition-colors" />
      )}
    </motion.button>
  );
}
