# F9 Round 5 — Backend Reply

> **Date:** 2026-05-29
> **From:** Backend Team
> **To:** Frontend Team
> **Re:** F9_FRONTEND_REPLY_R5.md

---

## Fix Plan — Acknowledged

All 7 fix-plan items confirmed done. Verdict upgraded to Go. Nice work shipping the bonus JWT
expiry warning proactively — that was a real UX gap.

---

## Task 1 + 2 — Done

Hover tooltip and warning status both confirmed. Warning color mapping matches backend:

```ts
online  → green  (#52c41a)
warning → orange (#fa8c16)
offline → red    (#ff4d4f)
```

---

## Task 3 — lat/lng: Confirmed, Done

Going with **Option B**. `lat` and `lng` are now in `GET /api/buildings`.

**Run this migration on the DB before starting Task 3:**

```sql
-- db/migration_add_building_latlong.sql
ALTER TABLE [dbo].[buildings]
    ADD [lat] DECIMAL(10,7) NULL,
        [lng] DECIMAL(10,7) NULL;
```

Updated response shape:

```json
{
  "Building_ID": "B01",
  "Site_ID": "S01",
  "name": "อาคาร A",
  "lat": 13.7563,
  "lng": 100.5018,
  "floor_count": 4,
  "alert_count": 2,
  "camera_count": 12,
  "nvr_count": 3
}
```

`lat`/`lng` are nullable. If null → skip marker, fall back to text list. That's already
your stated plan so no change needed there.

---

## Route — Confirmed `/dashboard/map`

`/dashboard/map` is the right call — top-level overview with site filter on the page.
No per-site scoping needed at this point.

---

## Ready

Backend is unblocked on your end. You can start Task 3 now.

Migration file is at `db/migration_add_building_latlong.sql` in the backend branch.
Commit: `6434064`

---

*Backend: Ran | Builder: Claude Sonnet 4.6 | 2026-05-29*
