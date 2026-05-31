# ROADMAP V2 — SSM (Surveillance Smart-Monitor)

> **Replaces:** `docs/plan/ROADMAP.md` (outdated — its premise drifted; see LEARNING_LOG RETRO-002).
> **Date:** 2026-05-31 (ICT) · **Last reviewed:** 2026-05-31 (ICT)
> **Premise check (do this every milestone):** the web app already shipped and works end-to-end.
> We are past "is it built" and into "make it trustworthy, then expand." If that stops being true,
> stop and rewrite this file — do not let the north star point at a dead problem again.

---

## Tag legend

| Tag | Meaning |
|---|---|
| **[CRITICAL]** | Blocks downstream work or causes real rework if done wrong / out of order. |
| **[STRONG]** | Solid plan item, low risk. |
| **[WEAK]** | A soft spot, a contested design call, or low ROI for its position. Revisit before building on it. |

Owner key: **FE** frontend · **BE** backend · **BOTH**.

---

## ⚠️ The biggest structural problem with this roadmap is the phase ORDER you asked for — [CRITICAL]

You asked for three phases in this order: **(1) audit-ready, (2) full CRUD + rack, (3) alert
hardware test.** I'll honor that structure below, but I'm telling you plainly: **putting the alert
hardware test dead last is a mistake.**

- The hardware test has **zero code dependency** — it runs against the PingService + status + Discord
  that already exist. Nothing in Phases 1–2 gates it.
- It **validates the entire value proposition** ("we detect cameras going down"). If the detection
  model is wrong, you want to know *before* you've built CRUD and a rack UI on top of the same
  status assumptions, not after.
- It needs **hardware and scheduling** (a real camera, a PoE switch, lab time) that are independent
  of dev velocity — so it's the one thing you can run *in parallel* while code work proceeds.

**Recommendation:** keep three phases for planning, but pull a **minimal alert test (baseline +
controlled failure) into Phase 1**, in parallel, and leave only the *hardening* (flapping, cluster,
diagnosis seed) in Phase 3. I've marked the parallel track in Phase 1. If you ignore one piece of
this roadmap, don't let it be this one.

---

## Cross-cutting: Platform Hardening (do ALONGSIDE phases, not "after") — [CRITICAL]

These aren't a feature phase, but every recurring failure in this project lives here. Folding them
in early is cheaper than retrofitting. Full detail in `docs/FIXES_AND_ADDITIONS.md`.

| Item | Owner | Tag | Why it can't wait |
|---|---|---|---|
| EF Core migrations (stop hand-running `ALTER TABLE`) | BE | [CRITICAL] | P6 happened *because* migrations aren't tracked. It will happen again with every new column. |
| DTO discipline + generated OpenAPI/Swagger → typed FE client | BOTH | [CRITICAL] | Kills the entire "field missing from response" class (P5, lat/lng). This *is* the real answer to the coordination problem, more than any markdown contract. |
| Server-side RBAC on every mutating endpoint | BE | [CRITICAL] | UI route guards are **not security**. The moment CRUD ships (Phase 2), an unguarded POST is exploitable regardless of what the UI hides. |
| PingService hardening (concurrent pings, supervised service, heartbeat) | BE | [CRITICAL] | Runs on a VM (not a laptop), but sequential pinging still won't finish within the interval at scale, and a VM fails silently too (hypervisor pause/migration, lost subnet path). Verify the VM — see `docs/FIXES_AND_ADDITIONS.md` H4. See Phase 3. |
| Paginate + server-side filter list endpoints; index Floor_ID/Site_ID/status | BE | [STRONG] | Cheap now while data is small; a forced refactor once there are thousands of devices. Watch RackDetail's devices+alerts query for N+1. |

---

## Phase 1 — Audit-Ready  *(this week — see `F9/AUDIT_CHECKLIST.md`)*

**Goal:** auditors verify every camera's online/offline status, reliably and with trustworthy
freshness. Read-only.

| Item | Owner | Tag | Notes / my take |
|---|---|---|---|
| Verify PingService freshness | BOTH | [CRITICAL] | Stale-but-green is the worst audit failure. Highest leverage, usually skipped. |
| `last_seen` returned + shown + stale flag | BOTH | [CRITICAL] | The audit's integrity hinges on "online *now*", not "online sometime". |
| Flat Audit View (table + counts + offline filter) | FE | [CRITICAL] | The actual deliverable. Makes P1/P5 cosmetic for audit. |
| Run topology migration (P6) | BE | [STRONG] | 30-sec one-liner; stops silent errors. Do via EF migrations, not by hand. |
| `position_x/y` in cameras SELECT (P5) | BE | [STRONG] | ~1 hr; removes the localStorage crutch. |
| Delete localStorage position hack | FE | [CRITICAL] | Rip it out once P5 lands or it calcifies. |
| Fix P1 icon/status misalignment | FE | [WEAK] | Cosmetic *for audit* if the table is the surface. Polish, not correctness. |
| **(parallel) Minimal alert test: baseline + controlled failure** | BOTH | [CRITICAL] | Pulled forward from Phase 3 — see warning above. |

