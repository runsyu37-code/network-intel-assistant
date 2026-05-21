# CONTEXT — master branch (ltH)

> สำหรับ AI: อ่านไฟล์นี้จบแล้วรู้ทุกอย่างที่ต้องทำใน branch นี้
> ดูรายละเอียดเพิ่มเติมที่ `docs/plan/MEGA_CONTEXT.md`

---

## branch นี้คืออะไร

**Home base — ltH (Home Laptop)**
ฐานหลักของโปรเจกต์ทั้งหมด พัฒนา tools, docs, schema
ทุก branch อื่นดึงมาจาก / sync กับ branch นี้

---

## เครื่องนี้คือ

| | ค่า |
|---|---|
| เครื่อง | ltH (Home Laptop) |
| Path | `C:\1_Work_Local\AI_Agent\network-intel-assistant` |
| SQL Auth | Windows Auth |
| Branch | `master` |

---

## Branches ทั้งหมด

| Branch | หน้าที่ | สถานะ |
|---|---|---|
| `master` | ltH home base | ✅ active |
| `work-safe` | Work Notebook | ✅ active |
| `backend` | C# REST API | ✅ เสร็จแล้ว (รอเพิ่ม GET filter) |
| `frontend` | React Web App | ⏳ กำลังวางแผน |

→ แผนที่ branch ทั้งหมดอยู่ที่ `docs/branches/INDEX.md`

---

## โครงสร้าง Folder

```
network-intel-assistant/
├── sanitizer/          ← Data Sanitizer (Python)
├── scripts/            ← SSM Importer (Python)
├── database/           ← SQL Schema
├── templates/          ← Excel templates
├── tests/              ← test files
├── work_pack/          ← ชุดไฟล์พร้อม copy ไปที่ทำงาน
├── docs/
│   ├── plan/           → MEGA_CONTEXT.md, ROADMAP.md
│   ├── branches/       → INDEX.md + .md แต่ละ branch
│   ├── workflow/       → START_HERE.md, HANDOVER.md ฯลฯ
│   └── log/            → LEARNING_LOG.md
└── CONTEXT.md          ← ไฟล์นี้
```

---

## งานหลักที่ต้องทำ (ตามลำดับ)

```
1. ✅ Data Sanitizer — เสร็จแล้ว
2. ✅ SSM Importer — เสร็จแล้ว
3. ✅ SQL Schema v2 — เสร็จแล้ว
4. ✅ C# REST API — เสร็จแล้ว (branch: backend)
5. ⏳ เพิ่ม GET filter ใน backend
6. ❌ Frontend React (branch: frontend)
7. ❌ ทดสอบกับ DB จริงที่ทำงาน
```

---

## ข้อมูลที่ต้องการ มาจากไหน

| ต้องการ | ไปหาที่ |
|---|---|
| AI briefing เต็ม | `docs/plan/MEGA_CONTEXT.md` |
| Roadmap 5 เดือน | `docs/plan/ROADMAP.md` |
| Schema DB | `database/SSM_schema_v2.sql` |
| แผนที่ทุก branch | `docs/branches/INDEX.md` |
| LEARNING LOG | `docs/log/LEARNING_LOG.md` |
| รายละเอียด backend | checkout `backend` → `CONTEXT.md` |
| รายละเอียด frontend | checkout `frontend` → `CONTEXT.md` |

---

## Sync ไปที่ทำงาน

```bash
git push origin master:work-safe --force
```

---

## กฎสำคัญ

- ตอบเป็นภาษาไทยเสมอ แม้ Ran พิมพ์ภาษาอังกฤษ
- อธิบาย WHY ก่อน HOW เสมอ
- ห้าม redesign schema หรือ structure โดยไม่ถาม
- ถามก่อนลบไฟล์หรือ drop table ใดๆ
