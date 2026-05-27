# UX Issues & Improvement Backlog

Collected feedback from Ran — do not implement without reviewing each item first.

---

## 1. Topology Page — Too Heavy

**Issue:** The Topology page is overly complex and noisy. It doesn't need to be a full standalone page.

**Want:**
- Option A: Keep topology but make it collapsible / toggleable (show/hide panel)
- Option B: Remove as a standalone page entirely — embed a simplified version on the Dashboard instead

**Current route:** `/dashboard/topology`

---

## 2. Floor Plan — Top-View Mode Gone

**Issue:** There used to be a simple top-down floor plan view ("ผังฟิวๆ from top view") that is now missing or broken.

**Want:**
- Restore the simple top-view floor plan
- Add a **mode switch** on the Floor Plan page so the user can toggle between:
  - Top-view (simple 2D map)
  - Current view (whatever mode exists now)

**Current route:** `/dashboard/floors/:floorId`

---

## 3. Back Navigation — Context Lost After Entering Device Detail

**Issue:** When navigating into a Camera Detail or Rack Detail from a floor/building context, pressing back returns to the global list (all cameras / all racks) instead of the floor or building you came from.

**Example flow (broken):**
> Building A → Floor 3 → Click Camera → Camera Detail → Back → **Cameras list** ❌

**Expected flow:**
> Building A → Floor 3 → Click Camera → Camera Detail → Back → **Floor 3 plan** ✅

> Same issue with Rack: Rack Detail → Back should return to the building/floor it was accessed from, not the global Racks list.

**Fix approach (when implementing):**
- Pass `returnTo` via navigation state (`navigate(..., { state: { from: location.pathname } })`)
- Back button in detail pages reads `location.state.from` and navigates there
- Fallback to global list if no state

---

## Notes

- These are UX/navigation issues, not visual/design bugs
- Priority order: #3 (back navigation) → #2 (floor plan mode) → #1 (topology simplify)
- More issues of this type (context-lost navigation, missing UI modes) likely to appear as more pages are reviewed