**Backend gates for Phase 1:** `last_seen` in SELECT, `position_x/y` in SELECT, topology migration
run. All small. **FE is otherwise unblocked now.**

**Exit criteria:** an auditor can list every camera, see trustworthy status + freshness, filter to
offline, and export it — without touching the floor plan.

---

## Phase 2 — Full CRUD + Rack

**Goal:** create/edit/delete every entity through the UI with real DB writes; rack U-position UI.

### Build order within Phase 2 (this order is load-bearing — [CRITICAL])

**2.1 — Device CRUD first (cameras / NVRs / switches)** — [CRITICAL]
- *Why first:* it's the foundation rack U-position is built on, and it's the highest-value
  "feels broken" fix (P2). Backend POST endpoints already exist
  (array-body add, `POST /{id}` edit, `POST /delete/{id}`) → **FE is unblocked right now.**
- **The one principle that prevents rework — [CRITICAL]:** build the device-mutation layer **once** —
  a shared mutations module + one reusable device modal — and reuse it for the list pages *and* the
  rack U-slot UI in 2.2. Do **not** write device-create twice. If you build a bespoke add-flow per
  page, you'll rebuild all of it for the rack.
- **Contract first** — [CRITICAL]: the array-vs-object body inconsistency (add=array, edit=object,
  delete=path param) is a footgun. Write a contract per endpoint so nobody guesses the shape.
- *My take on the delete pattern:* `POST /api/cameras/delete/{id}` is non-RESTful and the
  per-endpoint body inconsistency is technical debt. It's not worth a rewrite now, but **document it
  in contracts** so it stops costing a debugging session each time. [WEAK].

**2.2 — Rack U-position** — gated on schema (see below)
- Reuses the 2.1 mutation layer. Click empty U slot → add-device modal → POST with `Rack_ID` +
  `u_position` (+ `u_height`). Occupied slots show device + type. Click occupied → edit/remove.

**2.3 — Building / Site CRUD + coordinate (lat/lng) editing** — [STRONG]
- *Why before the map:* the map needs coordinates, and hand-seeding SQL forever is not a plan.
  This is what lets a real new building appear on the map without a DBA.

**2.4 — Satellite map (4B)** — LAST in Phase 2 — [WEAK] for its priority
- Tile-provider swap (ESRI/satellite) + reuse the existing click-to-navigate markers.
- *My take:* genuinely low ROI relative to audit and CRUD, and it's **blocked twice over** — no
  lat/lng data *and* no UI to enter it (2.3 must land first). **Do not start the map before 2.3**,
  or it stays empty for every real building and you'll have rebuilt the seeding by hand.

### Backend gates for Phase 2 (these are the rework landmines — [CRITICAL])

| Gate (BE must deliver) | Blocks | Tag | Why |
|---|---|---|---|
| `u_height` / `u_size` per device, **returned from device GET** | 2.2 rack UI | [CRITICAL] | A single `u_position` start-slot **cannot render a real rack** — a switch is 1U, an NVR 2U, a patch panel 1U. Without height you can't draw multi-U gear or detect overlaps. **FE must not start 2.2 until this exists.** |
| Confirm rack `max_u` exists + is returned | 2.2 rack UI | [CRITICAL] | The diagram is "1U → max_u". Verify it's real and in the response, don't assume. |
| Server-side overlap rejection (no two devices share a U range) | 2.2 writes | [CRITICAL] | A bare `u_position` column won't stop double-booking a slot; the API must 409 on overlap or the data corrupts. |
| Lock U numbering convention (U1 at bottom; top-down vs bottom-up) — write it in the contract | 2.2 render | [CRITICAL] | Real racks number U1 at the bottom. If FE and BE disagree on direction, the whole diagram renders upside-down. |
| Server-side RBAC on every CRUD endpoint | all of 2.1–2.4 | [CRITICAL] | Client guards are not security; see Platform Hardening. |
| `lat`/`lng` writable (2.3) and **returned** by `GET /api/buildings` (2.4) | 2.3 / 2.4 | [STRONG] | Same SELECT-drops-columns risk as P5 — verify the read path, not just the write. |

### Design call I think is wrong — flag before you build — [WEAK]

The plan reuses **device records (cameras) for rack items**, including patch panels
(`POST /api/cameras with Rack_ID + u_position`). Pragmatic for a v1, but:
- **Cameras don't physically rack-mount** — modelling a rack-mounted thing as a "camera" is a smell
  that will confuse every future query ("why is this camera not on a floor?").
