# Reviewer Probe Add-on — SSM Network Monitor Frontend

> **Type:** Mid-session supplement
> **Usage:** Paste the prompt below into the active review conversation to instruct the reviewer to probe these additional weak points before closing.

---

## Why This Add-on Exists

The original `REVIEWER_AGENT.md` hard questions cover general frontend concerns but miss three project-specific weak points that are known from the backend side. This file adds those.

---

## Additional Probe Points

### 1. Camera position persistence — the real trap
The PATCH `/api/cameras/{id}/position` endpoint saves position correctly.
**However:** `GET /api/cameras` does not return `position_x` / `position_y` in its response (known omission, logged in BACKEND_BUILDER_BRIEF).

The reviewer must ask:
> "When the floor plan page reloads, does the frontend GET position_x and position_y back from the API and render pins in their saved positions — or do the pins disappear on refresh?"

A builder answering only "we save it via PATCH" has not answered the question. Push until they confirm whether GET returns position fields or not.

---

### 2. `user` role boundary — the nuanced case
`viewer` being blocked is obvious. `user` is the harder role:
- Can see: sites, buildings, floors, rooms, racks
- Cannot see: cameras, NVRs, switches, logs

The reviewer must ask:
> "Walk me through what a `user` role sees at `/dashboard/racks` versus `/dashboard/cameras` — what's different, and how does the frontend enforce that boundary?"

Watch for: is the block a hidden route, a redirect, a 403 page, or just empty data? Each has different failure modes.

---

### 3. Floor plan image 404 — SVG fallback
`GET /api/floors/{floorId}/floor-plan/image` returns 404 if no image has been uploaded. The spec says the frontend has an SVG fallback for this case.

The reviewer must ask:
> "What does the floor plan page render when there is no floor plan image uploaded for that floor — does the SVG fallback actually appear, or is the canvas blank/broken?"

---
