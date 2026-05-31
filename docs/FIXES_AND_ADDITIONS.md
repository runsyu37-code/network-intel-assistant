# Fixes & Additions — Master Flat List

> **What this is:** every fix and addition the SSM project needs, in one place, each with an owner
> (FE / BE / BOTH), what it's blocked on, a risk tag, and my honest take. Cross-reference:
> `docs/plan/ROADMAP_V2.md` (order), `F9/AUDIT_CHECKLIST.md` (this week), `F9/API_CONTRACT_TEMPLATE.md`.
> **Date:** 2026-05-31 (ICT) · **Last reviewed:** 2026-05-31 (ICT)

## Tag legend

| Tag | Meaning |
|---|---|
| **[CRITICAL]** | Blocks downstream work or causes real rework / a security or data bug. |
| **[STRONG]** | Solid, low-risk. Just do it. |
| **[WEAK]** | Low ROI for its position, fragile, or a design call I'd push back on. |

Owner: **FE** frontend · **BE** backend · **BOTH**. Type: **Fix** (something broken) · **Add** (new).

---

## A. Current bugs (P1–P6)

| Item | Type | Owner | Blocked on | Tag | My take |
|---|---|---|---|---|---|
| P1 — camera icon ↔ status indicator misaligned | Fix | FE | nothing | **[WEAK]** | Cosmetic *for the audit* if the flat Audit View is the surface. Polish, not correctness. |
| P2 — no working CRUD through the UI | Fix | FE (BE endpoints exist) | contracts + shared mutation layer | **[CRITICAL]** | Highest "feels broken" item. The fix is FE wiring, not new BE. |
| P3 — satellite map + clickable overlays | Add | FE | lat/lng data **and** coordinate-entry UI | **[WEAK]** | Double-blocked and low ROI. Don't start before the coordinate UI exists. |
| P4 — rack add-device / U-position unused | Add | FE | rack schema gate (Section D) | **[CRITICAL]** | Blocked on schema, not UI. See D — `u_height` is the real prerequisite. |
| P5 — `GET /api/cameras` drops `position_x/y` | Fix | BE | nothing (add to SELECT) | **[CRITICAL]** | One-hour fix that's been forcing a localStorage hack. The SELECT is wrong, not the schema. |
| P6 — topology migration not run | Fix | BE | SSMS access | **[STRONG]** | 30-sec one-liner. *But* the missing **migration discipline** behind it is **[CRITICAL]** — see G. |

---

## B. CRUD wiring — per page (Roadmap 2.1 / brief 4A)

| Item | Type | Owner | Blocked on | Tag | My take |
|---|---|---|---|---|---|
| **Shared device-mutation layer + reusable modal** | Add | FE | nothing | **[CRITICAL]** | Build this **once** and reuse for list pages *and* the rack. The single biggest anti-rework move in the project. |
| Camera add (`POST /api/cameras`, array body) | Fix | FE | contract sign-off | **[CRITICAL]** | First mutation to wire; it exercises the array-body quirk. |
| Camera edit (`POST /api/cameras/{id}`, object body) | Fix | FE | contract | **[STRONG]** | — |
| Camera delete (`POST /api/cameras/delete/{id}`) | Fix | FE | contract | **[STRONG]** | Non-REST pattern; works. Document it so nobody guesses. |
| NVR add/edit/delete | Fix | FE | contract | **[STRONG]** | Reuses the mutation layer. |
| Switch add/edit/delete | Fix | FE | contract | **[STRONG]** | Reuses the mutation layer. |
| Rack add/edit/delete (`POST /api/racks`) | Fix | FE | contract | **[STRONG]** | — |
| Device-in-rack (`POST` device w/ `Rack_ID`+`u_position`) | Add | FE | **rack schema gate (D)** | **[CRITICAL]** | Don't wire until `u_height`/`max_u`/overlap rule exist. |
| Site create/rename/delete (`POST /api/sites`) | Fix | FE | contract | **[STRONG]** | — |
| Building add/rename/delete (`POST /api/buildings`) | Fix | FE | contract | **[STRONG]** | Partial today; finish it. |
| Floor-plan image upload (`POST /api/floor-plans`) | Add | FE | **confirm endpoint exists** + multipart contract | **[WEAK]** | Verify the endpoint is real first. Image upload has its own traps: size limits, storage location, allowed types. Don't assume it's a simple JSON POST. |
| Users add/edit/delete (read works) | Fix | FE | **server-side RBAC confirm (G)** | **[CRITICAL]** | Admin-only must be enforced **server-side**, not just by hiding the page. |