- **Patch panels aren't cameras/NVRs/switches** at all — they have no IP, no ping, no status.
  Forcing them into the camera table means dead columns and special-casing forever.

*My recommendation:* introduce a minimal `rack_item` (or a `device_type` discriminator) so a rack
slot can hold non-pingable gear cleanly. You can defer this if v1 only racks switches/NVRs, but
**decide it explicitly in the Phase 2 contract** rather than discovering it after the UI is built.
Front/rear mounting can be deferred for v1 — that one's fine to skip.

**Exit criteria:** every entity is CRUD-able through the UI with real writes and server-side
authorization; racks render real multi-U devices with overlap protection.

---

## Phase 3 — Alert Hardware Test  *(but start the minimal version in Phase 1 — see warning)*

**Goal:** prove the offline-detection + Discord-alert pipeline works against real hardware, and
harden it against the failure modes that ICMP can't distinguish on its own.

### Test sequence (each step has an observable checkpoint) — [CRITICAL]

| # | Step | What you confirm | Tag |
|---|---|---|---|
| 1 | **Baseline** — camera connected | pings succeed, DB online, FE green, no Discord noise | [CRITICAL] |
| 2 | **Controlled failure** — unplug camera / its PoE | after `interval × 3`, DB flips offline → FE red on floor plan *and* topology → Discord fires **once**. Measure detection latency = interval × threshold. | [CRITICAL] |
| 3 | **Recovery** — replug | next good ping → online → green → Discord recovery message | [STRONG] |
| 4 | **Flapping** — unplug/replug rapidly | de-dup / cooldown stops Discord spam | [STRONG] |
| 5 | **Cluster** — pull the switch uplink feeding several cameras | system doesn't bury the real cause under N unrelated alerts (this is the seed of the diagnosis layer, 4D) | [STRONG] |

### Failure modes to watch — [CRITICAL]

ICMP getting no reply is **identical** for "camera truly down", "transient network blip", and
"switch port / PoE down". That ambiguity is the core problem:

- **Camera down vs transient timeout** → transient loss causes false offlines. Mitigate: sane
  per-ping timeout, the 3-failure threshold **spread over time** (not 3 rapid-fire), and
  **monitor the PingService host's own uplink** — if *every* camera fails at the same instant,
  that's a monitor-side signature (laptop slept / lost uplink), not mass camera death. — [CRITICAL]
- **Switch port / PoE budget** → looks exactly like camera-down over ICMP. Distinguish via
  **topology correlation** now (all cameras on one switch dropped together → upstream/PoE), and
  **SNMP** later for port up/down + per-port PoE draw. — [STRONG]
- **Site power outage** → everything at a site at once = site-level signature. — [STRONG]
- **IP/DNS change / DHCP reassignment** → pings fail though the camera is up. Mitigate: static IPs /
  DHCP reservations (good practice anyway) and **ping by IP, not hostname**. — [CRITICAL]
- **Discord rate limits on mass events** → batch/cooldown. Also: you log in **ICT** — make the alert
  timestamp's timezone unambiguous, and confirm "offline" cascades up the hierarchy **without
  double-counting**. — [STRONG]

**Backend gate for Phase 3:** none for the test itself. For the *hardening*, the PingService work in
Platform Hardening (concurrency, daemon, heartbeat) is the real dependency — [CRITICAL].

**Exit criteria:** a real camera going down produces a correct red status + a single Discord alert
within the measured latency, recovers cleanly, doesn't spam on flapping, and a cluster outage points
at the cluster rather than burying it.

---

## Build-order summary (what gates what)

```
Platform Hardening  ──(runs alongside everything; EF migrations + OpenAPI + RBAC are prerequisites for trust)
        │
Phase 1 Audit-Ready ──[BE: last_seen, position_x/y in SELECT; run migration]──> FE unblocked now
        │                                                   └─(parallel)─> Alert test: baseline + controlled failure
        ▼
Phase 2.1 Device CRUD ──[BE endpoints already exist]──> FE unblocked now ──> build mutation layer ONCE
        ▼
Phase 2.2 Rack U-pos ──[BE GATE: u_height returned + max_u confirmed + overlap rule + numbering locked]
        ▼
Phase 2.3 Building/Site CRUD + lat/lng write ──> feeds coordinates
        ▼
Phase 2.4 Satellite map ──[BE GATE: lat/lng returned by GET]── (do NOT start before 2.3)
        ▼
Phase 3 Alert hardening (flapping, cluster, diagnosis seed) ──[dep: PingService hardened]
```

**Two rules that prevent most of the rework in this whole roadmap:**
1. **Write the device-mutation layer once** (2.1) and reuse it for the rack (2.2). Don't build
   device-create twice. — [CRITICAL]
2. **Don't start the satellite map until coordinates can be entered through the UI** (2.3 → 2.4),
   or you'll hand-seed SQL forever and the map will be empty for every real building. — [CRITICAL]
