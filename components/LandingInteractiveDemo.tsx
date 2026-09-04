"use client";

// components/LandingInteractiveDemo.tsx
// Interactive live demo for the landing page:
// Allows visitors to click tasks and see the heatmap cell and progress ring react in real time.

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, Flame, Kanban, Sparkle } from "@phosphor-icons/react";

interface DemoTask {
  id: string;
  title: string;
  tag: string;
  done: boolean;
}

const INITIAL_TASKS: DemoTask[] = [
  { id: "1", title: "Ship authentication middleware proxy", tag: "Backend", done: true },
  { id: "2", title: "Implement 3-column Kanban dnd", tag: "Frontend", done: true },
  { id: "3", title: "Tune heatmap cell fill & reduced motion", tag: "Design", done: false },
];

export function LandingInteractiveDemo() {
  const [tasks, setTasks] = useState<DemoTask[]>(INITIAL_TASKS);
  const reduce = useReducedMotion();

  const completedCount = tasks.filter((t) => t.done).length;
  const pct = Math.round((completedCount / tasks.length) * 100);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  // 28 days mock cells for a 4-week grid
  const mockHeatTiers = [
    5, 4, 5, 3, 5, 5, 4,
    5, 5, 4, 5, 3, 4, 5,
    5, 5, 5, 4, 5, 5, 5,
    5, 4, 5, 5, 4, 5,
  ];

  // Current day tier based on interactive demo state
  const currentDayTier = pct === 100 ? 5 : pct >= 66 ? 3 : pct >= 33 ? 2 : 0;

  return (
    <div className="w-full rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-7 backdrop-blur-sm">
      {/* Top Demo Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-800/70 border border-zinc-700/60 flex items-center justify-center text-[var(--accent)]">
            <Kanban size={20} weight="bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                30 Days of Systems Code
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                Day 28 of 30
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Interactive preview: Click tasks to update today&apos;s heat cell
            </p>
          </div>
        </div>

        {/* Streak & Ring */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-mono font-medium">
            <Flame size={15} weight="fill" className="text-amber-400 animate-pulse" />
            28 DAY STREAK
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 flex items-center justify-center">
              <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                <circle
                  cx="16"
                  cy="16"
                  r="12"
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="3"
                />
                <motion.circle
                  cx="16"
                  cy="16"
                  r="12"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="3"
                  strokeDasharray={2 * Math.PI * 12}
                  initial={{ strokeDashoffset: (2 * Math.PI * 12) * (1 - pct / 100) }}
                  animate={{
                    strokeDashoffset: (2 * Math.PI * 12) * (1 - pct / 100),
                  }}
                  transition={{ duration: reduce ? 0 : 0.3 }}
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="text-xs font-mono font-semibold text-[var(--text-primary)]">
              {pct}%
            </span>
          </div>
        </div>
      </div>

      {/* 2-Column Demo Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
        {/* Left: Interactive Task Checklist */}
        <div className="lg:col-span-6 space-y-2.5">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-secondary)]">
              Today&apos;s Scoped Tasks
            </span>
            <span className="text-xs font-mono text-[var(--text-muted)]">
              {completedCount}/{tasks.length} Done
            </span>
          </div>

          {tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className="w-full text-left p-3 rounded-xl border border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 transition-all flex items-center justify-between gap-3 group focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                    task.done
                      ? "bg-[var(--accent)] border-[var(--accent)] text-zinc-950"
                      : "border-zinc-700 group-hover:border-zinc-500 bg-transparent"
                  }`}
                >
                  {task.done && <Check size={13} weight="bold" />}
                </div>
                <span
                  className={`text-xs sm:text-sm font-medium transition-colors ${
                    task.done
                      ? "line-through text-zinc-500"
                      : "text-zinc-200 group-hover:text-white"
                  }`}
                >
                  {task.title}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 shrink-0">
                {task.tag}
              </span>
            </button>
          ))}

          {pct === 100 && (
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs font-mono"
            >
              <Sparkle size={14} weight="fill" className="text-emerald-400" />
              100% Day completion achieved: Streak preserved.
            </motion.div>
          )}
        </div>

        {/* Right: Live Heatmap Grid Simulation */}
        <div className="lg:col-span-6 flex flex-col justify-between rounded-xl border border-zinc-800/90 bg-zinc-950/50 p-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-secondary)]">
                Live Heatmap Matrix
              </span>
              <span className="text-xs font-mono text-[var(--accent)]">
                Tier {currentDayTier} active
              </span>
            </div>

            {/* Heatmap cells */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {mockHeatTiers.map((tier, i) => (
                <div
                  key={i}
                  data-heat={tier}
                  className="aspect-square rounded-[4px] border border-black/20"
                  title={`Day ${i + 1}: 100%`}
                />
              ))}
              {/* Day 28: Interactive live cell */}
              <motion.div
                data-heat={currentDayTier}
                animate={
                  reduce
                    ? {}
                    : { scale: [1, 1.1, 1] }
                }
                key={`today-${currentDayTier}`}
                transition={{ duration: 0.3 }}
                className="aspect-square rounded-[4px] border-2 border-[var(--accent)] relative cursor-pointer"
                title={`Today (Day 28): ${pct}% complete`}
              >
                <div className="absolute inset-0 flex items-center justify-center font-mono text-[9px] font-bold text-zinc-950">
                  28
                </div>
              </motion.div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)] pt-4 border-t border-zinc-900 mt-4">
            <span>Less</span>
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3, 4, 5].map((t) => (
                <div
                  key={t}
                  data-heat={t}
                  className="w-3 h-3 rounded-[2px]"
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
