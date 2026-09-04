"use client";
// components/ChallengeSheetView.tsx
// Phase 6: Notion-style sheet view over daily challenge logs.
// Table columns: Day, Tasks Scheduled, Tasks Completed, Tags (distinct completed), Notes (autosaving).
// Reads the exact same Log rows as the heatmap for 100% data fidelity.

import { useState, useRef, useEffect, memo } from "react";
import Link from "next/link";
import {
  MagnifyingGlass,
  ArrowSquareOut,
  Check,
  Funnel,
  SortAscending,
  SortDescending,
  NotePencil,
} from "@phosphor-icons/react";

export type SheetLog = {
  id: string;
  dayNumber: number;
  date: string;
  completionPct: number;
  tasksTotal: number;
  tasksDone: number;
  note: string | null;
  completedTags?: { id: string; name: string }[];
};

type Props = {
  challengeId: string;
  logs: SheetLog[];
  onNoteUpdated?: (logId: string, newNote: string | null) => void;
};

type FilterMode = "all" | "active" | "with_notes";
type SortOrder = "asc" | "desc";

// Map completion percentage to 0..5 heat tier
function pctToHeat(pct: number): number {
  if (pct <= 0) return 0;
  if (pct <= 25) return 1;
  if (pct <= 50) return 2;
  if (pct <= 75) return 3;
  if (pct < 100) return 4;
  return 5;
}

