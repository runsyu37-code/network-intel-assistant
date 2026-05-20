# ROADMAP — Ran's 5-Month AI Learning & Portfolio Plan

> **Period:** May 2026 → October 2026 (end of internship)
> **Owner:** Ran
> **Companion file:** `ABOUT_ME.md`
> **Last updated:** 2026-05-17

## ⚠ Critical Context (read this first)

- **Today:** 17 May 2026.
- **Surveillance Monitoring project status:** started ~26 April 2026, total length 3 months, **~2 months remaining** (deadline ~late July 2026).
- **Current phase:** Data Collection — and I'm stuck. Visible progress so far is minimal.
- **Implication for this roadmap:** The first AI tooling I build is NOT a learning exercise — it must directly accelerate data collection so the surveillance project ships on time. Portfolio polish, life-agents, investing tools all come AFTER the work deadline is safe.
- **Two timelines run in parallel:**
  - **Internship work timeline:** ends ~late July 2026 (surveillance project must ship), then continues with new assignments until October 2026.
  - **Personal learning + portfolio timeline:** 5 months ending October 2026. Heavy load before late July, lighter after.

---

## 0. North Star

Turn the next 5 months into:
1. **Ship the Surveillance Monitoring project on time** (~late July 2026) — non-negotiable. Everything else stacks on top of this.
2. **Mastery of Claude Code** — sub-agents, MCPs, slash commands, real workflows.
3. **A team of AI agents** that help me across internship work, investing, scholarship hunting, and daily life.
4. **A portfolio of 4–6 real projects** showcasing networking + AI development, sanitized and public-ready, that I can show to employers and scholarship committees.

**Anchor philosophy:** Every project must solve a real pain point in my life *and* produce a portfolio artifact. No throwaway code.
**Sequencing rule:** Work-critical tools first (data-collection unblockers), portfolio polish and life-agents second.

---

## 1. Anchor Project — "Network Intelligence Assistant"

The biggest pain in my internship is **data collection**: figuring out which CCTV is on which switch port, how switches connect, generating diagrams, keeping inventory accurate. This is also the most teachable problem because it touches Python, AI agents, data parsing, visualization, and confidentiality handling — almost the entire Claude Code skill tree.

### Sub-agent team for this project

| Agent | Job | Why it matters |
|---|---|---|
| `network-inventory-agent` | Parse switch outputs (`show mac-address-table`, ARP, CDP/LLDP, config files) → structured inventory (JSON/CSV) of CCTV ↔ switch port ↔ location | Cuts data-collection time from days to minutes |
| `topology-mapper-agent` | From inventory data, generate Mermaid / draw.io diagrams of how switches/NVRs/cameras connect | Auto-builds the network diagram I currently draw by hand |
| `data-sanitizer-agent` | **A local Python script (regex + mapping table)** that replaces real IPs/MACs/hostnames with safe placeholders. Runs entirely offline on my own machine — no AI involved at runtime. | Solves the data-confidentiality problem so I can (a) safely use cloud AI on the *sanitized* output later, and (b) publish sanitized samples to my portfolio |
| `alert-triage-agent` | When a CCTV fails, read recent logs + topology → suggest the most likely cause (PoE down? upstream switch? VLAN issue?) | Adds intelligence layer on top of the existing red-alert dashboard |

### Why this project is perfect for me
- Solves a real, painful problem **right now**.
- Teaches Claude Code sub-agents, file parsing, prompt design, output structuring, MCPs.
- Produces 4 distinct sub-agents → 4 portfolio artifacts from a single project.
- Works around the data-confidentiality constraint via the sanitizer pattern.

### IMPORTANT — How the data-confidentiality flow actually works

I cannot send real network data to any cloud AI. The architecture below respects that strictly.

**Phase A — Building the sanitizer (AI helps, but on FAKE DATA only)**

I sit with Claude Code on my **personal machine**. I hand-craft **fake/synthetic sample data** that *looks* like real switch output but contains no real IPs/MACs/hostnames. Claude Code sees only the fake data and helps me write a Python script that uses **regex + a mapping table** to detect and replace:

- IPv4 addresses → `10.0.0.X` series
- MAC addresses → stable hash like `aa:bb:cc:XX:XX:01`
- Hostnames → `SW-001`, `NVR-001`, `CAM-001` (via a mapping file)
- Location strings → `Building-A`, `Floor-1`, `Room-001`

No real data has left my machine. Claude Code has only seen fake samples.

**Phase B — Running the sanitizer (NO AI, runs offline on real data)**

I copy the finished Python script to my **work environment**. There I run:

```
python sanitize.py real_input.txt → sanitized_output.txt
```

This is **plain Python, no internet, no AI, no Claude Code**. It's just regex find-and-replace. The script transforms real data into sanitized data while staying entirely on the work machine.

