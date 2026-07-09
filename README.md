# AquaTrace Fiber Intelligence

AquaTrace Fiber Intelligence เป็นเว็บ dashboard สำหรับช่วยย้อน trace defect ที่พบจาก Flat screen หลัง Drawing กลับไปหา Can และช่วงเวลา Spinning ที่เกี่ยวข้องมากที่สุด

โปรเจกต์นี้ถูกแปลงจากไฟล์ HTML เดิม `fiber-traceability.html` ให้เป็น Next.js เพื่อ deploy บน Vercel ได้ง่ายขึ้น

## ความสามารถหลัก

- กรอกข้อมูล Brand, Lot, Bale, เวลาเริ่ม Drawing และเวลาเจอ Defect
- อ่านข้อมูล Doffing Record แบบ CSV ต่อบรรทัด
- อ่านข้อมูล FS Oil Dispersion / Flat screen rows เพื่อเลือก defect ที่พบจริง
- คำนวณ Can ที่น่าสงสัยจากข้อมูล Doffing และตำแหน่งเส้นใยในถัง
- ระบุชั้นในถัง, ช่วงเวลา Spinning ของชั้นนั้น และช่วงจากปากถังที่ควรคัดออก
- วิเคราะห์จุดกำเนิดความผิดปกติว่าเอนเอียงไปทาง `Spinning / Can`, `Drawing` หรือ `Mixed`
- เก็บ Drawing condition เช่น stop/start, tension, guide, roller และ cutter เพื่อช่วยแยกสาเหตุ
- ให้คะแนน Trace Confidence และ Risk level
- แสดงช่วงเวลา Spinning ที่ควรเปิดบันทึกย้อนกลับ
- แสดง checklist ลำดับการตรวจสอบย้อนหลัง
- พิมพ์รายงานผ่าน browser print

## Tech Stack

- Next.js App Router
- React Client Component
- CSS ปกติใน `app/globals.css`
- ไม่มี backend และยังไม่มี database

## โครงสร้างไฟล์

```text
app/
  layout.jsx      Root layout และ metadata
  page.jsx        Dashboard, form state, parser, trace logic
  globals.css     Style ทั้งหมดของหน้า
package.json      scripts และ dependencies สำหรับ Next.js
next.config.js    config ของ Next.js
AI_CONTEXT.md     context สำหรับ AI หรือ developer รอบถัดไป
```

## การรันบนเครื่อง

```bash
npm install
npm run dev
```

เปิด `http://localhost:3000`

## การ build

```bash
npm run build
npm run start
```

## การ deploy บน Vercel

1. Push repository นี้ขึ้น GitHub, GitLab หรือ Bitbucket
2. เข้า Vercel แล้วเลือก `New Project`
3. Import repository
4. Framework preset ให้ Vercel ตรวจเป็น `Next.js`
5. Build command ใช้ค่า default: `next build`
6. Output directory ไม่ต้องกำหนดเอง
7. กด Deploy

## รูปแบบข้อมูลที่รองรับ

### Doffing Record rows

```text
No, Day, Time, Can, Can No., Position, Grade, Doff time, Fluff check, Sign, Remark
```

ตัวอย่าง:

```text
1,2026-07-06,03:31,1,755,21-22,1A,30,ok,AM,normal
```

ระบบจะแปลงเป็น Can โดยใช้ `Day + Time` เป็นเวลาเริ่ม Spinning และใช้ `Doff time` เป็นเวลาจบ

### รายการ Can แบบ legacy

ใช้เมื่อ `Doffing Record rows` ว่าง:

```text
Can No, เวลาเริ่ม Spinning, เวลาจบ Spinning, หมายเหตุ
```

ตัวอย่าง:

```text
CAN-A01,2026-07-06T06:10,2026-07-06T06:45,UDY ปกติ
```

### FS Oil Dispersion / Flat screen rows

```text
No, Bale No., Time, Bundle, Twist, Tangle, Defect, Long filament, Remark
```

ระบบจะเลือก row ที่มี defect และตรงกับ `Bale No.` ก่อน หากไม่พบจะใช้ row ที่มี defect แรก

## Logic การให้คะแนนโดยย่อ

### Origin Analysis

- ระบบให้คะแนน `Spinning / Can risk` และ `Drawing risk` แยกกัน
- ถ้า defect เกิดหลาย Can หรือหลายตำแหน่งเวลาใกล้กัน จะเพิ่ม Drawing risk
- ถ้ามี stop/start, tension swing, guide, roller หรือ cutter ผิดปกติ จะเพิ่ม Drawing risk
- ถ้า defect เกิดเด่นเฉพาะ Can/ตำแหน่งเดียว หรือ Doffing record มี remark/fluff/BCP จะเพิ่ม Spinning / Can risk
- ผลลัพธ์จะแสดง `Likely Origin` และจุดตรวจอันดับแรก

### Can Layer Trace

- ถังของแบรนด์เดียวกันถูกมองว่าเดินเข้า Drawing พร้อมกัน
- Drawing ดึงเส้นใยจากปากถังด้านบนลงด้านล่าง
- Spinning/Doffing ลงเส้นใยในถังจากล่างขึ้นบน
- ระบบจึงแปลงเวลาที่เจอ defect เป็นเปอร์เซ็นต์ความลึกจากปากถัง แล้วกลับลำดับเพื่อหา `ชั้น doffing จากล่าง`
- `เวลา doffing ต่อ 1 ชั้น` ใช้คำนวณช่วงเวลา Spinning ของชั้นนั้น
- การเคลื่อนที่ของถังระหว่าง doffing เป็น context ของ process เพื่อให้เส้นใยเรียงตัวและไม่พันกัน แต่ไม่แยกผลลงถึงระดับทิศใน dashboard
- เริ่มต้นที่ 25 คะแนนต่อ Can
- ถ้าเวลาเจอ defect อยู่ในช่วงใช้ถังใน Drawing เพิ่ม 55
- ถ้าอยู่ในช่วงเผื่อคัดออกก่อน-หลัง defect เพิ่ม 15
- ถ้า note มีคำเช่น `unstable`, `remark`, `change`, `BCP`, `fluff`, `NG` เพิ่ม 10
- ถ้า note มีคำเช่น `swing`, `wrapping`, `guide`, `ผิด`, `tension`, `ปัญหา`, `คราบ`, `พัน` เพิ่ม 12
- ความรุนแรง `medium` เพิ่ม confidence 6, `high` เพิ่ม 12

## หมายเหตุการพัฒนา

ตอนนี้ logic ทั้งหมดอยู่ใน `app/page.jsx` เพื่อให้เห็นภาพง่าย หากต้องต่อยอดจริงควรแยก parser และ analyzer ไปไว้ใน `lib/trace.js` และเพิ่ม test case สำหรับข้อมูล CSV หลายรูปแบบ
