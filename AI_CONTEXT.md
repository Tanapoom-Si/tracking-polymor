# AI Context: AquaTrace Fiber Intelligence

เอกสารนี้มีไว้ให้ AI หรือ developer รอบถัดไปเข้าใจ context เดิมของโปรเจกต์โดยเร็ว

## เป้าหมายของโปรเจกต์

สร้างเว็บสำหรับโรงงานผลิตเส้นใยสั้น เพื่อช่วย trace defect ที่พบหลัง Drawing/Flat screen กลับไปหา Can และช่วงเวลา Spinning ที่ควรตรวจสอบย้อนหลัง

ผู้ใช้ต้องการ deploy ด้วย Vercel จึงแปลงจาก single-file HTML เป็น Next.js

## Source เดิม

ไฟล์ต้นทางที่ผู้ใช้ให้มา:

```text
C:/Users/timet/Documents/Codex/2026-07-06/new-chat/outputs/fiber-traceability.html
```

ไฟล์เดิมเป็น HTML เดียว มี CSS, form, table และ JavaScript DOM manipulation ในตัว

## โครงสร้าง Next.js ปัจจุบัน

- `app/layout.jsx`: metadata และ root layout
- `app/page.jsx`: React Client Component หลัก
- `app/globals.css`: CSS ที่ย้ายมาจาก HTML เดิมและปรับ class บางส่วน
- `README.md`: คู่มือ project/deploy
- `AI_CONTEXT.md`: ไฟล์นี้

## แนวคิด UX เดิมที่ต้องรักษา

- หน้าหลักต้องเป็น dashboard ใช้งานจริงทันที ไม่ใช่ landing page
- Sidebar แสดง brand, navigation และ Can/Spinning window ที่สงสัย
- Form ฝั่งซ้ายเน้นกรอกข้อมูลหลักก่อน
- Advanced section เก็บข้อมูลหัวเอกสารและรายการ Can แบบ legacy
- Results ฝั่งขวาแสดง KPI, Can ที่เกี่ยวข้อง, สาเหตุที่ควรตรวจ
- ด้านล่างมี timeline การตรวจสอบย้อนหลังและ matrix เทียบ defect
- ต้องรองรับภาษาไทยและข้อมูลหน้างานผสมอังกฤษ

## Data Model ใน `app/page.jsx`

`defaultForm` คือ initial state ของ form

field สำคัญ:

- `brand`, `lot`
- `drawingStart`
- `defectTime`
- `baleNo`, `testTime`
- `defect`, `severity`
- `drawingLine`, `spinningLine`
- `canUseMinutes`, `blendLag`
- `doffingRows`
- `cans`
- `fsRows`
- `note`

## Parsing Rules

`parseCans(text)` รองรับ 2 format:

1. Doffing Record format ถ้า line มีอย่างน้อย 9 columns
   - `parts[1]` = date
   - `parts[2]` = time
   - `parts[7]` = doff minutes
   - Can label ใช้ `parts[4]` ก่อน แล้ว fallback ไป `parts[3]`, `parts[0]`
   - note ใช้ column ตั้งแต่ index 10 เป็นต้นไป

2. Legacy Can format
   - `parts[0]` = Can id
   - `parts[1]` = spin start datetime
   - `parts[2]` = spin end datetime
   - note ใช้ column ตั้งแต่ index 3 เป็นต้นไป

`parseFsRows(text)` ใช้ format:

```text
No, Bale No., Time, Bundle, Twist, Tangle, Defect, Long filament, Remark
```

defect key เรียงตาม column:

```js
["bundle", "twist", "tangle", "defect", "long"]
```

`getActiveFsRow(data)` เลือก row ที่มี defect และ Bale No. ตรงกับ form ก่อน ถ้าไม่มีใช้ row defect แรก

## Analysis Logic

`analyze(data)` ทำงานหลักทั้งหมด:

1. parse `drawingStart`, `defectTime`
2. parse `canUseMinutes`, `blendLag`
3. เลือก `doffingRows` เป็น source หลัก ถ้าว่างจึงใช้ `cans`
4. สร้าง window การใช้ Can ใน Drawing ด้วย `getCanWindows`
5. เลือก defect profile จาก FS row ถ้ามี defect จริง ไม่อย่างนั้นใช้ select field
6. ให้คะแนน Can ตามเวลาที่ defect เกิดและ note
7. sort Can จาก score สูงไปต่ำ
8. คำนวณ confidence จากคะแนน Can หลัก + severity
9. คืนค่า `primary`, `traced`, `profile`, `risk`, `activeFsRow`

Risk label:

- `>= 80`: High trace risk
- `>= 55`: Medium trace risk
- ต่ำกว่า 55: Low trace risk

## จุดที่ควรระวังเมื่อแก้ต่อ

- ห้ามทำให้ Date parsing พังกับ `datetime-local` format เช่น `2026-07-06T13:25`
- Doffing Record ใช้ `Day` และ `Time` แยก column ไม่ใช่ datetime เดียว
- ถ้า `doffingRows` ไม่ว่าง ระบบจะไม่ใช้ `cans`
- ข้อความไทยต้องเป็น UTF-8
- หน้าเป็น Client Component เพราะมี form state และ `window.print()`
- ยังไม่มี backend ดังนั้นข้อมูลหายเมื่อ refresh

## แนวทางต่อยอด

- แยก analyzer ไปไว้ `lib/trace.js`
- เพิ่ม unit tests ให้ `parseCans`, `parseFsRows`, `analyze`
- เพิ่ม import CSV/XLSX จากไฟล์จริง
- เพิ่ม export PDF หรือบันทึกรายงาน
- เพิ่ม persistence ผ่าน database หรือ localStorage
