# Open Design Prompt — Next Round

## Prompt to send (attach all 5 TASK_*.md files together)

---

Read each attached TASK_*.md file and produce one standalone HTML mockup per file.

**Output file naming** (match exactly):
- `TASK_NVR_DETAIL.md` → `screens_nvr-detail.html`
- `TASK_SWITCH_DETAIL.md` → `screens_switch-detail.html`
- `TASK_FLOOR_REDESIGN.md` → `screens_floor.html`
- `TASK_TOPOLOGY_LITE.md` → `screens_topology.html`
- `TASK_USERS_CRUD.md` → `screens_users-crud.html`

**Global rules for all files:**
- Standalone HTML — no sidebar, no topbar (page content only)
- Link these two shared CSS files in every `<head>`:
  ```html
  <link rel="stylesheet" href="../mpmh6zea-tokens.css">
  <link rel="stylesheet" href="../mpmh6ze9-layout.css">
  ```
- Dark mode primary (`--bg`, `--surface`, `--ink` tokens)
- Font: Inter (UI) + JetBrains Mono (numbers, IPs, code)
- CSS tokens only — no hardcoded hex colors except pure black/white
- No emoji anywhere
- Icons: inline SVG (stroke-based, 24×24 viewBox)
- Show the most interesting modal/state open by default where applicable

Produce all 5 files.
