# SESSION_PROTOCOL.md — How to survive Claude Code session limits

> **Purpose:** Avoid losing progress when Claude Pro's 5-hour message window runs out mid-task, AND maximize usable quota by spanning work between two machines.
> **Audience:** Ran (and any future AI assistant resuming work).
> **Companion files:**
> - `MACHINE_RULES.md` — rules for the dual-machine setup (read first)
> - `LEARNING_LOG.md` — continuous error/improvement/retrospective journal (update throughout sessions)

---

## 1. The core rule

**Never have un-checkpointed work in the conversation.**
After every major STEP, push the progress out of the conversation and into files (HANDOVER.md, git commits, code on disk). That way, if the session dies, nothing important lives only in chat history.

---

## 2. Checkpoint protocol (do this every STEP)

After Claude Code finishes a STEP from `SANITIZER_PROMPT.md`, **before moving to the next step**, paste this in chat:

```
Before we continue, do these 4 things:
1. git add -A && git commit -m "checkpoint: <one-line summary of what we just did>"
2. Update or create HANDOVER.md at the project root with:
   - Date/time of this checkpoint (in Thai timezone, ICT)
   - The last STEP we completed (number + title)
   - The next STEP we need to do
   - Any open questions or decisions still pending
   - Any file or command the next session must re-read
3. Run `git status` so I can confirm everything is committed.
4. Explain in Thai what was just committed and why this checkpoint matters.
```

Why this works:
- **git commit** = code state is saved on disk, independent of chat
- **HANDOVER.md** = the *story* of the project is saved, also independent of chat
- Together, a fresh Claude Code session can read both and continue without losing context

---

## 3. The HANDOVER.md template

The first checkpoint should create `HANDOVER.md` at the project root using this template:

```markdown
# HANDOVER.md — Project resume notes

**Project:** network-intel-assistant
**Last checkpoint:** 2026-MM-DD HH:MM ICT
**Last completed step:** STEP X — <title>
**Next step to do:** STEP Y — <title>

## What's done so far
- bullet 1
- bullet 2

## Open questions / decisions pending
- (none, or list them)

## Files the next session must re-read first
1. ABOUT_ME.md
2. ROADMAP.md
3. SANITIZER_PROMPT.md
4. This file (HANDOVER.md)
5. Any code files mentioned below

## Code state
- Last commit: <commit message>
- Files touched this session: <list>

## Anything strange / blocking
- (note any errors, warnings, or things to investigate)
```

This file gets **updated** at every checkpoint, not replaced. Old entries can be archived to `HANDOVER_HISTORY.md` if it gets long.

---

## 4. When the limit hits mid-step

If Claude Code errors out or shows "rate limit exceeded" while in the middle of a step:

**Step A — Don't panic. Don't close the window.**
First, immediately check git status in a separate terminal:
```
git status
git diff
```
This shows you exactly what was changed but not yet committed.

**Step B — Manually commit whatever exists**
Even if the work is incomplete, commit it with a clear "WIP" message:
```
git add -A
git commit -m "wip: stopped mid-STEP-X due to session limit"
```

**Step C — Write a quick HANDOVER update manually**
Open `HANDOVER.md` in VS Code yourself (no AI needed) and add:
```
## Interrupted session
- Stopped on: 2026-MM-DD HH:MM ICT
- Mid-step: STEP X
- What was being worked on: <one sentence>
- What was incomplete: <one sentence>
```

**Step D — Wait for the limit to reset**
Claude Pro window is 5 hours from when it started. Use the wait time to:
- Read what was done so far in the code
- Plan questions for the next session
- Do offline work (file copying, drawing diagrams, etc.)

---

## 5. Resume prompt (paste this when starting a fresh session)

When the limit resets and you start Claude Code again, paste this as your FIRST message:

