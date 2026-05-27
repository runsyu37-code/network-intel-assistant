# SSM — Weekly Update
### 2026-05-27

---

## Slide 1 — What We Did This Week

```
Backend ──────────────────────────────── ✅ 100% Complete
  17 API endpoints · JWT · BCrypt · RBAC
  17/17 Security tests PASS

Frontend ─────────────────────────────── ✅ 100% Complete
  14 pages · 9 endpoints connected to real API

Full-stack ───────────────────────────── ✅ Demo Ready
  Login → JWT → API → DB → UI
  localhost:3000
```

---

## Slide 2 — UI Built: Network Topology

> **[screenshot: mpnjkqqr-screens_topology.html]**

- View all Site / Building status in one page
- Live stats: cameras online / NVR / Switch
- Recent alerts — refreshes every 30 seconds

---

## Slide 3 — UI Built: Floor Plan + Cameras

> **[screenshot: mpnjkqql-screens_floor.html]**

- Camera positions shown on floor plan
- Admin can drag-and-drop cameras → saved to DB instantly
- Zoom in/out / click camera to view details

---

## Slide 4 — UI Built: Device Details

> **[screenshot: mpnjkqqo-screens_nvr-detail.html or mpnjkqqp-screens_switch-detail.html]**

- View channel / port usage per device
- Ping history chart
- Status: 🟢 Online / 🟡 Warning / 🔴 Offline

---

## Slide 5 — Role-Based Access Control (RBAC)

```
Admin   → All pages + edit access
User    → Site / Building / Floor / Rack
Viewer  → Site / Building / Floor Plan only

Enforced on both Backend and Frontend
```

---

## Slide 6 — Next Week: 3 Goals

```
1. Frontend fully production-ready
   → Redesign UI for 6 pages
   → Fetch real data on every page

2. Full-stack with real data
   → Seed real device data into DB
   → View it live on the web

3. Test live alerts with real hardware
```

---

## Slide 7 — Next Week: Live Alert Test

```
  PoE Switch ──┐
               ├──► Test Machine ──► SSM Web
  CCTV Camera ──┘

  Test: unplug cable / power off camera
            ↓
  Web must show 🔴 Offline + send alert

  Questions to answer:
  → Can the system detect it reliably?
  → How fast is the alert?
```

---

## Slide 8 — Final Goal Next Week

```
Connect real hardware
      ↓
Web shows live status + alerts
      ↓
SSM System fully operational ✅
```
