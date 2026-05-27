# DEV — Quick Start

> โหลดไฟล์นี้เมื่อ: แค่จะโค้ด / รัน dev / แก้ bug
> โหลด `CLAUDE.md` เมื่อ: ต้องการ context เต็ม / ออกแบบ feature ใหม่

---

## Start

```powershell
cd C:\ai-playground\Frontend
npm run dev   # → http://localhost:3000
```

Login: ใส่อะไรก็ได้ → Admin (mock fallback)
Real account: `admin_test / Test@1234`

---

## งานที่ค้าง

→ [`BACKLOG.md`](BACKLOG.md) section **งานที่ยังเหลือ**
งานหลัก: เชื่อม API จริง 12 หน้า — ทุกหน้ายังเป็น mock data

---

## Rules (5 ข้อสำคัญที่สุด)

1. **ห้าม Tailwind** — layout CSS อยู่ใน `src/styles/` เท่านั้น
2. **ห้าม comment** ยกเว้น WHY ที่ไม่ชัดเจน
3. **Icons: lucide-react เท่านั้น** — ห้ามใช้ emoji ใน UI
4. CSS variables ทุกตัว → `src/styles/tokens.css`
5. Ant Design: ใช้แค่ `Form / Modal / Table` — ห้ามใช้ Layout

---

## Key Files

```
src/pages/              ← 15 page components (1 route = 1 file)
src/api/types.ts        ← TypeScript interfaces ทุก type
src/api/client.ts       ← axios instance + JWT interceptor
src/stores/authStore.ts ← { id, username, displayName, role }
src/styles/tokens.css   ← CSS custom properties (light/dark)
BACKLOG.md              ← งานค้าง + API gotchas
```

---

## Backend (เปิดเฉพาะตอน wire API จริง)

```powershell
cd C:\ai-playground\Frontend\BNO_Survei_Monitor\BNO_Survei_Monitor
dotnet run (หรือ IIS Express)   # → http://localhost:50680
```

Proxy `/api/*` → `localhost:44342` ตั้งค่าใน `vite.config.ts` แล้ว