---

## C. Audit-readiness (Roadmap Phase 1 — this week)

| Item | Type | Owner | Blocked on | Tag | My take |
|---|---|---|---|---|---|
| Verify PingService is running + status fresh | Fix | BOTH | nothing | **[CRITICAL]** | Stale-but-green is the worst audit outcome. Invisible, so it gets skipped. Don't. |
| Return `last_seen` on camera GET | Add | BE | contract | **[CRITICAL]** | Same drop-from-SELECT class as P5. |
| Show `last_seen` + stale flag (amber) on status | Add | FE | BE `last_seen` | **[CRITICAL]** | Auditor must distinguish "verified online" from "haven't heard from it". |
| Flat **Audit View** table + counts + offline filter | Add | FE | nothing | **[CRITICAL]** | The actual audit deliverable. Makes P1/P5 cosmetic for audit. |
| Export / print Audit View (CSV / PDF) | Add | FE | Audit View | **[STRONG]** | Auditors take evidence away. One button, high credibility. |
| Delete localStorage position crutch | Fix | FE | P5 landed | **[CRITICAL]** | "Works" → calcifies → breaks on new machine. Rip it out the day P5 lands. |
| Write "P2/P3/P4 out of scope this week" note | Add | FE | nothing | **[STRONG]** | Cheapest item; stops both branches drifting onto shiny features. |

---

## D. Rack schema changes (gates Roadmap 2.2 / brief 4C / P4)

| Item | Type | Owner | Blocked on | Tag | My take |
|---|---|---|---|---|---|
| Add `u_height`/`u_size` per device + **return from GET** | Add | BE | nothing | **[CRITICAL]** | A single start-slot can't draw a 2U NVR or detect overlap. **FE cannot start the rack UI without this.** |
| Confirm rack `max_u` exists + is returned | Fix | BE | nothing | **[CRITICAL]** | The diagram is "1U → max_u". Verify, don't assume. |
| Server-side overlap rejection (409 on overlapping U range) | Add | BE | nothing | **[CRITICAL]** | A bare column won't stop double-booking a slot → corrupt rack data. |
| Lock + document U numbering (U1 bottom; top-down vs bottom-up) | Add | BOTH | nothing | **[CRITICAL]** | Disagreement → diagram renders upside-down. Put it in the contract. |
| Introduce `rack_item` / `device_type` discriminator | Add | BE | **design decision** | **[WEAK]** | Recommended (see H). Deferrable *only* if v1 racks just switches/NVRs. Decide explicitly, don't drift. |

---

## E. Satellite map (gates Roadmap 2.3→2.4 / brief 4B / P3)

| Item | Type | Owner | Blocked on | Tag | My take |
|---|---|---|---|---|---|
| `lat`/`lng` writable via API (coordinate-entry) | Add | BE | nothing | **[STRONG]** | Prerequisite to ever filling the map without a DBA. |
| Coordinate-entry UI (building detail) | Add | FE | lat/lng writable | **[STRONG]** | This is what makes the map self-sustaining. |
| `lat`/`lng` **returned** by `GET /api/buildings` | Fix | BE | nothing | **[CRITICAL]** | Same SELECT-drops-columns risk as P5 — verify the **read** path, not just write. |
| Populate lat/lng for current real buildings | Fix | BE | coords entered (or the UI above) | **[STRONG]** | Why the map is empty today. Stopgap until the UI exists. |
| Swap tile provider to satellite + reuse click-nav | Add | FE | coordinate UI (2.3) | **[WEAK]** | Lowest ROI of all features. **Do not start before coords are enterable** or the map is empty for every new building. |

---

## F. Alert pipeline (Roadmap Phase 3 / brief 4D)

