# SSM — AI Task Delegation Guide

Use this file to delegate work to the right AI tool.
Each section has a ready-made prompt and the files to attach.

---

## 1. Open Design — Visual Polish

**When to use:** UI looks functional but plain. Want it to look more professional/enterprise.

**Files to attach:**
- `src/styles/tokens.css`
- `src/styles/layout.css`
- `src/styles/sites.css`
- `src/styles/rack.css`
- `src/styles/devicelist.css`
- `src/styles/camera.css`

**Prompt:**
```
I have a React SPA called SSM (Surveillance Smart-Monitor) — a CCTV device
management dashboard for a network operations team.

Tech stack: React 18 + Vite + TypeScript, Ant Design 5 (Form/Modal/Table only,
NOT for layout), CSS custom properties in tokens.css. No Tailwind.

I'm attaching the CSS files. Please help me:
1. Improve the color token palette in tokens.css to look more like a modern
   enterprise monitoring tool (think Grafana / Datadog light theme)
2. Improve card/panel visual hierarchy in layout.css — better shadows, borders,
   spacing
3. Make the sidebar feel more polished (brand area, nav items, user chip)
4. Suggest loading skeleton styles for tables and cards

Rules:
- Keep all changes inside the CSS files — no inline styles
- Use CSS custom properties for anything that has a light/dark variant
- Do NOT change class names — they are used throughout the codebase
- No Tailwind, no CSS-in-JS
```

---

## 2. Any Code AI — Boilerplate / Repetitive Tasks

### 2a. Convert mock data to React Query hooks

**When to use:** Backend API is ready. Want to replace in-file mock arrays with real API calls.

**Files to attach:**
- `review/FRONTEND_HANDOFF.md`
- `src/api/client.ts`
- One example page, e.g. `src/pages/CamerasPage.tsx`

**Prompt:**
```
I have a React SPA using TanStack React Query + Axios. The backend API spec is
in FRONTEND_HANDOFF.md. I'm attaching a sample page (CamerasPage.tsx) that
currently uses an in-file mock array.

Please convert it to use a React Query useQuery hook:
- API base URL: http://localhost:50680
- Auth: Authorization: Bearer <token> header (token from localStorage key "token")
- Endpoint: GET /api/cameras (returns array)
- Keep the same UI — only replace the data source
- Add isLoading state: show Ant Design Skeleton while loading
- Add isError state: show a simple error message if fetch fails
- Do NOT change any class names or CSS

After showing me the converted CamerasPage.tsx, I'll apply the same pattern to
the other pages myself.
```

### 2b. Add `user` role to frontend

**When to use:** Need to add 3rd role (`user` = can edit but can't manage users/floors).

**Files to attach:**
- `src/stores/authStore.ts`
- `src/components/layout/Sidebar.tsx`
- `review/FRONTEND_HANDOFF.md` (role matrix section)

**Prompt:**
```
I have a React app with a Zustand auth store. Currently the app only has two
roles: "admin" and "viewer". I need to add a third role "user" based on the
role matrix in FRONTEND_HANDOFF.md.

Role matrix summary:
- admin: full access including user management and floor plan upload
- user: can edit cameras/NVRs/buildings, drag-drop pins, but cannot manage users
  or upload floor plans
- viewer: read-only, cannot edit anything

Changes needed:
1. authStore.ts — add "user" to the role type union
2. Sidebar.tsx — "Admin" section (Users menu) should only show for admin,
   not for user role (currently correct, just verify)
3. In FloorPlanPage.tsx — Edit mode button should be hidden for viewer,
   visible for both admin and user

Show me the minimal changes needed.
```

---

## 3. Claude (context-heavy / integration tasks)

**When to use:** Tasks that require understanding the whole codebase, tricky API gotchas,
or fixing bugs across multiple files.

**Files to attach:**
- `CLAUDE.md`
- `review/FRONTEND_HANDOFF.md`
- Whichever source files are relevant

### Task list for Claude:

| Task | Files needed |
|------|-------------|
| Axios 401 interceptor → redirect to login on token expire | `src/api/client.ts`, `src/stores/authStore.ts` |
| Floor plan image: fetch as blob (authenticated endpoint) | `src/pages/FloorPlanPage.tsx`, `FRONTEND_HANDOFF.md` |
| Real polling: `GET /api/status/devices` every 30s, update status badges | `src/components/layout/Topbar.tsx`, `FRONTEND_HANDOFF.md` |
| Wire hierarchy tree to sidebar nav (replace hardcoded counts) | `src/components/layout/Sidebar.tsx`, `FRONTEND_HANDOFF.md` |
| Wire dashboard summary to Topology page stats | `src/pages/TopologyPage.tsx`, `FRONTEND_HANDOFF.md` |
| Fix any bugs found during API integration | Depends on error |

**Standard opening prompt for Claude:**
```
Context files: CLAUDE.md (project rules), FRONTEND_HANDOFF.md (API spec).

Task: [describe task here]

Current behavior: [what it does now]
Expected behavior: [what it should do]

Relevant files: [list files]
```

---

## File Map — What Each AI Needs

| AI Tool | Always send | Also send |
|---------|------------|-----------|
| Open Design | `tokens.css`, `layout.css` | Other CSS files as needed |
| Code AI (boilerplate) | `FRONTEND_HANDOFF.md`, `src/api/client.ts` | The specific page to convert |
| Claude | `CLAUDE.md`, `FRONTEND_HANDOFF.md` | Files mentioned in task |

---

## Current Status (as of 2026-05-26)

- All pages built with mock data ✅
- Auth persistence ✅
- UI polish done (alerts, breadcrumb, sidebar context) ✅
- **Not done yet:** API integration (all pages still use mock arrays)
- **Not done yet:** 401 handling / token refresh
- **Not done yet:** Authenticated floor plan image endpoint
- **Not done yet:** Real-time status polling

Deadline: **2026-05-29 (Thursday)**
