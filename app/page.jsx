"use client";

import { useMemo, useState } from "react";

const defaultForm = {
  brand: "SD 0.6 1200A",
  lot: "QR-25-F3-31 / QR-CM-F3-26",
  smNo: "4",
  creelNo: "12",
  dfNo: "4K-N",
  doffTimeHeader: "30",
  totalTowCan: "16",
  operationPosition: "21",
  totalSpNo: "304",
  minMaxSps: "301-361",
  polymerFeed: "5.99",
  actualSpinneret: "371 / 3",
  defect: "bundle",
  severity: "medium",
  drawingLine: "1K",
  spinningLine: "DF 4K-N",
  baleNo: "1",
  testTime: "08:10",
  drawingStart: "2026-07-06T12:00",
  defectTime: "2026-07-06T13:25",
  canUseMinutes: "35",
  blendLag: "8",
  doffingRows: `1,2026-07-06,03:31,1,755,21-22,1A,30,ok,AM,normal
2,2026-07-06,04:06,2,051,21-23,1A,30,ok,Operator,normal
3,2026-07-06,04:32,3,998,23-24,1A,30,ok,Operator,normal
4,2026-07-06,05:03,,192,24-22,1A,30,ok,Operator,BCP
5,2026-07-06,05:33,4,554,21-21,1A,30,ok,Operator,fiber unstable
6,2026-07-06,06:04,5,S-076,21-21,1A,30,ok,Operator,normal
7,2026-07-06,06:30,6,021,21-24,1A,30,ok,Operator,normal
8,2026-07-06,07:00,7,402,24-24,1A,30,ok,Operator,normal
9,2026-07-06,07:31,,036,24-23,1A,30,ok,Operator,change can
10,2026-07-06,08:02,8,S-003,23-23,1A,30,ok,Operator,normal
11,2026-07-06,08:33,,401,23-23,1A,30,ok,Operator,remark
12,2026-07-06,09:06,9,062,22-24,1A,30,ok,Operator,normal`,
  cans: `CAN-A01,2026-07-06T06:10,2026-07-06T06:45,UDY ปกติ
CAN-A02,2026-07-06T06:45,2026-07-06T07:20,tension swing ตอนท้าย
CAN-A03,2026-07-06T07:20,2026-07-06T07:55,มี wrapping ที่ guide
CAN-A04,2026-07-06T07:55,2026-07-06T08:30,ปกติ`,
  fsRows: `1,1,08:10,0,0,0,0,0,#6
2,1,08:10,0,0,0,0,0,#3
3,1,08:10,0,0,0,0,0,#6
4,1,08:10,0,0,0,0,0,#3
5,1,08:10,0,0,0,0,0,#6
6,1,08:10,0,0,0,0,0,#3
7,1,08:10,0,0,0,0,0,#6
8,1,08:10,0,0,0,0,0,#6
9,1,08:10,0,0,0,0,0,#6
10,1,08:10,0,0,0,0,0,#6
11,1,08:10,0,0,1,1,1,#6`,
  note: "พบ Bundle และเส้นใยจับเป็นก้อนหลังเริ่มเดิน Drawing ประมาณ 1 ชั่วโมง 25 นาที"
};

const sampleForm = {
  ...defaultForm,
  brand: "PSF-B220",
  lot: "DR-260706-05",
  defect: "tangle",
  severity: "high",
  drawingLine: "Drawing Line 2",
  spinningLine: "Spinning Line B",
  drawingStart: "2026-07-06T12:00",
  defectTime: "2026-07-06T14:12",
  canUseMinutes: "42",
  blendLag: "10",
  doffingRows: "",
  cans: `CAN-B11,2026-07-06T06:40,2026-07-06T07:22,ปกติ
CAN-B12,2026-07-06T07:22,2026-07-06T08:04,ปาก can มีเส้นล้ม
CAN-B13,2026-07-06T08:04,2026-07-06T08:46,tension swing และ laydown ไม่เรียบ
CAN-B14,2026-07-06T08:46,2026-07-06T09:28,ปกติ`,
  note: "Flat screen พบ Tangle ต่อเนื่องหลังเปลี่ยน Can ช่วงกลาง run ต้องย้อนดู Can ก่อนหน้าและ Can ปัจจุบัน"
};

