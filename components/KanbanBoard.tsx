"use client";
// components/KanbanBoard.tsx
// Phase 5: Kanban board for daily task management.
// Scoped to current day, with drag-and-drop, optimistic UI, inline task creation,
// and instant parent progress recompute for live heatmap cell updates.

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  Circle,
  Clock,
  CheckCircle,
  Plus,
  Trash,
  Lock,
  Tag as TagIcon,
  ArrowRight,
  ArrowLeft,
  Sparkle,
  X,
  Confetti,
} from "@phosphor-icons/react";

export type KanbanTask = {
  id: string;
  title: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  createdAt: string | Date;
  tags?: {
    tag: {
      id: string;
      name: string;
    };
  }[];
};

export type AvailableTag = {
  id: string;
  name: string;
  userId?: string | null;
};

type Props = {
  logId: string;
  challengeId: string;
  dayNumber: number;
  date: string;
  initialTasks: KanbanTask[];
  isLocked?: boolean;
  onLogUpdated?: (stats: {
    logId: string;
    tasksTotal: number;
    tasksDone: number;
    completionPct: number;
  }) => void;
};

const COLUMNS: { id: "TODO" | "IN_PROGRESS" | "DONE"; label: string }[] = [
  { id: "TODO", label: "To Do" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "DONE", label: "Done" },
];

