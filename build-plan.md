# Challenge Tracker — Full Build Plan

## What this is

A platform where someone commits to a challenge (100 Days of Code, Winter Arc, etc.), plans daily tasks on a Kanban board, and gets a GitHub-style heatmap, a streak, and a weekly leaderboard driven by how much of each day's board they actually complete. A Notion-style sheet gives a read view over the same data for reviewing history.

**Stack:** Next.js 14 (App Router, TypeScript) · Prisma · PostgreSQL · Clerk (auth)

**The one idea everything else follows from:** a day's `Log` row is a *cached summary* of its `Task` rows. Nothing about completion, streaks, or points is entered directly — it's all derived from tasks moving through the Kanban board, recomputed on every status change. The only thing a user ever types directly into a day is the optional `note`.

---

## Phase 0 — Environment setup

Goal: a running app with auth and a database, nothing else.

1. Scaffold Next.js (`create-next-app`, TypeScript, App Router, Tailwind).
2. Provision Postgres (Neon/Supabase/Railway).
3. Install Prisma, point `DATABASE_URL` at it.
4. Write and migrate the finalized schema (`schema.prisma` — already done, v2 with Task/Log/Tag/PointsLedger).
5. Set up Clerk: install SDK, wrap root layout in `ClerkProvider`, add `middleware.ts` protecting `/dashboard`, `/challenges`, `/leaderboard`, and their `/api` equivalents.
6. Build and test the Clerk webhook (`user.created` → insert `User` row) — verify with `svix` signature check before trusting the payload.
7. Seed preset tags (`DSA`, `Project`, `Reading`, `Gym`, etc.) via `prisma db seed`.
8. Manual smoke test: sign up → confirm a `User` row appears in Prisma Studio.

**Exit criteria:** you can sign up, and a real `User` row exists in the database.

---

## Phase 1 — Challenge lifecycle (backend)

Goal: creating a challenge pre-populates every day it needs.

1. `POST /api/challenges` — on create, in one transaction: insert the `Challenge`, then bulk-insert one `Log` row per day (`dayNumber` 1..totalDays, `date = startDate + dayNumber - 1`, `tasksTotal/tasksDone/completionPct` all zero).
2. `GET /api/challenges` — list with per-challenge progress (days elapsed, current streak).
3. `GET /api/challenges/[id]` — full detail including all `Log` rows.
4. `PATCH /api/challenges/[id]` — title/status only; explicitly reject changes to `totalDays`/`startDate` post-creation (would desync day numbering).
5. `DELETE /api/challenges/[id]` — cascade handles the rest.

**Exit criteria:** creating a challenge in Postman/Prisma Studio immediately produces the full set of `Log` rows.

---

## Phase 2 — Tasks, the Kanban engine, and the recompute pipeline

Goal: the actual gameplay loop. This is the highest-risk phase — get it right before building any UI against it.

1. `POST /api/logs/[logId]/tasks` — create a task (title, optional tags) under a specific day. Reject if the log's `date` is in the past (locked — no editing history).
2. `PATCH /api/tasks/[taskId]` — the core mutation: change `status` (drag between Kanban columns) and/or tags. On every status change, in one transaction:
   - Recompute `tasksTotal`, `tasksDone`, `completionPct` on the parent `Log`.
   - Recompute the challenge's `currentStreak`/`longestStreak` (>0% completion keeps the streak alive, per your rule — write this as a shared function, not inline).
   - Upsert the `PointsLedger` row for `(logId, reason: "daily_completion")` with `points = round(completionPct / 100 * BASE_POINTS_PER_DAY)`.
   - If a streak milestone (7/30/100) was just hit, check for an existing bonus row for this challenge+reason before inserting one (no DB constraint covers this one, per the schema notes).
3. `DELETE /api/tasks/[taskId]` — same recompute pipeline runs afterward.
4. `PATCH /api/logs/[logId]` — the one manual write path: the `note` field only.
5. `GET /api/logs/[logId]` — a day's full task list, for both the Kanban board and the sheet row to consume.