const defectProfiles = {
  bundle: {
    label: "Bundle",
    firstCheck: "Can + Tow tension",
    causes: [
      ["Can laydown ไม่ดีตั้งแต่ Spinning", "เปิดรูปสภาพ Can, ตรวจช่วงเส้นล้ม/จับตัว และบันทึกการเปลี่ยน Can", 92],
      ["เกิด wrapping หรือ guide สะดุดใน Drawing", "ตรวจ guide, roller, stop/start และค่า tension peak ช่วงก่อนเจอ defect", 84],
      ["Tow เข้า cutter ไม่สม่ำเสมอ", "ตรวจ feed roller, tow spread และการกระจายเส้นก่อนตัด", 68]
    ]
  },
  twist: {
    label: "Twist",
    firstCheck: "Tow path",
    causes: [
      ["เส้นบิดจากทางเดินเส้นหรือ guide alignment", "ตรวจตำแหน่ง guide, creel และเส้นทางจาก Can เข้า Drawing", 90],
      ["ความเร็ว roller ไม่สัมพันธ์กัน", "ตรวจ speed ratio และ log หลัง start/stop", 76],
      ["Can ถูกวางหรือดึงออกผิดทิศ", "ตรวจตำแหน่ง Can และวิธีดึงเส้นของ operator", 67]
    ]
  },
  tangle: {
    label: "Tangle",
    firstCheck: "Can condition",
    causes: [
      ["เส้นใน Can พันกันจาก Spinning laydown", "ตรวจ pattern การลง Can และช่วงท้าย/ต้น Can", 91],
      ["ดึงเส้นออกจาก Can ไม่เรียบ", "ดูช่วงเปลี่ยน Can, tow tension และสภาพปาก Can", 78],
      ["เกิด tension swing ระหว่าง Drawing", "ตรวจ tension trend และ roller surface", 70]
    ]
  },
  defect: {
    label: "Defect",
    firstCheck: "Spinning pack",
    causes: [
      ["คราบหรือสิ่งปนเปื้อนจาก Spinning", "ตรวจ pack pressure, spinneret/pack cleaning และ raw material lot", 88],
      ["ปัญหา oiling หรือ quench", "ตรวจ oil pickup, quench air และสภาพเส้น UDY", 74],
      ["มี foreign material ใน Can", "ตรวจฝาปิด Can, พื้นที่จัดเก็บ และรูปถ่ายก่อนเข้า Drawing", 66]
    ]
  },
  long: {
    label: "Long filament",
    firstCheck: "Cutter",
    causes: [
      ["ใบมีด cutter สึกหรือ clearance ผิด", "ตรวจ record เปลี่ยนใบมีดและวัดความยาวเส้นซ้ำ", 94],
      ["Tow feed เข้า cutter ไม่สม่ำเสมอ", "ตรวจ feed roller, draw speed และ tension ก่อนตัด", 80],
      ["มีเส้นบางส่วนไม่ถูกตัดเพราะจับเป็นมัด", "ย้อนดู Bundle/Tangle ใน Can ที่ใช้ช่วงเดียวกัน", 71]
    ]
  }
};

const defectMatrix = [
  ["Bundle", "เส้นใยจับเป็นมัดหรือก้อน", "Can ที่ใช้ช่วงนั้น, guide/wrapping, cutter feed, tow tension", "บันทึก wrapping, tension trend, รูป Flat screen, เวลาเปลี่ยน Can"],
  ["Twist", "เส้นใยบิดตัวผิดปกติ", "Drawing roller, tow path, creel/can position, guide alignment", "Log การร้อยเส้น, stop/start, roller speed, ภาพเส้นก่อนเข้า cutter"],
  ["Tangle", "เส้นใยพันกันหรือจัดตัวไม่สม่ำเสมอ", "Can laydown จาก Spinning, การดึงออกจาก Can, tow tension", "รูปสภาพ Can, operator note, tension peak, เวลาเปลี่ยน Can"],
  ["Defect", "ความผิดปกติทั่วไป เช่น จุดแข็ง คราบ หรือปนเปื้อน", "Spinning pack, quench, oiling, สิ่งปนเปื้อนใน Can", "pack pressure, oil pickup, clean record, raw material lot"],
  ["Long filament", "เส้นยาวเกินหลังตัด", "Cutter blade, cutter clearance, tow feeding, draw speed", "blade change record, cutter inspection, speed trend, sample length"]
];

function parseDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatTime(date) {
  if (!date) return "-";
  return date.toLocaleString("th-TH", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

function minutesBetween(a, b) {
  return Math.round((b.getTime() - a.getTime()) / 60000);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function parseCans(text) {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const parts = line.split(",").map((part) => part.trim());

      if (parts.length >= 9) {
        const doffMinutes = Math.max(1, Number(parts[7]) || 30);
        const start = parseDate(`${parts[1]}T${parts[2]}`);
        const end = start ? new Date(start.getTime() + doffMinutes * 60000) : null;
        const canLabel = parts[4] || parts[3] || parts[0] || `CAN-${index + 1}`;
        return {
          index,
          id: `CAN ${canLabel}`,
          spinStart: start,
          spinEnd: end,
          position: parts[5] || "-",
          grade: parts[6] || "-",
          fluff: parts[8] || "-",
          sign: parts[9] || "-",
          note: parts.slice(10).join(", ") || "-"
        };
      }

      return {
        index,
        id: parts[0] || `CAN-${index + 1}`,
        spinStart: parseDate(parts[1]),
        spinEnd: parseDate(parts[2]),
        position: "-",
        grade: "-",
        fluff: "-",
        sign: "-",
        note: parts.slice(3).join(", ") || "-"
      };
    });
}

function parseFsRows(text) {
  const defectKeys = ["bundle", "twist", "tangle", "defect", "long"];
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(",").map((part) => part.trim());
      const counts = defectKeys.map((key, offset) => ({
        key,
        count: Number(parts[offset + 3]) || 0
      }));
      const total = counts.reduce((sum, item) => sum + item.count, 0);
      const max = counts.reduce((best, item) => (item.count > best.count ? item : best), counts[0]);

      return {
        no: parts[0] || "-",
        baleNo: parts[1] || "-",
        time: parts[2] || "",
        defect: max.key,
        defectCount: max.count,
        totalDefects: total,
        remark: parts.slice(8).join(", ") || "-"
      };
    });
}

function getActiveFsRow(data) {
  const rows = parseFsRows(data.fsRows || "");
  const targetBale = String(data.baleNo || "").trim();
  const rowsWithDefect = rows.filter((row) => row.totalDefects > 0);
  return rowsWithDefect.find((row) => String(row.baleNo).trim() === targetBale) || rowsWithDefect[0] || rows[0] || null;
}

function getCanWindows(cans, drawingStart, canUseMinutes, blendLag) {
  return cans.map((can, index) => {
    const useStart = new Date(drawingStart.getTime() + index * canUseMinutes * 60000);
    const useEnd = new Date(useStart.getTime() + canUseMinutes * 60000);
    const traceStart = new Date(useStart.getTime() - blendLag * 60000);
    const traceEnd = new Date(useEnd.getTime() + blendLag * 60000);
    return { ...can, useStart, useEnd, traceStart, traceEnd };
  });
}

