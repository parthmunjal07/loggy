"use client";

// app/challenges/[id]/settings/ChallengeSettingsClient.tsx
// Interactive challenge settings with recurring task template management.

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowsClockwise,
  Plus,
  PencilSimple,
  Check,
  X,
  Tag as TagIcon,
  ToggleLeft,
  ToggleRight,
  SpinnerGap,
  Sparkle,
} from "@phosphor-icons/react";

export type SerializedRecurringTask = {
  id: string;
  title: string;
  isActive: boolean;
  createdAt: string;
  tags: { tag: { id: string; name: string } }[];
  tasksCount: number;
};

type Props = {
  challengeId: string;
  initialTitle: string;
  totalDays: number | null;
  startDate: string;
  status: string;
  initialRecurringTasks: SerializedRecurringTask[];
  availableTags: { id: string; name: string }[];
};

export function ChallengeSettingsClient({
  challengeId,
  initialTitle,
  totalDays,
  startDate,
  status: initialStatus,
  initialRecurringTasks,
  availableTags: initialAvailableTags,
}: Props) {
  // Challenge details state
  const [title, setTitle] = useState(initialTitle);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(initialTitle);
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [status, setStatus] = useState(initialStatus);

  // Recurring tasks state
  const [recurringTasks, setRecurringTasks] = useState<SerializedRecurringTask[]>(
    initialRecurringTasks
  );
  const [availableTags, setAvailableTags] = useState(initialAvailableTags);

  // New recurring task form
  const [isCreatingRt, setIsCreatingRt] = useState(false);
  const [newRtTitle, setNewRtTitle] = useState("");
  const [newRtTagIds, setNewRtTagIds] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [isSubmittingRt, setIsSubmittingRt] = useState(false);

  // Edit recurring task form
  const [editingRtId, setEditingRtId] = useState<string | null>(null);
  const [editingRtTitle, setEditingRtTitle] = useState("");
  const [editingRtTagIds, setEditingRtTagIds] = useState<string[]>([]);
  const [isSavingRtEdit, setIsSavingRtEdit] = useState(false);

  // Feedback banners
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  function showSuccess(msg: string) {
    setSuccessBanner(msg);
    setTimeout(() => setSuccessBanner(null), 3000);
  }

  function showError(msg: string) {
    setErrorBanner(msg);
    setTimeout(() => setErrorBanner(null), 4000);
  }

  // ─── Challenge Title Update ──────────────────────────────────────────────────
  async function handleSaveTitle(e: React.FormEvent) {
    e.preventDefault();
    if (!titleInput.trim() || isSavingTitle) return;

    setIsSavingTitle(true);
    try {
      const res = await fetch(`/api/challenges/${challengeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: titleInput.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update title");
      }

      setTitle(titleInput.trim());
      setIsEditingTitle(false);
      showSuccess("Challenge title updated.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update title";
      showError(msg);
    } finally {
      setIsSavingTitle(false);
    }
  }

  // ─── Challenge Status Toggle ─────────────────────────────────────────────────
  async function handleToggleStatus() {
    const nextStatus = status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      const res = await fetch(`/api/challenges/${challengeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      setStatus(nextStatus);
      showSuccess(`Challenge marked as ${nextStatus.toLowerCase()}.`);
    } catch {
      showError("Could not update status.");
    }
  }

  // ─── Inline Custom Tag Creation ──────────────────────────────────────────────
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
        if (isCreatingRt) {
          setNewRtTagIds((prev) => [...prev, tag.id]);
        } else if (editingRtId) {
          setEditingRtTagIds((prev) => [...prev, tag.id]);
        }
        setNewTagName("");
      }
    } catch {
      showError("Failed to create tag.");
    }
  }

  // ─── Create Recurring Task ───────────────────────────────────────────────────
  async function handleCreateRecurringTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newRtTitle.trim() || isSubmittingRt) return;

    setIsSubmittingRt(true);
    try {
      const res = await fetch(`/api/challenges/${challengeId}/recurring-tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newRtTitle.trim(),
          tagIds: newRtTagIds,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to create recurring task");
      }

      const created: SerializedRecurringTask = {
        id: data.recurringTask.id,
        title: data.recurringTask.title,
        isActive: data.recurringTask.isActive,
        createdAt: data.recurringTask.createdAt,
        tags: data.recurringTask.tags || [],
        tasksCount: data.todayTask ? 1 : 0,
      };

      setRecurringTasks((prev) => [created, ...prev]);
      setNewRtTitle("");
      setNewRtTagIds([]);
      setIsCreatingRt(false);
      showSuccess("Recurring task created and instantiated for today.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create recurring task";
      showError(msg);
    } finally {
      setIsSubmittingRt(false);
    }
  }

  // ─── Toggle Recurring Task Active/Inactive ───────────────────────────────────
  async function handleToggleRtActive(task: SerializedRecurringTask) {
    const nextActive = !task.isActive;

    // Optimistic update
    setRecurringTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, isActive: nextActive } : t))
    );

    try {
      const res = await fetch(
        `/api/challenges/${challengeId}/recurring-tasks/${task.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: nextActive }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      showSuccess(
        nextActive
          ? "Recurring task activated: will spawn on upcoming days."
          : "Recurring task deactivated: existing days remain untouched."
      );
    } catch {
      // Revert on error
      setRecurringTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, isActive: task.isActive } : t))
      );
      showError("Could not update recurring task status.");
    }
  }

  // ─── Edit Recurring Task (Title and Tags) ────────────────────────────────────
  function startEditingRt(task: SerializedRecurringTask) {
    setEditingRtId(task.id);
    setEditingRtTitle(task.title);
    setEditingRtTagIds(task.tags.map((t) => t.tag.id));
  }

  async function handleSaveRtEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingRtId || !editingRtTitle.trim() || isSavingRtEdit) return;

    setIsSavingRtEdit(true);
    try {
      const res = await fetch(
        `/api/challenges/${challengeId}/recurring-tasks/${editingRtId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: editingRtTitle.trim(),
            tagIds: editingRtTagIds,
          }),
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to update recurring task");
      }

      setRecurringTasks((prev) =>
        prev.map((t) =>
          t.id === editingRtId
            ? {
                ...t,
                title: data.recurringTask.title,
                tags: data.recurringTask.tags,
              }
            : t
        )
      );

      setEditingRtId(null);
      showSuccess("Template updated for future days.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update template";
      showError(msg);
    } finally {
      setIsSavingRtEdit(false);
    }
  }

  return (
    <div className="w-full space-y-8">
      {/* Back Link */}
      <div>
        <Link
          href={`/challenges/${challengeId}`}
          className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft size={13} />
          <span>Return to {title}</span>
        </Link>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border)]">
        <div>
          <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">
            Challenge Settings
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mt-1">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-md border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-secondary)]">
            {totalDays !== null ? `${totalDays} Days Commitment` : "Open-ended Log"}
          </span>
          <button
            type="button"
            onClick={handleToggleStatus}
            className={`px-2.5 py-1 rounded-md border text-xs font-mono font-medium transition-colors cursor-pointer ${
              status === "ACTIVE"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
            }`}
          >
            {status}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successBanner && (
        <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 text-xs font-mono">
          {successBanner}
        </div>
      )}
      {errorBanner && (
        <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-mono">
          {errorBanner}
        </div>
      )}

      {/* ── Section 1: Challenge Details ─────────────────────────────────────── */}
      <section className="card p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] space-y-5 shadow-xs">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            General Configuration
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Manage challenge title and view timeline details.
          </p>
        </div>

        <div className="pt-2">
          {isEditingTitle ? (
            <form onSubmit={handleSaveTitle} className="flex items-center gap-2 max-w-md">
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                className="flex-1 rounded-lg px-3 py-2 text-sm outline-none border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-primary)] focus:border-[var(--accent)]"
                autoFocus
              />
              <button
                type="submit"
                disabled={isSavingTitle || !titleInput.trim()}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[var(--accent)] text-white dark:text-zinc-950 disabled:opacity-50"
              >
                {isSavingTitle ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditingTitle(false);
                  setTitleInput(title);
                }}
                className="px-3 py-2 rounded-lg text-xs font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Cancel
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]">
              <div>
                <span className="text-[11px] font-mono uppercase text-[var(--text-muted)] block">
                  Challenge Title
                </span>
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingTitle(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <PencilSimple size={13} />
                <span>Rename</span>
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-mono text-[var(--text-secondary)]">
          <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]">
            <span className="text-[10px] uppercase text-[var(--text-muted)] block mb-1">
              Start Date
            </span>
            <span>{new Date(startDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
          </div>
          <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]">
            <span className="text-[10px] uppercase text-[var(--text-muted)] block mb-1">
              Pacing Model
            </span>
            <span>{totalDays !== null ? `Fixed length (${totalDays} days)` : "Open-ended (Continuous daily log)"}</span>
          </div>
        </div>
      </section>

      {/* ── Section 2: Auto-Repeating Daily Tasks ────────────────────────────── */}
      <section className="card p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ArrowsClockwise size={16} className="text-[var(--accent)]" />
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Auto-Repeating Daily Tasks
              </h2>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
              Define recurring daily habits. Each day receives an independent fresh task on its board.
            </p>
          </div>

          {!isCreatingRt && (
            <button
              type="button"
              onClick={() => setIsCreatingRt(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent)] text-white dark:text-zinc-950 transition-opacity hover:opacity-90 self-start sm:self-auto cursor-pointer"
            >
              <Plus size={13} weight="bold" />
              <span>New template</span>
            </button>
          )}
        </div>

        {/* Inline Recurring Task Creator */}
        {isCreatingRt && (
          <form
            onSubmit={handleCreateRecurringTask}
            className="p-4 rounded-xl border border-[var(--accent)] bg-[var(--surface-2)] flex flex-col gap-3.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--accent)]">
                New Recurring Task Template
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingRt(false);
                  setNewRtTitle("");
                  setNewRtTagIds([]);
                }}
                className="p-1 text-zinc-400 hover:text-zinc-200"
              >
                <X size={14} />
              </button>
            </div>

            <input
              type="text"
              value={newRtTitle}
              onChange={(e) => setNewRtTitle(e.target.value)}
              placeholder="e.g. 2 DSA questions, 30 min reading, workout..."
              className="w-full rounded-lg px-3.5 py-2 text-sm outline-none border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-primary)] focus:border-[var(--accent)]"
              autoFocus
            />

            {/* Tag Selection */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-mono text-zinc-400">Default tags (optional)</span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {availableTags.map((t) => {
                  const isSelected = newRtTagIds.includes(t.id);
                  return (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => {
                        setNewRtTagIds((prev) =>
                          isSelected ? prev.filter((id) => id !== t.id) : [...prev, t.id]
                        );
                      }}
                      className={`text-[11px] font-mono px-2 py-0.5 rounded border transition-colors ${
                        isSelected
                          ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--surface-3)]"
                          : "border-[var(--border)] text-zinc-400 hover:text-zinc-200 bg-[var(--surface-1)]"
                      }`}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>

              {/* Add custom tag */}
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="New tag..."
                  className="rounded px-2 py-1 text-xs outline-none font-mono border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-primary)]"
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

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => {
                  setIsCreatingRt(false);
                  setNewRtTitle("");
                  setNewRtTagIds([]);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newRtTitle.trim() || isSubmittingRt}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[var(--accent)] text-white dark:text-zinc-950 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmittingRt && <SpinnerGap size={13} className="animate-spin" />}
                <span>{isSubmittingRt ? "Creating..." : "Save template"}</span>
              </button>
            </div>
          </form>
        )}

        {/* Recurring Tasks List */}
        {recurringTasks.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] flex flex-col items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--surface-3)] text-[var(--accent)]">
              <Sparkle size={16} weight="fill" />
            </div>
            <p className="text-xs font-semibold text-[var(--text-primary)]">
              No recurring tasks defined
            </p>
            <p className="text-xs text-[var(--text-muted)] max-w-sm leading-relaxed">
              Add recurring daily habits to automatically instantiate them onto each day&apos;s Kanban board without manual entry.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--surface-1)]">
            {recurringTasks.map((rt) => {
              const isEditingThis = editingRtId === rt.id;

              if (isEditingThis) {
                return (
                  <form
                    key={rt.id}
                    onSubmit={handleSaveRtEdit}
                    className="p-4 bg-[var(--surface-2)] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-wider text-[var(--accent)]">
                        Edit Template
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingRtId(null)}
                        className="p-1 text-zinc-400 hover:text-zinc-200"
                      >
                        <X size={13} />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={editingRtTitle}
                      onChange={(e) => setEditingRtTitle(e.target.value)}
                      className="w-full rounded-lg px-3 py-1.5 text-sm outline-none border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-primary)] focus:border-[var(--accent)]"
                      autoFocus
                    />

                    {/* Tag editing */}
                    <div className="flex flex-wrap gap-1.5">
                      {availableTags.map((t) => {
                        const isSelected = editingRtTagIds.includes(t.id);
                        return (
                          <button
                            type="button"
                            key={t.id}
                            onClick={() => {
                              setEditingRtTagIds((prev) =>
                                isSelected ? prev.filter((id) => id !== t.id) : [...prev, t.id]
                              );
                            }}
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                              isSelected
                                ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--surface-3)]"
                                : "border-[var(--border)] text-zinc-400 bg-[var(--surface-1)]"
                            }`}
                          >
                            {t.name}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                      <button
                        type="button"
                        onClick={() => setEditingRtId(null)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!editingRtTitle.trim() || isSavingRtEdit}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--accent)] text-white dark:text-zinc-950 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {isSavingRtEdit && <SpinnerGap size={12} className="animate-spin" />}
                        <span>Save</span>
                      </button>
                    </div>
                  </form>
                );
              }

              return (
                <div
                  key={rt.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    !rt.isActive ? "opacity-60 bg-[var(--surface-2)]/40" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <ArrowsClockwise
                        size={14}
                        className={rt.isActive ? "text-[var(--accent)]" : "text-zinc-500"}
                      />
                      <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {rt.title}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          rt.isActive
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                            : "bg-zinc-500/10 text-zinc-500 border border-zinc-500/30"
                        }`}
                      >
                        {rt.isActive ? "Active" : "Paused"}
                      </span>
                    </div>

                    {rt.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {rt.tags.map(({ tag }) => (
                          <span
                            key={tag.id}
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border)]"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => startEditingRt(rt)}
                      className="p-1.5 rounded-md border border-[var(--border)] bg-[var(--surface-2)] text-zinc-400 hover:text-zinc-200 transition-colors"
                      title="Edit template title or tags"
                    >
                      <PencilSimple size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleRtActive(rt)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[var(--border)] bg-[var(--surface-2)] text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                    >
                      {rt.isActive ? (
                        <>
                          <ToggleRight size={17} weight="fill" className="text-emerald-500" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft size={17} weight="fill" className="text-zinc-500" />
                          <span>Paused</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
