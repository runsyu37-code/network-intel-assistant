# ABOUT ME — Ran's Context File for AI Assistants

> **Purpose of this file:** This document gives any future AI assistant (Claude, ChatGPT, Gemini, etc.) the full context about who I am, what I'm building, and how I work — so any new conversation can continue from where the previous one left off without losing momentum.
>
> **How to use this file:** Paste it (or attach it) at the start of any new AI chat. Tell the assistant: *"Read this first. Use it as your primary source of context about me. Update it at the end of our conversation if my situation has changed."*
>
> **Last updated:** 2026-05-17

---

## 1. Who I Am

- **Name:** Ran (short name — please call me "Ran")
- **Email:** runsyu37@gmail.com
- **Status:** 4th-year university student
- **Current role:** Network Engineer Intern
- **Internship duration:** Until October 2026 (~5 months remaining as of May 2026)
- **Language preference:** **I usually write/prompt in English, but I need responses in Thai.** My English is not strong enough to fully understand technical explanations in English — answering me in Thai is critical so I understand 100% of what's being said. Code, file names, commands, and technical terms can stay in English; the explanations, reasoning, walkthroughs, and conversation around them must be in Thai.
- **Location context:** Thailand

## 2. My Three Life Pillars

### Pillar 1 — Network Engineering Internship (active, primary focus)

I'm currently a **Network Engineering Intern** — that's my actual role. My day-to-day work is general network engineering tasks at the company. Separately, I've been **assigned a specific project**: building a **Surveillance Monitoring web application**. The surveillance project is one assignment within the internship, not the entire internship itself. After this project, I expect to be assigned other networking/engineering tasks until the internship ends in October 2026.

**Surveillance Monitoring project timeline (as of 2026-05-22):**