```
===== RESUME PASTE START =====

You are resuming a project. Before doing anything else:

1. Read these files in order:
   - ABOUT_ME.md
   - ROADMAP.md
   - SANITIZER_PROMPT.md (the master plan)
   - HANDOVER.md (the latest checkpoint state)

2. Run:
   - git log --oneline -20
   - git status

3. Tell me in Thai:
   - Where we left off (which STEP)
   - What was completed in the last session
   - What the next action is
   - Any open questions or blockers

4. Acknowledge the language rule: explain everything in Thai. I prompt in English but I cannot follow English explanations well.

5. Acknowledge the data rule: this is my personal machine, use fake/synthetic data only.

After confirming, wait for me to say "continue" before resuming work.

===== RESUME PASTE END =====
```

Save this prompt somewhere easy to find (e.g., as a bookmark or note) so you can grab it fast next time.

---

## 6. Compaction — the "/compact" command

Inside Claude Code there's a built-in slash command:
```
/compact
```
This compresses the conversation history into a summary so the context window doesn't fill up. Use it:
- Right after a major STEP is committed
- When you notice Claude starting to forget earlier instructions
- Before tackling a long sub-step

**Note:** `/compact` saves *context window space*, but it does NOT prevent hitting the 5-hour message limit. For that, only `git commit` + `HANDOVER.md` will save you.

---

## 7. Avoid these traps

- ❌ **Doing many STEPs without committing.** If session dies, you'll redo everything.
- ❌ **Letting Claude Code rewrite the same file 5 times before committing.** Each rewrite uses tokens. Commit between rewrites.
- ❌ **Running `/clear` mid-task.** This wipes context entirely. Only use `/clear` after a clean checkpoint.
- ❌ **Chatting casually with Claude inside the project session.** Every off-topic message eats your quota. Save chitchat for a separate session.
- ❌ **Re-pasting the whole SANITIZER_PROMPT.md every session.** Once it's read once, the resume prompt is enough.

---

## 8. Plan to not hit the limit at all

For the sanitizer project specifically:
- STEPs 1–4 (setup + samples) — small, ~30 min of Claude time
- STEP 5 (writing sanitize.py) — biggest chunk, ~1–2 hr of Claude time
- STEPs 6–10 (tests, run, README, commit) — ~1 hr

Total budget: ~3–4 hours of active Claude Code work, well within one 5-hour window IF you don't have the chat wander into tangents.

**Tip:** Try to finish STEPs 1–7 in ONE session, checkpoint, then come back later for 8–10 in a second session. The natural break is right after the tests pass.

---

## 9. If you ever feel lost

Paste this:
```
Read HANDOVER.md, then tell me in Thai: where are we, what's next, and what should I do right now? Don't write any code yet, just orient me.
```

---

## 10. Dual-Machine Strategy (work notebook + home laptop)

The work notebook is allowed to run Claude Code in `C:\ai-playground\` (see `MACHINE_RULES.md` for the rules). This lets us stretch usable Claude Pro time across the day instead of cramming it all into the evening.

### Why dual-machine helps quota

Claude Pro's 5-hour message window is **rolling** — usage in any 5-hour period is capped. By spreading work into two daily blocks (lunch + evening), each block uses its own window without stacking pressure, so the effective daily output is higher than one long evening session.

### The git-as-bridge pattern

Both machines `clone` the same private GitHub repo. The flow is:

```
Home laptop (evening)               Work notebook (lunch)
    |                                      |
    | git push                             |
    +────────►  GitHub repo  ◄────────────+
                  (private)                |
                                           | git pull → work → git push
                                           |
    git pull ◄─────────────────────────────+
