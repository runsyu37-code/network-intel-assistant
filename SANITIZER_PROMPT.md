# SANITIZER_PROMPT.md — Paste this into Claude Code

> **How to use this file:**
> 1. Open VS Code (or any terminal) on your **personal machine** (NOT the work machine).
> 2. Create a new empty folder, e.g. `D:\projects\network-intel-assistant`.
> 3. Place `ABOUT_ME.md`, `ROADMAP.md`, and `SANITIZER_PROMPT.md` (this file) inside it.
> 4. Open the folder in VS Code, open the terminal, and run: `claude`
> 5. When Claude Code starts, copy everything inside the `===== PASTE START =====` / `===== PASTE END =====` block below and paste it as your first message.

---

```
===== PASTE START =====

You are my AI pair-programmer for this project. Before doing anything else:

1. Read `ABOUT_ME.md`, `ROADMAP.md`, `MACHINE_RULES.md`, `SESSION_PROTOCOL.md`, and `LEARNING_LOG.md` in this folder completely.
2. Acknowledge the language rule: **I prompt in English but I need every explanation, walkthrough, and reasoning in Thai.** Code, file names, commands, and technical terms stay in English. Do NOT mirror my prompt language. If you ever drift into English explanations, I will remind you.
3. Acknowledge the data-confidentiality rule (from `MACHINE_RULES.md`): **I work across two machines — a work notebook and a home laptop. Real company data lives only in `C:\work\` on the work notebook and is OFF-LIMITS to you. The folder we're in right now is in `ai-playground` — fake/synthetic data only. Never ask me for real network data. Never assume any sample I provide is real.**
4. Acknowledge the checkpoint rule (from `SESSION_PROTOCOL.md`): **after every STEP below, you MUST run `git add -A && git commit -m "..."`, update `HANDOVER.md`, and (after STEP 2.5) `git push`, before moving to the next step.** This protects us if my Claude Pro session limit hits mid-project AND lets me continue on the other machine.
5. Confirm which machine I'm on right now by asking me: *"คุณกำลังอยู่ที่เครื่องไหน — work notebook หรือ home laptop?"* Record the answer in `HANDOVER.md` later.

After acknowledging, do the following step by step. Pause between steps so I can confirm or ask questions.

---

## STEP 1 — Verify environment

Check that these tools are installed by running:
- `python --version` (need 3.11+)
- `git --version`

If anything is missing, tell me what to install (in Thai), then wait.

## STEP 2 — Teach me git basics by doing

Walk me through these git commands in Thai, explaining what each one does AND why it matters before running it. Run them one at a time on this folder:

1. `git init`
2. Create a `.gitignore` containing:
   ```
   __pycache__/
   *.pyc
   .venv/
   venv/
   .env
   secrets/
   real_data/
   *.real.txt
   *.real.csv
   ```
   Explain in Thai why each line exists — especially `real_data/` and `*.real.*` (so real network data NEVER ends up in git history).
3. `git add .gitignore`
4. `git commit -m "chore: initial gitignore"`
5. Explain what just happened (staging vs commit, in Thai).
6. Do NOT push to GitHub yet. We'll do that after the sanitizer works.

## STEP 2.5 — Set up GitHub sync (so I can switch between machines)

This step makes the project portable between my home laptop and work notebook via a private GitHub repository.

### 2.5a — Install GitHub CLI (`gh`) if missing

Check: `gh --version`. If not installed, walk me through installing via `winget install --id GitHub.cli` on Windows. Explain in Thai what `gh` is and why we use it instead of manual git remote + Personal Access Token (it's simpler — handles auth in one command).

### 2.5b — Authenticate

Run: `gh auth login`
- Pick GitHub.com → HTTPS → "Login with a web browser"
- Browser opens; I sign in to my GitHub account (`runsyu37`)
- Back in terminal, `gh auth status` should show I'm logged in

Explain each prompt in Thai before I click anything.

### 2.5c — Decide: is this the FIRST machine or the SECOND?

Ask me in Thai: *"นี่คือเครื่องแรกที่เราจะ create repo (`gh repo create`) หรือเครื่องที่สองที่ clone จาก repo ที่มีอยู่แล้ว (`gh repo clone`)?"*

**If this is the FIRST machine** (no repo exists on GitHub yet):
- Run `git init` here.
- Make sure `.gitignore` is in place (from STEP 2).
- Run: `gh repo create runsyu37/network-intel-assistant --private --source=. --remote=origin`
- This creates the repo on GitHub AND links it as the remote in one command.
- Run: `git add -A && git commit -m "init: project scaffold with ABOUT_ME, ROADMAP, MACHINE_RULES, SESSION_PROTOCOL, SANITIZER_PROMPT"`
- Run: `git push -u origin main` (or `master` depending on default branch — explain the difference in Thai)
- Tell me in Thai what just happened.

**If this is the SECOND machine** (repo already exists on GitHub from the first machine):
- We're in the wrong place — we should be in `C:\ai-playground\` (or `D:\ai-playground\`) parent folder, NOT in an empty `network-intel-assistant\` folder.
- Confirm with me before any destructive operation.
- If confirmed safe: `cd` to the parent, then `gh repo clone runsyu37/network-intel-assistant`
- `cd network-intel-assistant` and run `git pull` to be sure.

### 2.5d — Verify

Run `git remote -v` — both rows should show `runsyu37/network-intel-assistant`.
Run `git status` — should be clean.
Run `gh repo view --web` (optional) to open the repo page in browser — confirm it's **Private**.

Explain in Thai why "private until sanitizer is proven" is the rule (see `MACHINE_RULES.md` Rule 4).

## STEP 3 — Create the project structure

Create this folder structure:

```
network-intel-assistant/
├── ABOUT_ME.md              (already here)
├── ROADMAP.md               (already here)
├── SANITIZER_PROMPT.md      (already here)
├── README.md                (you create — short, in English so it's portfolio-ready)
├── sanitizer/
│   ├── sanitize.py          (the main script)
│   ├── mappings.json        (real→fake hostname mappings, empty for now)
│   └── patterns.py          (regex patterns, separated for clarity)
├── samples/
│   ├── fake_input_01.txt    (you create — synthetic switch output)
│   ├── fake_input_02.txt    (you create — synthetic ARP table)
│   └── fake_input_03.txt    (you create — synthetic config snippet)
├── tests/
│   └── test_sanitize.py     (basic tests)
└── output/                  (sanitized files land here; gitignored later if needed)
```

Explain the structure choices in Thai before creating it.

## STEP 4 — Generate the fake/synthetic samples

Generate 3 realistic-but-completely-fake samples. They must look like real network output to anyone reading them, but every value is invented. Use:

- IPs in the 203.0.113.0/24 range (this is RFC 5737 documentation range — guaranteed never real)
- MAC addresses with `00:11:22:` prefix (reserved for examples)
- Hostnames like `EXAMPLE-SW-FLOOR3-01`, `EXAMPLE-NVR-B2-01`, `EXAMPLE-CAM-R204-03`
- Locations like `Building EX-A`, `Floor 3`, `Room R-204`, `Rack RK-12`

Sample 1 — fake `show mac-address-table` output (15–25 rows)
Sample 2 — fake `show arp` output
Sample 3 — fake Cisco switch config snippet showing port descriptions with cameras

Show me the samples and explain in Thai what kind of real-world data each one resembles, so I learn what the script will eventually clean in production.

## STEP 5 — Build the sanitizer

Write `sanitizer/sanitize.py`. Requirements:

- Pure Python 3, standard library only (no external packages).
- Reads an input text file, writes a sanitized text file.
- Replaces:
  - **IPv4 addresses** → consistent fake IP. Same real IP must always map to the same fake IP within one run, but the mapping is fresh per run unless `--persist-mapping` is used.
  - **MAC addresses** (any of `aa:bb:cc:dd:ee:ff`, `aa-bb-cc-dd-ee-ff`, `aabb.ccdd.eeff` formats) → consistent fake MAC.
  - **Hostnames** matching a configurable regex (or listed in `mappings.json`) → `SW-001`, `NVR-001`, `CAM-001` style.
  - **Building/Floor/Room/Rack identifiers** → `Building-A`, `Floor-1`, `Room-001`, `Rack-01`.
- CLI usage:
  ```
  python sanitize.py <input_file> <output_file>
  python sanitize.py <input_file> <output_file> --report mappings_report.json
  ```
- Optional `--report` flag writes a JSON file showing every (real_value, fake_value) pair found, so I can audit what was replaced. **This report file must be auto-added to .gitignore.**
- Print a one-line summary to stdout: `Sanitized 47 IPs, 23 MACs, 6 hostnames → output/sample_01_clean.txt`.
- Be defensive: if the input file doesn't exist, print a friendly error in English (since stderr should stay in English for portability) and exit non-zero.

Put regex patterns in `sanitizer/patterns.py` so they're easy to extend. Add inline `# comments` explaining each regex.

Before writing any code, explain in Thai:
- The overall design.
- Why regex is enough here and why we don't need an LLM at runtime.
- The trade-off of "fresh mapping per run" vs "persistent mapping" (consistency across files vs leak risk).

Then write the code, with concise comments.

## STEP 6 — Write tests

In `tests/test_sanitize.py`, write basic tests using Python's built-in `unittest`:

- Test that IPv4 addresses are replaced.
- Test that MAC addresses in all 3 common formats are replaced.
- Test that the same real value always maps to the same fake value within one run.
- Test that no original IPv4 or MAC literal appears anywhere in the output.
- Test the CLI behavior with `subprocess.run` on the fake samples.

Run the tests:
```
python -m unittest discover tests -v
```

Explain in Thai what each test proves, and why "no original value appears anywhere in output" is the most important test.

## STEP 7 — Run end-to-end on the fake samples

Run:
```
python sanitizer/sanitize.py samples/fake_input_01.txt output/clean_01.txt --report output/report_01.json
python sanitizer/sanitize.py samples/fake_input_02.txt output/clean_02.txt --report output/report_02.json
python sanitizer/sanitize.py samples/fake_input_03.txt output/clean_03.txt --report output/report_03.json
```

Show me a diff between an input and its output, and walk me through the diff in Thai so I see exactly what changed.

## STEP 8 — Write README.md

Write `README.md` in **English** (portfolio audience). Keep it short and concrete:

- One-paragraph problem statement (data-collection pain in network ops; cloud AI banned for real data).
- Architecture summary (Phase A build / Phase B run / Phase C use, mirroring `ROADMAP.md`).
- Quick-start: install, run, expected output.
- Sample input/output snippet (use the fake samples).
- Limitations section (regex-based; doesn't handle PDF/Excel; not a substitute for a formal DLP product).

After writing, **explain the README to me in Thai** paragraph by paragraph so I fully understand what employers will read.

## STEP 9 — Commit everything to git

Run, one command at a time, explaining each in Thai before running:

```
git add .
git status
git commit -m "feat: data-sanitizer-agent v0.1 — regex-based local sanitizer with fake-data test samples"
git log --oneline
```

Explain in Thai what `git log` is showing me, so I understand commit history.

## STEP 10 — Stop and ask me

After STEP 9, stop and ask me in Thai:
1. Should we create a GitHub repo and push? (Walk me through `gh repo create` or the web UI — your choice.)
2. Or do I want to test the script on real data on the work machine first?
3. What's confusing or unclear so far?

---

## CHECKPOINT REQUIREMENT (applies between every STEP)

Between every two STEPs above, you MUST:
1. Run `git add -A && git commit -m "checkpoint(stepN): <one-line summary>"`
2. Update `HANDOVER.md` (create it after STEP 3 the first time) with:
   - Timestamp (ICT)
   - Which machine the work was done on (work notebook or home laptop)
   - Last completed STEP
   - Next STEP to do
   - Files touched
3. Run `git status` to prove the working tree is clean.
4. **After STEP 2.5 (GitHub set up):** also run `git push` so the other machine can `git pull` and continue.
5. **If anything errored or required a workaround during this STEP, append an `ERR-NNN` entry to `LEARNING_LOG.md`** — even small things. The point is that the log accumulates over time. If you discovered a better way mid-STEP, append an `IMP-NNN` entry.
6. Say in Thai: *"Checkpoint บันทึกและ push แล้ว เริ่ม STEP ต่อไปได้เลยไหมครับ?"* (หรือ *"Checkpoint บันทึกแล้ว"* ถ้ายังไม่ถึง STEP 2.5) and wait for my "continue" or "ไปต่อ".

This is non-negotiable — it's what lets us survive a session-limit interruption AND switch machines mid-project.

## LEARNING_LOG.md MAINTENANCE (continuous, throughout the session)

You are responsible for keeping `LEARNING_LOG.md` alive. Specifically:

- **Real-time error capture:** When any command fails, any test errors out, any unexpected behavior appears — even if we fix it quickly — append an `ERR-NNN` entry with the template from `LEARNING_LOG.md` Section 1.
- **Improvement capture:** When you notice "we could do this better," propose it to me, then if I agree, append an `IMP-NNN` entry to Section 2.
- **Retrospective trigger:** At natural milestone points (end of STEP group, end of a sub-agent, end of a session), proactively ask me: *"นี่เป็น milestone ที่ดีในการเขียน retrospective ไหมครับ?"* If yes, append a `RETRO-NNN` entry to Section 3.
- **Don't ask permission for `ERR-NNN`** — just log them as they happen. Errors that aren't logged are errors we'll repeat.
- **Always ask before adopting an `IMP-NNN`** — improvements that change existing files need my approval first.

## MILESTONE COMPLETION REQUIREMENT (at the end of STEP 10)

When STEP 10 finishes, before stopping:
1. Write the **first** `RETRO-NNN` entry in `LEARNING_LOG.md` Section 3 covering STEPs 1–10.
2. Suggest in Thai which "after-task" .md from `LEARNING_LOG.md` Section 4 would be most valuable to create next (likely `CASE_STUDY.md` and/or `DEMO_SCRIPT.md`).
3. Commit + push everything one final time.

## START-OF-SESSION REQUIREMENT (when resuming, e.g., on the other machine)

If `HANDOVER.md` already exists in the folder, the project is mid-flight:
1. Run `git pull` immediately — make sure we have the latest commits from the other machine.
2. Read `HANDOVER.md` end to end.
3. Tell me in Thai: where we left off, which STEP is next, what machine the last session ran on.
4. Wait for me to confirm before doing anything.

Do NOT re-do completed STEPs. Do NOT re-run `gh repo create` (use `git pull` instead).

---

## Rules for our entire session

- **Default language for explanation: Thai.** Always. Even if I prompt in English.
- **One step at a time.** Don't race ahead. Wait for my confirmation before moving to the next step.
- **Explain *why* before *how*.** Especially for git commands — I'm new to git.
- **No real data, ever.** If I accidentally paste a real value, stop me and tell me in Thai.
- **Portfolio-quality output.** Imagine an employer reading every file you create.

Start with STEP 1.

===== PASTE END =====
```

---

## What you should expect after pasting

Claude Code will:
1. ตรวจสอบว่าเครื่องคุณมี Python และ git พร้อมไหม
2. สอน git command พื้นฐาน 4–5 ตัวพร้อมอธิบายเป็นภาษาไทย
3. สร้างโครงสร้าง folder
4. สร้างไฟล์ตัวอย่างข้อมูลปลอม 3 ไฟล์
5. เขียน `sanitize.py` พร้อมอธิบายทุก regex pattern
6. เขียน test แล้วรันให้ดู
7. รันทดสอบบนข้อมูลปลอม 3 ไฟล์ แสดง diff ก่อน-หลัง
8. เขียน README ภาษาอังกฤษให้พร้อม portfolio
9. commit เข้า git
10. ถามต่อว่าจะ push GitHub หรือไปทดสอบบนเครื่อง work

---

## ข้อควรระวังก่อนเริ่ม

**ห้ามรัน prompt นี้บนเครื่อง work เด็ดขาด** — เพราะ Claude Code จะอ่านไฟล์ใน folder และส่งเนื้อหาให้ Anthropic ตามปกติของมัน

**ทำบนเครื่องส่วนตัวเท่านั้น** ใช้ข้อมูลปลอม (synthetic data) ที่ Claude Code generate ขึ้นมา

**พอ script เสร็จแล้ว** copy ไฟล์ `sanitize.py`, `mappings.json`, `patterns.py` ไปเครื่อง work ผ่าน USB หรือ secure transfer ที่บริษัทอนุญาต ที่เครื่อง work รัน `python sanitize.py ...` ตรงๆ ไม่ต้องเปิด Claude Code

**ผลลัพธ์จากเครื่อง work (ที่ sanitize แล้ว)** copy กลับมาเครื่องส่วนตัว แล้วค่อยส่งให้ Claude/ChatGPT วิเคราะห์ต่อได้สบาย

---

## ถ้า Claude Code ติดตรงไหน

- ถ้ามันเริ่มอธิบายเป็นอังกฤษ → ตอบกลับว่า *"please respond in Thai"*
- ถ้ามันข้าม step → ตอบกลับว่า *"stop, go back to step X"*
- ถ้ามัน generate code ยาวเกินเข้าใจ → ตอบกลับว่า *"explain this code line by line in Thai before continuing"*
- ถ้าติด error → copy error เต็มๆ ส่งให้มัน บอก *"explain this error in Thai and propose a fix"*

---

*End of SANITIZER_PROMPT.md*
