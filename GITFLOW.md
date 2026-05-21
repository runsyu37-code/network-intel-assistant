# Git Workflow Guide

ทุกครั้งที่จะทำงาน ให้เช็ก branch และ pull ก่อนเสมอ ก่อนที่จะ push ให้ตรวจสอบว่าอยู่ใน branch ที่ถูกต้อง

---

## ขั้นตอนมาตรฐาน (ทำทุกครั้ง)

### 1. เริ่มงาน — ดึงโค้ดล่าสุดลงมา

```bash
# ไปที่ branch ที่ต้องการทำงาน
git checkout feature/backend-api

# ดึงโค้ดล่าสุดจาก remote
git pull origin feature/backend-api
```

### 2. ระหว่างทำงาน — ตรวจสอบสถานะ

```bash
# ดูว่าแก้ไขไฟล์อะไรบ้าง
git status

# ดู diff ก่อน add
git diff
```

### 3. เสร็จแล้ว — ขึ้น remote

```bash
# เพิ่มเฉพาะไฟล์ที่แก้
git add <ชื่อไฟล์>

# หรือเพิ่มทั้ง folder
git add BNO_Survei_MonitorAPI/

# commit พร้อม message
git commit -m "feat: คำอธิบาย"

# ตรวจสอบว่าอยู่ใน branch ที่ถูกต้องก่อน push
git branch

# push
git push origin feature/backend-api
```

---

## Branch ในโปรเจกต์นี้

| Branch | ใช้ทำอะไร |
|--------|-----------|
| `master` | โค้ดที่พร้อม production — ห้าม push ตรง |
| `feature/backend-api` | พัฒนา backend API (C# ASP.NET) |

---

## Merge เข้า master (เมื่อ feature พร้อม)

```bash
# ตรวจสอบว่า feature branch ทำงานถูกต้องก่อน
git checkout master
git pull origin master
git merge feature/backend-api
git push origin master
```

> merge เข้า master เมื่อ: โค้ดทำงานได้ครบ, ทดสอบแล้วไม่มี bug

---

## Checklist ก่อน Push ทุกครั้ง

- [ ] `git branch` — อยู่ใน branch ที่ถูกต้อง
- [ ] `git status` — ไม่มีไฟล์ที่ไม่ตั้งใจ add
- [ ] commit message บอกว่าทำอะไร
- [ ] ไม่ push ตรงไปที่ `master`