function analyze(data) {
  const fallbackDate = new Date();
  const drawingStart = parseDate(data.drawingStart) || fallbackDate;
  const defectTime = parseDate(data.defectTime) || drawingStart;
  const canUseMinutes = Math.max(1, Number(data.canUseMinutes) || 1);
  const blendLag = Math.max(0, Number(data.blendLag) || 0);
  const activeFsRow = getActiveFsRow(data);
  const sourceRows = (data.doffingRows || "").trim() ? data.doffingRows : data.cans;
  const cans = getCanWindows(parseCans(sourceRows || ""), drawingStart, canUseMinutes, blendLag);
  const selectedDefect = activeFsRow && activeFsRow.totalDefects > 0 ? activeFsRow.defect : data.defect;
  const profile = defectProfiles[selectedDefect] || defectProfiles.bundle;
  const elapsed = drawingStart && defectTime ? minutesBetween(drawingStart, defectTime) : 0;

  const traced = cans
    .map((can) => {
      let score = 25;
      if (defectTime >= can.useStart && defectTime <= can.useEnd) score += 55;
      if (defectTime >= can.traceStart && defectTime <= can.traceEnd) score += 25;
      if (/unstable|remark|change|BCP|fluff|NG|not ok/i.test(can.note)) score += 10;
      if (/swing|wrapping|guide|ผิด|tension|ปัญหา|คราบ|พัน/i.test(can.note)) score += 12;
      const center = can.useStart.getTime() + (can.useEnd.getTime() - can.useStart.getTime()) / 2;
      const distanceMin = Math.abs(defectTime.getTime() - center) / 60000;
      score -= Math.min(22, distanceMin / 5);
      return { ...can, score: Math.round(clamp(score, 5, 99)) };
    })
    .sort((a, b) => b.score - a.score);

  const primary = traced[0] || null;
  const severityAdd = data.severity === "high" ? 12 : data.severity === "medium" ? 6 : 0;
  const confidence = clamp((primary ? primary.score : 0) + severityAdd, 5, 99);
  const risk = confidence >= 80 ? "High trace risk" : confidence >= 55 ? "Medium trace risk" : "Low trace risk";

  return { drawingStart, defectTime, elapsed, profile, traced, primary, confidence, risk, activeFsRow };
}

function Field({ id, label, children, help }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {help ? <p className="help">{help}</p> : null}
    </div>
  );
}

function TextInput({ form, id, onChange, type = "text", min }) {
  return <input id={id} name={id} type={type} min={min} value={form[id]} onChange={onChange} />;
}

function TextArea({ form, id, onChange }) {
  return <textarea id={id} name={id} value={form[id]} onChange={onChange} />;
}