export function KanbanBoard({
  logId,
  dayNumber,
  initialTasks,
  isLocked = false,
  onLogUpdated,
}: Props) {
  const shouldReduceMotion = useReducedMotion();
  const [tasks, setTasks] = useState<KanbanTask[]>(initialTasks);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Task creation state
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<AvailableTag[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [celebrationToast, setCelebrationToast] = useState<string | null>(null);

  const titleInputRef = useRef<HTMLInputElement>(null);

  // Sync tasks when initialTasks change
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // Load available tags
  useEffect(() => {
    async function loadTags() {
      try {
        const res = await fetch("/api/tags");
        if (res.ok) {
          const data = await res.json();
          setAvailableTags(data.tags || []);
        }
      } catch (err) {
        console.error("Failed to load tags:", err);
      }
    }
    loadTags();
  }, []);

  // Autofocus input on create
  useEffect(() => {
    if (isCreating) {
      titleInputRef.current?.focus();
    }
  }, [isCreating]);

  // Calculate stats & notify parent immediately
  function computeAndNotify(nextTasks: KanbanTask[]) {
    const total = nextTasks.length;
    const done = nextTasks.filter((t) => t.status === "DONE").length;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);

    if (pct === 100 && done > 0) {
      setCelebrationToast(`Day ${dayNumber} fully completed! Today's heatmap cell is now lit.`);
      setTimeout(() => setCelebrationToast(null), 3500);
    }

    onLogUpdated?.({
      logId,
      tasksTotal: total,
      tasksDone: done,
      completionPct: pct,
    });
  }

  // ─── Status Update (Optimistic) ──────────────────────────────────────────────
  async function updateTaskStatus(taskId: string, newStatus: "TODO" | "IN_PROGRESS" | "DONE") {
    if (isLocked) return;

    const previousTasks = [...tasks];
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask || targetTask.status === newStatus) return;

    // 1. Optimistic local state update
    const nextTasks = tasks.map((t) =>
      t.id === taskId ? { ...t, status: newStatus } : t
    );
    setTasks(nextTasks);
    computeAndNotify(nextTasks);

    // 2. Server mutation
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      const data = await res.json();
      // Synchronize with server recompute result if present
      if (data.completionPct !== undefined) {
        onLogUpdated?.({
          logId,
          tasksTotal: data.tasksTotal,
          tasksDone: data.tasksDone,
          completionPct: data.completionPct,
        });
      }
    } catch {
      // Revert on error
      setErrorBanner("Could not update task status. Reverting changes.");
      setTasks(previousTasks);
      computeAndNotify(previousTasks);
      setTimeout(() => setErrorBanner(null), 4000);
    }
  }

  // ─── Task Deletion (Optimistic) ──────────────────────────────────────────────
  async function deleteTask(taskId: string) {
    if (isLocked) return;

    const previousTasks = [...tasks];
    const nextTasks = tasks.filter((t) => t.id !== taskId);
    setTasks(nextTasks);
    computeAndNotify(nextTasks);

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete task");
      }

      const data = await res.json();
      if (data.completionPct !== undefined) {
        onLogUpdated?.({
          logId,
          tasksTotal: data.tasksTotal,
          tasksDone: data.tasksDone,
          completionPct: data.completionPct,
        });
      }
    } catch {
      setErrorBanner("Could not delete task. Reverting changes.");
      setTasks(previousTasks);
      computeAndNotify(previousTasks);
      setTimeout(() => setErrorBanner(null), 4000);
    }
  }

  // ─── Task Creation ───────────────────────────────────────────────────────────
  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (isLocked || !newTitle.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const title = newTitle.trim();
    const tagIds = [...selectedTagIds];

    // Optimistic placeholder
    const tempId = `temp-${Date.now()}`;
    const selectedTagsObjects = availableTags
      .filter((t) => tagIds.includes(t.id))
      .map((t) => ({ tag: { id: t.id, name: t.name } }));

    const optimisticTask: KanbanTask = {
      id: tempId,
      title,
      status: "TODO",
      createdAt: new Date().toISOString(),
      tags: selectedTagsObjects,
    };

    const nextTasks = [...tasks, optimisticTask];
    setTasks(nextTasks);
    computeAndNotify(nextTasks);

    // Clear form
    setNewTitle("");
    setSelectedTagIds([]);
    setIsCreating(false);

    try {
      const res = await fetch(`/api/logs/${logId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, tagIds }),
      });

      if (!res.ok) {
        throw new Error("Failed to create task");
      }

      const data = await res.json();
      const realTask = data.task;

      // Swap temp task with real task from server
      setTasks((current) =>
        current.map((t) => (t.id === tempId ? realTask : t))
      );
    } catch {
      setErrorBanner("Failed to save new task.");
      setTasks((current) => current.filter((t) => t.id !== tempId));
      computeAndNotify(tasks);
      setTimeout(() => setErrorBanner(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  }

  // ─── Inline Tag Creation ─────────────────────────────────────────────────────
  async function handleCreateTag() {
    if (!newTagName.trim()) return;
    const name = newTagName.trim();
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        const data = await res.json();
        const tag = data.tag;
        if (!availableTags.some((t) => t.id === tag.id)) {
          setAvailableTags((prev) => [...prev, tag]);
        }
        if (!selectedTagIds.includes(tag.id)) {
          setSelectedTagIds((prev) => [...prev, tag.id]);
        }
        setNewTagName("");
      }
    } catch (err) {
      console.error("Failed to create tag:", err);
    }
  }

  // ─── Drag and Drop Handlers ──────────────────────────────────────────────────
  function handleDragStart(e: React.DragEvent, taskId: string) {
    if (isLocked) return;
    setDraggedTaskId(taskId);
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent, columnId: string) {
    if (isLocked) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  }

  function handleDragLeave(columnId: string) {
    if (dragOverColumn === columnId) {
      setDragOverColumn(null);
    }
  }

  function handleDrop(e: React.DragEvent, columnId: "TODO" | "IN_PROGRESS" | "DONE") {
    if (isLocked) return;
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = draggedTaskId || e.dataTransfer.getData("text/plain");
    if (taskId) {
      updateTaskStatus(taskId, columnId);
    }
    setDraggedTaskId(null);
  }

  return (
    <div className="w-full flex flex-col gap-5">
      {/* Celebration Toast */}
      <AnimatePresence>
        {celebrationToast && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -10 }}
            className="rounded-xl px-4 py-3 text-xs font-mono bg-emerald-950/70 border border-emerald-700/80 text-emerald-200 flex items-center justify-between gap-3 shadow-lg"
          >
            <div className="flex items-center gap-2">
              <Confetti size={16} weight="fill" className="text-emerald-400 shrink-0" />
              <span>{celebrationToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setCelebrationToast(null)}
              className="text-emerald-400 hover:text-emerald-200 p-0.5"
            >
              <X size={13} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error banner */}
      <AnimatePresence>
        {errorBanner && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -10 }}
            className="rounded-lg px-4 py-2.5 text-xs font-mono bg-red-950/60 border border-red-800/80 text-red-200"
          >
            {errorBanner}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lock banner if read-only */}
      {isLocked && (
        <div
          className="flex items-center gap-2.5 px-4 py-3 rounded-xl border text-xs font-mono"
          style={{
            background: "var(--surface-2)",
            borderColor: "var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          <Lock size={15} className="text-zinc-400 shrink-0" />
          <span>Past day archive: this day is locked. Tasks are preserved in read-only mode.</span>
        </div>
      )}

      {/* Fresh day empty invitation */}
      {tasks.length === 0 && !isLocked && !isCreating && (
        <div
          className="rounded-xl border p-6 text-center flex flex-col items-center gap-3 transition-colors"
          style={{
            background: "var(--surface-1)",
            borderColor: "var(--border)",
          }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: "var(--surface-2)",
              color: "var(--accent)",
            }}
          >
            <Sparkle size={20} weight="fill" />
          </div>
          <div>
            <h4
              className="text-base font-semibold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Plan Day {dayNumber}
            </h4>
            <p
              className="text-xs max-w-sm mt-1 leading-relaxed"
              style={{ color: "var(--text-muted)" }}
            >
              Break your challenge goal into high-impact steps. Drag them to Done as you complete them to light up today&apos;s heatmap cell.
            </p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="mt-1 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-transform duration-150 active:scale-[0.98]"
            style={{
              background: "var(--accent)",
              color: "var(--surface-0)",
            }}
          >
            <Plus size={14} weight="bold" />
            Add your first task
          </button>
        </div>
      )}

      {/* Inline Task Creation Form */}
      <AnimatePresence>
        {isCreating && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleCreateTask}
            className="rounded-xl border p-4 flex flex-col gap-3.5 overflow-hidden"
            style={{
              background: "var(--surface-1)",
              borderColor: "var(--accent)",
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-xs font-mono uppercase tracking-wider"
                style={{ color: "var(--accent)" }}
              >
                New Task for Day {dayNumber}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setNewTitle("");
                  setSelectedTagIds([]);
                }}
                className="p-1 rounded text-zinc-400 hover:text-zinc-200"
              >
                <X size={14} />
              </button>
            </div>

            <input
              ref={titleInputRef}
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="What focused step will you accomplish?"
              className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-colors"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setIsCreating(false);
                }
              }}
            />

            {/* Tag Selection */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
                <TagIcon size={12} />
                <span>Tags</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {availableTags.map((t) => {
                  const isSelected = selectedTagIds.includes(t.id);
                  return (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => {
                        setSelectedTagIds((prev) =>
                          isSelected
                            ? prev.filter((id) => id !== t.id)
                            : [...prev, t.id]
                        );
                      }}
                      className={`text-[11px] font-mono px-2.5 py-1 rounded-md border transition-colors ${
                        isSelected
                          ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--surface-3)]"
                          : "border-[var(--border)] text-zinc-400 hover:text-zinc-200 bg-[var(--surface-2)]"
                      }`}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>

              {/* Add Custom Tag */}
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="New tag..."
                  className="rounded-md px-2.5 py-1 text-xs outline-none font-mono"
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateTag();
                    }
                  }}
                />
                {newTagName.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={handleCreateTag}
                    className="text-xs font-mono px-2 py-1 rounded bg-[var(--surface-3)] text-zinc-300 hover:text-white"
                  >
                    + Add
                  </button>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setNewTitle("");
                  setSelectedTagIds([]);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newTitle.trim() || isSubmitting}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-transform active:scale-[0.98] disabled:opacity-50"
                style={{
                  background: "var(--accent)",
                  color: "var(--surface-0)",
                }}
              >
                {isSubmitting ? "Adding..." : "Add task"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* 3 Columns Kanban Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          const isOver = dragOverColumn === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={() => handleDragLeave(col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`rounded-xl border flex flex-col transition-all duration-150 ${
                isOver ? "ring-2 ring-[var(--accent)] border-transparent" : ""
              }`}
              style={{
                background: "var(--surface-1)",
                borderColor: isOver ? "var(--accent)" : "var(--border)",
                minHeight: "260px",
              }}
            >
              {/* Column Header */}
              <div
                className="flex items-center justify-between px-4 py-3 border-b"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="flex items-center gap-2">
                  {col.id === "TODO" && (
                    <Circle size={14} className="text-zinc-400" />
                  )}
                  {col.id === "IN_PROGRESS" && (
                    <Clock size={14} className="text-amber-400" />
                  )}
                  {col.id === "DONE" && (
                    <CheckCircle
                      size={14}
                      weight="fill"
                      style={{ color: "var(--accent)" }}
                    />
                  )}
                  <h3
                    className="text-xs font-semibold tracking-wide"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {col.label}
                  </h3>
                  <span
                    className="text-[11px] font-mono px-1.5 py-0.5 rounded-full"
                    style={{
                      background: "var(--surface-2)",
                      color: "var(--text-muted)",
                    }}
                  >
                    {colTasks.length}
                  </span>
                </div>

                {col.id === "TODO" && !isLocked && (
                  <button
                    type="button"
                    onClick={() => setIsCreating(true)}
                    className="p-1 rounded-md transition-colors text-zinc-400 hover:text-white hover:bg-[var(--surface-2)]"
                    aria-label="Add task to To Do"
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>

              {/* Tasks List */}
              <div className="p-3 flex flex-col gap-2.5 flex-1">
                <AnimatePresence>
                  {colTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ type: "spring", stiffness: 350, damping: 28 }}
                      draggable={!isLocked}
                      onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, task.id)}
                      className={`group relative rounded-lg p-3 border transition-all duration-150 select-none ${
                        !isLocked
                          ? "cursor-grab active:cursor-grabbing hover:border-zinc-700"
                          : ""
                      }`}
                      style={{
                        background: "var(--surface-2)",
                        borderColor: "var(--border)",
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p
                            className={`text-sm leading-snug break-words ${
                              task.status === "DONE"
                                ? "line-through text-[var(--text-muted)]"
                                : "text-[var(--text-primary)]"
                            }`}
                          >
                            {task.title}
                          </p>

                          {/* Tags */}
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2.5">
                              {task.tags.map(({ tag }) => (
                                <span
                                  key={tag.id}
                                  className="text-[10px] font-mono px-2 py-0.5 rounded"
                                  style={{
                                    background: "var(--surface-3)",
                                    color: "var(--text-secondary)",
                                  }}
                                >
                                  {tag.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Delete Button */}
                        {!isLocked && (
                          <button
                            type="button"
                            onClick={() => deleteTask(task.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded text-zinc-500 hover:text-red-400 transition-opacity"
                            aria-label="Delete task"
                          >
                            <Trash size={13} />
                          </button>
                        )}
                      </div>

                      {/* Accessible Status Move Controls */}
                      {!isLocked && (
                        <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-500">
                          <div>
                            {task.status !== "TODO" && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateTaskStatus(
                                    task.id,
                                    task.status === "DONE"
                                      ? "IN_PROGRESS"
                                      : "TODO"
                                  )
                                }
                                className="inline-flex items-center gap-1 hover:text-zinc-200 transition-colors"
                              >
                                <ArrowLeft size={11} />
                                <span>
                                  {task.status === "DONE"
                                    ? "In Progress"
                                    : "To Do"}
                                </span>
                              </button>
                            )}
                          </div>
                          <div>
                            {task.status !== "DONE" && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateTaskStatus(
                                    task.id,
                                    task.status === "TODO"
                                      ? "IN_PROGRESS"
                                      : "DONE"
                                  )
                                }
                                className="inline-flex items-center gap-1 hover:text-[var(--accent)] transition-colors"
                              >
                                <span>
                                  {task.status === "TODO"
                                    ? "In Progress"
                                    : "Done"}
                                </span>
                                <ArrowRight size={11} />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Empty column placeholder */}
                {colTasks.length === 0 && (
                  <div
                    className="flex-1 min-h-[100px] border border-dashed rounded-lg flex items-center justify-center p-4 text-center text-xs font-mono"
                    style={{
                      borderColor: "var(--border)",
                      color: "var(--text-muted)",
                    }}
                  >
                    <span>{col.label} empty</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
