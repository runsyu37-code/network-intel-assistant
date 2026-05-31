# LEARNING_LOG.md — Continuous Improvement Journal

> **Purpose:** Capture every error, every "better way" discovered, and every end-of-task retrospective in one place. Over time this file becomes the most valuable artifact in the project — it's the record of how Ran actually learned and what could be done differently.
> **Owner:** Ran
> **Maintained by:** Both me and any Claude Code session working on this project.

---

## How this file works

This is a **living log**, append-only (no deletes). It has three sections:

| Section | When to append | Who writes it |
|---|---|---|
| **1. Error Log** | Whenever something breaks, errors out, or behaves unexpectedly | Claude Code in real-time, OR Ran manually |
| **2. Improvements** | When a "better way" is discovered mid-work | Claude Code when proposing it, OR Ran when noticing |
| **3. Retrospectives** | After every major milestone (e.g., end of a STEP group, end of a sub-agent) | Claude Code prompted, Ran reviews |

**Rule:** Entries are timestamped (ICT), in plain English (so portfolio readers can understand), and short. Long stories belong in the project README. This file is for facts and lessons.

---

## Section 1 — Error Log

> **Append a new `### ERR-<NNN>` block for every error.** Number sequentially. Never delete past entries — they're proof of growth.

### Template (copy this when adding a new entry)

```markdown
### ERR-001 — <one-line title>

- **Date/time (ICT):** YYYY-MM-DD HH:MM
- **STEP / context:** STEP X of SANITIZER_PROMPT, or "ad-hoc"
- **Machine:** home laptop / work notebook
- **What happened:** The literal error message OR a 1-sentence description of unexpected behavior.
- **Root cause:** Why did this happen? (Don't guess — verify if possible.)
- **Fix applied:** Exact commands or code change that resolved it.
- **Prevention:** What rule/check/test would have caught this earlier?
- **Effort to debug:** quick (<5 min) / medium (5–30 min) / long (>30 min)
- **Tags:** `#git` `#python` `#claude-code` `#network` `#data-privacy` (whatever applies)
```

### Entries

---

### ERR-001 — retroactive: git commit failed — user identity not configured

- **Date/time (ICT):** 2026-05-17 (evening session, STEP 2)
- **STEP / context:** STEP 2 — Teach git basics by doing
- **Machine:** home laptop
- **What happened:** `git commit` exited with code 128: `Author identity unknown — Please tell me who you are. Run git config --global user.email / user.name`
- **Root cause:** `git config --global` had never been run on this machine. Git requires author identity before the very first commit.
- **Fix applied:** `git config --global user.name "Ran"` and `git config --global user.email "runsyu37@gmail.com"`
- **Prevention:** Add a git identity check (`git config user.name`) to the STEP 1 environment verification, alongside `python --version` and `git --version`.
- **Effort to debug:** quick (<5 min)
- **Tags:** `#git`

---

### ERR-002 — retroactive: GitHub CLI not in PATH after winget installation

- **Date/time (ICT):** 2026-05-17 (evening session, STEP 2.5)
- **STEP / context:** STEP 2.5a — Install GitHub CLI
- **Machine:** home laptop
- **What happened:** After `winget install --id GitHub.cli` completed successfully, running `gh --version` in the same bash shell returned `gh: command not found` (exit 127).
- **Root cause:** `winget` writes the new binary path to the Windows PATH registry key, but the currently running shell process had already captured the old PATH at startup. Shell restart is needed to pick up the new PATH.
- **Fix applied:** Located `gh.exe` at `C:\Program Files\GitHub CLI\gh.exe` using PowerShell `Get-ChildItem`. Used full absolute path for all subsequent `gh` commands in this session.
- **Prevention:** After any `winget install`, remind Ran to open a new terminal window before running the newly installed tool. In STEP 2.5a instructions, add: *"หลัง winget install เสร็จ ให้เปิด terminal ใหม่ก่อนรัน gh"*
- **Effort to debug:** quick (<5 min)
- **Tags:** `#git` `#windows`

---

### ERR-003 — retroactive: UnicodeEncodeError printing → character on Windows terminal

