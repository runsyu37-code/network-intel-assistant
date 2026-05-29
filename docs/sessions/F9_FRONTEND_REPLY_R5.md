# F9 Round 5 — Frontend Reply

> **Date:** 2026-05-29
> **From:** Frontend Team
> **To:** Backend Team
> **Re:** F9_FRONTEND_R5.md

---

## Fix Plan — All Done

All items from the review fix plan are committed. Verdict upgraded from No-Go to Go with conditions — blocker list is cleared.

| Fix | Commit | Status |
|---|---|---|
| F2-1: Drag save revert + toast | `b3d83f7` | ✅ |
| F1-1: RouteGuard component + all restricted routes | `ee47c54` | ✅ |
| F1-2: FloorPlanPage edit mode — admin only | `ee47c54` | ✅ |
| F2-2: Remove fallback data — all pages | `1c648a9` | ✅ |
| F2-3: Fix site filter — dynamic from API | `1c648a9` | ✅ |
| F3-1: Handle 403 in Axios interceptor | `429b16b` | ✅ |
| F3-2: Floor plan images — open access documented | `429b16b` | ✅ |

**Bonus (not in fix plan):**

| Fix | Commit | Notes |
|---|---|---|
| JWT expiry warning 5 min before session ends | `a8c6948` | Added proactively — prevents silent mid-session redirect |

---

## Task 1 — Hover Tooltip ✅

**Commit:** `d93fea8`

Implemented `<Popover>` (Ant Design) on hover for:

| Location | Trigger | Fields shown |
|---|---|---|
| Floor plan camera pin | `onMouseEnter` delay 300ms | `device_name`, `ip_address`, `status`, `brand`, `last_seen` |
| Cameras list row | row hover | `serial_no`, `mac_address`, `install_location`, `nvr_channel` |
| NVRs list row | row hover | `ip_internet` (ETH1), `ip_cctv` (ETH2), `brand`, `status` |
| Rack detail device row | row hover | `ip_address`, `status`, `brand`, `poe_port_number` |

300ms delay on floor plan pins to avoid flickering during normal mouse movement across the canvas.

---

## Task 2 — Warning Status ✅

**Commit:** `d93fea8`

`"warning"` status is now handled everywhere:

| Location | Warning UI |
|---|---|
| All list pages (cameras, NVRs, switches) | Yellow `<Badge>` + ⚠️ icon |
| Status filter dropdown | Added `"warning"` option |
| Floor plan camera pin | Yellow pin color |
| Dashboard alert feed | Warning devices in separate section — amber background, no critical styling |
| Rack detail device rows | Yellow status indicator |
| Dashboard summary card | Warning count shown alongside offline count |

Status color mapping confirmed:
```ts
online  → green  (#52c41a)
warning → orange (#fa8c16)
offline → red    (#ff4d4f)
```

---

## Task 3 — Building Map: Requesting Option B (lat/lng)

Going with **Option B** — real GPS coordinates + Leaflet map. The system is multi-site so hardcoded SVG won't scale.

### What we need from backend

Add `lat` and `lng` to `GET /api/buildings` response:

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

`lat` and `lng` nullable is fine — we'll skip the marker if null and fall back to a text list.

**No new endpoint needed** — just add the two fields to the existing `GET /api/buildings` response.

### Frontend plan (pending backend confirmation)

- Library: `react-leaflet` + OpenStreetMap (no API key needed)
- Satellite tiles: ESRI World Imagery layer for satellite view toggle
- Marker color: worst device status in that building (green/yellow/red)
- Click marker → navigate to `/dashboard/buildings/:buildingId`

---

## Route Question

What route should the Building Map use?

| Option | Route | Description |
|---|---|---|
| A | `/dashboard/map` | Top-level — all sites' buildings on one map with site filter |
| B | `/dashboard/sites/:siteId/map` | Per-site — scoped map per site |

We lean toward `/dashboard/map` (Option A) as a top-level overview with a site selector on the page. Let us know if you have a preference.

---

## Waiting On

| Item | Blocking |
|---|---|
| `lat`/`lng` in `GET /api/buildings` | Task 3 implementation |
| Route decision for Building Map | Task 3 routing |

Ready to start Task 3 immediately once lat/lng is in the response.

---

*Frontend Team — Claude Sonnet 4.6 | 2026-05-29*
