"use client";
// components/StreakBadge.tsx
// Shows current streak with a flame-style animated accent.

import { Flame } from "@phosphor-icons/react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";

type StreakBadgeProps = {
  streak: number;
  size?: "sm" | "md" | "lg";
};

export function StreakBadge({ streak, size = "md" }: StreakBadgeProps) {
  const shouldReduceMotion = useReducedMotion();

  const sizeMap = {
    sm: { icon: 14, text: "text-xs", px: "px-2 py-0.5" },
    md: { icon: 16, text: "text-sm", px: "px-2.5 py-1" },
    lg: { icon: 20, text: "text-base", px: "px-3 py-1.5" },
  };

  const { icon, text, px } = sizeMap[size];
  const isHot = streak >= 7;

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full font-mono font-medium ${px} ${text}`}
      style={{
        background: isHot ? "var(--accent-subtle)" : "var(--surface-2)",
        color: isHot ? "var(--accent)" : "var(--text-secondary)",
        border: `1px solid ${isHot ? "var(--accent-dim)" : "var(--border)"}`,
      }}
    >
      <motion.div
        animate={
          isHot && !shouldReduceMotion
            ? { scale: [1, 1.15, 1], rotate: [0, -4, 4, 0] }
            : {}
        }
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        className="flex items-center justify-center shrink-0"
      >
        <Flame
          size={icon}
          weight={isHot ? "fill" : "regular"}
          style={{ color: isHot ? "var(--accent)" : "var(--text-muted)" }}
        />
      </motion.div>
      <AnimatePresence mode="wait">
        <motion.span
          key={streak}
          initial={shouldReduceMotion ? false : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? undefined : { opacity: 0, y: 4 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.18 }}
        >
          {streak}d
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
