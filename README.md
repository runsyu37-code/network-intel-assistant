# SSM — Surveillance Smart-Monitor

ระบบติดตามกล้องวงจรปิดและอุปกรณ์เครือข่ายแบบ Real-time  
Full-stack: React SPA (Frontend) + ASP.NET Core API (Backend)

---

## อ่านก่อนเริ่มทำงาน

| ต้องการอะไร | ไปที่ |
|---|---|
| บริบทโปรเจกต์ + rules ทั้งหมด | [`CLAUDE.md`](CLAUDE.md) |
| งานที่ค้างอยู่ + API notes + gotchas | [`BACKLOG.md`](BACKLOG.md) |
| ปัญหา UX ที่รอแก้ | [`open design/UX_ISSUES.md`](open%20design/UX_ISSUES.md) |
| Presentation slides | [`presentation_F/SLIDES_FINAL.md`](presentation_F/SLIDES_FINAL.md) |

---

## สถานะโปรเจกต์

> อัปเดต: **2026-05-27** · Deadline: **2026-05-29 (พฤหัส)**  
> Branch หลัก: `frontend`

| ส่วน | สถานะ |
|---|---|
| Backend API (ASP.NET Core) | ✅ เสร็จ — JWT, RBAC, 17+ endpoints |
| Dashboard overview | ✅ stat cards + alerts + offline devices + per-site table |
| CRUD Sites / Cameras / NVRs / Switches | ✅ Add / Edit / Delete modal ครบทุกหน้า |
| Frontend pages ทั้งหมด | ✅ 15 หน้า (ดูตารางด้านล่าง) |
| เชื่อม API จริงทุกหน้า | 🟡 บางหน้าแล้ว — list pages ใช้ mock, detail pages ใช้ API |
| UX issues (back nav, floor mode, topology) | 🔴 รอแก้ — ดู `open design/UX_ISSUES.md` |

---

## Quick Start

### Frontend

```powershell
cd C:\ai-playground\Frontend
npm install
npm run dev
# → http://localhost:3001
```

### Backend (ต้องเปิดถ้าจะดูหน้า detail / topology)

```powershell
cd C:\ai-playground\Frontend\BNO_Survei_Monitor\BNO_Survei_Monitor
dotnet run
# → http://localhost:44342
```

> หน้า Dashboard, Sites list, Cameras list, NVRs list, Switches list ใช้ mock data — **ดูได้โดยไม่ต้องเปิด backend**

### Login ทดสอบ

| Username | Password | Role |
|---|---|---|
| `admin_test` | `Test@1234` | Admin |
| `user_test` | `Test@1234` | User |
| `viewer_test` | `Test@1234` | Viewer |
| ใส่อะไรก็ได้ | ใส่อะไรก็ได้ | Admin (mock fallback) |

---

## Pages ทั้งหมด

| Route | ไฟล์ | Data | สถานะ |
|---|---|---|---|
| `/dashboard` | `OverviewPage.tsx` | Mock | ✅ |
| `/dashboard/topology` | `TopologyPage.tsx` | API | ✅ |
| `/dashboard/sites` | `SitesCrudPage.tsx` | Mock | ✅ CRUD |
| `/dashboard/sites/:siteId` | `SitesPage.tsx` | Mock | ✅ |
| `/dashboard/buildings/:id` | `BuildingDetailPage.tsx` | Mock | ✅ |
| `/dashboard/floors/:id` | `FloorPlanPage.tsx` | Mock | ✅ |
| `/dashboard/cameras` | `CamerasPage.tsx` | Mock | ✅ CRUD |
| `/dashboard/cameras/:id` | `CameraDetailPage.tsx` | API | ✅ |
| `/dashboard/nvrs` | `NVRsPage.tsx` | Mock | ✅ CRUD |
| `/dashboard/nvrs/:id` | `NVRDetailPage.tsx` | API | ✅ |
| `/dashboard/switches` | `SwitchesPage.tsx` | Mock | ✅ CRUD |
| `/dashboard/switches/:id` | `SwitchDetailPage.tsx` | API | ✅ |
| `/dashboard/racks` | `RacksListPage.tsx` | Mock | ✅ |
| `/dashboard/racks/:id` | `RackDetailPage.tsx` | Mock | ✅ |
| `/dashboard/users` | `UsersPage.tsx` | API | ✅ Admin only |

---

## โครงสร้างสำคัญ

```
Frontend/
├── src/
│   ├── pages/          ← React page components (1 ไฟล์ต่อ 1 route)
│   ├── components/
│   │   └── layout/     ← AppLayout, Sidebar, Topbar
│   ├── api/            ← axios client + typed API functions
│   ├── stores/         ← Zustand (authStore, themeStore)
│   └── styles/         ← CSS token files (ห้ามใช้ Tailwind)
│
├── open design/
│   ├── output/         ← HTML mockup รอ implement
│   ├── done/           ← implement เสร็จแล้ว (อย่าลบ)
│   └── UX_ISSUES.md    ← ปัญหา UX ที่รอแก้ไข
│
├── BNO_Survei_Monitor/ ← ASP.NET Core backend
├── CLAUDE.md           ← context สำหรับ AI + project rules
└── BACKLOG.md          ← รายละเอียดงานที่ค้าง
```

---

## Stack

| | |
|---|---|
| Frontend | React 18 + Vite 6 + TypeScript (port 3001) |
| UI Library | Ant Design 5 (Form / Modal / Table เท่านั้น) |
| State | Zustand (`authStore`, `themeStore`) |
| Data fetching | TanStack React Query + Axios |
| Icons | lucide-react |
| Topology | React Flow v11 |
| Backend | ASP.NET Core .NET 10 |
| Auth | JWT (8h) + BCrypt |

---

## Rules สั้นๆ

- Layout ใช้ CSS custom เท่านั้น — ห้าม Tailwind, ห้าม Ant Design layout
- CSS tokens ทุกตัวอยู่ใน `src/styles/tokens.css`
- ห้ามใส่ comment ในโค้ดยกเว้น WHY ที่ไม่ชัดเจน
- Icons: lucide-react เท่านั้น — ห้ามใช้ emoji ใน UI
- Mock data ก่อน — API wire ทีหลัง

ดูรายละเอียดครบใน [`CLAUDE.md`](CLAUDE.md)
