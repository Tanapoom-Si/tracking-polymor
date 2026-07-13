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
  layerMinutes: "2",
  affectedScope: "single",
  drawingStopStart: "no",
  drawingTension: "normal",
  drawingGuide: "normal",
  drawingRoller: "normal",
  drawingCutter: "normal",
  drawingNote: "ไม่พบ stop/start หรือ tension swing ชัดเจนก่อนเจอ defect",
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
  layerMinutes: "3",
  affectedScope: "multiple",
  drawingStopStart: "yes",
  drawingTension: "swing",
  drawingGuide: "normal",
  drawingRoller: "normal",
  drawingCutter: "normal",
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
  ["Bundle", "เส้นใยมีความแข็ง", "Can ที่ใช้ช่วงนั้น, Guide/Wrapping, Cutter feed, Tow tension", "บันทึก Wrapping, Tension trend, รูป Flat screen, เวลาเปลี่ยน Can"],
  ["Twist", "เส้นใยจับตัวเป็นมัดหรือเป็นก้อน", "Drawing roller, Tow path, Creel/Can position, Guide alignment", "Log การร้อยเส้น, Stop/Start, Roller speed, ภาพเส้นก่อนเข้า Cutter"],
  ["Tangle", "เส้นใยมีความฟูหรือจัดตัวไม่สม่ำเสมอ", "Can laydown จาก Spinning, การดึงออกจาก Can, Tow tension", "รูปสภาพ Can, Operator note, Tension peak, เวลาเปลี่ยน Can"],
  ["Defect", "เส้นใยมีความผิดปกติ", "Spinning pack, Quench, Oiling, สิ่งปนเปื้อนใน Can", "Pack pressure, Oil pickup, Clean record, Raw material lot"],
  ["Long filament", "เส้นยาวเกินหลังตัด", "Cutter blade, Cutter clearance, Tow feeding, Draw speed", "Blade change record, Cutter inspection, Speed trend, Sample length"]
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

