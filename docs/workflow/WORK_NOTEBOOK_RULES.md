# WORK_NOTEBOOK_RULES.md — Strict rules for the work notebook

> **Owner:** Ran
> **Companion files:** MACHINE_RULES.md, SESSION_PROTOCOL.md
> **Last updated:** 2026-05-18 (lunch session, work notebook)
> **Branch:** Lives on `master` only — must NEVER appear on `work-safe`

## Purpose

Even when the company appears uninterested in interns, risk comes from three independent sources:
1. Automated systems (DLP, endpoint monitoring, network logs)
2. Accidental exposure (shoulder surfing, screen share, IT remote support)
3. Future audits (security incidents, end-of-internship review, reference checks)

This file locks personal behavior on the work notebook to prevent long-term career, legal, and reputation damage that may surface months or years later.

## Two independent risk dimensions

| Risk | Source | Mitigation |
|---|---|---|
| **Risk A — Disk persistence** | Personal files sit on company-owned hardware | Never create personal .md on work disk; use orphan branch `work-safe` |
| **Risk B — Network monitoring** | Traffic flows through company WiFi gateway | Use mobile hotspot for personal AI topics |

Avoiding only one is insufficient. Both must be addressed.

## Rules (non-negotiable)

### Rule 1 — Branch isolation (orphan branch)
- Work notebook: only `work-safe` branch (orphan, no master history)
- Home laptop: full `master` branch
- Clone on work notebook with:
  ```
  gh repo clone runsyu37/network-intel-assistant -- --branch work-safe --single-branch
  ```
- Never `git checkout master` on work notebook
- Verify after clone:
  ```
  git branch -a              # should show only work-safe
  git log --all --oneline    # should show only work-safe commits, no master history
  ls                         # should NOT show ABOUT_ME.md, ROADMAP.md, HANDOVER.md, WORK_NOTEBOOK_RULES.md, LEARNING_LOG.md
  ```

### Rule 2 — No personal AI chat on company WiFi
Personal topics that must NOT touch any AI service while on company WiFi:
- Scholarship / master degree planning
- Job hunting / career outside this company
- Personal investing / trading
- CV / SOP / cover letter drafting
- Long-term plans away from this employer

→ Switch to mobile hotspot BEFORE opening any AI chat for these topics.
→ Or wait until home.

### Rule 3 — No personal .md files on work disk
ABOUT_ME.md, ROADMAP.md, HANDOVER.md, WORK_NOTEBOOK_RULES.md, LEARNING_LOG.md, and any personally-themed file must NEVER exist as files in any folder on the work notebook.

If accidentally created or pulled: `rm` immediately + `git checkout work-safe` + verify with `ls`.

### Rule 4 — Screen lock discipline
- `Win+L` every time leaving the desk (even 30 seconds)
- Never screen-share during a meeting without closing personal windows first
- Position monitor away from walkway and coworker line-of-sight
- Consider a privacy filter screen if budget allows

### Rule 5 — Content transfer protocol (work → home)
When personal AI content must travel from work to home:
1. Switch work notebook to mobile hotspot
2. Get content in CHAT (not as a file on work disk)
3. Email content to self as Gmail draft (no file on disk)
4. At home, retrieve from Gmail and create files locally

### Rule 6 — Technical progress tracking on work notebook
Since `HANDOVER.md` is forbidden on work-safe, use `WORK_PROGRESS.md` instead:
- Contains: which STEP is current, which files were touched, what's next
- Forbidden: any mention of career goals, scholarship plans, investing, or non-work topics
- Synced back to master's HANDOVER.md manually at home

### Rule 7 — End-of-internship cleanup (October 2026)
Before returning the work notebook:
- `rmdir /S C:\ai-playground\` (delete all AI playground content)
- Empty Recycle Bin (or `Shift+Delete` to bypass it)
- Clear browser history for personal sites
- Clear AI chat app cache / local sessions
- Sign out of personal Gmail, GitHub, Anthropic accounts
- Optional: BleachBit or similar tool to wipe free space

## What's allowed on work notebook

- Running `sanitize.py` offline (no AI, no internet) — Phase B of the project
- Reading `work-safe` branch files (sanitizer code, samples, tests only)
- General internship work unrelated to personal AI
- Claude Code on `work-safe` branch with technical questions only (no personal context)

## What's forbidden on work notebook

- Opening Claude Code / Claude.ai / ChatGPT for personal topics over company WiFi
- Storing ABOUT_ME.md, ROADMAP.md, HANDOVER.md, LEARNING_LOG.md, WORK_NOTEBOOK_RULES.md, or any personal planning .md
- Cloning the full `master` branch
- Running `git checkout master`, `git fetch origin master:master`, or any command that pulls master content
- Pushing personal .md edits from work notebook

## Verification commands (run on work notebook before every session)

```
# Confirm only work-safe branch is local
git branch
# Expected: * work-safe (no master listed)

# Confirm no personal files in working directory
ls ABOUT_ME.md ROADMAP.md HANDOVER.md LEARNING_LOG.md WORK_NOTEBOOK_RULES.md 2>nul
# Expected: all "not found" or empty output

# Confirm history doesn't contain personal files
git log --all --full-history -- ABOUT_ME.md
# Expected: empty output (no commits touched it on work-safe)
```

If any of these fail → STOP. Re-clone the repo cleanly with `--single-branch --branch work-safe`.

## Why these rules exist (real risks)

1. **Automated DLP/endpoint alerts** flag unusual AI traffic patterns
2. **Coworker / supervisor accidentally sees** personal plans on screen
3. **IT remote support** session reveals open Claude Code window
4. **End-of-internship offboarding audit** images the disk and reviews files
5. **Security incident audit** later pulls 90-day logs retroactively
6. **Recommendation letter quality** degraded if supervisor sees career plans
7. **Reputation in Thai network engineering community** is small and connected
8. **Contract violation risk** (Acceptable Use Policy, conflict of interest, IP assignment, NDA)

## Rule 0 (overrides all others)

> **If unsure whether something is safe to do on the work notebook → don't do it. Wait until home.**

The 18 hours of evening + weekend time at home are enough for everything personal. The only thing that genuinely needs the work notebook is running `sanitize.py` on real company data offline.

---

*End of WORK_NOTEBOOK_RULES.md*
