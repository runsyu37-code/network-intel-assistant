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

*(Append retrospectives here.)*

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
