# SSM — Surveillance Smart-Monitor

ระบบติดตามกล้องวงจรปิดและอุปกรณ์เครือข่ายแบบ Real-time  
Full-stack: React SPA (Frontend) + ASP.NET Core API (Backend)

---

## อ่านก่อนเริ่มทำงาน

| ต้องการอะไร | ไปที่ |
|---|---|
| บริบทโปรเจกต์ + rules ทั้งหมด | [`CLAUDE.md`](CLAUDE.md) |
| งานที่ค้างอยู่ + API notes + gotchas | [`BACKLOG.md`](BACKLOG.md) |
| งาน design ที่ต้องทำ (ใช้ HTML mockup) | [`open design/TASK_DASHBOARD.md`](open%20design/TASK_DASHBOARD.md) · [`open design/TASK_CRUD.md`](open%20design/TASK_CRUD.md) |
| Presentation slides (สัปดาห์นี้) | [`presentation_F/SLIDES_FINAL.md`](presentation_F/SLIDES_FINAL.md) |

---

## สถานะโปรเจกต์

> อัปเดต: **2026-05-27** · Deadline: **2026-05-29 (พฤหัส)**  
> Branch หลัก: `frontend`

| ส่วน | สถานะ |
|---|---|
| Backend API (ASP.NET Core) | ✅ เสร็จ — 17 endpoints, JWT, RBAC, 17/17 tests pass |
| Frontend pages (React) | ✅ 14 หน้า — บางหน้ายังใช้ mock data |
| Dashboard page | 🔴 ยังไม่มี — งานบ่ายนี้ |
| CRUD (Create/Edit/Delete) | 🔴 ยังไม่มี — งานบ่ายนี้ |
| เชื่อม API จริงทุกหน้า | 🟡 บางหน้าแล้ว ดู BACKLOG.md |

---

## Quick Start

### Frontend

```powershell
cd C:\ai-playground\Frontend
npm install
npm run dev
# → http://localhost:3000
```

### Backend (ต้องเปิดก่อน Frontend จะ call API ได้)

```powershell
# เปิดใน Visual Studio หรือ
cd C:\ai-playground\Frontend\BNO_Survei_Monitor
dotnet run
# → http://localhost:50680
```

> Vite proxy forward `/api` → `localhost:50680` อัตโนมัติ — ไม่ต้องแก้ CORS

### Login ทดสอบ

| Username | Password | Role |
|---|---|---|
| `admin_test` | `Test@1234` | Admin |
| `user_test` | `Test@1234` | User |
| `viewer_test` | `Test@1234` | Viewer |

---

## โครงสร้างสำคัญ

```
Frontend/
├── src/
│   ├── pages/          ← React page components
│   ├── api/            ← axios client + typed API functions
│   ├── stores/         ← Zustand (authStore, themeStore)
│   └── styles/         ← CSS token files (ห้ามใช้ Tailwind)
│
├── open design/
│   ├── input/          ← HTML mockup ที่ส่งให้ design tool
│   ├── output/         ← HTML ที่ได้รับกลับ พร้อม implement เป็น React
│   └── done/           ← implement เสร็จแล้ว
│
├── BNO_Survei_Monitor/ ← ASP.NET Core backend (ไม่แตะใน branch นี้)
├── CLAUDE.md           ← context สำหรับ AI + project rules
└── BACKLOG.md          ← รายละเอียดงานที่ค้าง + technical notes
```

---

## Stack

| | |
|---|---|
| Frontend | React 18 + Vite 6 + TypeScript |
| UI Library | Ant Design 5 (Form / Modal / Table เท่านั้น) |
| State | Zustand |
| Data fetching | TanStack React Query + Axios |
| Icons | lucide-react |
| Topology | React Flow v11 |
| Backend | ASP.NET Core .NET 10 + SQL Server |
| Auth | JWT (8h) + BCrypt + Rate Limiting |

---

## Rules สั้นๆ

- Layout ใช้ CSS custom เท่านั้น — ห้าม Tailwind, ห้าม Ant Design layout
- CSS tokens ทุกตัวอยู่ใน `src/styles/tokens.css`
- ห้ามใส่ comment ในโค้ดยกเว้น WHY ที่ไม่ชัดเจน
- Icons: lucide-react เท่านั้น — ห้ามใช้ emoji ใน UI
- Mock data ก่อน — API wire ทีหลัง

ดูรายละเอียดครบใน [`CLAUDE.md`](CLAUDE.md)
