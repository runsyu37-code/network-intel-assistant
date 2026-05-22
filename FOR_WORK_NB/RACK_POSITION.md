# Rack Position Fields — `u_position`, `u_subposition`, `u_size`

Applies to tables **`nvrs`** and **`poe_switches`** only.
Cameras are excluded — they are wall/ceiling mounted, not rack-installed.

---

## Fields

| Field | Type | Default | Nullable |
|---|---|---|---|
| `u_position` | INT | — | YES |
| `u_subposition` | TINYINT | — | YES |
| `u_size` | TINYINT | 1 | YES |

All 3 fields are nullable — NULL means the device has not yet been installed into a rack.

---

## Definitions

### `u_position`
The U slot number counted from the **bottom** of the rack upward (1-based).
Example: `u_position = 3` means the 3rd slot from the floor.

### `u_subposition`
A vertical mounting-hole position within a single U slot (values: 1, 2, or 3).

Each U slot has 3 mounting holes arranged **vertically** (Y-axis) on the rack rail.
`u_subposition` identifies which of those holes the device's bracket is fastened to.

| Value | Meaning |
|---|---|
| `NULL` | Mounting hole not recorded — position tracked at U level only |
| `1` | Bottom hole of that U |
| `2` | Middle hole of that U |
| `3` | Top hole of that U |

**Why this matters — airflow gaps:**  
If position were tracked in whole U steps only, the smallest airflow gap you could leave between two devices would be 1U (≈ 44 mm) — wasteful in a dense rack.  
With sub-position, a gap can be as small as one hole (~14 mm), allowing tighter, more efficient packing while still maintaining airflow.

The number of holes per U is defined at the rack level via `racks.units_per_u` (default 3, max 12).

### `u_size`
How many U slots the device occupies (default 1).
Example: a 2U server uses `u_size = 2`, occupying `u_position` and `u_position + 1`.

---

## Example

```
Rack front view — Y-axis is vertical, U1 at the bottom
Each U has 3 mounting holes stacked vertically (sub1=bottom, sub2=middle, sub3=top)

  ┌──────────────────────────────┐
  │      [sub3] ─────────────── │ ↑
  │ U5   [sub2] ── Switch A ─── │  1U  (u_pos=5, u_sub=2, u_size=1)
  │      [sub1] ─────────────── │ ↓
  ├──────────────────────────────┤  ← airflow gap (sub3 of U4 to sub2 of U5 = ~14mm)
  │      [sub3] ─────────────── │ ↑
  │ U4   [sub2] ─────────────── │  NVR-01 spans U3–U4
  │      [sub1] ─── NVR-01 ──── │ ↓  (u_pos=3, u_sub=1, u_size=2)
  ├──────────────────────────────┤
  │      [sub3] ─── NVR-01 ──── │ ↑
  │ U3   [sub2] ─── NVR-01 ──── │  NVR-01 continued
  │      [sub1] ─── NVR-01 ──── │ ↓
  ├──────────────────────────────┤
  │      [sub3] ─────────────── │ ↑
  │ U2   [sub2] ── Switch B ─── │  (u_pos=2, u_sub=2, u_size=1)
  │      [sub1] ─────────────── │ ↓
  ├──────────────────────────────┤
  │ U1   (empty)                 │
  └──────────────────────────────┘ (floor)
```

| Device | u_position | u_subposition | u_size | Notes |
|---|---|---|---|---|
| Switch A | 5 | 2 | 1 | bracketed at the middle hole of U5 |
| NVR-01 | 3 | 1 | 2 | bracketed at the bottom hole of U3, spans U3–U4 |
| Switch B | 2 | 2 | 1 | bracketed at the middle hole of U2 |

Gap between Switch B (U2 sub2) and NVR-01 (U3 sub1) ≈ 1 hole ≈ 14 mm — sufficient for airflow.  
If position were tracked at U level only, a full 1U gap (44 mm) would be required instead.

---

## SQL Constraints

```sql
-- racks table
units_per_u  TINYINT  DEFAULT 3  NOT NULL
CONSTRAINT CHK_racks_units_per_u CHECK (units_per_u BETWEEN 1 AND 12)

-- nvrs / poe_switches
CONSTRAINT CHK_nvr_usubpos CHECK (u_subposition IS NULL OR u_subposition BETWEEN 1 AND 3)
CONSTRAINT CHK_sw_usubpos  CHECK (u_subposition IS NULL OR u_subposition BETWEEN 1 AND 3)
```

---

## Known Limitation

The `u_subposition` CHECK constraint is hardcoded to `BETWEEN 1 AND 3` on the device tables (`nvrs`, `poe_switches`), but `racks.units_per_u` can be configured up to 12.

**Impact:** If a rack has `units_per_u > 3`, any device assigned `u_subposition > 3` will fail the constraint and cannot be saved.

**Current workaround:** All racks in v1.0 use the default `units_per_u = 3`. This limitation has no practical impact for the current deployment.

**Fix planned:** v2.0 — replace the hardcoded CHECK with a trigger or application-layer validation that reads `units_per_u` dynamically from the parent rack.

---

## Indexes

```sql
IX_nvrs_rack_slot    ON nvrs         (Rack_ID, u_position, u_subposition)
IX_sw_rack_slot      ON poe_switches (Rack_ID, u_position, u_subposition)
```

These indexes allow the rack diagram view to load device positions quickly.
