# Branch: work-safe

> ใช้ที่ทำงาน (Work Notebook) — SQL Auth, path `C:\ai-playground\network-intel-assistant`

---

## มีอะไรเพิ่มจาก master?

| Folder/File | คืออะไร |
|---|---|
| `api/Controllers/` | C# Controller files (backup ไว้อ้างอิง) |
| `api/Models/` | C# Model files (backup ไว้อ้างอิง) |
| `api/ConnectionDB/ConnectionDB.cs` | connection string C# |
| `api/Web.config` | config ของ API project |
| `api/bruno/` | Bruno collections ทุก endpoint |
| `api/BACKEND.md` | สรุป backend ทำอะไรได้บ้าง |
| `docs/workflow/IMPORT_DECISION.md` | เหตุผลที่เลิกใช้ ssm_import.py |
| `docs/log/BUG_LOG.md` | log bugs ที่เจอที่ทำงาน |

---

## วิธี sync จาก master ไป work-safe

```bash
# ที่บ้าน (ltH) — หลัง push master เสร็จแล้ว
git push origin master:work-safe --force
```

---

## การใช้งานที่ทำงาน

```powershell
# เปิด session ที่ทำงาน
git checkout work-safe
git pull origin work-safe

# รัน importer (SQL Auth)
cd work_pack
python ssm_import.py Fakeinfo_test.xlsx --server SERVER\SQLEXPRESS --db SSM_DB --auth sql --user sa --password รหัส
```
