# MACHINE_RULES.md — Dual-Machine Operating Rules

> **Purpose:** Clear, non-negotiable rules for running the `network-intel-assistant` project across two machines (work notebook + home laptop) without leaking real company data to AI services.
> **Owner:** Ran
> **Companion files:** `ABOUT_ME.md`, `ROADMAP.md`, `SESSION_PROTOCOL.md`, `SANITIZER_PROMPT.md`

---

## 1. The two machines

| Machine | Role | Network | Trust level for AI |
|---|---|---|---|
| **Work notebook** | Office, Mon–Fri 08:00–17:00 | Company WiFi (private), notebook NOT joined to domain | AI allowed by company. Safe ONLY in `C:\ai-playground\`. |
| **Home laptop** | Personal, evenings + weekends | Home WiFi | AI freely allowed in any project folder you own. |
| **Bridge** | Private GitHub repo | Either WiFi | Stores ONLY sanitized/playground code. NEVER real data. |

---

## 2. Folder zones (BOTH machines)

The single most important habit: **physically separate real-data zones from AI-zones using folder paths.**

### Work notebook layout

```
C:\work\                              ← REAL DATA ZONE — Claude Code FORBIDDEN
   ├── surveillance-project\          (real CCTV inventory, real IPs, real configs)
   ├── network-diagrams\              (real Visio/draw.io files)
   ├── exports\                       (real CSVs, real PDFs)
   └── credentials\                   (any real auth — never AI-touched)

C:\ai-playground\                     ← AI ZONE — fake data only, Claude Code allowed
   └── network-intel-assistant\       (clone of the private GitHub repo)
       ├── ABOUT_ME.md
       ├── ROADMAP.md
       ├── SESSION_PROTOCOL.md
       ├── MACHINE_RULES.md
       ├── SANITIZER_PROMPT.md
       ├── HANDOVER.md
       ├── sanitizer/
       ├── samples/                   (FAKE samples ONLY)
       └── tests/
```

### Home laptop layout

```
D:\ai-playground\
   └── network-intel-assistant\       (clone of the same private GitHub repo)
       ├── (same structure)
```

### The mental model

- **`C:\work\`** = the "vault." Real data lives here. AI is forbidden to look here, full stop. Use regular Notepad, Excel, Visio — never Claude Code.
- **`C:\ai-playground\`** = the "lab." Only fake data lives here. Claude Code is free to read, write, and modify anything inside.
- **GitHub repo** = the bridge between work and home. It only sees what's in `ai-playground` and is governed by `.gitignore`.

---

## 3. The five iron rules

### Rule 1 — Folder discipline
Open Claude Code ONLY in `C:\ai-playground\network-intel-assistant\` (or sub-folders). Never `cd` into anywhere under `C:\work\`. Never let Claude Code's "Open Folder" point to a real-data path.

### Rule 2 — Never copy real data into `ai-playground`
Not even "just to test." Not even with the intention of deleting later. Once it's there, you might forget and commit it. Use only Claude-generated synthetic samples.

### Rule 3 — Use a strict `.gitignore`
Defense in depth. Even if Rule 2 fails, `.gitignore` blocks it from reaching GitHub. Template:

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
*.real.json
*.real.yaml
output/*.json
mappings_report*.json
```

Filenames containing `.real.` are reserved for accidental real-data drops — they'll never be committed.

### Rule 4 — Private GitHub repo until proven safe
The project starts as a **private** GitHub repository. Only switch to public after:
- `data-sanitizer-agent` has been built and tested.
- Every sample in the repo has been manually verified to contain no real-looking values.
- The README clearly explains the sanitization workflow.

### Rule 5 — Mobile hotspot for personal-confidential AI work
If you need to ask Claude about anything personal that you don't want company IT to see in WiFi logs (scholarship applications, job hunting, financial planning, drafting an SOP, etc.), switch the work notebook to **mobile hotspot** before opening the AI session. Switch back to company WiFi when done.

---

## 4. Network visibility — what company IT can see

Even with AI allowed, all traffic on company WiFi is observable at the network layer. What IT sees depends on whether they run **SSL/TLS inspection**:

| Scenario | What IT can see |
|---|---|
| No SSL inspection (most likely since notebook is not domain-joined) | Just metadata: "Ran's notebook connects to api.anthropic.com, sends/receives X MB at HH:MM" |
| SSL inspection on + corporate cert installed on notebook | **Decrypted content** of every prompt and response |

### How to check for SSL inspection (one-time, ~30 seconds)

1. Press `Win + R` → type `certmgr.msc` → Enter.
2. Expand **Trusted Root Certification Authorities** → **Certificates**.
3. Scan for any certificate whose name contains the company name, or terms like `Proxy`, `MITM`, `Inspection`, `Corporate`, `Internal CA`.