- **Date/time (ICT):** 2026-05-17 (evening session, STEP 5)
- **STEP / context:** STEP 5 — Build the sanitizer, first smoke test run
- **Machine:** home laptop
- **What happened:** `sanitize.py` raised `UnicodeEncodeError: 'charmap' codec can't encode character '→' in position 38: character maps to <undefined>` when printing the summary line `Sanitized N IPs, N MACs, N hostnames → output\file.txt`.
- **Root cause:** Windows terminal defaults to CP1252 (Windows-1252) encoding. The `→` (U+2192 RIGHTWARDS ARROW) character is not in CP1252's code page, so `print()` fails when trying to encode it for stdout.
- **Fix applied:** Changed all `→` characters in `print()` calls inside `sanitize.py` to `->` (two ASCII characters).
- **Prevention:** Avoid non-ASCII characters in any `print()` / `sys.stderr.write()` output in scripts intended to run on Windows. ASCII-only stdout is a portability rule.
- **Effort to debug:** quick (<5 min)
- **Tags:** `#python` `#windows`

---

### ERR-004 — retroactive: output/*.txt files not in .gitignore — risked committing sanitized outputs

- **Date/time (ICT):** 2026-05-17 (evening session, STEP 5)
- **STEP / context:** STEP 5 — smoke test created output/test_0*.txt files
- **Machine:** home laptop
- **What happened:** The initial `.gitignore` only excluded `output/*.json`. Running the smoke test created `output/test_01.txt`, `test_02.txt`, `test_03.txt` — these appeared as untracked files and would have been committed by `git add -A`.
- **Root cause:** When writing the initial `.gitignore`, only JSON report files were considered. Plain `.txt` sanitized outputs were overlooked.
- **Fix applied:** Added `output/*.txt` to `.gitignore` immediately after discovering the untracked files.
- **Prevention:** When setting up `.gitignore` for a project with an `output/` directory, default to gitignoring ALL output file types (`output/*`), then whitelist only the `.gitkeep` placeholder. Simpler and safer than listing extensions one by one.
- **Effort to debug:** quick (<5 min)
- **Tags:** `#git` `#data-privacy`

---

### ERR-005 — retroactive: subnet mask 255.255.255.0 treated as IPv4 and replaced