| Item | Type | Owner | Blocked on | Tag | My take |
|---|---|---|---|---|---|
| Run E2E test sequence (baseline→failure→recover→flap→cluster) | Add | BOTH | hardware (camera + PoE switch + uplink) | **[CRITICAL]** | Validates the whole premise. **Pull baseline+failure into Phase 1** — it has no code dependency. |
| Ping by **IP**, not hostname / give cameras static IPs | Fix | BOTH (network) | nothing | **[CRITICAL]** | DHCP reassignment → pings fail though the camera is up → false offlines. |
| Discord de-dup / cooldown | Add | BE | nothing | **[STRONG]** | Needed before the flapping test, or you spam the channel. |
| Monitor the PingService VM's own path to the camera subnet | Add | BE | confirm network path | **[CRITICAL]** | "Whole fleet offline at once" = the VM lost its path (firewall/VLAN/routing change), not mass camera death. Must be distinguishable. Overlaps heartbeat (G) + H4. |
| Alert timestamp timezone unambiguous (ICT) | Fix | BE | nothing | **[STRONG]** | You log in ICT; make the alert clock explicit. |
| Topology correlation for cluster outages | Add | BE | E2E test insights | **[STRONG]** | Seed of the diagnosis layer. |
| SNMP for port up/down + PoE draw | Add | BE | future | **[WEAK]** | The real way to tell "port down" from "camera down". Later, not now. |
| Diagnosis / triage layer ("3 cams on one port → PoE") | Add | BOTH | a *working* pipeline first | **[WEAK]** | Do **not** build this before the basic pipeline is proven end-to-end. |

---

## G. Platform hardening — the root-cause fixes (brief 4E + the weak points)

> Every recurring failure in this project lives here. These aren't a feature; they're the reason
> features keep tripping. Folding them in early is cheaper than retrofitting.

| Item | Type | Owner | Blocked on | Tag | My take |
|---|---|---|---|---|---|
| EF Core migrations (stop hand-running `ALTER TABLE`) | Fix | BE | nothing | **[CRITICAL]** | P6 happened *because* migrations aren't tracked. Recurs with every new column otherwise. |
| DTO discipline + OpenAPI/Swagger + typed FE client | Add | BOTH | nothing | **[CRITICAL]** | Kills the entire "field missing from response" class (P5, lat/lng, last_seen). The *real* fix for "frontend waits on backend" — more than the markdown contract. |
| Server-side RBAC on every mutating endpoint | Fix | BE | nothing | **[CRITICAL]** | UI guards are not security. The moment CRUD ships, an unguarded POST is exploitable. |
| PingService: concurrent pings | Fix | BE | nothing | **[CRITICAL]** | Sequential pinging won't finish within the interval once there are hundreds of cameras → silent status lag. |
| PingService: confirm it's a supervised service (not a login-session script) | Fix | BE | verify VM service setup | **[CRITICAL]** until verified | Runs on a VM (good — not a laptop). But confirm it's a `systemd`/Windows Service that auto-restarts and starts on boot, *not* a script in an SSH/RDP session that dies on logout. See H4. |
| PingService: emit a heartbeat | Add | BE | nothing | **[CRITICAL]** | The *absence* of monitoring must itself alert, or you trust a dead monitor. |
| Paginate + server-side filter list endpoints | Add | BE | nothing | **[STRONG]** | Cheap now; a forced refactor at thousands of devices. |
| Index `Floor_ID` / `Site_ID` / `status` | Add | BE | nothing | **[STRONG]** | Unindexed full-table reads will choke as data grows. |
| Audit RackDetail's combined devices+alerts query (N+1) | Fix | BE | nothing | **[STRONG]** | Watch for per-device alert queries; batch them. |
| Adopt the API contract template in `F9/contracts/` | Add | BOTH | nothing | **[STRONG]** | The stopgap until OpenAPI exists. Useful, but don't mistake it for the durable fix. |

---

## H. Design calls I'd change before you build on them — [read this]

These are the places where I think the current design is **wrong or risky**, not just incomplete.
You asked me to be critical, so here they are with reasoning.