function preciseMinutesBetween(a, b) {
  return (b.getTime() - a.getTime()) / 60000;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatPercent(value) {
  return `${Math.round(value)}%`;
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
          doffMinutes,
          note: parts.slice(10).join(", ") || "-"
        };
      }

      const spinStart = parseDate(parts[1]);
      const spinEnd = parseDate(parts[2]);
      return {
        index,
        id: parts[0] || `CAN-${index + 1}`,
        spinStart,
        spinEnd,
        position: "-",
        grade: "-",
        fluff: "-",
        sign: "-",
        doffMinutes: spinStart && spinEnd ? Math.max(1, preciseMinutesBetween(spinStart, spinEnd)) : 30,
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

function analyzeOrigin(data, traced, profile) {
  let spinningScore = 30;
  let drawingScore = 30;
  const drawingReasons = [];
  const spinningReasons = [];
  const noteText = `${data.note || ""} ${data.drawingNote || ""}`.toLowerCase();

  if (data.affectedScope === "multiple") {
    drawingScore += 28;
    drawingReasons.push("พบ defect หลาย Can/หลายตำแหน่งในช่วงใกล้กัน จึงควรตรวจ Drawing ก่อน");
  } else if (data.affectedScope === "single") {
    spinningScore += 18;
    spinningReasons.push("พบความผิดปกติใน Can ตำแหน่งเดิมซ้ำหลายครั้ง");
  }

  if (data.drawingStopStart === "yes") {
    drawingScore += 18;
    drawingReasons.push("มี stop/start หรือ change setting ก่อนพบ defect");
  }

  if (data.drawingTension === "swing") {
    drawingScore += 20;
    drawingReasons.push("มี tension swing ใน Drawing");
  }

  if (data.drawingGuide === "abnormal") {
    drawingScore += 18;
    drawingReasons.push("พบความผิดปกติที่ guide/tow path");
  }

  if (data.drawingRoller === "abnormal") {
    drawingScore += 16;
    drawingReasons.push("พบความผิดปกติที่ roller หรือ speed ratio");
  }

  if (data.drawingCutter === "abnormal") {
    drawingScore += 16;
    drawingReasons.push("พบความผิดปกติที่ cutter/feed ก่อนตัด");
  }

  if (/tension|wrapping|guide|roller|cutter|stop|start|speed|สะดุด|แกว่ง/.test(noteText)) {
    drawingScore += 10;
    drawingReasons.push("หมายเหตุหน้างานมีคำที่สัมพันธ์กับ Drawing condition");
  }

  const primary = traced[0] || null;
  if (primary && /unstable|remark|change|BCP|fluff|NG|not ok/i.test(primary.note)) {
    spinningScore += 22;
    spinningReasons.push("Doffing record ของ Can มี remark/fluff/BCP หรือความผิดปกติ");
  }

  if (primary && /swing|wrapping|guide|ผิด|tension|ปัญหา|คราบ|พัน/i.test(primary.note)) {
    spinningScore += 10;
    spinningReasons.push("หมายเหตุใน Can มีคำที่สัมพันธ์กับสภาพเส้นใยหรือ laydown");
  }

  if (profile.firstCheck.includes("Cutter") || profile.firstCheck.includes("Tow path")) {
    drawingScore += 10;
    drawingReasons.push(`ชนิด defect นี้ควรตรวจ ${profile.firstCheck} ใน Drawing ร่วมด้วย`);
  }

  if (profile.firstCheck.includes("Can") || profile.firstCheck.includes("Spinning")) {
    spinningScore += 10;
    spinningReasons.push(`ชนิด defect นี้สัมพันธ์กับ ${profile.firstCheck}`);
  }

  const total = Math.max(1, spinningScore + drawingScore);
  const spinningRisk = Math.round((spinningScore / total) * 100);
  const drawingRisk = Math.round((drawingScore / total) * 100);
  const likelyOrigin = Math.abs(spinningRisk - drawingRisk) <= 10
    ? "Mixed"
    : drawingRisk > spinningRisk ? "Drawing" : "Spinning / Can";
  const firstCheck = likelyOrigin === "Drawing"
    ? "ตรวจ Drawing condition: tension, guide, roller, cutter, stop/start"
    : likelyOrigin === "Spinning / Can"
      ? ""
      : "ตรวจทั้ง Drawing condition และ Can layer ควบคู่กัน";

  return {
    spinningRisk,
    drawingRisk,
    likelyOrigin,
    firstCheck,
    drawingReasons: drawingReasons.slice(0, 3),
    spinningReasons: spinningReasons.slice(0, 3)
  };
}

function getCanSections(cans, drawingStart, defectTime, canUseMinutes, blendLag, layerMinutes) {
  const elapsed = Math.max(0, preciseMinutesBetween(drawingStart, defectTime));
  const consumedRatio = clamp(elapsed / canUseMinutes, 0, 1);
  const removeTopStartPct = clamp(((elapsed - blendLag) / canUseMinutes) * 100, 0, 100);
  const removeTopEndPct = clamp(((elapsed + blendLag) / canUseMinutes) * 100, 0, 100);

  return cans.map((can, index) => {
    const fallbackDoffMinutes = can.spinStart && can.spinEnd ? preciseMinutesBetween(can.spinStart, can.spinEnd) : layerMinutes;
    const doffMinutes = Math.max(1, Number(can.doffMinutes) || fallbackDoffMinutes || layerMinutes);
    const layerCount = Math.max(1, Math.ceil(doffMinutes / layerMinutes));
    const topLayer = clamp(Math.floor(consumedRatio * layerCount) + 1, 1, layerCount);
    const doffingLayer = layerCount - topLayer + 1;
    const sectionMinutes = layerMinutes;
    const sectionOffset = (doffingLayer - 1) * layerMinutes;
    const spinSectionStart = can.spinStart ? new Date(can.spinStart.getTime() + sectionOffset * 60000) : null;
    const spinSectionEnd = spinSectionStart
      ? new Date(Math.min(spinSectionStart.getTime() + sectionMinutes * 60000, can.spinEnd?.getTime() || Infinity))
      : null;

    return {
      ...can,
      index,
      useStart: drawingStart,
      useEnd: new Date(drawingStart.getTime() + canUseMinutes * 60000),
      elapsed,
      layerCount,
      topLayer,
      doffingLayer,
      positionFromTopPct: consumedRatio * 100,
      positionFromBottomPct: (1 - consumedRatio) * 100,
      removeTopStartPct,
      removeTopEndPct,
      spinSectionStart,
      spinSectionEnd
    };
  });
}

function analyze(data) {
  const fallbackDate = new Date();
  const drawingStart = parseDate(data.drawingStart) || fallbackDate;
  const defectTime = parseDate(data.defectTime) || drawingStart;
  const canUseMinutes = Math.max(1, Number(data.canUseMinutes) || 1);
  const blendLag = Math.max(0, Number(data.blendLag) || 0);
  const layerMinutes = Math.max(0.1, Number(data.layerMinutes) || 1);
  const activeFsRow = getActiveFsRow(data);
  const sourceRows = (data.doffingRows || "").trim() ? data.doffingRows : data.cans;
  const cans = getCanSections(parseCans(sourceRows || ""), drawingStart, defectTime, canUseMinutes, blendLag, layerMinutes);
  const selectedDefect = activeFsRow && activeFsRow.totalDefects > 0 ? activeFsRow.defect : data.defect;
  const profile = defectProfiles[selectedDefect] || defectProfiles.bundle;
  const elapsed = drawingStart && defectTime ? minutesBetween(drawingStart, defectTime) : 0;

  const traced = cans
    .map((can) => {
      let score = 25;
      if (defectTime >= can.useStart && defectTime <= can.useEnd) score += 55;
      if (can.elapsed >= 0 && can.elapsed <= canUseMinutes + blendLag) score += 15;
      if (/unstable|remark|change|BCP|fluff|NG|not ok/i.test(can.note)) score += 10;
      if (/swing|wrapping|guide|ผิด|tension|ปัญหา|คราบ|พัน/i.test(can.note)) score += 12;
      return { ...can, score: Math.round(clamp(score, 5, 99)) };
    })
    .sort((a, b) => b.score - a.score);

  const primary = traced[0] || null;
  const severityAdd = data.severity === "high" ? 12 : data.severity === "medium" ? 6 : 0;
  const confidence = clamp((primary ? primary.score : 0) + severityAdd, 5, 99);
  const risk = confidence >= 80 ? "ความเสี่ยงสูง" : confidence >= 55 ? "ความเสี่ยงปานกลาง" : "ความเสี่ยงต่ำ";
  const origin = analyzeOrigin(data, traced, profile);

  return { drawingStart, defectTime, elapsed, profile, traced, primary, confidence, risk, activeFsRow, canUseMinutes, layerMinutes, origin };
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
  const [activeView, setActiveView] = useState("home");
  const result = useMemo(() => analyze(form), [form]);
  const primary = result.primary;
  const confidenceClass = result.confidence >= 80 ? "high" : result.confidence < 55 ? "low" : "";
  const viewTitle = {
    home: ["TRACK FIBER", "เลือกเมนูที่ต้องการใช้งาน"],
    overview: ["ผลการวิเคราะห์", "แสดงผลการวิเคราะห์ พร้อมคำแนะนำในการตรวจสอบและข้อมูลที่เกี่ยวข้อง"],
    input: ["บันทึกข้อมูล", "กรอกข้อมูล Flat screen, Drawing และ Spinning ที่เกี่ยวข้องเพื่อใช้ในวิเคราะห์"],
    origin: ["วิเคราะห์สาเหตุของความผิดปกติ", "ประเมินความเป็นไปได้ของสาเหตุระหว่างกระบวนการ Spinning และ Drawing"],
    trace: ["วิเคราะห์ตำแหน่งเส้นใย", "ตรวจสอบตำแหน่ง ชั้นของเส้นใย และช่วงเวลา Spinning ที่เกี่ยวข้องกับความผิดปกติ"],
    timeline: ["ลำดับการตรวจสอบที่แนะนำ", "ตรวจสอบสาเหตุของ Defect ตามลำดับความเสี่ยงและหลักฐานที่เกี่ยวข้อง"],
    matrix: ["คู่มืออ้างอิง", "ตารางเปรียบเทียบประเภทความผิดปกติ จุดที่ควรตรวจสอบ และหลักฐานประกอบการวิเคราะห์"]
  };
  const activeTitle = viewTitle[activeView] || viewTitle.overview;
  const showLayout = ["input", "origin", "trace"].includes(activeView);
  const originReason = result.origin.drawingRisk >= result.origin.spinningRisk
    ? result.origin.drawingReasons[0] || "ข้อมูล Drawing มีน้ำหนักมากกว่าหรือใกล้เคียงกับฝั่ง Can"
    : result.origin.spinningReasons[0] || "ข้อมูล Can และ Doffing มีน้ำหนักมากกว่าฝั่ง Drawing";
  const firstAction = result.origin.likelyOrigin === "Drawing"
    ? "ตรวจ Drawing ก่อน"
    : result.origin.likelyOrigin === "Spinning / Can"
      ? "เริ่มตรวจสอบที่ Spinning (Can)"
      : "ตรวจ Drawing และ Can พร้อมกัน";

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setActiveView("overview");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handlePrint() {
    window.print();
  }

  const timeline = [
    [
      "1",
      "ยืนยันตำแหน่งและเวลาที่พบ Defect",
      `${result.profile.label} ที่ ${formatTime(result.defectTime)} บน ${form.drawingLine} หลังเริ่ม Drawing ประมาณ ${result.elapsed} นาที`
    ],
    [
      "2",
      "ตรวจสอบสภาพการทำงานของกระบวนการ Drawing",
      `ตรวจสอบรายการ Stop/Start, Tension, Guide, Roller และ Cutter เนื่องจากผลวิเคราะห์พบความเป็นไปได้จาก Drawing อยู่ที่ ${result.origin.drawingRisk}%`
    ],
    [
      "3",
      "ประเมินแหล่งที่มาของความผิดปกติ",
      `${result.origin.likelyOrigin} | Spinning/Can ${result.origin.spinningRisk}% | Drawing ${result.origin.drawingRisk}%`
    ],
    [
      "4",
      "แปลงช่วงเวลา Drawing เป็นตำแหน่งเส้นใยใน Can",
      primary
        ? `ตำแหน่งจากปากถังลงไปประมาณ ${formatPercent(primary.positionFromTopPct)} ตรงกับชั้น Doffing ${primary.doffingLayer}/${primary.layerCount}`
        : "ยังไม่มีข้อมูลถัง ให้เพิ่ม Doffing record หรือรายการ Can ก่อนวิเคราะห์"
    ],
    [
      "5",
      "ตรวจสอบช่วงเวลา Spinning ของชั้นเส้นใยที่เกี่ยวข้อง",
      primary
        ? `ตรวจสอบ ${primary.id} ชั้นนี้ช่วง ${formatTime(primary.spinSectionStart)} - ${formatTime(primary.spinSectionEnd)} เทียบกับ Laydown, Tension, Wrapping และหมายเหตุหน้างาน`
        : `ตรวจ ${form.spinningLine}, can laydown, tension/wrapping และหมายเหตุ operator ในช่วงที่สัมพันธ์กับเวลา Defect`
    ],
    [
      "6",
      "คัดแยกเส้นใยในช่วงที่มีความเสี่ยง",
      primary
        ? `คัดแยกเส้นใยเฉพาะบริเวณที่มีความเสี่ยงจากตำแหน่งจากปากถัง ${formatPercent(primary.removeTopStartPct)} - ${formatPercent(primary.removeTopEndPct)} แล้วให้ QC ยืนยันก่อนใช้ส่วนที่เหลือต่อ`
        : "ถ้า Defect ต่อเนื่อง ให้ hold เฉพาะส่วนที่สัมพันธ์กับเวลาและตำแหน่งที่พบ Defect"
    ]
  ];

  return (
    <div className="shell">
      <aside className="sidebar">
        <section className="brand">
          <div className="mark" aria-hidden="true">
            <svg viewBox="0 0 64 64" role="img" focusable="false">
              <path d="M10 18c11-9 22-9 33 0 5 4 9 5 13 3" />
              <path d="M8 32c12-8 23-8 34 0 6 4 10 5 15 2" />
              <path d="M10 46c10-7 21-7 32 0 5 3 9 4 14 1" />
              <circle cx="17" cy="14" r="3" />
              <circle cx="33" cy="30" r="3" />
              <circle cx="48" cy="48" r="3" />
            </svg>
          </div>
          <div>
            <h1>TRACK FIBER</h1>
            <p>ระบบวิเคราะห์ข้อมูลย้อนกลับเพื่อระบุตำแหน่งที่เส้นใยเกิดความผิดปกติ</p>
          </div>
        </section>

        <nav className="nav" aria-label="เมนูหลัก">
          <button className={activeView === "home" ? "active" : ""} type="button" onClick={() => setActiveView("home")}>Home</button>
          <button className={activeView === "input" ? "active" : ""} type="button" onClick={() => setActiveView("input")}>บันทึกข้อมูล</button>
          <button className={activeView === "overview" ? "active" : ""} type="button" onClick={() => setActiveView("overview")}>ผลการวิเคราะห์</button>
          <button className={activeView === "origin" ? "active" : ""} type="button" onClick={() => setActiveView("origin")}>วิเคราะห์สาเหตุ</button>
          <button className={activeView === "trace" ? "active" : ""} type="button" onClick={() => setActiveView("trace")}>วิเคราะห์ตำแหน่ง</button>
          <button className={activeView === "timeline" ? "active" : ""} type="button" onClick={() => setActiveView("timeline")}>ลำดับการตรวจสอบ</button>
          <button className={activeView === "matrix" ? "active" : ""} type="button" onClick={() => setActiveView("matrix")}>คู่มืออ้างอิง</button>
        </nav>

        <p className="side-note">
          
        </p>

        <section className="side-metrics">
          <div className="side-metric">
            <b>{primary ? primary.id : "-"}</b>
            Can ที่ควรย้อนตรวจอันดับแรก
          </div>
          <div className="side-metric">
            <b>{primary ? `${formatPercent(primary.positionFromTopPct)} / ชั้น ${primary.doffingLayer}` : "-"}</b>
            ตำแหน่งในถังที่ควรคัดแยก
          </div>
        </section>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h2>{activeTitle[0]}</h2>
            <p>{activeTitle[1]}</p>
          </div>
          <div className="actions">
            <button className="btn secondary" type="button" onClick={() => setForm(sampleForm)}>
              โหลดข้อมูลตัวอย่าง
            </button>
            <button className="btn" type="button" onClick={handlePrint}>
              พิมพ์รายงาน
            </button>
          </div>
        </header>

        <section className={`home-grid ${activeView !== "home" ? "page-hidden" : ""}`} aria-label="หน้าเริ่มต้น">
          <article className="home-hero">
            <span>Fiber Defect Traceability</span>
            <h3>เริ่มต้นการวิเคราะห์</h3>
            <p>ระบบเชื่อมโยงข้อมูล Flat screen, Drawing และ Spinning เพื่อระบุตำแหน่งของเส้นใยที่พบความผิดปกติ</p>
            <button className="btn" type="button" onClick={() => setActiveView("input")}>
              เริ่มวิเคราะห์ใหม่
            </button>
          </article>

          <button className="home-card" type="button" onClick={() => setActiveView("input")}>
            <span>Step 1</span>
            <strong>บันทึกข้อมูล Defect</strong>
            <p>ใส่เวลาเจอ Defect, เวลาเริ่ม Drawing, Doffing record และ Drawing condition</p>
          </button>

          <button className="home-card" type="button" onClick={() => setActiveView("overview")}>
            <span>Step 2</span>
            <strong>ผลการวิเคราะห์เบื้องต้น</strong>
            <p>ดูคำแนะนำหลักว่าต้องเริ่มตรวจที่ไหนและควรกันเส้นใยช่วงใดไว้ก่อน</p>
          </button>

          <button className="home-card" type="button" onClick={() => setActiveView("origin")}>
            <span>Check</span>
            <strong>วิเคราะห์สาเหตุ</strong>
            <p>เปรียบเทียบความเสี่ยงระหว่าง Spinning / Can กับ Drawing</p>
          </button>

          <button className="home-card" type="button" onClick={() => setActiveView("trace")}>
            <span>Trace</span>
            <strong>ตรวจสอบตำแหน่งภายใน Can</strong>
            <p>ดู Can, ชั้น Doffing, ตำแหน่งจากปากถัง และช่วงเวลาของชั้นนั้น</p>
          </button>

          <button className="home-card" type="button" onClick={() => setActiveView("timeline")}>
            <span>Action</span>
            <strong>ลำดับการตรวจสอบ</strong>
            <p>แสดงขั้นตอนการตรวจสอบที่ระบบแนะนำตามผลการวิเคราะห์</p>
          </button>
        </section>

        <section className={`summary-band ${activeView !== "overview" ? "page-hidden" : ""}`} aria-label="สรุปผลสำคัญ">
          <article className="summary-card hero">
            <span>1. เริ่มจากตรงนี้</span>
            <strong>{firstAction}</strong>
            <p>{result.origin.firstCheck}</p>
            <small>{originReason}</small>
          </article>
          <article className="summary-card">
            <span>2. ช่วงการผลิตที่ได้รับผลกระทบ</span>
            <strong>{primary ? `${formatPercent(primary.removeTopStartPct)} - ${formatPercent(primary.removeTopEndPct)}` : "-"}</strong>
            <p>{primary ? `จากปากถังของ ${primary.id}` : "ยังไม่มีข้อมูล Can"}</p>
          </article>
          <article className="summary-card">
            <span>3. ชั้นเส้นใยที่ควรตรวจสอบ</span>
            <strong>{primary ? `ชั้น ${primary.doffingLayer}/${primary.layerCount}` : "-"}</strong>
            <p>{primary ? `เวลาชั้นนี้ ${formatTime(primary.spinSectionStart)} - ${formatTime(primary.spinSectionEnd)}` : "ยังไม่มีข้อมูลชั้น"}</p>
          </article>
          <article className="summary-card">
            <span>4. ระดับความเชื่อมั่น</span>
            <strong>{result.confidence}%</strong>
            <p>{result.risk} | Drawing {result.origin.drawingRisk}% / Can {result.origin.spinningRisk}%</p>
          </article>
        </section>

        <section className={`layout ${showLayout ? "" : "page-hidden"} ${activeView === "input" ? "single" : "full"}`}>
          <section className={`panel pad ${activeView !== "input" ? "page-hidden" : ""}`} id="input">
            <h3>ข้อมูลการตรวจพบ Defect</h3>
            <form className="form" onSubmit={handleSubmit}>
              <div className="quick-guide">
                <strong>กรุณากรอกข้อมูลที่จำเป็นสำหรับการวิเคราะห์</strong>
                <span>ระบุเวลาเริ่ม Drawing, เวลาเจอ Defect, ประเภท Defect และ Record ที่เกี่ยวข้องเพื่อใช้ในการวิเคราะห์</span>
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
                <Field id="drawingStart" label="เวลาเริ่ม Drawing">
                  <TextInput form={form} id="drawingStart" type="datetime-local" onChange={updateField} />
                </Field>
                <Field id="defectTime" label="เวลาที่ตรวจพบ Defect">
                  <TextInput form={form} id="defectTime" type="datetime-local" onChange={updateField} />
                </Field>
              </div>

              <div className="two">
                <Field id="baleNo" label="Bale No. ที่พบ Defect">
                  <TextInput form={form} id="baleNo" onChange={updateField} />
                </Field>
                <Field id="testTime" label="เวลาเก็บตัวอย่าง">
                  <TextInput form={form} id="testTime" type="time" onChange={updateField} />
                </Field>
              </div>

              <div className="two">
                <Field id="defect" label="ประเภท Defect (Flat screen)">
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
                <summary>ข้อมูลเพิ่มเติม</summary>
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
                    <Field id="canUseMinutes" label="เวลาเดิน Drawing จนใช้ถังหมด (นาที)">
                      <TextInput form={form} id="canUseMinutes" type="number" min="1" onChange={updateField} />
                    </Field>
                    <Field id="blendLag" label="เผื่อช่วงคัดออกก่อน-หลังจุด defect (นาที)">
                      <TextInput form={form} id="blendLag" type="number" min="0" onChange={updateField} />
                    </Field>
                  </div>
                  <Field id="layerMinutes" label="เวลา doffing ต่อ 1 ชั้น (นาที)" help="ใช้ระบุชั้นที่สัมพันธ์กับ defect โดยไม่ต้องแยกทิศการเคลื่อนที่ของถัง">
                    <TextInput form={form} id="layerMinutes" type="number" min="0.1" onChange={updateField} />
                  </Field>
                  <div className="quick-guide">
                    <strong>Drawing condition ตอนพบ defect</strong>
                    <span>ใช้แยกว่า defect น่าจะเกิดระหว่าง Drawing หรือมีต้นทางจาก Can/Spinning</span>
                  </div>
                  <div className="two">
                    <Field id="affectedScope" label="ขอบเขตที่พบ Defect">
                      <select id="affectedScope" name="affectedScope" value={form.affectedScope} onChange={updateField}>
                        <option value="single">พบเด่นเฉพาะ Can / ตำแหน่งเดียว</option>
                        <option value="multiple">พบหลาย Can / หลายตำแหน่งเวลาใกล้กัน</option>
                        <option value="unknown">ยังไม่แน่ใจ</option>
                      </select>
                    </Field>
                    <Field id="drawingStopStart" label="มี Stop/Start หรือเปลี่ยน Setting ก่อนเจอไหม">
                      <select id="drawingStopStart" name="drawingStopStart" value={form.drawingStopStart} onChange={updateField}>
                        <option value="no">ไม่มี</option>
                        <option value="yes">มี</option>
                        <option value="unknown">ไม่ทราบ</option>
                      </select>
                    </Field>
                  </div>
                  <div className="two">
                    <Field id="drawingTension" label="Tension ใน Drawing">
                      <select id="drawingTension" name="drawingTension" value={form.drawingTension} onChange={updateField}>
                        <option value="normal">ปกติ</option>
                        <option value="swing">แกว่ง / peak ผิดปกติ</option>
                        <option value="unknown">ไม่ทราบ</option>
                      </select>
                    </Field>
                    <Field id="drawingGuide" label="Guide / Tow path">
                      <select id="drawingGuide" name="drawingGuide" value={form.drawingGuide} onChange={updateField}>
                        <option value="normal">ปกติ</option>
                        <option value="abnormal">ผิดปกติ / เส้นสะดุด</option>
                        <option value="unknown">ไม่ทราบ</option>
                      </select>
                    </Field>
                  </div>
                  <div className="two">
                    <Field id="drawingRoller" label="Roller / Speed ratio">
                      <select id="drawingRoller" name="drawingRoller" value={form.drawingRoller} onChange={updateField}>
                        <option value="normal">ปกติ</option>
                        <option value="abnormal">ผิดปกติ</option>
                        <option value="unknown">ไม่ทราบ</option>
                      </select>
                    </Field>
                    <Field id="drawingCutter" label="Cutter / Feed ก่อนตัด">
                      <select id="drawingCutter" name="drawingCutter" value={form.drawingCutter} onChange={updateField}>
                        <option value="normal">ปกติ</option>
                        <option value="abnormal">ผิดปกติ</option>
                        <option value="unknown">ไม่ทราบ</option>
                      </select>
                    </Field>
                  </div>
                  <Field id="drawingNote" label="Drawing note">
                    <TextArea form={form} id="drawingNote" onChange={updateField} />
                  </Field>
                  <Field id="cans" label="รายการ Can จาก Spinning ตามลำดับที่นำเข้า Drawing" help="รูปแบบต่อบรรทัด: Can No, เวลาเริ่ม Spinning, เวลาจบ Spinning, หมายเหตุ">
                    <TextArea form={form} id="cans" onChange={updateField} />
                  </Field>
                </div>
              </details>

              <details className="advanced">
                <summary>Record ที่เกี่ยวข้อง</summary>
                <div className="advanced-body">
                  <Field id="doffingRows" label="Doffing Record rows" help="Format: No, Day, Time, Can, Can No., Position, Grade, Doff time, Fluff check, Sign, Remark">
                    <TextArea form={form} id="doffingRows" onChange={updateField} />
                  </Field>

                  <Field id="fsRows" label="FS Oil Dispersion / Flat screen rows" help="Format: No, Bale No., Time, Bundle, Twist, Tangle, Defect, Long filament, Remark">
                    <TextArea form={form} id="fsRows" onChange={updateField} />
                  </Field>

                  <Field id="note" label="บันทึกจาก Flat screen / หน้างาน">
                    <TextArea form={form} id="note" onChange={updateField} />
                  </Field>
                </div>
              </details>

              <button className="btn" type="submit">
                วิเคราะห์ย้อนกลับ
              </button>
            </form>
          </section>

          <section className={`results ${activeView === "input" ? "page-hidden" : ""}`}>
            <section className={`decision-grid ${activeView !== "trace" ? "page-hidden" : ""}`} aria-label="ผลสรุป">
              <div className="decision-card">
                <span>ระดับความมั่นใจของผลวิเคราะห์</span>
                <b>{result.confidence}%</b>
                <small>{result.risk}</small>
              </div>
              <div className="decision-card">
                <span>Can ที่เกี่ยวข้องหลัก</span>
                <b>{primary ? primary.id : "-"}</b>
                <small>{primary ? `คะแนนความเกี่ยวข้อง ${primary.score}%` : "ยังไม่มีข้อมูล"}</small>
              </div>
              <div className="decision-card">
                <span>ตำแหน่งของเส้นใยใน Can</span>
                <b>{primary ? formatPercent(primary.positionFromTopPct) : "-"}</b>
                <small>จากปากถังลงไป</small>
              </div>
              <div className="decision-card">
                <span>ชั้นของเส้นใย</span>
                <b>{primary ? `${primary.doffingLayer}/${primary.layerCount}` : "-"}</b>
                <small>Doffing จากล่างขึ้นบน</small>
              </div>
            </section>

            <section className={`panel ${activeView !== "origin" ? "page-hidden" : ""}`}>
              <div className="head">
                <h3>สรุปแหล่งที่มาของความผิดปกติ</h3>
                <span className="tag">{result.origin.likelyOrigin}</span>
              </div>
              <div className="origin-grid">
                <article className="origin-card">
                  <div className="cause-top">
                    <h4>Spinning / Can risk</h4>
                    <div className="bar">
                      <i style={{ width: `${result.origin.spinningRisk}%` }} />
                    </div>
                  </div>
                  <p>{result.origin.spinningRisk}% | {result.origin.spinningReasons.join(" / ") || "ยังไม่มีสัญญาณเด่นจาก Can หรือ Doffing record"}</p>
                </article>
                <article className="origin-card">
                  <div className="cause-top">
                    <h4>Drawing risk</h4>
                    <div className="bar">
                      <i style={{ width: `${result.origin.drawingRisk}%` }} />
                    </div>
                  </div>
                  <p>{result.origin.drawingRisk}% | {result.origin.drawingReasons.join(" / ") || "ยังไม่มีสัญญาณเด่นจาก Drawing condition"}</p>
                </article>
                <article className="origin-card wide">
                  <div className="cause-top">
                    <h4>จุดที่ควรตรวจสอบเป็นลำดับแรก</h4>
                    <span className="tag warn">Priority</span>
                  </div>
                  <p>{result.origin.firstCheck}</p>
                </article>
              </div>
            </section>

            <section className={`panel ${activeView !== "trace" ? "page-hidden" : ""}`} id="trace">
              <div className="head">
                <h3>รายละเอียดเพิ่มเติม</h3>
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
                        <span>ช่วงเวลา Drawing: {formatTime(can.useStart)} - {formatTime(can.useEnd)}</span>
                        <span>ช่วงเวลา Spinning: {formatTime(can.spinStart)} - {formatTime(can.spinEnd)}</span>
                        <span>ตำแหน่งของเส้นใยใน Can: {formatPercent(can.positionFromTopPct)}</span>
                        <span>ชั้นจากด้านบน: {can.topLayer}/{can.layerCount}</span>
                        <span>ชั้นจากด้านล่าง: {can.doffingLayer}/{can.layerCount}</span>
                        <span>เวลาของชั้น: {formatTime(can.spinSectionStart)} - {formatTime(can.spinSectionEnd)}</span>
                        <span>Position: {can.position || "-"}</span>
                        <span>Grade: {can.grade || "-"}</span>
                        <span>Fluff: {can.fluff || "-"}</span>
                        <span>คะแนนความเป็นไปได้ {can.score}%</span>
                      </div>
                      <p>
                        แนะนำให้คัดแยกเส้นใยช่วงจากปากถัง {formatPercent(can.removeTopStartPct)} - {formatPercent(can.removeTopEndPct)}
                        {" "}และตรวจสอบยืนยันก่อนนำเส้นใยส่วนที่เหลือไปใช้งาน | {can.note}
                      </p>
                    </article>
                  ))
                ) : (
                  <p className="help">ยังไม่มีข้อมูล Can</p>
                )}
              </div>
            </section>

            <section className={`panel ${activeView !== "origin" ? "page-hidden" : ""}`}>
              <div className="head">
                <h3>รายการสาเหตุที่ควรตรวจสอบเพิ่มเติม</h3>
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

        <section className={`panel ${activeView !== "timeline" ? "page-hidden" : ""}`} id="timeline">
          <div className="head">
            <h3>ลำดับการตรวจสอบหลังพบความผิดปกติ</h3>
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

        <section className={`panel matrix ${activeView !== "matrix" ? "page-hidden" : ""}`} id="matrix">
          <div className="head">
            <h3>ตารางอ้างอิง Defect และแนวทางการตรวจสอบ</h3>
            <span className="tag">Flat screen reference</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Defect</th>
                <th>ลักษณะ</th>
                <th>จุดที่ควรตรวจสอบย้อนหลัง</th>
                <th>หลักฐานประกอบการตรวจสอบ</th>
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