- **Date/time (ICT):** 2026-05-17 (evening session, STEP 7)
- **STEP / context:** STEP 7 — end-to-end diff on fake_input_03.txt
- **Machine:** home laptop
- **What happened:** The line `ip address 203.0.113.12 255.255.255.0` in the config produced `ip address 10.0.0.1 10.0.0.2` in the output — the subnet mask `255.255.255.0` was matched by `IPV4_RE` and replaced with a fake IP.
- **Root cause:** The regex matches any syntactically valid IPv4 (each octet 0–255) without understanding semantic context. `255.255.255.0` is a valid IPv4 literal even though it's used as a subnet mask, not a device address.
- **Fix applied:** None — accepted as a known limitation and documented in README Limitations section.
- **Prevention (future):** A smarter approach would be to look at the surrounding keyword context (e.g., if preceded by `255.255` it's likely a mask). Alternatively, add a post-pass to restore known subnet masks. Queued as a potential IMP for a future version.
- **Effort to debug:** quick (<5 min) — noticed during diff walkthrough, not a runtime crash
- **Tags:** `#python` `#regex` `#network`

---

## Section 2 — Improvements

> **Append a new `### IMP-<NNN>` block when a better approach is discovered.** This is for "we could do X instead of Y and it would save time / reduce errors / be cleaner."

### Template

```markdown
### IMP-001 — <one-line title>

- **Date/time (ICT):** YYYY-MM-DD HH:MM
- **Context:** What we were doing when the better way appeared.
- **Old way:** What we were originally doing (1–2 sentences).
- **New way:** The improved approach.
- **Why it's better:** Choose one or more: faster / fewer errors / easier to maintain / safer / more portfolio-friendly / cheaper on quota.
- **Adopted?:** yes / partial / queued for later
- **Affected files / docs to update:** list them
- **Tags:** `#workflow` `#code` `#prompt-engineering` `#git` `#agent-design`
```

### Entries

---

### IMP-001 — retroactive: separate regex patterns into patterns.py instead of embedding in sanitize.py

- **Date/time (ICT):** 2026-05-17 (evening session, STEP 5)
- **Context:** Designing the sanitizer architecture before writing code.
- **Old way:** All regex patterns defined as module-level variables at the top of `sanitize.py`.
- **New way:** All patterns live in a dedicated `sanitizer/patterns.py` file imported by `sanitize.py`.
- **Why it's better:** easier to maintain — anyone extending the sanitizer edits only `patterns.py` without touching the logic. Also makes patterns independently testable and importable by unit tests.
- **Adopted?:** yes
- **Affected files / docs to update:** `sanitizer/patterns.py`, `sanitizer/sanitize.py`, `tests/test_sanitize.py`
- **Tags:** `#code` `#workflow`

---

### IMP-002 — retroactive: use default-argument capture (k=kind) in lambda to avoid Python closure bug

- **Date/time (ICT):** 2026-05-17 (evening session, STEP 5)
- **Context:** Writing the `sanitize()` method — iterating over `(pattern, kind)` pairs and passing a lambda to `re.sub`.
- **Old way:** `pat.sub(lambda m: self._fake_loc(m.group(), kind), text)` — `kind` is a loop variable captured by reference, so all lambdas would use the last value of `kind` after the loop ends.
- **New way:** `pat.sub(lambda m, k=kind: self._fake_loc(m.group(), k), text)` — `k=kind` binds the current value of `kind` at lambda creation time.
- **Why it's better:** prevents a subtle closure bug where all location types would be replaced with the label of the last type in the loop (e.g., everything becomes "stairwell"). Hard to debug because the regex still matches; only the replacement label is wrong.
- **Adopted?:** yes
- **Affected files / docs to update:** `sanitizer/sanitize.py` (line in `sanitize()` method)
- **Tags:** `#python` `#code`

---

### IMP-003 — retroactive: use output/* in .gitignore instead of listing extensions one by one

- **Date/time (ICT):** 2026-05-17 (evening session, STEP 5 — triggered by ERR-004)
- **Context:** Fixing the missing `output/*.txt` gitignore entry after the smoke test.
- **Old way:** `.gitignore` listed `output/*.json` only. Each new file type discovered during testing required a manual addition.
- **New way (proposed for next project):** Use `output/*` with a `!output/.gitkeep` negation to block everything except the placeholder. Zero-maintenance as new output types are added.
- **Why it's better:** fewer errors — no chance of forgetting a new extension. One rule covers all future output types automatically.
- **Adopted?:** partial — current project uses `output/*.json` and `output/*.txt`. The `output/*` approach is queued for the next sub-agent's setup.
- **Affected files / docs to update:** `.gitignore` (next project), `MACHINE_RULES.md` Rule 3 template
- **Tags:** `#git` `#workflow` `#data-privacy`

---

### IMP-004 — retroactive: replacement ordering (locations → hostnames → MACs → IPs) prevents false positives

- **Date/time (ICT):** 2026-05-17 (evening session, STEP 5)
- **Context:** Designing the `sanitize()` method's pass order.
- **Old way (naive):** Replace IPs first, then MACs, then hostnames, then locations — or apply all patterns in any order.
- **New way:** Fixed order: locations first (longest, most specific), then hostnames, then MACs, then IPs (shortest, most general).
- **Why it's better:** Prevents two classes of bugs: (1) a fake hostname like `Building-A` would match `HOSTNAME_RE` if hostnames ran before locations; (2) `re.sub` is single-pass so each pattern sees text already modified by earlier passes — putting more specific patterns first reduces the surface area for false matches.
- **Adopted?:** yes
- **Affected files / docs to update:** `sanitizer/sanitize.py` (`sanitize()` method comments)
- **Tags:** `#python` `#code` `#regex`

---

## Section 3 — Retrospectives

> **After every major milestone, write a `### RETRO-<NNN>` block.** A milestone is: end of a STEP group (e.g., STEPs 1–5 done), end of a sub-agent (e.g., sanitizer fully working), end of a month, or any other moment that feels like a natural stopping point.

### Template

```markdown
### RETRO-001 — <milestone title>

- **Date/time (ICT):** YYYY-MM-DD HH:MM
- **Milestone:** What was completed.
- **Time spent (rough):** X hours total, across N sessions.
- **What went well:** 3 bullet points.
- **What didn't go well:** 3 bullet points.
- **What I'd do differently next time:** 3 bullet points.
- **Knowledge gained:** New skills / concepts / tools learned.
- **Portfolio value:** What's now demoable / writeable about this milestone?
- **Top 1 action item for the next milestone:** Single most important thing to carry forward.
```

### Entries

---

### RETRO-001 — data-sanitizer-agent v0.1 complete (STEPs 1–10)

- **Date/time (ICT):** 2026-05-17 (evening)
- **Milestone:** data-sanitizer-agent v0.1 shipped — regex-based sanitizer with 24 passing tests, fake samples, full README, LEARNING_LOG, and all commits pushed to private GitHub repo.
- **Time spent (rough):** ~3–4 hours total, 1 session, home laptop.

- **What went well:**
  1. **24/24 tests passed on the first full run** — the test design (especially `TestNoLeakage`) caught real behavior correctly without needing a rewrite.
  2. **Checkpoint protocol worked perfectly** — every STEP was committed and pushed. The session could have been interrupted at any point and resumed on another machine with zero lost work.
  3. **Replacement ordering (locations → hostnames → MACs → IPs)** was designed correctly upfront — no false-positive bugs appeared during the end-to-end diff.

- **What didn't go well:**
  1. **git user identity not configured** (ERR-001) — blocked the very first commit and required a detour before STEP 2 could continue. Cost: ~3 minutes.
  2. **GitHub CLI not in PATH after winget install** (ERR-002) — required locating the exe manually and using the full path for the rest of the session. A new terminal window would have fixed it instantly.
  3. **255.255.255.0 subnet mask caught by IPV4_RE** (ERR-005) — not caught during design, only discovered at STEP 7 during the diff walkthrough. Should have been anticipated and noted in Limitations before writing the regex.

- **What I'd do differently next time:**
  1. Add `git config user.name` check to STEP 1's environment verification — run it right after `git --version`.
  2. After any `winget install`, always open a new terminal before using the new tool — add this as a rule to `MACHINE_RULES.md` or `SESSION_PROTOCOL.md`.
  3. Write the Limitations section of README *before* writing the sanitizer code — forces thinking about edge cases (subnet masks, base64, etc.) before the design is locked in.

- **Knowledge gained:**
  - Git workflow end-to-end: `init` → `add` → `commit` → `push` → `log` with real project context.
  - Python regex: word boundaries (`\b`), `re.sub` with lambda callbacks, closure capture with default args (`k=kind`).
  - GitHub CLI: `gh auth login`, `gh repo create --private --source=. --remote=origin`.
  - Data privacy architecture: Phase A (fake data + AI) / Phase B (offline on real data) / Phase C (sanitized output to AI) — a reusable pattern for any sensitive-data project.
  - Windows-specific gotchas: CP1252 encoding in terminal, PATH not refreshed after `winget install`.

- **Portfolio value:**
  - Working sanitizer (`sanitize.py` + `patterns.py`) with 24 unit tests — runnable by anyone who clones the repo.
  - Professional README with ASCII architecture diagram, before/after sample, and honest Limitations section.
  - LEARNING_LOG with 5 real errors and 4 improvements — shows engineering discipline, not just code.
  - Clean git history with Conventional Commits (`chore:`, `feat:`, `checkpoint(stepN):`) — readable by employers.

- **Top 1 action item for the next milestone:**
  Copy `sanitize.py`, `patterns.py`, and `mappings.json` to the work machine (via USB or company-approved transfer). Run Phase B: `python sanitize.py real_switch_output.txt output_clean.txt`. Confirm that the script handles real data correctly offline. Only after Phase B passes is it safe to move to the next sub-agent (`network-inventory-agent`).

---

### RETRO-002 — Surveillance Monitoring web app shipped (Phase 1 closed)

- **Date/time (ICT):** 2026-05-31 (evening)
- **Milestone:** The Surveillance Monitoring web app (SSM — Surveillance Smart-Monitor) reached demo-ready state: 13 routes, all pages wired to the real C# API, JWT login + RBAC (admin/user), React Flow topology with positions persisted to the API, building/floor/rack/device hierarchy drill-down, camera/NVR/switch list + detail pages, and per-floor camera positioning. Demo was delivered on/around 2026-05-30 — roughly **2 months ahead** of the original ~late-July deadline. This formally closes Phase 1 of the roadmap.
- **Time spent (rough):** ~5–6 weeks of internship project work (late April → 31 May 2026), across many sessions, mostly on the work notebook with Claude Code (Sonnet 4.6) as builder. Sanitizer sub-project (~3–4 hrs, home laptop) ran in parallel earlier.

- **What went well:**
  1. **Shipped early and complete.** The web app itself solved the data-collection pain point — the hierarchy UI + DB-backed inventory replaced the slow manual diagramming the original roadmap was panicking about. The thing that was "the bottleneck" on 2026-05-17 was gone by 2026-05-31.
  2. **Real API end-to-end, no mock data.** Every page is wired to `localhost:50680` via React Query + Axios. Login uses real JWT credentials with role-based access (Users page is admin-only). This is a genuine full-stack deliverable, not a prototype.
  3. **Git went from zero to daily fluency.** Ran now branches (`frontend`/`backend`/`master`), commits with Conventional Commits, pushes, and runs a PR workflow — the exact skill gap flagged as "Beginner — don't know git yet" in ABOUT_ME on 2026-05-17 is closed.

- **What didn't go well:**
  1. **The roadmap premise drifted silently.** The 2026-05-17 ROADMAP assumed the web app was stuck and that AI agents were needed to unblock it. Reality diverged weeks ago, but no one updated the plan until now — so the "north star" pointed at a problem that no longer existed.
  2. **Loose ends shipped with the demo.** Three items are still open: SQL migration (`ALTER TABLE sites ADD topology_x/y`) not yet run on SSMS, `GET /api/cameras` doesn't return `position_x/y` (forced a localStorage fallback hack), and buildings have `lat/lng = null` so the Building Map is empty. The demo works only because of fallbacks papering over these gaps.
  3. **Sanitizer Phase B never happened.** RETRO-001's single top action item — run `sanitize.py` on real switch data on the work machine — was never executed. It got crowded out by web-app work and is still outstanding.

- **What I'd do differently next time:**
  1. **Re-validate the roadmap's core premise at every milestone, not just at the end.** A 2-minute "is this still true?" check on the deadline/bottleneck assumptions would have caught the drift a month early.
  2. **Track backend dependencies as explicit blockers, not footnotes.** The `position_x/y` and `lat/lng` gaps should have been filed as named blockers (F9 R18) the day they were discovered, not discovered as "open items" at demo time.
  3. **Protect carried-over action items.** RETRO-001's Phase B item should have been put on a calendar / checklist so it didn't silently get dropped when a bigger task arrived.

- **Knowledge gained:**
  - Full-stack wiring: React 18 + Vite + TypeScript front-end against an ASP.NET Core (.NET 10) API, proxied via Vite, with React Query for server state and Zustand for auth/theme.
  - RBAC in a SPA: JWT in an auth store, role-gated routes and UI (admin-only Users page, admin-only drag-to-sort).
  - React Flow v11 for an interactive topology, including persisting node positions back to the API via `PATCH /api/sites/{id}/position` with a localStorage fallback.
  - Practical git/PR workflow on a multi-branch repo (frontend/backend/master), Conventional Commits, ultra code review with zero bugs found.
  - Front-end ↔ back-end coordination protocol (the `F9/` reply-log folder) for tracking cross-team API requests.

- **Portfolio value:**
  - A complete, demo-ready full-stack network-operations web app — the single strongest portfolio piece so far, far bigger than the sanitizer. Needs a sanitized public README, a 3–5 min demo video, and a case study to be portfolio-ready.
  - Demonstrates real network-engineering domain knowledge (CCTV / switch / NVR / rack / floor topology) combined with modern web dev — exactly the "networking + AI/dev" combination the portfolio is meant to show.
  - Clean multi-branch git history + the F9 coordination log show professional engineering discipline.

- **Top 1 action item for the next milestone:**
  Turn the web app into a real portfolio artifact: run the 3 outstanding fixes to clear the demo of fallbacks (SQL migration, backend `position_x/y`, building `lat/lng`), then produce a sanitized public README + a 3–5 min demo video + a short case study. This converts ~6 weeks of work into something showable to employers and scholarship committees — which the current private, work-only codebase is not.

---

## Section 4 — Other "after-task" artifacts (ideas to create later)

When a project or sub-agent is finished, these additional .md files are worth creating once. They are NOT continuous logs — each is written once per task.

| File | When to create | Purpose | Audience |
|---|---|---|---|
| `POSTMORTEM.md` | After a major bug or incident | Deep dive into one specific failure, blameless analysis | Internal / portfolio |
| `DEMO_SCRIPT.md` | Before recording a demo video | Word-for-word script + screen actions | Just me, to record cleanly |
| `CASE_STUDY.md` | After a sub-agent ships | Long-form portfolio piece: problem → approach → outcome → metrics | Employers, scholarship committees |
| `METRICS.md` | When the sub-agent has been used on real work | Quantified outcomes: "reduced data-collection time by X%" | Portfolio + resume |
| `HANDOFF.md` | When transferring work to a colleague or supervisor | What's done, what's left, how to run it | Internal team |
| `RUNBOOK.md` | When an agent runs in production | Step-by-step operational instructions, what to do when alerts fire | Future me, on-call |
| `INTERVIEW_NOTES.md` | When research/conversation feeds the agent design | User research, supervisor input, conversation summaries | Just me |
| `ROADMAP_NEXT.md` | At the end of the internship | Sequel project ideas based on what was learned | Future me |

**How to use this table:** Don't pre-create empty versions. Create each file the moment it becomes useful, using the template inside that file's first entry.

---

## Section 5 — Quick-reference cheat sheet (Claude Code triggers)

When working in Claude Code, use these short trigger phrases to update this log:

| Trigger phrase from Ran | What Claude Code does |
|---|---|
| *"log this error"* | Adds an `ERR-NNN` entry from the latest error in the conversation |
| *"log an improvement"* | Adds an `IMP-NNN` entry |
| *"write a retro"* | Adds a `RETRO-NNN` entry for the current milestone |
| *"summarize errors so far"* | Reads the Error Log section and produces a 1-paragraph Thai summary |
| *"what have I learned?"* | Reads all 3 sections and gives a Thai overview |

Claude Code should also proactively suggest adding entries when it notices:
- An error is debugged and fixed → "should we log this as ERR-NNN?"
- A pattern is reused 2+ times → "this might deserve an IMP-NNN entry"
- A STEP group of SANITIZER_PROMPT.md completes → "ready to write a RETRO?"

---

## Section 6 — Why this file matters

For Ran personally:
- **Memory.** In 3 months you won't remember the specifics of why Python 3.10 broke `gh repo create`. This file will.
- **Pattern recognition.** After 10 entries, recurring categories show up. That's where automation pays off.
- **Confidence calibration.** Comparing today's errors to last month's errors is the clearest proof that you're improving.

For the portfolio:
- This file is **showable**. Hiring managers love seeing real engineering discipline. Many candidates have GitHub repos; very few have a real LEARNING_LOG with dozens of debugged-and-documented errors.
- Once enough RETRO entries pile up, they can be turned into a blog post: *"What I learned building an AI co-worker over 5 months."*

For future AI assistants:
- This is the second-most important context file after `ABOUT_ME.md`. It tells the assistant which mistakes have already been made (so it doesn't repeat them) and which patterns work for me.

---

*End of LEARNING_LOG.md*
