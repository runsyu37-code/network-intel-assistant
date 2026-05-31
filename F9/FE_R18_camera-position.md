# F9 Round 18 — Frontend Note

> **Date:** 2026-05-30
> **From:** Frontend Team
> **To:** Backend Team
> **Re:** 2 open items still blocking full demo

---

## Still Waiting on Backend — 2 Items

### 1. Building Map — lat/lng missing (F9 R17, no reply yet)

`GET /api/buildings` returns `lat: null, lng: null` for every building.
Map page renders correctly but shows zero markers.

SQL to fix (adjust coordinates per actual building location):

```sql
UPDATE buildings SET lat = 13.7563, lng = 100.5018 WHERE Building_ID = 'B001';
UPDATE buildings SET lat = 13.7480, lng = 100.5350 WHERE Building_ID = 'B002';
```

Frontend is ready — no code change needed on our side.

---

### 2. Floor Plan — camera positions not persisted

`GET /api/cameras` does not include `position_x` / `position_y` in the response,
even though the columns exist in the DB and `PATCH /cameras/{id}/position` writes them.

Frontend reads `position_x` / `position_y` from the response and falls back to a grid
layout when they are null — so the page works, but positions reset on every reload.

**Fix needed:** Add `position_x` and `position_y` to the SELECT in the cameras GET endpoint.

---

## Everything Else is Working

| Area | Status |
|---|---|
| Login (admin + ssm_user) | ✅ |
| All 13 pages + real API | ✅ |
| Breadcrumb (real names) | ✅ |
| RBAC route guards | ✅ |
| Topology / Sites / Racks | ✅ |

Waiting only on the two items above before the demo is 100% complete.

---

*Frontend Team — Claude Sonnet 4.6 | 2026-05-30*
