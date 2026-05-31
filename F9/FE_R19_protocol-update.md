# F9 Round 19 — Protocol Update (Both Teams)

> **Date:** 2026-05-31
> **From:** Frontend Team
> **To:** Backend Team
> **Status:** INFO — no action required, read and acknowledge

---

## What changed today and why

### Old system — what went wrong

The F9 folder existed only in the frontend branch. Backend had no equivalent folder.
Files were named `F9_FRONTEND_REPLY_R*.md` and `F9_BACKEND_REPLY_R*.md` — the naming
was inconsistent and the direction of communication was not obvious from the filename.

**Three recurring problems this caused:**

1. **Silent blocks** — R17 (building lat/lng) and R18 (camera position_x/y) were sent
   but never got a reply. Neither team knew the other was waiting. Work stalled for days
   without anyone noticing.

2. **No gate discipline** — there was no single place to check "is the backend ready
   before I start this UI?" The rack U-position UI could have been built without
   `u_height` existing in the schema — discovered only after the fact.

3. **No shared coordination space** — backend had no F9 folder, so there was no
   standard place to send requests back to frontend.

---

### New system — what was set up today

**1. F9/ now exists in both branches**
- `frontend` branch: `C:\1_Work_Local\AI_Agent\network-intel-assistant\F9\`
- `backend` branch: `C:\1_Work_Local\backend-latest\F9\`
- Both have: `PROTOCOL.md`, `API_CONTRACT_TEMPLATE.md`, `contracts/`

**2. New file naming convention**

| File prefix | Meaning | Who reads it |
|---|---|---|
| `FE_R<N>_<topic>.md` | Frontend → Backend request/note | Backend team |
| `BE_R<N>_<topic>.md` | Backend → Frontend request/note | Frontend team |
| `contracts/CONTRACT_<method>_<endpoint>.md` | API contract (both sign) | Both |
| `gates/GATE_<phase>.md` | Phase gate checklist | Both (check before starting) |

**3. New BLOCKED rule (replaces the old 2-day timer)**

> First, check if there is any work that moves the main track forward.
> If yes — do that work, then check back.
> If no — mark `Status: BLOCKED` immediately and notify the other team directly.
> Do not fill the time with unrelated tasks while the main track is stuck.

**4. All old files renamed** to match the new convention (git history preserved via `git mv`).

---

## What backend needs to do

- [ ] Read `F9/PROTOCOL.md` — the full rules are there.
- [ ] Acknowledge this file (change `Status: INFO` → `Status: READ` and commit).
- [ ] Use `BE_R<N>_<topic>.md` for all future requests/replies to frontend — drop them
      into `C:\1_Work_Local\AI_Agent\network-intel-assistant\F9\` and notify Ran.

---

## Still open from before

| Round | File | Issue | Status |
|---|---|---|---|
| R17 | `FE_R17_building-latlong.md` | `lat/lng` = null in DB for all buildings | OPEN |
| R18 | `FE_R18_camera-position.md` | `GET /api/cameras` not returning `position_x/y` | OPEN |

These are the two items that triggered this overhaul. Please address R18 first —
it's a one-line SELECT change and unblocks the floor plan position fix.

---

*Frontend Team — Claude Sonnet 4.6 | 2026-05-31*
