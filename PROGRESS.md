# Progress Log — backend branch

> อัปเดตล่าสุด: 2026-05-24

---

## สถานะรวม

| ส่วน | สถานะ |
|---|---|
| C# REST API (13 tables) | ✅ เสร็จแล้ว |
| Bruno test collections | ✅ เสร็จแล้ว |
| Frontend (web app) | 📋 ยังไม่เริ่ม |

---

## Backend API — BNO_Survei_MonitorAPI (ASP.NET Web API)

### Controllers ที่มี (13 tables)

| Table | PK type | GET | SAVE | UPDATE | DELETE |
|---|---|---|---|---|---|
| sites | string | ✅ | ✅ | ✅ | ✅ |
| buildings | string | ✅ | ✅ | ✅ | ✅ |
| floors | string | ✅ | ✅ | ✅ | ✅ |
| rooms | string | ✅ | ✅ | ✅ | ✅ |
| racks | string | ✅ | ✅ | ✅ | ✅ |
| nvrs | string | ✅ | ✅ | ✅ | ✅ |
| poeSwitches | string | ✅ | ✅ | ✅ | ✅ |
| cameras | int (auto) | ✅ | ✅ | ✅ | ✅ |
| users | int (auto) | ✅ | ✅ | ✅ | ✅ |
| alertLogs | int (auto) | ✅ | ✅ | ✅ | ✅ |
| auditLogs | int (auto) | ✅ | ✅ | ✅ | ✅ |
| pingLogs | int (auto) | ✅ | ✅ | ✅ | ✅ |
| syncLogs | int (auto) | ✅ | ✅ | ✅ | ✅ |

### HTTP Methods (ทุก endpoint)

| Operation | Method | URL pattern |
|---|---|---|
| GET | `GET` | `/api/Get{table}` |
| SAVE | `POST` | `/api/Save{table}` |
| UPDATE | `POST` | `/api/Update{table}/{id}` |
| DELETE | `POST` | `/api/Delete{table}/{id}` |

> ใช้ POST ทุก operation ยกเว้น GET — ตาม convention ของทีม

### หมายเหตุ Design

- SAVE ใช้ `INSERT` (error ถ้าซ้ำ — ป้องกันข้อมูลเก่าโดนทับ)
- UPDATE ใช้ plain `UPDATE WHERE PK`
- DELETE ใช้ `DELETE WHERE PK` — ID ส่งผ่าน URL
- string-PK tables: sites, buildings, floors, rooms, racks, nvrs, poeSwitches
- auto-increment PK tables: cameras, users, alertLogs, auditLogs, pingLogs, syncLogs

### Cascade Delete (สำคัญ)

SQL Server บล็อก CASCADE บน FK_sw_rack และ FK_nvr_rack (multiple cascade path)
แก้โดยให้ Delete controllers ลบ poe_switches + nvrs ก่อนเสมอ:

| Controller | Pre-delete ก่อน |
|---|---|
| DeleteSites | poe_switches + nvrs WHERE Site_ID |
| DeleteBuildings | poe_switches + nvrs WHERE Building_ID |
| DeleteFloors | poe_switches + nvrs WHERE Floor_ID |
| DeleteRooms | poe_switches + nvrs WHERE Room_ID |
| DeleteRacks | poe_switches + nvrs WHERE Rack_ID |

cameras ลบอัตโนมัติผ่าน `FK_cam_floor CASCADE` อยู่แล้ว

---

## Bruno Collections

- ครบทุก table ทุก operation
- SAVE มี JSON body (array)
- UPDATE มี JSON body (object)
- DELETE ไม่มี body (ID อยู่ใน URL)
- อยู่ที่ `bruno/` folder

---

## Session Log

### 2026-05-24
- เพิ่ม `devicesController.cs` — unified GET search ข้าม cameras/nvrs/poe_switches (UNION ALL)
- เพิ่ม `deviceSearchModel.cs`
- Rename route ทุกตัว → PascalCase (`GetSites`, `SaveSites`, `UpdateSites`, `DeleteSites`, ฯลฯ)
- แก้ typo `Updatenvrs` → `UpdateNvrs`
- เพิ่ม `device_type` filter ใน `GetSyncLogs`
- Externalize connection string → `connectionStrings.config` (gitignored — แต่ละเครื่องสร้างเอง)
- สร้าง `mock_data.sql` + ติดตั้ง SSM_DB บน ltH (home laptop)
- อัปเดต Bruno collections — URL ทั้งหมด → PascalCase (53 files)
- ทดสอบ GET ทุกตัวผ่าน ✅
- ทดสอบ Save/Update/Delete ผ่าน ✅
- แก้ cascade delete: เพิ่ม pre-delete logic ใน 5 hierarchy controllers
- **backend พร้อมแล้ว — ไป frontend ได้เลย**

### 2026-05-21
- Rename branch `feature/backend-api` → `backend`
- เปลี่ยน `[HttpPut]` + `[HttpDelete]` → `[HttpPost]` ทุก controller (13 files)
- อัปเดต Bruno collections — method PUT/DELETE → POST ให้ตรงกับ controllers
- ลบ `bruno/building/` (duplicate ที่ชี้ URL ผิดไป sites)
- แก้ encoding เละใน `Sites/UPDATE.yml`

### ก่อนหน้า
- สร้าง 13 controllers ครบทุก endpoint
- สร้าง Bruno collections พร้อม JSON body
- ทดสอบทุก endpoint ผ่านแล้ว

---

## งานที่ยังค้าง

- [ ] สร้าง `connectionStrings.config` บน work notebook (gitignored — ต้องสร้างเอง ดู CONTEXT.md)
- [ ] รัน `SSM_schema_v2.sql` + `mock_data.sql` บน work notebook ถ้ายังไม่มี SSM_DB
- [ ] Frontend web app (Phase 7 — ยังไม่ได้ตัดสินใจ stack)
- [ ] Merge เข้า master (รอหลัง frontend เสร็จ)
