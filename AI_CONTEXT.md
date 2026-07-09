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
- Results ฝั่งขวาแสดง KPI, Origin Analysis, Can ที่เกี่ยวข้อง, ตำแหน่งในถัง, ชั้น doffing และสาเหตุที่ควรตรวจ
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
- `layerMinutes`: เวลา doffing ต่อ 1 ชั้น จากใบ doffing
- `affectedScope`: พบ defect เด่นเฉพาะ Can/ตำแหน่งเดียว หรือหลาย Can/หลายตำแหน่ง
- `drawingStopStart`, `drawingTension`, `drawingGuide`, `drawingRoller`, `drawingCutter`, `drawingNote`: Drawing condition สำหรับแยกต้นเหตุ
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
4. สร้างตำแหน่งในถังด้วย `getCanSections`
5. Model สำคัญ: ถังของแบรนด์เดียวกันเดิน Drawing พร้อมกัน, Drawing ใช้จากบนลงล่าง, Doffing ลงถังจากล่างขึ้นบน
6. แปลงเวลา defect เป็นเปอร์เซ็นต์จากปากถัง แล้วกลับเป็น `doffingLayer` จากล่าง
7. ใช้ `layerMinutes` หาเวลาของชั้นนั้นใน Spinning โดยไม่ต้องแยกทิศการเคลื่อนที่ของถัง
8. เลือก defect profile จาก FS row ถ้ามี defect จริง ไม่อย่างนั้นใช้ select field
9. ให้คะแนน Can ตามเวลาที่ defect เกิดและ note
10. sort Can จาก score สูงไปต่ำ
11. เรียก `analyzeOrigin(data, traced, profile)` เพื่อคำนวณ `Spinning / Can risk`, `Drawing risk`, `likelyOrigin`
12. คำนวณ confidence จากคะแนน Can หลัก + severity
13. คืนค่า `primary`, `traced`, `profile`, `risk`, `activeFsRow`, `origin`

Risk label:

- `>= 80`: ความเสี่ยงสูง
- `>= 55`: ความเสี่ยงปานกลาง
- ต่ำกว่า 55: ความเสี่ยงต่ำ

## จุดที่ควรระวังเมื่อแก้ต่อ

- ห้ามทำให้ Date parsing พังกับ `datetime-local` format เช่น `2026-07-06T13:25`
- Doffing Record ใช้ `Day` และ `Time` แยก column ไม่ใช่ datetime เดียว
- ถ้า `doffingRows` ไม่ว่าง ระบบจะไม่ใช้ `cans`
- อย่ากลับไปใช้ logic แบบ Can ถูกใช้ทีละถังตามลำดับ เพราะหน้างานระบุว่าถังในแบรนด์เดียวกันเดิน Drawing พร้อมกัน
- อย่าเพิ่ม field ทิศกลับเข้ามา เว้นแต่ผู้ใช้ขอชัดเจน เพราะผู้ใช้บอกว่าเอาแค่ระดับชั้นก็พอ
- อย่า bias ว่า defect มาจาก Spinning อย่างเดียว ต้องแสดง Drawing risk คู่กับ Spinning / Can risk เสมอ
- การคัดออกควรใช้ช่วงจากปากถัง `removeTopStartPct` ถึง `removeTopEndPct` แล้วให้ QC ยืนยันก่อนใช้ส่วนอื่นต่อ
- ข้อความไทยต้องเป็น UTF-8
- หน้าเป็น Client Component เพราะมี form state และ `window.print()`
- ยังไม่มี backend ดังนั้นข้อมูลหายเมื่อ refresh

## แนวทางต่อยอด

- แยก analyzer ไปไว้ `lib/trace.js`
- เพิ่ม unit tests ให้ `parseCans`, `parseFsRows`, `analyze`
- เพิ่ม import CSV/XLSX จากไฟล์จริง
- เพิ่ม export PDF หรือบันทึกรายงาน
- เพิ่ม persistence ผ่าน database หรือ localStorage