// ─── Individual Sheet Row (isolated state for lag-free typing) ─────────────────
const SheetRow = memo(function SheetRow({
  challengeId,
  log,
  onNoteUpdated,
}: {
  challengeId: string;
  log: SheetLog;
  onNoteUpdated?: (logId: string, newNote: string | null) => void;
}) {
  const [noteValue, setNoteValue] = useState(log.note || "");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync if prop changes externally
  useEffect(() => {
    setNoteValue(log.note || "");
  }, [log.note]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNoteValue(val);
    setSaveStatus("saving");

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      try {
        const payload = val.trim() ? val.trim() : null;
        const res = await fetch(`/api/logs/${log.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: payload }),
        });

        if (res.ok) {
          setSaveStatus("saved");
          onNoteUpdated?.(log.id, payload);
          setTimeout(() => setSaveStatus("idle"), 2000);
        } else {
          setSaveStatus("idle");
        }
      } catch {
        setSaveStatus("idle");
      }
    }, 700);
  };

  const heat = pctToHeat(log.completionPct);
  const formattedDate = new Date(log.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <tr
      className="border-b transition-colors hover:bg-[var(--surface-2)]/40 group"
      style={{ borderColor: "var(--border)" }}
    >
      {/* Day Column */}
      <td className="py-3 px-4 whitespace-nowrap">
        <div className="flex items-center gap-2.5">
          <div
            className="w-2.5 h-2.5 rounded-sm shrink-0"
            data-heat={heat}
            title={`${log.completionPct}% completed`}
          />
          <div>
            <span
              className="text-xs font-mono font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Day {log.dayNumber}
            </span>
            <span
              className="text-[11px] font-mono ml-2"
              style={{ color: "var(--text-muted)" }}
            >
              {formattedDate}
            </span>
          </div>
        </div>
      </td>

      {/* Tasks Scheduled Column (read-only) */}
      <td className="py-3 px-4 text-xs font-mono tabular-nums text-zinc-300">
        {log.tasksTotal}
      </td>

      {/* Tasks Completed Column (read-only) */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 min-w-[70px]">
            <span className="text-xs font-mono font-medium text-zinc-100 tabular-nums">
              {log.tasksDone}
            </span>
            <span className="text-[11px] font-mono text-zinc-500">
              /{log.tasksTotal}
            </span>
          </div>

          {/* Mini progress bar */}
          <div
            className="w-16 h-1.5 rounded-full overflow-hidden shrink-0 hidden sm:block"
            style={{ background: "var(--surface-3)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${log.completionPct}%`,
                background:
                  log.completionPct >= 100
                    ? "var(--accent)"
                    : "var(--accent-dim)",
              }}
            />
          </div>

          <span
            className="text-[11px] font-mono tabular-nums w-10 text-right"
            style={{
              color:
                log.completionPct > 0
                  ? "var(--accent)"
                  : "var(--text-muted)",
            }}
          >
            {log.completionPct}%
          </span>
        </div>
      </td>

      {/* Tags Column (distinct from completed tasks only) */}
      <td className="py-3 px-4">
        {log.completedTags && log.completedTags.length > 0 ? (
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {log.completedTags.map((tag) => (
              <span
                key={tag.id}
                className="text-[10px] font-mono px-2 py-0.5 rounded border"
                style={{
                  background: "var(--surface-2)",
                  borderColor: "var(--border)",
                  color: "var(--text-secondary)",
                }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-xs font-mono text-zinc-600">-</span>
        )}
      </td>

      {/* Notes Column (inline-editable with autosave) */}
      <td className="py-2.5 px-4 min-w-[260px] flex-1">
        <div className="relative flex items-center">
          <input
            type="text"
            value={noteValue}
            onChange={handleNoteChange}
            placeholder="Add reflection or blockers..."
            className="w-full text-xs font-mono px-2.5 py-1.5 rounded border bg-transparent outline-none transition-colors placeholder:text-zinc-600 focus:border-[var(--accent)] focus:bg-[var(--surface-2)]"
            style={{
              borderColor:
                saveStatus === "saving"
                  ? "var(--accent-dim)"
                  : "transparent",
              color: "var(--text-primary)",
            }}
          />

          {/* Status Indicator */}
          <div className="absolute right-2 flex items-center pointer-events-none">
            {saveStatus === "saving" && (
              <span
                className="text-[10px] font-mono animate-pulse"
                style={{ color: "var(--text-muted)" }}
              >
                saving...
              </span>
            )}
            {saveStatus === "saved" && (
              <span
                className="text-[10px] font-mono flex items-center gap-0.5"
                style={{ color: "var(--accent)" }}
              >
                <Check size={11} weight="bold" />
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Open Day Kanban CTA */}
      <td className="py-3 px-4 text-right whitespace-nowrap">
        <Link
          href={`/challenges/${challengeId}/day/${log.id}`}
          className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded border text-zinc-400 hover:text-white hover:border-zinc-700 transition-all"
          style={{
            background: "var(--surface-2)",
            borderColor: "var(--border)",
          }}
          title={`Open Kanban board for Day ${log.dayNumber}`}
        >
          <span>Kanban</span>
          <ArrowSquareOut size={11} />
        </Link>
      </td>
    </tr>
  );
});

// ─── Main Sheet Table Component ───────────────────────────────────────────────
export function ChallengeSheetView({
  challengeId,
  logs,
  onNoteUpdated,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Filtering
  const filteredLogs = logs.filter((log) => {
    // Search query matches day number, notes, or tags
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchDay = `day ${log.dayNumber}`.includes(q) || String(log.dayNumber) === q;
      const matchNote = log.note?.toLowerCase().includes(q) || false;
      const matchTag =
        log.completedTags?.some((t) => t.name.toLowerCase().includes(q)) || false;
      if (!matchDay && !matchNote && !matchTag) return false;
    }

    if (filterMode === "active") {
      return log.tasksTotal > 0 || log.completionPct > 0;
    }
    if (filterMode === "with_notes") {
      return Boolean(log.note && log.note.trim().length > 0);
    }
    return true;
  });

  // Sorting
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    if (sortOrder === "asc") {
      return a.dayNumber - b.dayNumber;
    }
    return b.dayNumber - a.dayNumber;
  });

  return (
    <div
      className="card rounded-xl overflow-hidden flex flex-col"
      style={{
        background: "var(--surface-1)",
        borderColor: "var(--border)",
      }}
    >
      {/* Table Toolbar */}
      <div
        className="p-4 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
        style={{ borderColor: "var(--border)" }}
      >
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <MagnifyingGlass
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search days, notes, or tags..."
            className="w-full pl-8 pr-3 py-1.5 text-xs font-mono rounded-lg outline-none transition-colors"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        {/* Filter Pills & Sort Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className="flex items-center p-0.5 rounded-lg border text-xs font-mono"
            style={{
              background: "var(--surface-2)",
              borderColor: "var(--border)",
            }}
          >
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterMode === "all"
                  ? "bg-[var(--surface-3)] text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              All ({logs.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("active")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterMode === "active"
                  ? "bg-[var(--surface-3)] text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("with_notes")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterMode === "with_notes"
                  ? "bg-[var(--surface-3)] text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Notes
            </button>
          </div>

          {/* Sort Button */}
          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-mono text-zinc-400 hover:text-white transition-colors"
            style={{
              background: "var(--surface-2)",
              borderColor: "var(--border)",
            }}
            title={sortOrder === "asc" ? "Ascending order" : "Descending order"}
          >
            {sortOrder === "asc" ? (
              <>
                <SortAscending size={13} />
                <span>1 → {logs.length}</span>
              </>
            ) : (
              <>
                <SortDescending size={13} />
                <span>{logs.length} → 1</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr
              className="border-b text-[11px] font-mono uppercase tracking-wider text-zinc-400"
              style={{
                background: "var(--surface-2)",
                borderColor: "var(--border)",
              }}
            >
              <th className="py-3 px-4 font-medium">Day</th>
              <th className="py-3 px-4 font-medium">Scheduled</th>
              <th className="py-3 px-4 font-medium">Completed</th>
              <th className="py-3 px-4 font-medium">Completed Tags</th>
              <th className="py-3 px-4 font-medium flex items-center gap-1.5">
                <NotePencil size={13} />
                <span>Notes (Autosaves)</span>
              </th>
              <th className="py-3 px-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedLogs.length > 0 ? (
              sortedLogs.map((log) => (
                <SheetRow
                  key={log.id}
                  challengeId={challengeId}
                  log={log}
                  onNoteUpdated={onNoteUpdated}
                />
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="py-12 text-center text-xs font-mono"
                  style={{ color: "var(--text-muted)" }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Funnel size={20} className="text-zinc-600" />
                    <p>No days matched your current filter.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div
        className="px-4 py-3 border-t flex items-center justify-between text-[11px] font-mono"
        style={{
          borderColor: "var(--border)",
          color: "var(--text-muted)",
        }}
      >
        <span>
          Showing {sortedLogs.length} of {logs.length} days
        </span>
        <span>
          Notes autosave inline to database
        </span>
      </div>
    </div>
  );
}
