# Git Workflow Guide

> อัปเดตล่าสุด: 2026-05-24

ทุกครั้งที่จะทำงาน ให้เช็ก branch และ pull ก่อนเสมอ

---

## Branch ในโปรเจกต์นี้

| Branch | ใช้ทำอะไร | สถานะ |
|--------|-----------|-------|
| `master` | โค้ดที่พร้อม production — ห้าม push ตรง | stable |
| `backend` | C# ASP.NET Web API (13 tables, CRUD ครบ) | ✅ เสร็จแล้ว |
| `frontend` | React web app (Phase 7) | 📋 ยังไม่เริ่ม |
| `work-safe` | สำเนา safe สำหรับ work notebook | คงที่ |

---

## เริ่มงานแต่ละวัน

```bash
# ไปที่ branch ที่ต้องการ
git checkout backend      # หรือ frontend

# ดึงโค้ดล่าสุด
git pull origin backend
```

---

## ระหว่างทำงาน

```bash
git status      # ดูไฟล์ที่เปลี่ยน
git diff        # ดู diff ก่อน add
```

---

## Commit และ Push

```bash
git add <ชื่อไฟล์>           # เพิ่มเฉพาะไฟล์ที่แก้
git commit -m "feat: ..."    # commit พร้อม message
git branch                   # ยืนยัน branch ก่อน push
git push origin backend      # push
```

---

## Merge เข้า master (เมื่อ feature พร้อม)

```bash
git checkout master
git pull origin master
git merge backend      # หรือ frontend
git push origin master
```

> merge เข้า master เมื่อ: ทั้ง backend และ frontend เสร็จและทดสอบครบแล้ว

---

## Checklist ก่อน Push ทุกครั้ง

- [ ] `git branch` — อยู่ใน branch ที่ถูกต้อง
- [ ] `git status` — ไม่มีไฟล์ที่ไม่ตั้งใจ add (โดยเฉพาะ `connectionStrings.config`)
- [ ] commit message บอกว่าทำอะไร
- [ ] ไม่ push ตรงไปที่ `master`
