# พรุ่งนี้ทำอะไร — 2026-05-25

---

## 1. Work Notebook — ตั้งค่าก่อนทำงาน

```
git checkout backend
git pull
```

สร้างไฟล์นี้ (gitignored — ไม่มีใน repo):
`BNO_Survei_MonitorAPI/BNO_Survei_MonitorAPI/connectionStrings.config`

```xml
<connectionStrings>
  <add name="CN" connectionString="Data Source=DESKTOP-R2SH8R7\SQLEXPRESS;Initial Catalog=SSM_DB;Integrated Security=False;User ID=sa;Password=Buono@1234;" />
</connectionStrings>
```

ถ้า SSM_DB ยังไม่มีบน work notebook ให้รันใน SSMS:
```
1. CREATE DATABASE SSM_DB;
2. SSM_schema_v2.sql
3. mock_data.sql
```

Run VS (F5) → ทดสอบด้วย Bruno ว่า API ขึ้น

---

## 2. Backend — สิ่งที่อาจต้องเพิ่ม

ตรวจสอบ GET filter ที่ frontend ต้องใช้ drill-down:

| Endpoint | มีแล้ว? | ทำอะไร |
|---|---|---|
| `GetBuildings?Site_ID=` | ⚠️ เช็ก | ถ้าไม่มีให้เพิ่ม query param ใน buildingsController |
| `GetRooms?Floor_ID=` | ⚠️ เช็ก | เช่นเดียวกัน |
| `GetRacks?Room_ID=` | ⚠️ เช็ก | เช่นเดียวกัน |
| `GetNvrs?Rack_ID=` | ⚠️ เช็ก | เช่นเดียวกัน |
| `GetPoeSwitches?Rack_ID=` | ⚠️ เช็ก | เช่นเดียวกัน |

---

## 3. Frontend — plan การทำ

**Step 1 — Wireframe (Claude Design)**
- เปิด claude.ai → Design
- อธิบาย layout จาก FRONTEND_PLAN.md ทีละหน้า
- Export HTML

**Step 2 — Scaffold (Bolt.new)**
- เปิด bolt.new
- วาง HTML wireframe + FRONTEND_PLAN.md
- พิมพ์: "แปลงเป็น React + Vite + Ant Design ตาม route structure นี้ เชื่อมกับ API ที่ https://localhost:44342"
- ได้ skeleton พร้อม routing ออกมา
- Push ไป `frontend` branch

**Step 3 — ต่อยอด (Claude Code)**
- เปิด Claude Code ใน frontend branch
- implement CRUD + API calls ทีละหน้า

---

## อ่านไฟล์ไหนตอนเริ่ม chat แต่ละงาน

| งานที่จะทำ | บอก AI ให้อ่าน |
|---|---|
| ตั้งค่า work notebook | `CONTEXT.md` |
| ต่อ backend (เพิ่ม filter ฯลฯ) | `CONTEXT.md` + `PROGRESS.md` |
| ทำ frontend | `FRONTEND_PLAN.md` |
| ไม่แน่ใจว่า branch ไหนทำอะไร | `GITFLOW.md` |

> วิธีบอก AI: "อ่าน CONTEXT.md ก่อนแล้วค่อยถามฉัน" หรือ "read FRONTEND_PLAN.md first"
