# Audit Readiness Checklist — One Week

> **The job, in one sentence:** auditors open the app, browse site → building → floor, and verify
> every CCTV camera is online (green) or offline (red). Read-only. That's the whole MVP.
> **Scope of this week:** make that *reliable and trustworthy*. Nothing else.
>
> **Last reviewed:** `2026-05-31 (ICT)` ← bump this every time you touch the file
> **Reviewed by:** Ran
> **Audit target date:** `____` ← fill in; everything below is sized to one week before it

---

## Tag legend

| Tag | Meaning |
|---|---|
| **[CRITICAL]** | The audit is wrong/broken/untrustworthy without this. Do first. |
| **[STRONG]** | Real value, low risk. Do it. |
| **[WEAK]** | Cosmetic or low-impact *for the audit specifically*. Do only if time remains. |

Owner key: **FE** = frontend · **BE** = backend · **BOTH** = needs both branches.

---

## ⚠️ The thing most likely to sink the audit isn't on the original P1–P6 list — [CRITICAL]

**A green dot the auditor trusts must mean "online *right now*."** Your status comes from a Python
PingService running on a VM. If that process is stalled, dead, or the VM has lost its network path
to the camera subnet, the app will cheerfully show green for cameras that died hours ago. **A
stale-but-green camera is the single worst possible audit outcome** — worse than any misaligned
icon, because it's a confident lie. Two checklist items below (freshness verification + last-seen
timestamp) exist for this and are ranked above the cosmetic floor-plan fix on purpose.

**Second opinion you should weigh: the audit may not need the floor plan at all.** "Verify *every*
camera" is a completeness question, and a flat filterable table ("show offline only", with an
online/offline count) answers "did I check everything?" far better than per-floor diagrams — and
it has no positions to misalign or lose. I've put that table first. If it lands, **P1 and P5 drop
from blocking to cosmetic for the audit.** Build the robust thing, then prettify if there's time.

---

## The week — in priority order

### Day 1–2 — Make status trustworthy (the real audit risk)

- [ ] **[CRITICAL] (BOTH) Verify the PingService VM is running, current, and reachable.**
  Confirm: the pinger is a supervised service that survives a VM reboot and an operator logout (not
  a script in an SSH/RDP session); the VM is always-on (not on a cost-saving auto-shutdown); it has
  a working network path to the camera subnet; how long a full ping sweep takes vs the interval; and
  what the newest `last_seen` across all cameras is right now. If the freshest ping is hours old,
  *stop and fix this before anything else* — the rest of the audit is theater otherwise.
  *My take:* this is the highest-leverage hour of the week and it's invisible, so it gets skipped.
  Don't skip it. (Full VM verification list: `docs/FIXES_AND_ADDITIONS.md` → H4.)

- [ ] **[CRITICAL] (BE) Return `last_seen` / `last_checked` on the camera GET.**
  If it isn't in the SELECT, add it (same class of bug as P5). Contract it first
  (`F9/contracts/GET_api-cameras.md`).

- [ ] **[CRITICAL] (FE) Show `last_seen` next to every camera status, and flag stale.**
  e.g. "online · checked 2 min ago" in green; if `now - last_seen > 2 × ping_interval`, render the
  row/dot as **stale** (amber, not green). An auditor must be able to distinguish "verified online"
  from "haven't heard from it lately."

### Day 2–3 — Build the actual audit surface

- [ ] **[CRITICAL] (FE) Flat "Audit View": one table of every camera in the company.**
  Columns: Site · Building · Floor · Camera · IP · Status · Last seen. Plus a header showing
  **total / online / offline / stale counts**, and a **"show offline only"** filter.
  *My take:* this is the deliverable. It's robust, it's the showpiece for non-auditors too, and it
  makes the floor-plan bugs cosmetic. Do this before touching pixel alignment.

- [ ] **[STRONG] (FE) "Export / print" the audit view** (CSV or print-to-PDF).
  Auditors love taking evidence away. One button. Low effort, high credibility.

### Day 1 (parallel, trivial) — Clear the silent-failure landmines