```

The **golden rules** for git-as-bridge:

- Before opening Claude Code on a machine: `git pull` first. Always.
- Before walking away from a machine: `git push` last. Always.
- Each session ends with a checkpoint commit (see Section 2 above).
- If `git pull` shows a merge conflict, ask Claude Code: *"git pull gave me a merge conflict, walk me through the fix in Thai."*

### Three-folder discipline (critical)

| Folder | Purpose | Claude Code allowed? |
|---|---|---|
| `C:\work\` (on work notebook) | Real company data | ❌ NEVER |
| `C:\ai-playground\` (work notebook) | Sanitized project files | ✅ Yes |
| `D:\ai-playground\` (home laptop) | Same project, cloned via git | ✅ Yes |

Detail and full rules: `MACHINE_RULES.md` sections 2–3.

---

## 11. Daily Schedule Template

A concrete template for a typical Mon–Fri. Adjust to your reality.

| Time | Location | Activity | Tool | Quota cost |
|---|---|---|---|---|
| 06:30–07:30 | Home | `git pull` → review HANDOVER.md → plan today's STEP | Claude Code or just reading | Light |
| 08:00–11:50 | Office | Office work. Light Claude.ai web chat for planning, regex help, docs lookup when free. | Browser chat | Light |
| 12:00–12:55 | Office | Focused Claude Code session in `C:\ai-playground\`. One STEP per lunch. `git push` before standing up. | Claude Code (work notebook) | Medium-Heavy |
| 13:00–17:00 | Office | Office work. Light AI chat for ad-hoc questions only. | Browser chat | Light |
| 18:00–22:00 | Home | `git pull` → main Claude Code session. Multi-STEP push. `git push` before bed. | Claude Code (home laptop) | Heavy (full window) |

Weekly target: complete 5–7 STEPs of `SANITIZER_PROMPT.md` in week 1. Lunch sessions = 1 STEP each, evening sessions = 2–3 STEPs each.

### Weekend marathon template (Sat or Sun)

| Time | Block | Activity |
|---|---|---|
| 08:00–13:00 | Window 1 | Heavy build: implement a new sub-agent, refactor sanitizer |
| 13:00–14:00 | Buffer | Lunch, walk, no AI |
| 14:00–19:00 | Window 2 | Testing, documentation, demo recording |
| 19:00–20:00 | Buffer | Dinner |
| 20:00–00:00 | Window 3 (optional) | Light: README polish, plan next week, commit + push |

### Allocation rule of thumb

- **Hard work that needs Claude Code's tool calls** → evening + weekend (home laptop, full window)
- **Planning, reading, regex, doc lookup** → during work day (web chat, very light)
- **Personal-confidential AI chat** (scholarship, job search) → mobile hotspot, never company WiFi

---

## 12. Pre-flight checklist (run before every session)

Before opening Claude Code, run through this 30-second checklist:

- [ ] Am I in the right folder? (`pwd` should show `…\ai-playground\network-intel-assistant`)
- [ ] Did I `git pull` already? (`git status` should say "up to date")
- [ ] Do I know which STEP I'm continuing from? (check `HANDOVER.md`)
- [ ] On work notebook: am I on company WiFi or mobile hotspot, and is that the right one for the work I'm about to do?
- [ ] Is my prompt for this session already drafted (or ready to paste)?

If all checked → start session.

---

## 13. Post-session checklist (run before closing)

Before closing Claude Code at the end of a session:

- [ ] All commits done? `git status` should be clean.
- [ ] All commits pushed? `git push` should say "Everything up-to-date."
- [ ] `HANDOVER.md` reflects the current state? (timestamp + machine + next STEP)
- [ ] `LEARNING_LOG.md` has entries for every error this session? Even small ones?
- [ ] Any improvement ideas captured as `IMP-NNN`?
- [ ] If this was a milestone end: a `RETRO-NNN` written?

If all checked → close cleanly.

---

## 14. Continuous improvement loop

`LEARNING_LOG.md` is not optional — it's the difference between repeating mistakes and getting compounding skill. Treat it like a developer journal:

- **During the session:** Claude Code logs `ERR-NNN` automatically as errors happen. Don't suppress this — let small errors be logged too. Patterns only emerge with quantity.
- **End of session:** Skim the new entries. Anything surprising? Anything that suggests a permanent rule change to `MACHINE_RULES.md` or `SESSION_PROTOCOL.md`?
- **End of milestone:** Write a `RETRO-NNN`. Read the last 2 retros to see if previous "what I'd do differently" items actually got done.
- **End of internship (October 2026):** The full `LEARNING_LOG.md` becomes a portfolio artifact and the source material for a long-form write-up.

The log compounds. Trust the process.

---

*End of SESSION_PROTOCOL.md*
