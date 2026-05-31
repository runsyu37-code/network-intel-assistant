# F9 Round 15 — Frontend Note

> **Date:** 2026-05-30
> **From:** Frontend Team
> **To:** Backend Team
> **Re:** Login ไม่ผ่าน — bcrypt hash ไม่ตรงกับ password จริง

---

## Bug — Login 401 กับทุก credential

**Symptom:** `POST /api/auth/login` คืน 401 กับ username `admin` + password `Admin@SSM1`
(ตาม comment ใน `SSM_schema_v2.sql` line 573)

**Root cause:** bcrypt hash ใน DB (`$2b$12$/XPQA5LCi...`) ไม่ตรงกับ hash ใน schema file (`$2b$12$Ke7Qs3...`) — แสดงว่า DB ถูก seed ด้วย hash ที่ต่างออกไป password จริงไม่ใช่ `Admin@SSM1`

**กระทบ demo:** ล็อกอินด้วย username/password ไม่ได้เลย — ใช้ได้แค่ "Continue as Guest" ซึ่งเป็น viewer role เห็นได้แค่ Overview/Topology/Map

---

## วิธีแก้ (เลือกอย่างใดอย่างหนึ่ง)

### Option A — Reset password ใน DB โดยตรง
รัน SQL นี้เพื่อ set password ใหม่ที่รู้ค่าแน่นอน:

```sql
-- รัน Python หาก hash ก่อน:
-- import bcrypt; print(bcrypt.hashpw(b"Admin@SSM1", bcrypt.gensalt(12)).decode())
-- แล้วแทนที่ NEW_HASH ด้วยผลลัพธ์

UPDATE users SET pw_hash = '<NEW_HASH>' WHERE username = 'admin';
```

### Option B — เพิ่ม endpoint reset password ชั่วคราว (dev only)
สำหรับ demo เพิ่ม `POST /api/auth/dev-reset` ที่ set hash ใหม่ได้ — แต่ option A ง่ายกว่า

---

## สถานะ Frontend — พร้อม Demo ทุกอย่างแล้ว

| หน้า | สถานะ |
|---|---|
| Login (real credentials) | ❌ รอ backend แก้ hash |
| Dashboard / Topology / Map | ✅ |
| Building / Floor / FloorPlan | ✅ — breadcrumb ถูกต้องแล้ว |
| Cameras / NVRs / Switches / Users | ✅ |
| Racks | ✅ |

---

*Frontend Team — Claude Sonnet 4.6 | 2026-05-30*