**Exit criteria:** dragging a task to Done in a manual API test call updates completion %, streak, and points ledger correctly — verify all three before writing a single line of frontend.

---

## Phase 3 — Tags, leaderboard, public data

1. `GET/POST /api/tags` — preset + user's own, case-insensitive dedup on create.
2. `GET /api/leaderboard` — group `PointsLedger` by user for the current ISO week, sum points, return top N plus the requester's own rank even if outside it.
3. Decide and implement the composite score display (base + streak + capped note/tag bonus) with a visible breakdown, not just a final number.

**Exit criteria:** the leaderboard reflects real point totals and doesn't silently drop the current user if they're ranked 50th.

---

## Phase 4 — Frontend: the home experience (heatmap-first)

1. Dashboard: active challenges as cards, each with a compact heatmap preview and current streak.
2. Challenge detail page's heatmap: full grid, color intensity mapped to `completionPct` (not binary) — this is the "aliveness" moment, worth the extra design pass.
3. Clicking a day cell opens today's Kanban board (only "today" is ever interactive; past days render read-only).

**Exit criteria:** the heatmap visually distinguishes a 20%-done day from a 100%-done day, not just logged-vs-not.

---

## Phase 5 — Frontend: the Kanban board

1. Three columns (To Do / In Progress / Done) scoped to the current day only.
2. Drag-and-drop with optimistic UI — the completion % and heatmap cell should update the instant a task lands in Done, not after a round trip.
3. Inline task creation with a tag picker (reuse the tags endpoint).
4. Empty state for a fresh day: an invitation to add the first task, not a blank board.

**Exit criteria:** a full day's loop — add tasks, drag them across, watch the heatmap cell fill in — works without a page reload.

---

## Phase 6 — Frontend: the sheet view

1. Table with columns: Day, Tasks Scheduled, Tasks Completed, Tags (distinct, from completed tasks only), Notes.
2. Every column but Notes is read-only, pulled straight from `Log`/`Task` data — no separate write path.
3. Notes column is the one inline-editable cell, autosaving via `PATCH /api/logs/[logId]`.

**Exit criteria:** the sheet and the heatmap never disagree, because they're reading the same `Log` rows.

---

## Phase 7 — Leaderboard & public profile pages

1. Leaderboard page: ranked list, current week clearly labeled, user's own position always visible.
2. Public profile (`/profile/[username]`): unauthenticated, read-only, challenges rendered as a timeline/feed of days rather than a raw table — this is the one place the "journal feed" idea from earlier gets used.

**Exit criteria:** a signed-out visitor can view a shared profile URL and see a coherent story of someone's progress.

---

## Phase 8 — Polish pass

1. Design pass on tone: playful only in the heatmap/streak/task-completion moments, calm everywhere else (nav, forms, settings) — per the frontend design direction already agreed on.
2. Loading skeletons and in-voice error states on every data-fetching screen.
3. Mobile responsiveness end to end, not just the marketing page.
4. `prefers-reduced-motion` respected on any heatmap/task-completion animation.
5. Keyboard focus visible on every interactive element, including Kanban cards and heatmap cells.

---

## Phase 9 — Backfill, seed data, and deploy

1. If any test challenges exist from earlier prototyping under the old (non-Kanban) model, write a one-time migration script — don't hand-patch data.
2. Seed a demo account with a few weeks of realistic task history so the leaderboard and heatmap aren't empty on first deploy.
3. Deploy (Vercel is the natural fit for Next.js + Postgres via Neon/Supabase).
4. Point the Clerk webhook at the production URL and re-verify the signature check works against real traffic, not just local testing.

---

## Heads-up before you start handing this to a coding tool

The two extensive prompts built earlier in this project (`api-routes-prompt.md` and `frontend-prompt.md`) were written against the **old checkbox/table model** — they predate the Kanban pivot and reference routes like `POST /api/challenges/[id]/logs` that no longer match this schema. Don't hand those to a coding tool as-is; they'll produce code that contradicts the plan above. Say so when you're ready and I'll rewrite both against this final architecture before you use them.