- [ ] **[STRONG] (BE) Run the topology migration (P6).**
  `ALTER TABLE [dbo].[sites] ADD [topology_x] FLOAT NULL, [topology_y] FLOAT NULL;`
  *My take:* near-zero audit value (topology isn't on the audit path), but it's a 30-second
  one-liner that stops the topology page erroring silently. Do it and forget it.
  **Bigger fix it points to:** put this on EF Core migrations so you never hand-run ALTER TABLE
  against prod again — see `docs/FIXES_AND_ADDITIONS.md`.

- [ ] **[STRONG] (BE) Add `position_x` / `position_y` to the cameras SELECT (P5).**
  ~1 hour. Removes the localStorage fallback hack. Contract it
  (`F9/contracts/GET_api-cameras.md` already covers this).

- [ ] **[CRITICAL] (FE) Delete the localStorage position crutch once P5 lands.**
  *My take:* the hack "works," which is exactly why it's dangerous — left in, it calcifies into
  your persistence layer and breaks on every new machine/browser-clear. Rip it out the day the API
  returns the real fields. Tracked as its own item so it doesn't get forgotten.

### Day 3–4 — Polish (only after the above)

- [ ] **[WEAK] (FE) Fix P1: camera icon ↔ status indicator misalignment.**
  CSS positioning in `FloorPlanPage.tsx` / `floor.css`. Half a day.
  *My take:* marked [WEAK] **for the audit** on purpose. If the Audit View table is the surface
  auditors use, this is cosmetic. It matters for the demo's polish, not for audit correctness.
  Don't let it eat the days that should go to freshness + the table.

### Day 4–5 — Calibrate trust before the auditors do

- [ ] **[CRITICAL] (BOTH) End-to-end spot check.**
  Pick ~5 cameras. Physically/logically confirm reality (unplug one, watch it go red within
  `interval × 3`; confirm a known-good one is green). If the app's status disagrees with reality,
  you found it before the auditor did. *This is the dress rehearsal for Phase 3's hardware test —
  do a mini version now.*

- [ ] **[CRITICAL] (FE/docs) Write down that P2 / P3 / P4 are OUT of scope this week.**
  Put one line in `F9/` and `DEV.md`. *My take:* the cheapest item here and one of the most
  important — the LEARNING_LOG already shows this team drifts onto shiny features. Naming the
  shelf in writing stops both branches wandering into CRUD/rack/satellite-map mid-week.

---

## Flat audit table (at-a-glance — same tasks, sortable view)

| # | Task | Owner | Effort | Tag | Blocked on | Done |
|---|---|---|---|---|---|---|
| 1 | Verify PingService running + status freshness | BOTH | 1 hr | [CRITICAL] | — | ☐ |
| 2 | Return `last_seen` on camera GET | BE | 30 min | [CRITICAL] | contract sign-off | ☐ |
| 3 | Show `last_seen` + stale flag on status | FE | 2–3 hr | [CRITICAL] | #2 | ☐ |
| 4 | Flat Audit View table + counts + offline filter | FE | 0.5–1 day | [CRITICAL] | — | ☐ |
| 5 | Export/print audit view | FE | 1–2 hr | [STRONG] | #4 | ☐ |
| 6 | Run topology SQL migration (P6) | BE | 5 min | [STRONG] | SSMS access | ☐ |
| 7 | Add `position_x/y` to cameras SELECT (P5) | BE | 1 hr | [STRONG] | contract sign-off | ☐ |
| 8 | Delete localStorage position crutch | FE | 1 hr | [CRITICAL] | #7 | ☐ |
| 9 | Fix P1 icon/status misalignment | FE | 0.5 day | [WEAK] | — | ☐ |
| 10 | End-to-end spot check (mini hardware test) | BOTH | 2–3 hr | [CRITICAL] | 1 camera + switch | ☐ |
| 11 | Write P2/P3/P4 "out of scope" note | FE | 10 min | [CRITICAL] | — | ☐ |

---

## What I am explicitly telling you NOT to do this week — [CRITICAL]

- **No CRUD wiring (P2 / 4A).** The audit is read-only. Every hour on Add/Edit/Delete is an hour
  stolen from making status trustworthy.
- **No satellite map (P3 / 4B).** It's empty anyway (no lat/lng), and it's irrelevant to "is this
  camera online." Pure scope creep against the audit.
- **No rack U-position (P4 / 4C).** Same — and its schema isn't even ready (see roadmap/fixes).

If you finish everything above with days to spare, the highest-value next move is **not** a feature
— it's pulling Phase 3's alert hardware test forward (it has no code dependency and validates the
whole premise). See `docs/plan/ROADMAP_V2.md`.