**Phase C — Using cloud AI safely (on sanitized output only)**

Once I have `sanitized_output.txt`, I can freely paste it into Claude, ChatGPT, Gemini, or push to a public GitHub repo as a sample. The real values are already gone.

**Plan B — If even Phase A is too risky:**
Use **Ollama** with a local LLM (e.g. `llama3.2`, `qwen2.5`) to run AI fully on my machine. Slower and less smart than Claude, but data never leaves the laptop. Use this only if Phase A's "fake data → AI → script" approach isn't allowed by my employer.

---

## 2. Tools & Tech I Need (and What to Learn First)

### Already installed
- **Claude Code** ✅
- **GitHub account** ✅ (but I don't know git yet — see below)
- **Python** (on internship machine)

### Install in Week 1
| Tool | Why | Difficulty |
|---|---|---|
| **VS Code** | Best editor; integrates with Claude Code and git seamlessly | Easy |
| **Git CLI** | Version control — must-have | Easy (commands), moderate (concepts) |
| **GitHub Desktop** *(optional)* | GUI for git if CLI feels intimidating early on | Easy |
| **Python 3.11+** | Runtime for scripts | Easy |
| **uv** *(Python package manager)* | Modern, fast replacement for pip | Easy |
| **mermaid-cli** | Render topology diagrams from code | Easy |
| **Discord webhook URL** | Reuse existing alert pipeline | Already done |

### Learn in Weeks 1–2 (after install)
| Skill | Why it matters | Minimum to know |
|---|---|---|
| **Git basics** | Required for every project, portfolio, collaboration | `git init`, `clone`, `add`, `commit`, `push`, `pull`, `branch`, `checkout`, `.gitignore` |
| **GitHub basics** | Where the portfolio lives | Create repo, push, README, public vs private, issues |
| **Claude Code slash commands** | Day-to-day driving of Claude Code | `/agents`, `/mcp`, `/init`, `/clear`, `/compact` |
| **Claude Code sub-agents** | Core to building agent teams | How to define `.claude/agents/<name>.md` files |
| **MCP basics** | How agents reach external tools (Discord, GitHub, Calendar, etc.) | What an MCP server is, how to add one |
| **Markdown** | Everything is written in markdown | Headings, lists, tables, code blocks, links |

### Add when needed (don't preload)
- **Docker** — when project needs containerization (probably Month 3+)
- **FastAPI / Flask** — if extending the surveillance web app
- **Pandas** — for inventory data manipulation
- **NetworkX** — for graph analysis of topology
- **Tailscale** *(or similar)* — if I want to reach work-machine resources securely from home

---

## 3. Git & GitHub Quickstart (since I'm starting at zero)

A minimum-viable git mental model:

```
Your folder  --(git add)-->  Staging area  --(git commit)-->  Local history  --(git push)-->  GitHub
```

**First-time setup (do once):**
```bash
git config --global user.name "Ran"
git config --global user.email "runsyu37@gmail.com"
```

**Daily flow (for every project):**
```bash
git init                         # only the very first time, in a new folder
git add .                        # stage all changes
git commit -m "what I did"       # save a checkpoint
git push                         # send to GitHub (needs remote set up once)
```

**Branching (when working on a feature without breaking the main copy):**
```bash
git checkout -b feature/inventory-parser   # create + switch
# ...make changes...
git add . && git commit -m "parser v1"
git checkout main && git merge feature/inventory-parser
```

**Critical:** Add a `.gitignore` that excludes real network data:
```
*.csv
*.log
configs/real/
.env
secrets/
```

> **Sanitization rule:** Real device data **never** gets committed. Only sanitized samples go to GitHub.

I'll have Claude Code walk me through these step-by-step in Week 1.

---

## 4. 5-Month Timeline

> **Phase split:**
> - **Phase 1 — Critical Path (17 May → ~25 July 2026):** Build AI tools that directly unblock the surveillance project's data-collection phase. Goal = ship the work project on time.
> - **Phase 2 — Portfolio & Expansion (late July → October 2026):** With the work deadline cleared, expand to life-agents, investing agent, ML predictive features, and portfolio polish.

### Month 1 — May 17 → June 17 :: "Foundation + data-collection unblockers" *(Phase 1)*

**Week 1 (May 17–24) — Setup & first sub-agent**
- Install VS Code, git, Python 3.11, uv on **personal machine**.
- Complete git basics via 1 small "hello world" repo.
- Read `ABOUT_ME.md` and `ROADMAP.md` into a new Claude Code project.
- Build `data-sanitizer-agent` first. **Why first?** Because once the script exists, every later step can use cloud AI safely on sanitized output.
- **Strict rule for Week 1:** Develop using **fake/synthetic data only** on the personal machine. Real data is only touched in Phase B (running the finished script on the work machine, no AI involved).
- Verification: feed 3 synthetic switch outputs into the script → confirm all IPs/MACs/hostnames are masked → diff the output to be sure no real-looking value leaks through.

**Week 2 (May 24–31) — Inventory parser**
- Build `network-inventory-agent`.
- Input: raw `show mac-address-table` output (sanitized via Week 1 agent).
- Output: structured CSV/JSON of `(device, port, mac, vendor_guess, location_hint)`.
- Write a 1-page README + sample input/output.

**Week 3 (May 31–June 7) — Diagram generator**
- Build `topology-mapper-agent`.
- Input: the JSON from Week 2.
- Output: Mermaid diagram code + rendered PNG.

**Week 4 (June 7–17) — Stitch the team together**
- Create a parent Claude Code "orchestrator" that pipes:
  raw config → sanitizer → inventory parser → topology mapper → final report
- **Month 1 deliverable:** Working pipeline + GitHub repo + 2-minute screen-recorded demo.

**Skills unlocked this month:** git, Claude Code sub-agents, file I/O, structured prompting, Mermaid.

---

### Month 2 — June 17 → ~25 July 2026 :: "Ship the surveillance project" *(Phase 1 — final stretch)*

> **This is the deadline month.** Every hour here goes toward getting the Surveillance Monitoring web app to a deliverable state. Life-agents, scholarship hunting, and investing tools are DEFERRED to Phase 2.

**Week 5–6 — Wire the AI tools into the actual deliverable**
- Use Month 1's inventory + topology agents to populate the real web app's database with the now-collected inventory.
- Build `alert-triage-agent`: when CCTV fails, agent reads logs + topology and suggests likely cause.
- Integrate `alert-triage-agent` with the existing Discord webhook (adds an AI-written diagnosis to the existing red-alert message).

**Week 7–8 — Final polish + project handoff prep**
- Stabilize bugs, finalize the hierarchy drill-down UX (Site → Building → Floor → Room → Rack → Device).
- Write internal handover documentation for the work team.
- Record a 3–5 min internal demo for my supervisor.
- **Hard deadline ~25 July 2026:** Surveillance Monitoring project shipped. Supervisor sign-off.

**Skills unlocked this month:** integrating AI outputs into a real product, alert triage logic, technical handover writing.

---

### Late July — buffer week + retrospective

- Buffer for any slip on the surveillance project.
- Write a 1-page retrospective: what worked, what didn't, what AI accelerated, what it didn't.
- Update `ABOUT_ME.md` and `ROADMAP.md` with new internship assignment details once the supervisor gives me the next task.
- **Switch to Phase 2.**

---

### Month 3 — Late July → August 17 :: "Life agents + investing assistant" *(Phase 2 begins)*

**Week 9 (catch-up week) — Life agents**
- Build `scholarship-hunter-agent`: weekly digest of master's scholarships matching my profile (Thai student, networking/AI, full funding).
- Build `daily-ops-agent`: morning summary of calendar + tasks + market open.
- **Deliverable:** Both agents running on a schedule.

**Week 10 — Stock research agent**
- Build `stock-research-agent`:
  - Watchlist defined in a YAML/CSV file.
  - Every morning: pulls news headlines, basic fundamentals, technical signals (price vs MA, RSI, volume spike).
  - Outputs a short briefing — **not** buy/sell recommendations.
- **Critical rule:** Agent gives *information*; I make the trade.

**Week 11–12 — Portfolio infrastructure**
- Create a personal GitHub Pages site (`susan-portfolio.github.io`) listing all projects with screenshots and short descriptions.
- Standardize every project repo with:
  - `README.md` (problem, approach, demo, learnings)
  - `demo.gif` or short video
  - `architecture.md` (which agents, how they connect, MCPs used)
- **Deliverable:** Public portfolio site live; all 3 months' projects published with sanitized examples.

**Skills unlocked:** Web scraping/APIs, financial-data MCPs, static-site publishing, technical writing.

---

### Month 4 — August 17 → September 17 :: "Predictive features + agent orchestration" *(Phase 2)*

**Week 13–14 — CCTV health predictor**
- Use ping history (sanitized) → train a simple anomaly detector.
- Goal: flag cameras likely to fail in the next 24h before they fully drop.
- This is your "I worked with ML, not just LLMs" portfolio piece.

**Week 15–16 — Multi-agent orchestration**
- Build a "team lead" agent that, given a problem like *"Camera B3-204 keeps dropping at night,"* automatically:
  - calls `network-inventory-agent` to locate it,
  - calls `alert-triage-agent` for hypotheses,
  - calls `topology-mapper-agent` for the relevant subgraph,
  - compiles a runbook-style report.
- **Deliverable:** Full multi-agent demo. This is the portfolio "centerpiece."

**Skills unlocked:** Light ML (scikit-learn or similar), agent orchestration patterns, runbook generation.

---

### Month 5 — September 17 → October 17 :: "Synthesis + storytelling" *(Phase 2 — final)*

**Week 17–18 — Polish + case studies**
- Write a **case study** per project (1,500–2,500 words) describing the problem, my approach, what I learned, what failed, and outcomes/metrics.
- Record longer demo videos (5–8 min) for the 2 strongest projects.
- Polish the GitHub Pages site.

**Week 19–20 — Externalize**
- Post 3–5 LinkedIn write-ups (one per major project) — these get shared with my professional network.
- Draft an "AI for Network Operations" article for Medium or a personal blog.
- Update CV with measurable outcomes (e.g., *"reduced inventory documentation time by X%"*).
- Reach out to 5 scholarship programs / 5 companies whose work overlaps with this portfolio.

**End-of-internship deliverable (Oct 2026):**
- 4–6 portfolio projects (sanitized, public).
- Public portfolio site.
- 3–5 case studies and LinkedIn write-ups.
- A working "AI co-worker" team I keep using after the internship.

---

## 5. Weekly Rhythm

| Day | What |
|---|---|
| **Mon–Thu** | 2–3 hours/day on the active week's milestone |
| **Fri** | "Documentation Friday" — README, commit messages, screenshots |
| **Sat** | Investing agent maintenance + watchlist review |
| **Sun** | Review the week, update `ABOUT_ME.md` and `ROADMAP.md`, plan next week |

---

## 6. Definition of Done (per project)

A project is "done" when **all** of these are true:
1. ✅ It solves a real problem I actually have.
2. ✅ A sanitized version is in a public GitHub repo with a clean README.
3. ✅ There's at least one demo asset (GIF, video, or screenshots).
4. ✅ I can explain *why* the architecture is the way it is, not just *what* it does.
5. ✅ It's listed on the portfolio site with a 1-paragraph summary.

---

## 7. Risk Register (and Mitigations)

| Risk | Likelihood | Mitigation |
|---|---|---|
| Internship workload spikes, no time for side projects | High | Make Month 1 anchor project *directly useful for internship* so it's not "extra work" |
| Real data leaks to public repo | Medium | `data-sanitizer-agent` is project #1; `.gitignore` template enforced; sanitizer **built with fake data only** so real values never touch Claude Code |
| Sending real data to cloud AI by accident | Medium | Personal machine = AI-allowed (fake data only). Work machine = AI-forbidden, only runs the offline sanitizer script. Never connect Claude Code on the work machine. |
| Get stuck on Claude Code syntax | Medium | Use this `ROADMAP.md` as a re-anchor; ask for examples not theory |
| Trying to learn too many tools at once | High | Strict rule: install a new tool only when this week's milestone needs it |
| Investing agent influences trades emotionally | Low–Medium | Agent outputs *information*, never recommendations; I keep all decisions manual |
| Burnout from internship + projects + university | Medium | Sunday review explicitly checks energy level; cut scope before cutting sleep |

---

## 8. Decision Log (append as we go)

| Date | Decision | Rationale |
|---|---|---|
| 2026-05-17 | Anchor on Network Intelligence Assistant | Solves real pain (data collection), teaches Claude Code, generates portfolio |
| 2026-05-17 | Build `data-sanitizer-agent` first | Unblocks every other agent under data-confidentiality constraint |
| 2026-05-17 | Skip Docker, FastAPI, ML libraries until month they're needed | Avoid tool-overload paralysis |
| 2026-05-17 | Split roadmap into Phase 1 (critical path to surveillance project deadline ~25 July) and Phase 2 (portfolio + life agents Aug–Oct) | Project is 3 weeks in, 2 months left, still in data collection; the AI tooling must directly accelerate the work deliverable before doing anything else |
| 2026-05-17 | Defer scholarship/investing/life agents to Phase 2 | Cannot afford to context-switch during the surveillance deadline crunch |

*(New decisions get appended here in future sessions.)*

---

## 9. Next Action (right now)

1. Read both files (`ABOUT_ME.md` and this one) end-to-end.
2. Install **VS Code**, **Git**, **Python 3.11**.
3. Start a new Claude Code session in a fresh folder called `network-intel-assistant/`.
4. Tell Claude Code: *"Read `ABOUT_ME.md` and `ROADMAP.md`. Then walk me through git basics by creating my first commit. After that, help me design `data-sanitizer-agent`."*
5. Commit + push to a new private GitHub repo. (We'll go public after sanitization is proven.)

That's it. Week 1 begins.

---

*End of ROADMAP.md — pair with ABOUT_ME.md.*
