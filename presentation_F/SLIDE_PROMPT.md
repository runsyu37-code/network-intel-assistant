# Prompt สำหรับคนทำ Slide

---

## สิ่งที่ส่งมาให้

1. **`SLIDES_FINAL.md`** — เนื้อหา 8 slides ครบแล้ว ใช้เป็น script ได้เลย
2. **ไฟล์ HTML 3 ไฟล์** สำหรับ screenshot ใส่ slide:
   - `mpnjkqqr-screens_topology.html` → Slide 2
   - `mpnjkqql-screens_floor.html` → Slide 3
   - `mpnjkqqo-screens_nvr-detail.html` → Slide 4
   - *(เปิดใน browser แล้ว screenshot Full Page ได้เลย)*

---

## Prompt ที่ใช้สั่ง

```
ช่วยทำ presentation จากไฟล์ SLIDES_FINAL.md ให้หน่อย

สไตล์:
- เน้นภาพ ข้อความน้อย ดูเข้าใจง่าย
- โทนสีหลัก: สีม่วง #8B44AF กับขาว/เทาเข้ม
- ฟอนต์: ทันสมัย เช่น Inter หรือ Poppins
- พื้นหลัง: สีเข้ม (dark theme) เพราะเป็นระบบ monitoring

สำหรับ Slide 2, 3, 4:
- มีช่อง [screenshot: ชื่อไฟล์.html] บอกไว้
- ใส่รูป screenshot ของ HTML ไฟล์ที่แนบมาตรงนั้นได้เลย
- จัดให้รูปใหญ่ เห็นชัด ไม่ต้องย่อมาก

Slide ที่มีแค่ text (1, 5, 6, 7, 8):
- ใช้ diagram / icon / arrow แทนข้อความเยอะๆ
- Slide 7 (Alert test) เน้น flow diagram ให้เห็นชัด

ผลลัพธ์ที่ต้องการ: PowerPoint / Google Slides / PDF
จำนวน: 8 slides
ภาษา: ไทย (ตามต้นฉบับ)
```

---

## สรุปสั้น (ถ้าจะบรีฟด้วยปาก)

> "สไลด์อัปเดตงานอาทิตย์นี้ 8 หน้า เนื้อหาครบในไฟล์ .md แล้ว  
> Slide 2-4 มีรูป screenshot UI แนบมาให้ใส่  
> โทนสีม่วงเข้ม พื้นหลังดำ เน้นภาพมากกว่าตัวอักษร"