- **Found one** → assume IT can read your AI prompts. Treat every prompt as if a co-worker were reading over your shoulder. Stick to project work only; route personal questions through the mobile hotspot.
- **Found none** → IT only sees metadata. Still keep prompts professional, but you have more latitude.

---

## 5. GitHub setup — minimum viable

You don't need any "Claude ↔ GitHub" special integration. You need:

1. **GitHub account** — you already have one (`runsyu37`).
2. **Git installed** on both machines — Claude Code will install/verify in STEP 1 of SANITIZER_PROMPT.md.
3. **GitHub CLI (`gh`)** — strongly recommended; handles authentication painlessly.
4. **One private repository** — `runsyu37/network-intel-assistant` (private).

### One-time setup per machine

```
# Install GitHub CLI (Windows, via winget)
winget install --id GitHub.cli

# Authenticate (opens browser, sign in once)
gh auth login

# Verify
gh auth status
```

### Creating the repo (do this from the home laptop the FIRST time)

```
cd D:\ai-playground\network-intel-assistant
git init
git add .
git commit -m "init: project scaffold"
gh repo create runsyu37/network-intel-assistant --private --source=. --push
```

### Cloning on the work notebook (after the repo exists)

```
mkdir C:\ai-playground
cd C:\ai-playground
gh repo clone runsyu37/network-intel-assistant
```

### Daily sync pattern

- Before starting work on a machine: `git pull`
- Before walking away from a machine: `git add -A && git commit -m "..." && git push`

If you forget a `git pull` and start editing, you'll get a merge conflict. Recovery: ask Claude Code "git pull gave me a merge conflict, walk me through the fix in Thai."

---

## 6. What goes through GitHub vs what stays local

| Stays LOCAL ONLY (never `git add`) | Goes to GitHub (sanitized repo) |
|---|---|
| Real switch configs | Fake synthetic configs in `samples/` |
| Real CCTV inventory CSVs | `sanitize.py`, `patterns.py` source code |
| Real network diagrams | `README.md`, `ROADMAP.md`, `ABOUT_ME.md` |
| `output/` files with real values | Sanitized example outputs |
| Anything with real IPs, MACs, hostnames | `.claude/agents/*.md` definitions |
| Credentials, API keys, `.env` | `tests/` test code with fake fixtures |

`.gitignore` enforces most of this automatically. The human enforcement layer is: **never `git add` something you haven't read.**

---

## 7. Forbidden operations (do not do, ever)

- ❌ `cd C:\work && claude` — never open Claude Code inside the real-data zone.
- ❌ Copying any file from `C:\work\` into `C:\ai-playground\` (even renamed, even partial).
- ❌ Pasting real switch output into a Claude prompt "just to ask a quick question."
- ❌ Making the GitHub repo public before sanitization is proven.
- ❌ Pushing without reviewing what's about to be pushed: always run `git status` and `git diff --cached` before `git push` on the work notebook.
- ❌ Installing Claude Code on a colleague's machine for "convenience."

---

## 8. Allowed personal-time activities

While at work, on the work notebook, on company WiFi — these are fine because they don't involve real company data:

- Running Claude Code in `C:\ai-playground\` on the sanitizer, parser, mapper code.
- Reading docs (Anthropic, Python, Git, networking RFCs) in browser.
- Using Claude.ai (web) for general programming questions, regex help, doc lookups.

Switch to **mobile hotspot** for:
- Scholarship/master's research
- Job search, resume work
- Personal investing/stocks research
- Anything that mentions your career plans outside this company

---

## 9. If a rule gets broken — recovery checklist

Mistakes happen. If you realize you've violated a rule, do this immediately:

**If you accidentally pasted real data into Claude Code (locally):**
1. Stop. Don't send more messages.
2. Note exactly what was leaked (which fields, which prompt).
3. The data is already on Anthropic's servers — it can't be un-sent. But:
   - Anthropic doesn't train on Pro plan data by default.
   - The conversation is bound to your account.
4. Tell your supervisor in plain language if the data was sensitive. Honesty > cover-up.

**If you accidentally committed real data to git (locally, not pushed):**
```
git reset --soft HEAD~1     # undo the commit, keep the changes
# delete or .gitignore the offending files
git add . && git commit -m "fix: remove accidentally added file"
```

**If you accidentally pushed real data to GitHub:**
1. Make the repo private immediately if it wasn't.
2. Delete the repo OR rewrite history with `git filter-repo` (Claude Code can guide you in Thai).
3. Force-push the cleaned history.
4. Assume the file was scraped — change anything secret it contained (credentials, IPs you can rotate, etc.).
5. Document what happened in your own notes; this is a learning moment.

---

## 10. The one sentence to remember

> **`C:\work\` is the vault, `C:\ai-playground\` is the lab. AI lives in the lab. Never let them meet.**

---

*End of MACHINE_RULES.md*
