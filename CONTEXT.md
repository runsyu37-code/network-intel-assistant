# CONTEXT — work-safe branch

> สำหรับ AI: อ่านไฟล์นี้จบแล้วรู้ทุกอย่างที่ต้องทำใน branch นี้

---

## branch นี้คืออะไร

**Work Notebook branch** — ใช้ที่ทำงานเท่านั้น
มีทุกอย่างจาก `master` + ไฟล์ C# API backup เพิ่มมา

---

## เครื่องนี้คือ

| | ค่า |
|---|---|
| เครื่อง | Work Notebook (ที่ทำงาน) |
| Path | `C:\ai-playground\network-intel-assistant` |
| SQL Auth | ใช้ SQL Auth (user/password) ไม่ใช่ Windows Auth |
| Branch | `work-safe` |

---

## มีอะไรเพิ่มจาก master

| Folder | คืออะไร |
|---|---|
| `api/Controllers/` | C# Controller files (backup ไว้อ้างอิง) |
| `api/Models/` | C# Model files |
| `api/bruno/` | Bruno collections |
| `api/BACKEND.md` | สรุป API |
| `docs/workflow/IMPORT_DECISION.md` | เหตุผลที่เลิกใช้ ssm_import.py |
| `docs/log/BUG_LOG.md` | log bugs ที่เจอที่ทำงาน |

---

## งานที่ทำที่ทำงาน

### รัน Importer (SQL Auth)
```powershell
cd work_pack
python ssm_import.py Fakeinfo_test.xlsx --server SERVER\SQLEXPRESS --db SSM_DB --auth sql --user sa --password รหัส
```

### ทดสอบ API
- เปิด Visual Studio → รัน project ใน branch `backend`
- ใช้ Bruno collections ที่ `api/bruno/`

---

## ข้อมูลที่ต้องการ มาจากไหน

| ต้องการ | ไปหาที่ |
|---|---|
| Schema DB | `database/SSM_schema_v2.sql` |
| Template Excel | `work_pack/template_v4_empty.xlsx` |
| คู่มือ importer | `work_pack/SSM_IMPORT_GUIDE.md` |
| C# API backup | `api/` |
| AI briefing เต็ม | `docs/plan/MEGA_CONTEXT.md` |

---

## Sync จาก master

เมื่อ master อัปเดต ให้ sync มาที่ work-safe:
```bash
# รันที่บ้าน (ltH) หลัง push master แล้ว
git push origin master:work-safe --force
```

---

## กฎสำคัญ

- ห้าม commit ข้อมูลจริง (IP, MAC, hostname จริง)
- ห้าม push sensitive data ขึ้น GitHub
- ข้อมูลจริงอยู่ที่เครื่องนี้เท่านั้น