export default function HomePage() {
  const [form, setForm] = useState(defaultForm);
  const result = useMemo(() => analyze(form), [form]);
  const primary = result.primary;
  const confidenceClass = result.confidence >= 80 ? "high" : result.confidence < 55 ? "low" : "";

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
  }

  function handlePrint() {
    window.print();
  }

  const timeline = [
    ["1", "ยืนยันผล Flat screen", `${result.profile.label} ที่ ${formatTime(result.defectTime)} บน ${form.drawingLine} และบันทึกรูปตัวอย่าง`],
    ["2", "เทียบเวลา Drawing กับลำดับ Can", `เริ่ม Drawing ${formatTime(result.drawingStart)} เจอ defect หลังเริ่มประมาณ ${result.elapsed} นาที`],
    [
      "3",
      "ตรวจ Can ที่เกี่ยวข้อง",
      primary
        ? `${primary.id} ถูกใช้ช่วง ${formatTime(primary.useStart)} - ${formatTime(primary.useEnd)} และผลิตจาก Spinning ช่วง ${formatTime(primary.spinStart)} - ${formatTime(primary.spinEnd)}`
        : "ไม่พบ Can ที่ตรงเงื่อนไข"
    ],
    ["4", "เปิดบันทึก Spinning", `ตรวจ ${form.spinningLine}, can laydown, tension/wrapping, pack pressure และหมายเหตุ operator`],
    ["5", "ตัดสินใจ Hold/Release", "หาก defect ต่อเนื่อง ให้ Hold product จาก Can ที่เกี่ยวข้องและ Can ก่อน-หลังในช่วงคาบเกี่ยว"]
  ];

  return (
    <div className="shell">
      <aside className="sidebar">
        <section className="brand">
          <div className="mark" aria-hidden="true" />
          <div>
            <h1>AquaTrace Fiber Intelligence</h1>
            <p>ระบบวิเคราะห์ย้อนกลับ Defect จาก Flat screen ไปหา Can และช่วงเวลา Spinning</p>
          </div>
        </section>

        <nav className="nav" aria-label="เมนูหลัก">
          <a href="#input">ข้อมูล Flat screen</a>
          <a href="#trace">Can ที่เกี่ยวข้อง</a>
          <a href="#timeline">ลำดับการตรวจสอบ</a>
          <a href="#matrix">คู่มือ Defect</a>
        </nav>

        <p className="side-note">
          ออกแบบสำหรับงานผลิตเส้นใยสั้นที่มี 2 ช่วงหลัก: Spinning ผลิต UDY ลง Can และ Drawing ดึงยืดก่อนตัดเพื่อตรวจ Flat screen
        </p>

        <section className="side-metrics">
          <div className="side-metric">
            <b>{primary ? primary.id : "-"}</b>
            Can ที่ควรย้อนตรวจอันดับแรก
          </div>
          <div className="side-metric">
            <b>{primary ? `${formatTime(primary.spinStart)} - ${formatTime(primary.spinEnd)}` : "-"}</b>
            ช่วงเวลา Spinning ที่ต้องดู
          </div>
        </section>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h2>AquaTrace Defect Dashboard</h2>
            <p>ระบุเวลาเจอ Defect หลัง Drawing แล้วระบบจะเทียบกับลำดับ Can จาก Spinning เพื่อหาแหล่งที่ควรตรวจย้อนกลับ</p>
          </div>
          <div className="actions">
            <button className="btn secondary" type="button" onClick={() => setForm(sampleForm)}>
              โหลดตัวอย่าง
            </button>
            <button className="btn" type="button" onClick={handlePrint}>
              พิมพ์รายงาน
            </button>
          </div>
        </header>

        <section className="layout">
          <section className="panel pad" id="input">
            <h3>ข้อมูลการพบ Defect</h3>
            <form className="form" onSubmit={handleSubmit}>
              <div className="quick-guide">
                <strong>กรอกแค่ข้อมูลหลักก็วิเคราะห์ได้</strong>
                <span>1) Brand/Grade  2) เวลาเริ่ม Drawing  3) เวลาพบ Defect  4) Doffing Record rows  5) FS Oil Dispersion rows</span>
              </div>

              <div className="two">
                <Field id="brand" label="Brand / Grade">
                  <TextInput form={form} id="brand" onChange={updateField} />
                </Field>
                <Field id="lot" label="Lot / Run No.">
                  <TextInput form={form} id="lot" onChange={updateField} />
                </Field>
              </div>

              <div className="two">
                <Field id="drawingStart" label="เริ่มเดิน Drawing">
                  <TextInput form={form} id="drawingStart" type="datetime-local" onChange={updateField} />
                </Field>
                <Field id="defectTime" label="เวลาเจอ Defect">
                  <TextInput form={form} id="defectTime" type="datetime-local" onChange={updateField} />
                </Field>
              </div>

              <div className="two">
                <Field id="baleNo" label="Bale No. ที่พบ Defect">
                  <TextInput form={form} id="baleNo" onChange={updateField} />
                </Field>
                <Field id="testTime" label="เวลาในใบ Test">
                  <TextInput form={form} id="testTime" type="time" onChange={updateField} />
                </Field>
              </div>

              <div className="two">
                <Field id="defect" label="ประเภท Defect จาก Flat screen">
                  <select id="defect" name="defect" value={form.defect} onChange={updateField}>
                    <option value="bundle">Bundle</option>
                    <option value="twist">Twist</option>
                    <option value="tangle">Tangle</option>
                    <option value="defect">Defect</option>
                    <option value="long">Long filament</option>
                  </select>
                </Field>
                <Field id="severity" label="ระดับความรุนแรง">
                  <select id="severity" name="severity" value={form.severity} onChange={updateField}>
                    <option value="low">พบเล็กน้อย</option>
                    <option value="medium">พบต่อเนื่อง</option>
                    <option value="high">พบมาก / ต้อง Hold</option>
                  </select>
                </Field>
              </div>

              <details className="advanced">
                <summary>ข้อมูลเพิ่มเติมจากหัวเอกสาร</summary>
                <div className="advanced-body">
                  <div className="two">
                    <Field id="smNo" label="SM No.">
                      <TextInput form={form} id="smNo" onChange={updateField} />
                    </Field>
                    <Field id="creelNo" label="Creel No.">
                      <TextInput form={form} id="creelNo" onChange={updateField} />
                    </Field>
                  </div>
                  <div className="two">
                    <Field id="dfNo" label="DF No.">
                      <TextInput form={form} id="dfNo" onChange={updateField} />
                    </Field>
                    <Field id="doffTimeHeader" label="Doff time จากหัวเอกสาร (นาที)">
                      <TextInput form={form} id="doffTimeHeader" type="number" onChange={updateField} />
                    </Field>
                  </div>
                  <div className="two">
                    <Field id="totalTowCan" label="Total tow can">
                      <TextInput form={form} id="totalTowCan" type="number" onChange={updateField} />
                    </Field>
                    <Field id="operationPosition" label="Operation position">
                      <TextInput form={form} id="operationPosition" onChange={updateField} />
                    </Field>
                  </div>
                  <div className="two">
                    <Field id="totalSpNo" label="Total sp.no">
                      <TextInput form={form} id="totalSpNo" onChange={updateField} />
                    </Field>
                    <Field id="minMaxSps" label="Min-Max total sps">
                      <TextInput form={form} id="minMaxSps" onChange={updateField} />
                    </Field>
                  </div>
                  <div className="two">
                    <Field id="polymerFeed" label="Polymer feed">
                      <TextInput form={form} id="polymerFeed" onChange={updateField} />
                    </Field>
                    <Field id="actualSpinneret" label="Actual Spinneret / Total FB">
                      <TextInput form={form} id="actualSpinneret" onChange={updateField} />
                    </Field>
                  </div>
                  <div className="two">
                    <Field id="drawingLine" label="Machine / Drawing Line">
                      <TextInput form={form} id="drawingLine" onChange={updateField} />
                    </Field>
                    <Field id="spinningLine" label="Spinning Line / Doffing record">
                      <TextInput form={form} id="spinningLine" onChange={updateField} />
                    </Field>
                  </div>
                  <div className="two">
                    <Field id="canUseMinutes" label="เวลาใช้ต่อ Can โดยประมาณ (นาที)">
                      <TextInput form={form} id="canUseMinutes" type="number" min="1" onChange={updateField} />
                    </Field>
                    <Field id="blendLag" label="เผื่อคาบเกี่ยวช่วงเปลี่ยน Can (นาที)">
                      <TextInput form={form} id="blendLag" type="number" min="0" onChange={updateField} />
                    </Field>
                  </div>
                  <Field id="cans" label="รายการ Can จาก Spinning ตามลำดับที่นำเข้า Drawing" help="รูปแบบต่อบรรทัด: Can No, เวลาเริ่ม Spinning, เวลาจบ Spinning, หมายเหตุ">
                    <TextArea form={form} id="cans" onChange={updateField} />
                  </Field>
                </div>
              </details>

              <Field id="doffingRows" label="Doffing Record rows" help="Format: No, Day, Time, Can, Can No., Position, Grade, Doff time, Fluff check, Sign, Remark">
                <TextArea form={form} id="doffingRows" onChange={updateField} />
              </Field>

              <Field id="fsRows" label="FS Oil Dispersion / Flat screen rows" help="Format: No, Bale No., Time, Bundle, Twist, Tangle, Defect, Long filament, Remark">
                <TextArea form={form} id="fsRows" onChange={updateField} />
              </Field>

              <Field id="note" label="บันทึกจาก Flat screen / หน้างาน">
                <TextArea form={form} id="note" onChange={updateField} />
              </Field>

              <button className="btn" type="submit">
                วิเคราะห์ย้อนกลับ
              </button>
            </form>
          </section>

          <section className="results">
            <section className="kpis" aria-label="ผลสรุป">
              <div className="kpi">
                <span>Trace Confidence</span>
                <b>{result.confidence}%</b>
              </div>
              <div className="kpi">
                <span>Can หลักที่สงสัย</span>
                <b>{primary ? primary.id : "-"}</b>
              </div>
              <div className="kpi">
                <span>Spinning Window</span>
                <b>{primary ? `${formatTime(primary.spinStart)} - ${formatTime(primary.spinEnd)}` : "-"}</b>
              </div>
              <div className="kpi">
                <span>First Check</span>
                <b>{result.profile.firstCheck}</b>
              </div>
            </section>

            <section className="panel" id="trace">
              <div className="head">
                <h3>Can ที่เกี่ยวข้องมากที่สุด</h3>
                <span className={`badge ${confidenceClass}`}>{result.risk}</span>
              </div>
              <div className="trace-list">
                {result.traced.length ? (
                  result.traced.slice(0, 4).map((can) => (
                    <article className="trace-card" key={`${can.id}-${can.index}`}>
                      <div className="trace-top">
                        <h4>{can.id}</h4>
                        <div className="bar" aria-label="คะแนนความเกี่ยวข้อง">
                          <i style={{ width: `${can.score}%` }} />
                        </div>
                      </div>
                      <div className="trace-meta">
                        <span>ใช้ใน Drawing: {formatTime(can.useStart)} - {formatTime(can.useEnd)}</span>
                        <span>Spinning: {formatTime(can.spinStart)} - {formatTime(can.spinEnd)}</span>
                        <span>Position: {can.position || "-"}</span>
                        <span>Grade: {can.grade || "-"}</span>
                        <span>Fluff: {can.fluff || "-"}</span>
                        <span>คะแนน {can.score}%</span>
                      </div>
                      <p>{can.note}</p>
                    </article>
                  ))
                ) : (
                  <p className="help">ยังไม่มีข้อมูล Can</p>
                )}
              </div>
            </section>

            <section className="panel">
              <div className="head">
                <h3>สาเหตุที่ควรตรวจ</h3>
                <span className="tag">
                  {result.activeFsRow
                    ? `${result.profile.label} | Bale ${result.activeFsRow.baleNo} | ${result.activeFsRow.time || form.testTime || "-"}`
                    : result.profile.label}
                </span>
              </div>
              <div className="cause-list">
                {result.profile.causes.map((cause) => (
                  <article className="cause-card" key={cause[0]}>
                    <div className="cause-top">
                      <h4>{cause[0]}</h4>
                      <div className="bar">
                        <i style={{ width: `${cause[2]}%` }} />
                      </div>
                    </div>
                    <p>
                      {cause[1]}
                      {primary ? ` | เริ่มจาก ${primary.id}` : ""}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </section>
        </section>

        <section className="panel" id="timeline">
          <div className="head">
            <h3>ลำดับการตรวจสอบย้อนหลัง</h3>
            <span className="tag warn">{form.brand} / {form.lot}</span>
          </div>
          <div className="timeline">
            {timeline.map((step) => (
              <div className="step" key={step[0]}>
                <div className="time">ขั้นตอน {step[0]}</div>
                <div>
                  <strong>{step[1]}</strong>
                  <p>{step[2]}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel matrix" id="matrix">
          <div className="head">
            <h3>คู่มือเทียบ Defect กับจุดตรวจ</h3>
            <span className="tag">Flat screen reference</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Defect</th>
                <th>ความหมายหน้างาน</th>
                <th>จุดที่ควรย้อนตรวจ</th>
                <th>หลักฐานที่ควรเปิดดู</th>
              </tr>
            </thead>
            <tbody>
              {defectMatrix.map((row) => (
                <tr key={row[0]}>
                  <td>{row[0]}</td>
                  <td>{row[1]}</td>
                  <td>{row[2]}</td>
                  <td>{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}