- **Total project duration:** 3 months.
- **Started:** approximately **26 April 2026**.
- **Deadline:** **early July 2026** (ไม่ใช่ปลาย July — เป็นต้นเดือน July).
- **Current phase:** **Frontend Web App (React)** — Backend API (C#) เสร็จแล้วและผ่าน testing ครบแล้ว (~55% complete ไม่นับการรอข้อมูลจริง).
- **After SSM ships:** จะได้รับโปรเจกต์ใหม่จากที่ทำงาน (ยังไม่รู้ว่าคืออะไร) และสหกิจดำเนินต่อถึงตุลาคม 2026.

**About the currently assigned project (Surveillance Monitoring web app):**

- **What it does:** Interactive infrastructure map with hierarchical layers: **Site → Building → Floor → Room → Rack → Device**.
- **Core mechanic:** Python scripts ping CCTV devices every few minutes. After 3 failed pings, the system:
  - Marks the affected area red in the web UI (cascading: room → floor → building → site).
  - Sends alerts to the dashboard and Discord.
  - Lets users drill down to find the exact failed device.
- **Device detail view shows:** CCTV IP, switch port, offline timestamp, related network/device details.
- **Biggest pain point right now:** **Data collection** — figuring out which CCTV connects to which switch port, which NVR controls which group, how switches connect (e.g., Server SW → B.1 SW → cameras), and keeping that inventory accurate. Building the network topology by hand is slow and error-prone.
- **Data sensitivity constraint:** The real device/IP/topology data is **confidential**. I cannot send it directly to cloud AI services. Any AI work must run locally OR be done on sanitized/anonymized data.

### Pillar 2 — Future Master's Degree

- I want to pursue a master's degree in the future.
- I currently do **not** have enough money for it.
- Plan: work for a few years to save money + gain experience, and/or apply for **scholarships**.
- I haven't picked a specific program yet — open to networking, AI/ML, or a combination.

### Pillar 3 — Investing / Trading

- I have some stock-market knowledge and currently make **small profits** through short-term trades.
- My budget is still limited.
- Goals:
  - Build more capital for long-term investing.
  - Improve financial planning.
  - Learn trading more seriously (I consider myself inexperienced).
- I want AI to help me **research faster**, not make trade decisions for me.

## 3. My Skill Level (as of May 2026)

| Area | Level | Notes |
|---|---|---|
| Network engineering | Intern-level, learning fast | Working hands-on with CCTV, switches, NVR, IP planning |
| Python | I can read & guide, but **I don't write code myself** | I use AI (ChatGPT / Gemini / Claude) to generate and modify code while I try to understand it |
| Web dev | Same as Python — I direct AI to build features | The current web app was built this way |
| Git / GitHub | **Beginner — I don't know how to use git yet** | Have a GitHub account, that's it |
| Claude Code | Installed, not yet used in real projects | This is the main tool I want to master |
| Other AI tools | Chat-based only — ChatGPT, Gemini, Claude.ai | No experience yet with agents, MCPs, or API |
| Stocks/trading | Beginner-intermediate, profitable on small scale | Mostly short-term |

## 4. What I Want to Build & Learn

### Headline goals
1. **Learn Claude Code deeply** through real projects (not tutorials).
2. **Build a team of sub-agents** that help me with both work and life.
3. **Build a high-value portfolio** showcasing both networking skills AND AI development skills, ready before I finish my studies.

### Sub-agent team I want to build
- **Internship helper agent** — write/debug Python scripts, document network setups, generate diagrams, sanitize sensitive data before AI processing.
- **Investing/stock research agent** — daily watchlist briefings, fundamental + news summaries, no auto-trading.
- **Scholarship/master's hunter agent** — find scholarships matching my profile, track deadlines, help with SOP/essays.
- **Life management agent** — daily planner, habit tracking, calendar, study schedule.
- **Meta-orchestrator** — multiple agents working as a coordinated team, not silos.

### Outcomes I care about (in priority order)
1. **Save meaningful time** on real work (especially data collection in the internship).
2. **Build portfolio** for jobs/scholarship applications after graduation.
3. **Improve workflow** across all three life pillars.
4. **Potentially turn one of the projects into a product/business** later.

## 5. My Working Style & Preferences

- **Hands-on learning:** I learn by building real things that solve real problems, not by following tutorials.
- **AI-augmented coder:** I don't write code from scratch; I direct AI and try to understand the output. **Please explain *why*, not just give me code.** I want to grow my understanding.
- **Confidential data:** Never assume I can paste production data into a cloud AI. Default to local execution or sanitization-first.
- **Time:** Roughly **20+ hours/week** available for AI/project learning alongside internship work.
- **Reply style:** Direct, structured, and in **Thai** (technical terms can stay English). I like seeing concrete next steps, not just theory.
- **Quality bar:** Each project should produce something portfolio-worthy (README, demo, write-up). No throwaway code.
- **Sanitization-first habit:** Build a workflow where data is anonymized before going anywhere outside my machine.

## 6. Tools I Already Have / Don't Have

**Installed / available:**
- Claude Code (installed, not used yet on real project)
- GitHub account (basic, don't know git yet)
- Python scripts running on internship environment
- Web app codebase from internship project
- Discord (for alerts)

**Need to learn / set up:**
- Git basics (clone, commit, push, branch)
- Claude Code workflow (sub-agents, MCPs, slash commands)
- VS Code or similar IDE for inspecting code
- Local data sanitization workflow

## 7. Active Constraints to Remember

- **HARD DEADLINE:** Surveillance Monitoring web app project must ship by **~late July 2026** (~2 months from 17 May 2026). The project is already 3 weeks in and stuck on data collection — the next 2–4 weeks of AI tooling MUST unblock this, not be theoretical.
- **Time:** ~5 months until internship ends (Oct 2026); other commitments include university and short-term trading.
- **Money:** Limited — prefer free / open-source / student-tier tools whenever possible.
- **Data confidentiality:** Real network data must not leave my machine.
- **Skill gap:** I can't write code unaided — assistants should generate code AND walk me through how it works.

## 8. How to Help Me Effectively

If you're a future AI assistant reading this, here's how to give me the most value:

1. **Always tie advice back to one of the three pillars** (internship / master's / investing) or my sub-agent team. Random advice gets discarded.
2. **Default to "build something real" over "read something theoretical."** I learn by doing.
3. **Explain code before generating it.** Walk me through the *why*, then show the *how*.
4. **Respect data confidentiality.** When network data is involved, ask "is this real or sanitized?" before processing.
5. **Track progress against the roadmap.** I have a separate `ROADMAP.md` — refer to it and update it when milestones are hit or scope changes.
6. **Respond in Thai even if I prompt in English.** Do not mirror my prompt language. My ability to understand English is limited; clear Thai explanations are the only way I can actually learn.
6. **Bias toward portfolio-quality output.** Every project should end with a README + demo + write-up.
7. **If I'm vague, ask 1–3 clarifying questions before making big assumptions.** I'd rather pause for a question than rework a wrong path.
8. **Update this file at the end of major sessions.** If my situation changes (new project, skill leveled up, pillar shifted), edit this file and tell me what you changed.

---

*End of ABOUT_ME.md — pair this with ROADMAP.md for full context.*