**H1. Modelling rack items (and patch panels) as camera records — [WEAK], borderline [CRITICAL] for the rack.**
The plan reuses `POST /api/cameras` (with `Rack_ID` + `u_position`) to put things in a rack.
Cameras don't physically rack-mount, and patch panels have no IP, no ping, no status — forcing them
into the camera table means dead columns and special-casing forever, plus confusing queries ("why
is this camera not on any floor?"). **Recommendation:** a minimal `rack_item` table or a
`device_type` discriminator so a slot can hold non-pingable gear cleanly. Deferrable *only* if v1
racks just switches/NVRs — but decide it in the Phase 2 contract, don't discover it after the UI is
built.

**H2. The HQ topology node with no `Site_ID` — [WEAK].**
It currently persists separately via localStorage, diverging from how every other node works. That
divergence is small now and a maintenance wart later. **Decide explicitly:** add HQ as a real site
(clean, consistent) or formally keep it UI-only (documented, accepted). Don't leave it as an
accident.

**H3. `POST /api/cameras/delete/{id}` + array-vs-object body inconsistency — [WEAK].**
Add uses an array body, edit a single object, delete a path param via POST. It works, so a rewrite
isn't worth it now — but the inconsistency costs a debugging session every time someone wires a new
mutation. **At minimum, document the shape per endpoint in `F9/contracts/`.** If you ever do a v2
API, normalize to real HTTP verbs.

**H4. PingService host — [CRITICAL] until the VM is verified.**
*Correction applied: it runs on a VM, not a work notebook — so the "laptop sleeps / gets closed"
mode is gone.* But a VM is a **better** host, not automatically a **reliable** one, and the
hardening items don't disappear — they re-point at VM facts not yet known. A VM has its own
silent-death modes: the hypervisor pausing / migrating it or taking a maintenance / snapshot
window, host resource pressure OOM-killing the ping process, a firewall / VLAN / routing change
cutting it off from the camera subnet, and clock drift after a pause (which quietly poisons the
`last_seen` freshness logic *and* the alert timestamps). It is also still a single point of failure.
Concurrency (scale), heartbeat (silent death), subnet-path monitoring, and ping-by-IP all still
stand — and heartbeat + path-monitoring matter *more* on a VM than on a laptop, because a VM fails
where nobody is looking. **Verify before trusting it:**
- **Always-on policy** — is it excluded from cost-saving auto-shutdown? Who can pause / stop it?
  What happens to the process during host maintenance / snapshots? (The VM-equivalent of "the
  laptop slept.")
- **Supervision** — is the pinger a `systemd` unit / Windows Service that auto-restarts on crash
  and starts on boot, or a script in an SSH / RDP / tmux session that dies on logout?
- **Network path to the camera subnet** — direct (same VLAN / routed) or through a
  firewall / NAT / VPN? Is ICMP permitted end-to-end? A filtered or fragile path is itself a
  mass-false-offline vector.
- **Spec (vCPU / RAM)** — enough headroom to ping the *current* fleet concurrently and finish a
  full sweep in well under one interval? (The metric that matters is sweep-time ÷ interval, not the
  host type.)
- **Clock** — NTP-synced? VM clock drift breaks both the stale-detection threshold and the alert
  timestamps (ties to the ICT item in F).

**H5. The floor-plan-centric audit assumption — [WEAK].**
The brief frames the audit around floor plans and treats P1 (icon alignment) as a top fix. But
"verify *every* camera" is a completeness question a flat table answers better and more robustly
(no positions to lose or misalign). I'd build the table as the audit surface and demote the floor
plan to a nice-to-have view. This reframes P1/P5 from blocking to cosmetic — which is why the
checklist orders them the way it does.

---

## One-paragraph summary of where the real risk is

Most of the item-by-item work is straightforward FE wiring against endpoints that already exist
(Section B), and it's largely unblocked **today**. The danger isn't those — it's three things that
are easy to under-prioritize because none of them is a visible feature: **(1) status freshness /
PingService reliability** (a dead monitor lies), **(2) the rack schema gate** (`u_height`/`max_u`/
overlap/numbering — build the UI without these and you rebuild it), and **(3) platform discipline**
(EF migrations + OpenAPI + server-side RBAC — the absence of which caused every recurring bug so
far and will cause the next ones). Spend disproportionately on those three.
