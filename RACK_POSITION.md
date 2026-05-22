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
A micro-slot within a single U slot (values: 1, 2, or 3).

One U slot does not always hold a single full-width device.
Smaller devices (e.g. half-width patch panels, fiber adapters) can share one U slot.
`u_subposition` identifies which micro-slot the device occupies within that U.

| Value | Meaning |
|---|---|
| `NULL` | Device occupies the entire U — no micro-slot division |
| `1`, `2`, `3` | Device occupies that specific micro-slot |

The number of micro-slots per U is defined at the rack level via `racks.units_per_u` (default 3, max 12).

### `u_size`
How many U slots the device occupies (default 1).
Example: a 2U server uses `u_size = 2`, occupying `u_position` and `u_position + 1`.

---

## Example

```
Rack (42U, units_per_u = 3) — front view, U1 at the bottom

  ┌─────────────────────────────────┐
  │ U6  [ sub1 ][ sub2 ][ sub3 ]   │  ← all micro-slots empty
  │ U5  [ Switch A ][ Switch B ][  ]│  ← sub1 = Switch A, sub2 = Switch B
  │ U4  │                           │  ← NVR-01 (u_size=2, occupies U3–U4)
  │ U3  │         NVR-01            │
  │ U2  [ Switch C ][              ]│  ← sub1 = Switch C
  │ U1  [                          ]│  ← empty
  └─────────────────────────────────┘ (floor)
```

| Device | u_position | u_subposition | u_size |
|---|---|---|---|
| Switch A | 5 | 1 | 1 |
| Switch B | 5 | 2 | 1 |
| NVR-01 | 3 | NULL | 2 |
| Switch C | 2 | 1 | 1 |

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
