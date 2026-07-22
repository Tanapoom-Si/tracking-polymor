"use client";

import { useEffect, useMemo, useState } from "react";

const defaultForm = {
  brand: "",
  lot: "",
  smNo: "",
  creelNo: "",
  dfNo: "",
  doffTimeHeader: "",
  totalTowCan: "",
  operationPosition: "",
  totalSpNo: "",
  minMaxSps: "",
  polymerFeed: "",
  actualSpinneret: "",
  defect: "",
  severity: "medium",
  drawingLine: "",
  spinningLine: "",
  baleNo: "",
  testTime: "",
  productionDate: "",
  drawingStart: "",
  canStart: "",
  doffingStart: "",
  defectOffsetMinutes: "",
  defectTime: "",
  defectDurationMinutes: "",
  defectEndTime: "",
  currentCanNo: "",
  canSequence: "",
  canUseMinutes: "",
  blendLag: "",
  layerMinutes: "",
  drawLayerMinutes: "",
  affectedScope: "single",
  drawingStopStart: "no",
  drawingTension: "normal",
  drawingGuide: "normal",
  drawingRoller: "normal",
  drawingCutter: "normal",
  drawingNote: "",
  doffingRows: "",
  cans: "",
  fsRows: "",
  note: ""
};

const defaultDoffingDraft = {
  canNo: "",
  startedAt: "",
  endedAt: "",
  day: "",
  time: "",
  position: "",
  remark: ""
};

const brandPresets = [
  { brand: "SD 3.0 x 5 N(C)", baleNo: "1", drawingLine: "1KN", spinningLine: "SM-62", testTime: "08:10", productionDate: "2026-06-25" },
  { brand: "SD 0.5 x 5 N(E)", baleNo: "106", drawingLine: "4KN", spinningLine: "SM-4", testTime: "09:48", productionDate: "2026-06-22" },
  { brand: "SD 1.1 x 5 NU(E)", baleNo: "73", drawingLine: "5KN", spinningLine: "SM-5", testTime: "08:49", productionDate: "2026-06-22" },
  { brand: "SD 1.1 x 5 NU(E)T", baleNo: "81", drawingLine: "5KN", spinningLine: "SM-5", testTime: "10:08", productionDate: "2026-06-25" },
  { brand: "SDJC 1.5 x 5 N(E)", baleNo: "105", drawingLine: "6KN", spinningLine: "SM-62", testTime: "10:07", productionDate: "2026-06-22" },
  { brand: "SDJC 2.0 x 5 N(E)", baleNo: "213", drawingLine: "6KN", spinningLine: "SM-62", testTime: "15:44", productionDate: "2026-06-28" },
  { brand: "SD 1.1 x 5 NUK(C)", baleNo: "1", drawingLine: "7KN", spinningLine: "SM-5", testTime: "15:08", productionDate: "2026-06-23" }
];
const brandExamples = brandPresets.map((preset) => preset.brand);
const customBrandStorageKey = "trace-fiber-custom-brands";
const customBrandEventName = "trace-fiber-custom-brands-change";

function getCustomBrandSnapshot() {
  if (typeof window === "undefined") return "[]";
  return window.localStorage.getItem(customBrandStorageKey) || "[]";
}

function subscribeToCustomBrands(onStoreChange) {
  if (typeof window === "undefined") return () => {};
  const handleStorage = (event) => {
    if (!event.key || event.key === customBrandStorageKey) onStoreChange();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(customBrandEventName, onStoreChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(customBrandEventName, onStoreChange);
  };
}

function normalizeBrandName(value) {
  return (value || "")
    .toUpperCase()
    .replace(/[×＊*]/g, "X")
    .replace(/\s+/g, "")
    .replace(/X/g, "X")
    .replace(/([A-Z])\(/g, "$1(")
    .trim();
}

function findBrandPreset(value) {
  const normalized = normalizeBrandName(value);
  return brandPresets.find((item) => normalizeBrandName(item.brand) === normalized);
}

const spinningMachineOptions = ["SM-31", "SM-32", "SM-4", "SM-5", "SM-61", "SM-62"];
const drawingMachineOptions = ["1KN", "3KS", "4KS", "4KN", "5KS", "5KN", "6KS", "6KN", "7KN"];
const drawingToSpinningMap = {
  "1KN": "SM-62",
  "3KS": "SM-32",
  "4KS": "SM-4",
  "4KN": "SM-4",
  "5KS": "SM-5",
  "5KN": "SM-5",
  "6KS": "SM-61",
  "6KN": "SM-62",
  "7KN": "SM-32"
};

const defectProfiles = {
  bundle: {
    label: "Bundle",
    firstCheck: "Can + Tow tension",
    causes: [
      ["Finish Oil เคลือบเส้นใยไม่สม่ำเสมอ", "ตรวจสอบระบบ Finish Oil / Oiling, ค่า Oil pickup และจุดที่เส้นใยเริ่มจับตัวเป็นกลุ่ม", 92],
      ["เกิดไฟฟ้าสถิตระหว่างกระบวนการผลิต", "ตรวจสอบความชื้น, การ Grounding, สภาพเส้นใยก่อนเข้า Drawing และจุดที่เส้นใยเริ่มติดกัน", 86],
      ["กลุ่มเส้นใยจับตัวแข็งและแยกออกจากกันไม่สมบูรณ์", "ตรวจสภาพ Can, Tow tension, Guide และช่วงเวลาที่พบ Bundle จาก Flat screen", 78]
    ]
  },
  twist: {
    label: "Twist",
    firstCheck: "Tow path",
    causes: [
      ["Long yarn contaminate จากแรงเสียดทานสูง", "ตรวจคราบ Oil scrum / สิ่งติดตาม Yarn path และจุดที่ Tow สัมผัสกับ Roller หรือ Guide", 90],
      ["รอยสึกของ Roller หรือ Guide ทำให้เส้นใยขาด/บิด", "ตรวจสภาพผิว Roller, Guide alignment และเส้นทางจาก Can เข้า Drawing", 82],
      ["เส้นใยบิดรวมกันจน QC แยกออกจากกันไม่ได้", "ตรวจรูป Flat screen, Yarn path และ Log การร้อยเส้นก่อนพบ Twist", 74]
    ]
  },
  tangle: {
    label: "Tangle",
    firstCheck: "Can condition",
    causes: [
      ["OPU ต่ำ ทำให้เส้นใยกระจายตัวในน้ำมันไม่ดี", "ตรวจค่า Oil concentration, Oil pickup และการควบคุม Finish Oil ตามรอบที่กำหนด", 91],
      ["อุปกรณ์ Finished Oil หรือระบบเคลือบน้ำมันทำงานไม่สม่ำเสมอ", "ตรวจอุปกรณ์ Finished Oil และบันทึกการปรับ Oil conc. ก่อนพบ Tangle", 84],
      ["Oil scrum / คราบสะสมบน Yarn path ทำให้เกิด friction low", "ตรวจ Yarn path, Roller, Guide และสภาพเส้นที่พันกันจาก Flat screen", 76]
    ]
  },
  defect: {
    label: "Defect",
    firstCheck: "Twist / Tangle",
    causes: [
      ["ห้องทดสอบรวมค่า Twist และ Tangle เป็น Defect", "ตรวจรูป Flat screen เพื่อแยกว่าใกล้เคียง Twist หรือ Tangle มากกว่า แล้วจึงย้อนดู Yarn path / Oil / Can", 88],
      ["เส้นใยบิด พัน หรือจับตัวผิดปกติจาก Yarn path", "ตรวจ Roller, Guide, Yarn path, Oil scrum และ Log การร้อยเส้นก่อนพบ Defect", 80],
      ["เส้นใยกระจายตัวไม่ดีจาก OPU หรือ Finished Oil", "ตรวจ Oil conc., Oil pickup, อุปกรณ์ Finished Oil และสภาพเส้นที่ออกจาก Can", 76]
    ]
  },
  long: {
    label: "Long Filament",
    firstCheck: "Cutter",
    causes: [
      ["เส้นใยขาดหรือสะสมบริเวณ Rotor / Yarn path", "ตรวจจุดสะสมของ Long yarn contaminant บริเวณ Rotor, Yarn path และ Set tow", 94],
      ["เส้นใยหลุดเข้า Rotor พร้อมกับ set tow", "ตรวจรอบการทำความสะอาด, ภาพหน้างาน และช่วงเวลาที่เกิดการสะสมก่อนเข้า Cutter", 86],
      ["Cutter / ใบมีด หรือการป้อน Tow ทำให้ความยาวเกินมาตรฐาน", "ตรวจ Cutter blade, Clearance, Tow feeding และการตรวจ Spider net ตามรอบ", 78]
    ]
  }
};

const defectMatrix = [
  ["Bundle", "กลุ่มเส้นใยจับตัวรวมกัน มีลักษณะแข็ง ติดกัน หรือไม่สามารถแยกออกจากกันได้สมบูรณ์", "ตรวจสอบการจ่าย Finish Oil / Oiling, ค่า Oil Pickup, ไฟฟ้าสถิต, Tow Tension และสภาพ Can", "บันทึก Finish Oil / Oiling, ค่า Oil Pickup, ค่าความชื้น, ค่าไฟฟ้าสถิต, ภาพ Flat Screen และช่วงเวลาที่พบเส้นใยผิดปกติ"],
  ["Twist", "เส้นใยบิดหรือพันรวมกันเป็นก้อน อาจแยกออกจากกันไม่ได้", "ตรวจสอบ Yarn Path, Roller, Guide Alignment, คราบ Oil Scrum และจุดเสียดสีบริเวณ Roller / Guide", "บันทึกการร้อยเส้น, สภาพ Roller / Guide, ภาพเส้นใยก่อนเข้า Cutter และภาพจาก Flat Screen"],
  ["Tangle", "เส้นใยพันกันหรือกระจายตัวไม่สม่ำเสมอ แต่ในบางกรณี QC ยังสามารถแยกเส้นใยออกจากกันได้", "ตรวจสอบค่า OPU, Oil Concentration, การทำงานของ Finished Oil, Yarn Path และแรงเสียดสีของเส้นใย", "ค่า Oil Concentration, ค่า Oil Pickup, สภาพอุปกรณ์ Finished Oil, ภาพ Yarn Path, หมายเหตุจากผู้ปฏิบัติงาน และภาพ Flat Screen"],
  ["Long Filament", "เส้นใยยาวเกินมาตรฐาน หรือพบเส้นใยยาวปะปนกับเส้นใยปกติ", "ตรวจสอบเส้นใยขาด/สะสมบริเวณ Rotor หรือ Yarn Path, Set Tow, Cutter Blade, Cutter Clearance และ Tow Feeding", "บันทึกการตรวจ Rotor / Yarn Path, รอบการทำความสะอาด Spider Net, ผลตรวจ Cutter, ความยาวตัวอย่าง และภาพเปรียบเทียบความยาวเส้นใย"]
];

function parseDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toDateTimeLocalValue(date) {
  if (!date || Number.isNaN(date.getTime())) return "";
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
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

function formatRemovalRange(startPct, endPct) {
  const start = Math.round(Number(startPct) || 0);
  const end = Math.round(Number(endPct) || 0);
  if (start === end) return `ประมาณ ${start}% จากปากถัง`;
  return `ประมาณ ${start}% - ${end}% จากปากถัง`;
}

function formatCanLabel(value) {
  const clean = String(value || "").trim();
  if (!clean) return "";
  const withoutPrefix = clean.replace(/^can[\s:-]*/i, "").trim();
  return withoutPrefix ? `Can ${withoutPrefix}` : "Can";
}

function formatMinutesValue(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "-";
  return Number.isInteger(numberValue) ? `${numberValue}` : `${numberValue.toFixed(1)}`;
}

function hasTraceableCanData(can) {
  return Boolean(can && can.spinStart && can.spinEnd);
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
        const canLabel = parts[4] || parts[3] || parts[0] || `${index + 1}`;
        return {
          index,
          id: formatCanLabel(canLabel),
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
    drawingReasons.push(`ชนิด Defect นี้ควรตรวจ ${profile.firstCheck} ใน Drawing ร่วมด้วย`);
  }

  if (profile.firstCheck.includes("Can") || profile.firstCheck.includes("Spinning")) {
    spinningScore += 10;
    spinningReasons.push(`ชนิด Defect นี้สัมพันธ์กับ ${profile.firstCheck}`);
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

function getCanSections(cans, drawingStart, defectTime, canUseMinutes, blendLag, layerMinutes, drawLayerMinutes) {
  const elapsed = Math.max(0, preciseMinutesBetween(drawingStart, defectTime));

  return cans.map((can, index) => {
    const fallbackDoffMinutes = can.spinStart && can.spinEnd ? preciseMinutesBetween(can.spinStart, can.spinEnd) : layerMinutes;
    const doffMinutes = Math.max(1, Number(can.doffMinutes) || fallbackDoffMinutes || layerMinutes);
    const layerCount = Math.max(1, Math.ceil(doffMinutes / layerMinutes));
    const effectiveCanUseMinutes = Math.max(canUseMinutes, layerCount * drawLayerMinutes);
    const consumedRatio = clamp(elapsed / effectiveCanUseMinutes, 0, 1);
    const removeTopStartPct = clamp(((elapsed - blendLag) / effectiveCanUseMinutes) * 100, 0, 100);
    const removeTopEndPct = clamp(((elapsed + blendLag) / effectiveCanUseMinutes) * 100, 0, 100);
    const topLayer = clamp(Math.floor(elapsed / drawLayerMinutes) + 1, 1, layerCount);
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
      useEnd: new Date(drawingStart.getTime() + effectiveCanUseMinutes * 60000),
      elapsed,
      effectiveCanUseMinutes,
      drawLayerMinutes,
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

function getDoffingLookupWindow(data, elapsed, layerMinutes, drawLayerMinutes, blendLag, elapsedEnd = elapsed) {
  const hasLookupInputs = Boolean((data.canStart || data.drawingStart) && data.defectTime && data.drawLayerMinutes && data.layerMinutes);
  if (!hasLookupInputs) return null;

  const doffTotal = Number(data.doffTimeHeader) || 0;
  const elapsedMinutes = Math.max(0, elapsed);
  const elapsedEndMinutes = Math.max(elapsedMinutes, elapsedEnd);
  const rawLayersFromTop = Math.max(1, Math.ceil(elapsedMinutes / drawLayerMinutes));
  const rawLayerEndFromTop = Math.max(rawLayersFromTop, Math.ceil(elapsedEndMinutes / drawLayerMinutes));
  const totalLayers = doffTotal ? Math.max(1, Math.ceil(doffTotal / layerMinutes)) : null;
  const canOffset = totalLayers ? Math.floor((rawLayersFromTop - 1) / totalLayers) : 0;
  const canEndOffset = totalLayers ? Math.floor((rawLayerEndFromTop - 1) / totalLayers) : 0;
  const exceedsOneCan = totalLayers ? canOffset > 0 || canEndOffset > 0 : false;
  const layersFromTop = totalLayers ? ((rawLayersFromTop - 1) % totalLayers) + 1 : rawLayersFromTop;
  const layerEndFromTop = totalLayers ? ((rawLayerEndFromTop - 1) % totalLayers) + 1 : rawLayerEndFromTop;
  const drawingLayerStart = (rawLayersFromTop - 1) * drawLayerMinutes;
  const drawingLayerEnd = rawLayerEndFromTop * drawLayerMinutes;
  const doffingLayerFromBottom = totalLayers ? Math.max(1, totalLayers - layersFromTop + 1) : null;
  const doffingLayerEndFromBottom = totalLayers ? Math.max(1, totalLayers - layerEndFromTop + 1) : null;
  const targetMinuteStart = doffingLayerFromBottom && doffingLayerEndFromBottom ? (Math.min(doffingLayerFromBottom, doffingLayerEndFromBottom) - 1) * layerMinutes : null;
  const targetMinuteEnd = doffingLayerFromBottom && doffingLayerEndFromBottom ? Math.min(doffTotal, Math.max(doffingLayerFromBottom, doffingLayerEndFromBottom) * layerMinutes) : null;
  const bufferLayers = blendLag > 0 ? Math.ceil(blendLag / drawLayerMinutes) : 1;
  const reviewTopStart = Math.max(1, layersFromTop - bufferLayers);
  const reviewTopEnd = totalLayers ? Math.min(totalLayers, Math.max(layersFromTop, layerEndFromTop) + bufferLayers) : layerEndFromTop + bufferLayers;
  const reviewBottomStart = totalLayers ? Math.max(1, totalLayers - reviewTopEnd + 1) : null;
  const reviewBottomEnd = totalLayers ? Math.min(totalLayers, totalLayers - reviewTopStart + 1) : null;
  const sheetMinuteStart = reviewBottomStart ? Math.max(0, (reviewBottomStart - 1) * layerMinutes) : null;
  const sheetMinuteEnd = reviewBottomEnd ? Math.min(doffTotal, reviewBottomEnd * layerMinutes) : null;
  const minutesFromDoffingEnd = Math.max(layerMinutes, layersFromTop * layerMinutes);
  const quickSheetMinuteStart = doffTotal ? Math.max(0, doffTotal - rawLayerEndFromTop * layerMinutes) : null;
  const quickSheetMinuteEnd = doffTotal || null;
  const quickMinutesBeforeEnd = rawLayerEndFromTop * layerMinutes;
  const doffingStart = parseDate(data.doffingStart);
  const cctvStart = doffingStart && quickSheetMinuteStart !== null ? new Date(doffingStart.getTime() + quickSheetMinuteStart * 60000) : null;
  const cctvEnd = doffingStart && quickSheetMinuteEnd !== null ? new Date(doffingStart.getTime() + quickSheetMinuteEnd * 60000) : null;
  const recordCanList = parseCans((data.doffingRows || "").trim() ? data.doffingRows : data.cans || "")
    .map((can) => can.id)
    .filter(Boolean);
  const suggestedCan = recordCanList[canOffset] || "";

  return {
    elapsedMinutes,
    elapsedEndMinutes,
    rawLayersFromTop,
    rawLayerEndFromTop,
    layersFromTop,
    layerEndFromTop,
    totalLayers,
    canOffset,
    canEndOffset,
    suggestedCan,
    exceedsOneCan,
    drawingLayerStart,
    drawingLayerEnd,
    doffingLayerFromBottom,
    targetMinuteStart,
    targetMinuteEnd,
    bufferLayers,
    reviewTopStart,
    reviewTopEnd,
    minutesFromDoffingEnd,
    quickSheetMinuteStart,
    quickSheetMinuteEnd,
    quickMinutesBeforeEnd,
    cctvStart,
    cctvEnd,
    sheetMinuteStart,
    sheetMinuteEnd
  };
}

function analyze(data) {
  const fallbackDate = new Date();
  const drawingStart = parseDate(data.drawingStart) || fallbackDate;
  const canStart = parseDate(data.canStart) || drawingStart;
  const defectTime = parseDate(data.defectTime) || drawingStart;
  const defectEndTime = parseDate(data.defectEndTime) || defectTime;
  const canUseMinutes = Math.max(1, Number(data.canUseMinutes) || 1);
  const blendLag = Math.max(0, Number(data.blendLag) || 0);
  const layerMinutes = Math.max(0.1, Number(data.layerMinutes) || 1);
  const drawLayerMinutes = Math.max(0.1, Number(data.drawLayerMinutes) || canUseMinutes);
  const activeFsRow = getActiveFsRow(data);
  const sourceRows = (data.doffingRows || "").trim() ? data.doffingRows : data.cans;
  const parsedCans = parseCans(sourceRows || "");
  const hasCanRows = parsedCans.length > 0;
  const cans = getCanSections(parsedCans, drawingStart, defectTime, canUseMinutes, blendLag, layerMinutes, drawLayerMinutes);
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
  const doffingLookup = getDoffingLookupWindow(
    data,
    preciseMinutesBetween(canStart, defectTime),
    layerMinutes,
    drawLayerMinutes,
    blendLag,
    preciseMinutesBetween(canStart, defectEndTime)
  );

  const canDataReady = hasTraceableCanData(primary);
  const traceStatus = canDataReady
    ? "ready"
    : hasCanRows ? "partial" : "missing";
  const traceMessage = canDataReady
    ? "ระบุ Can และช่วงเวลา Spinning ได้"
    : hasCanRows
      ? "พบข้อมูล Can บางส่วน แต่ยังขาดเวลาเริ่ม/จบ Spinning ที่ใช้ย้อนชั้นในถัง"
      : "";

  return {
    drawingStart,
    canStart,
    defectTime,
    defectEndTime,
    elapsed,
    profile,
    traced,
    primary,
    confidence,
    risk,
    activeFsRow,
    canUseMinutes,
    layerMinutes,
    drawLayerMinutes,
    origin,
    doffingLookup,
    canDataReady,
    traceStatus,
    traceMessage
  };
}

function fieldIconType(id) {
  if (["brand", "baleNo", "productionDate", "testTime"].includes(id)) return "tag";
  if (["drawingLine", "spinningLine", "smNo", "creelNo", "dfNo"].includes(id)) return "machine";
  if (["drawingStart", "canStart", "doffingStart", "defectTime", "defectEndTime"].includes(id)) return "clock";
  if (["defectOffsetMinutes", "defectDurationMinutes", "drawLayerMinutes", "layerMinutes", "doffTimeHeader", "canUseMinutes", "blendLag"].includes(id)) return "timer";
  if (["currentCanNo", "canSequence", "totalTowCan", "cans", "doffingRows"].includes(id)) return "can";
  if (["defect", "note", "fsRows", "drawingNote"].includes(id)) return "inspect";
  if (["drawingStopStart", "drawingTension", "drawingGuide", "drawingRoller", "drawingCutter"].includes(id)) return "condition";
  return "field";
}

function FieldIcon({ type }) {
  const paths = {
    tag: (
      <>
        <path d="M4 6.5V11c0 .6.2 1.1.6 1.5l6.9 6.9a2 2 0 0 0 2.8 0l5.1-5.1a2 2 0 0 0 0-2.8L12.5 4.6A2.1 2.1 0 0 0 11 4H6.5A2.5 2.5 0 0 0 4 6.5Z" />
        <path d="M8 8h.01" />
      </>
    ),
    machine: (
      <>
        <path d="M4 17h16" />
        <path d="M6 17V8h12v9" />
        <path d="M8 8V5h8v3" />
        <path d="M8 12h2m4 0h2" />
      </>
    ),
    clock: (
      <>
        <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    timer: (
      <>
        <path d="M10 3h4" />
        <path d="M12 14l3-3" />
        <path d="M12 21a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z" />
      </>
    ),
    can: (
      <>
        <path d="M5 7c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3Z" />
        <path d="M5 7v10c0 1.7 3.1 3 7 3s7-1.3 7-3V7" />
        <path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" />
      </>
    ),
    inspect: (
      <>
        <path d="M10.5 18a7.5 7.5 0 1 1 5.3-2.2L20 20" />
        <path d="M8 10h5" />
        <path d="M8 13h3" />
      </>
    ),
    condition: (
      <>
        <path d="M4 7h10" />
        <path d="M18 7h2" />
        <path d="M4 17h2" />
        <path d="M10 17h10" />
        <path d="M14 7a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z" />
        <path d="M6 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z" />
      </>
    ),
    field: (
      <>
        <path d="M5 5h14v14H5z" />
        <path d="M8 9h8M8 13h5" />
      </>
    )
  };

  return (
    <span className="field-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">{paths[type] || paths.field}</svg>
    </span>
  );
}

function Field({ id, label, children, help }) {
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        <FieldIcon type={fieldIconType(id)} />
        <span>{label}</span>
      </label>
      {children}
      {help ? <p className="help">{help}</p> : null}
    </div>
  );
}

function TextInput({ form, id, onChange, type = "text", min, step, placeholder, required = false, list }) {
  const isDateLike = ["date", "time", "datetime-local"].includes(type);
  return <input id={id} name={id} type={type} min={min} step={step} placeholder={placeholder} value={form[id]} onChange={onChange} required={required} list={list} data-empty={isDateLike && !form[id] ? "true" : undefined} />;
}

function TextArea({ form, id, onChange }) {
  return <textarea id={id} name={id} value={form[id]} onChange={onChange} />;
}

export default function HomePage() {
  const [form, setForm] = useState(defaultForm);
  const [doffingDraft, setDoffingDraft] = useState(defaultDoffingDraft);
  const [traceMode, setTraceMode] = useState("quick");
  const [activeView, setActiveView] = useState("home");
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [customBrandSnapshot, setCustomBrandSnapshot] = useState("[]");
  const quickMode = traceMode === "quick";
  const analysisForm = useMemo(() => ({
    ...form,
    canStart: "",
    ...(quickMode ? { canSequence: "", currentCanNo: "" } : {})
  }), [form, quickMode]);
  const result = useMemo(() => analyze(analysisForm), [analysisForm]);
  const primary = result.primary;
  const canReady = result.canDataReady;
  const confidenceClass = result.confidence >= 80 ? "high" : result.confidence < 55 ? "low" : "";
  const pageHeading = {
    input: ["บันทึกข้อมูล", "เลือกฟังก์ชันและกรอกข้อมูลที่จำเป็นสำหรับการวิเคราะห์"],
    overview: ["ผลการวิเคราะห์", quickMode ? "" : ""],
    origin: ["วิเคราะห์สาเหตุ", ""],
    timeline: ["ลำดับการตรวจสอบ", ""],
    matrix: ["คู่มืออ้างอิง"]
  };
  const showLayout = ["input", "overview", "origin"].includes(activeView);
  useEffect(() => {
    const syncCustomBrands = () => setCustomBrandSnapshot(getCustomBrandSnapshot());
    syncCustomBrands();
    return subscribeToCustomBrands(syncCustomBrands);
  }, []);

  const brandOptions = useMemo(() => {
    try {
      const saved = JSON.parse(customBrandSnapshot);
      return Array.from(new Set([...brandExamples, ...saved.filter(Boolean)]));
    } catch {
      return brandExamples;
    }
  }, [customBrandSnapshot]);
  const originReason = result.origin.drawingRisk >= result.origin.spinningRisk
    ? result.origin.drawingReasons[0] || "ข้อมูล Drawing มีน้ำหนักมากกว่าหรือใกล้เคียงกับฝั่ง Can"
    : result.origin.spinningReasons[0] || "ข้อมูล Can และ Doffing มีน้ำหนักมากกว่าฝั่ง Drawing";
  const firstAction = result.origin.likelyOrigin === "Drawing"
    ? "ตรวจ Drawing ก่อน"
    : result.origin.likelyOrigin === "Spinning / Can"
      ? "เริ่มตรวจสอบที่ Spinning (Can)"
      : "ตรวจ Drawing และ Can พร้อมกัน";
  const showTracePosition = activeView === "overview" && !quickMode;
  const doffingLookupText = result.doffingLookup
    ? result.doffingLookup.exceedsOneCan
      ? quickMode
        ? `เวลา Drawing ที่กรอกเทียบได้ ${result.doffingLookup.rawLayersFromTop} ชั้น ซึ่งเกินจำนวนชั้นของใบ Doffing หนึ่งถัง ให้ตรวจใบถัดไปหรือเช็กเวลาเริ่ม Drawing อีกครั้ง`
        : `เวลา Drawing ที่กรอกเทียบได้ ${result.doffingLookup.rawLayersFromTop} ชั้น เกินถังแรกและควรตรวจ ${result.doffingLookup.suggestedCan || `Can ลำดับที่ ${result.doffingLookup.canOffset + 1}`} ถ้าลำดับ Can ไม่ตรง ให้เช็กเวลาเริ่ม Drawing อีกครั้ง`
      : result.doffingLookup.quickSheetMinuteStart !== null
      ? `เปิดใบ Doffing ช่วงท้ายประมาณนาทีที่ ${formatMinutesValue(result.doffingLookup.quickSheetMinuteStart)} - ${formatMinutesValue(result.doffingLookup.quickSheetMinuteEnd)} จากเวลาเริ่ม Doffing หรือย้อนจากเวลาครบ Doff ไปประมาณ ${formatMinutesValue(result.doffingLookup.quickMinutesBeforeEnd)} นาที`
      : `เปิดใบ Doffing ช่วงท้าย ย้อนจากเวลาจบประมาณ 0 - ${formatMinutesValue(result.doffingLookup.minutesFromDoffingEnd)} นาที`
    : "กรอกข้อมูลเพิ่มเติมเพื่อให้ระบบคำนวณช่วงเวลาที่ควรตรวจสอบ";
  const quickResultTitle = result.doffingLookup
    ? result.doffingLookup.exceedsOneCan
      ? quickMode
        ? "เกินช่วงใบ Doffing หนึ่งถัง"
        : result.doffingLookup.suggestedCan ? `ตรวจ ${result.doffingLookup.suggestedCan}` : `ตรวจ Can ลำดับที่ ${result.doffingLookup.canOffset + 1}`
      : result.doffingLookup.quickSheetMinuteStart !== null
        ? `เปิดใบ Doffing นาทีที่ ${formatMinutesValue(result.doffingLookup.quickSheetMinuteStart)} - ${formatMinutesValue(result.doffingLookup.quickSheetMinuteEnd)}`
        : "รอเวลา Doffing รวมตามใบ"
    : "กรุณากรอกข้อมูล";
  const quickCanText = result.doffingLookup?.suggestedCan || (result.doffingLookup ? `Can ลำดับที่ ${result.doffingLookup.canOffset + 1}` : "");
  const quickLayerText = result.doffingLookup
    ? result.doffingLookup.layersFromTop === result.doffingLookup.layerEndFromTop
      ? `ชั้น ${result.doffingLookup.layersFromTop}`
      : `ชั้น ${result.doffingLookup.layersFromTop}-${result.doffingLookup.layerEndFromTop}`
    : "-";
  const quickPositionText = result.doffingLookup
    ? result.doffingLookup.exceedsOneCan ? quickMode ? "เกิน 1 ถัง" : quickCanText : quickLayerText
    : "-";
  const quickSummaryPositionText = result.doffingLookup
    ? result.doffingLookup.exceedsOneCan ? quickMode ? "เกินช่วงใบ Doffing หนึ่งถัง" : quickCanText : `${quickLayerText} จากด้านบน`
    : "รอข้อมูลเวลา";
  const quickElapsedText = result.doffingLookup
    ? `หลังเริ่ม Drawing ${formatMinutesValue(result.doffingLookup.elapsedMinutes)} - ${formatMinutesValue(result.doffingLookup.elapsedEndMinutes)} นาที`
    : "กรอกเวลาเริ่ม Drawing และเวลาเก็บตัวอย่าง";
  const quickReviewWindowText = result.doffingLookup && !result.doffingLookup.exceedsOneCan && result.doffingLookup.quickSheetMinuteStart !== null
    ? `${formatMinutesValue(result.doffingLookup.quickSheetMinuteStart)} - ${formatMinutesValue(result.doffingLookup.quickSheetMinuteEnd)}`
    : result.doffingLookup?.exceedsOneCan ? "เช็ก Can ถัดไป" : "-";
  const quickCctvWindowText = result.doffingLookup?.cctvStart && result.doffingLookup?.cctvEnd
    ? `${formatTime(result.doffingLookup.cctvStart)} - ${formatTime(result.doffingLookup.cctvEnd)}`
    : "-";
  const doffingDraftStart = parseDate(doffingDraft.startedAt);
  const doffingDraftEnd = parseDate(doffingDraft.endedAt);
  const doffingDraftMinutes = doffingDraftStart && doffingDraftEnd
    ? formatMinutesValue(Math.max(0, preciseMinutesBetween(doffingDraftStart, doffingDraftEnd)))
    : "";
  const quickRecordDate = form.doffingStart ? form.doffingStart.slice(0, 10) : form.productionDate;
  const quickRecordTarget = [
    form.spinningLine || form.drawingLine ? `เครื่อง ${form.spinningLine || form.drawingLine}` : "ยังไม่ระบุเครื่อง",
    quickRecordDate ? `วันที่ ${quickRecordDate}` : "ยังไม่ระบุวันที่"
  ].join(" | ");

  function syncTimeFields(next, changedName) {
    const baseStart = parseDate(next.canStart || next.drawingStart);
    const defectStart = parseDate(next.defectTime);
    const defectEnd = parseDate(next.defectEndTime);
    const offsetMinutes = Number(next.defectOffsetMinutes);
    const durationMinutes = Number(next.defectDurationMinutes);

    if (baseStart && next.defectOffsetMinutes !== "" && Number.isFinite(offsetMinutes) && ["defectOffsetMinutes", "canStart", "drawingStart"].includes(changedName)) {
      next.defectTime = toDateTimeLocalValue(new Date(baseStart.getTime() + offsetMinutes * 60000));
    }

    const updatedDefectStart = parseDate(next.defectTime);
    if (updatedDefectStart && next.defectDurationMinutes !== "" && Number.isFinite(durationMinutes) && ["defectDurationMinutes", "defectTime", "defectOffsetMinutes", "canStart", "drawingStart"].includes(changedName)) {
      next.defectEndTime = toDateTimeLocalValue(new Date(updatedDefectStart.getTime() + durationMinutes * 60000));
    }

    if (baseStart && parseDate(next.defectTime) && changedName === "defectTime") {
      next.defectOffsetMinutes = formatMinutesValue(Math.max(0, preciseMinutesBetween(baseStart, parseDate(next.defectTime))));
    }

    if (defectStart && defectEnd && changedName === "defectEndTime") {
      next.defectDurationMinutes = formatMinutesValue(Math.max(0, preciseMinutesBetween(defectStart, defectEnd)));
    }

    return next;
  }

  function rememberBrand(value) {
    const clean = String(value || "").trim();
    if (!clean) return;
    if (brandOptions.some((item) => normalizeBrandName(item) === normalizeBrandName(clean))) return;
    try {
      const customOnly = [...brandOptions, clean].filter((item) => !brandExamples.some((preset) => normalizeBrandName(preset) === normalizeBrandName(item)));
      window.localStorage.setItem(customBrandStorageKey, JSON.stringify(customOnly));
      window.dispatchEvent(new Event(customBrandEventName));
    } catch {
      // Ignore storage errors; the brand still works for the current submission.
    }
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => {
      let next;
      if (name === "brand") {
        const preset = findBrandPreset(value);
        next = preset
          ? { ...current, brand: preset.brand, baleNo: preset.baleNo, drawingLine: preset.drawingLine, spinningLine: preset.spinningLine, testTime: preset.testTime, productionDate: preset.productionDate }
          : { ...current, brand: value };
        return syncTimeFields(next, name);
      }
      if (name === "drawingLine") {
        next = { ...current, drawingLine: value, spinningLine: value ? drawingToSpinningMap[value] || "" : "" };
        return syncTimeFields(next, name);
      }
      if (name === "doffingStart") {
        next = { ...current, doffingStart: value, productionDate: value ? value.slice(0, 10) : current.productionDate };
        return syncTimeFields(next, name);
      }
      next = { ...current, [name]: value };
      return syncTimeFields(next, name);
    });
  }

  function updateDoffingDraft(event) {
    const { name, value } = event.target;
    setDoffingDraft((current) => {
      if (name === "startedAt") {
        return {
          ...current,
          startedAt: value,
          day: value ? value.slice(0, 10) : "",
          time: value ? value.slice(11, 16) : ""
        };
      }
      return { ...current, [name]: value };
    });
  }

  function addDoffingRecord() {
    const startedAt = doffingDraft.startedAt || (doffingDraft.day && doffingDraft.time ? `${doffingDraft.day}T${doffingDraft.time}` : "");
    const day = startedAt ? startedAt.slice(0, 10) : "";
    const time = startedAt ? startedAt.slice(11, 16) : "";
    const start = parseDate(startedAt);
    const end = parseDate(doffingDraft.endedAt);
    const doffMinutes = start && end ? formatMinutesValue(Math.max(0, preciseMinutesBetween(start, end))) : "";
    if (!day || !time || !doffMinutes) return;

    const existingLines = form.doffingRows
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const rowNo = existingLines.length + 1;
    const record = [
      rowNo,
      day,
      time,
      form.spinningLine || form.drawingLine || "-",
      doffingDraft.canNo || `Can ${rowNo}`,
      doffingDraft.position || "-",
      form.brand || "-",
      doffMinutes,
      "",
      "",
      doffingDraft.remark || "ปกติ"
    ].join(", ");

    setForm((current) => ({
      ...current,
      doffingRows: current.doffingRows ? `${current.doffingRows}\n${record}` : record
    }));
    setDoffingDraft((current) => ({
      ...defaultDoffingDraft,
      startedAt: current.endedAt,
      day: current.endedAt ? current.endedAt.slice(0, 10) : day,
      time: current.endedAt ? current.endedAt.slice(11, 16) : time
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    rememberBrand(form.brand);
    setHasAnalyzed(true);
    setActiveView("overview");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goToView(view) {
    setActiveView(view);
    setMobileNavOpen(false);
  }


  const timeline = quickMode ? [
    [
      "1",
      "ระบุใบ Doffing ที่ต้องตรวจสอบ",
      `เปิดใบ Doffing ของ${form.spinningLine || form.drawingLine ||"เครื่องที่เกี่ยวข้อง"} ${form.productionDate ? `วันที่ ${form.productionDate}` : "ตามวันที่ผลิตหรือวันที่ Doffing"}`
    ],
    [
      "2",
      "ตรวจสอบช่วงเวลาที่เกี่ยวข้องในใบ Doffing",
      doffingLookupText
    ],
    [
      "3",
      "เทียบกับเวลาจริงหรือภาพจาก CCTV",
      result.doffingLookup?.cctvStart ? `ตรวจช่วงเวลา ${quickCctvWindowText}` : "หากต้องการตรวจสอบจาก CCTV ให้ใช้เวลาเริ่ม Doffing / Spinning ของ Can เป็นเวลาอ้างอิง"
    ],
    [
      "4",
      "ตรวจสอบ Remark และเหตุการณ์หน้างาน",
      "ตรวจสอบ Record, Remark จากผู้ปฏิบัติงาน, ภาพจากหน้างาน และเหตุการณ์ผิดปกติของเครื่องในช่วงเวลาที่เกี่ยวข้อง"
    ]
  ] : [
    [
      "1",
      "ยืนยันเวลาเก็บตัวอย่าง",
      `พบ ${result.profile.label} วันที่ ${formatTime(result.defectTime)} ในถุง ${form.drawingLine} หลังเริ่ม Drawing ประมาณ ${result.elapsed} นาที`
    ],
    [
      "2",
      "บันทึกข้อมูลการทำงานของ Drawing",
      `ตรวจสอบ Stop/Start, Tension, Guide, Roller และ Cutter เนื่องจากผลวิเคราะห์พบความเป็นไปได้จาก Drawing ${result.origin.drawingRisk}%`
    ],
    [
      "3",
      "ประเมินแหล่งที่มาของความผิดปกติของเส้นใย",
      `${result.origin.likelyOrigin} | Spinning/Can ${result.origin.spinningRisk}% | Drawing ${result.origin.drawingRisk}%`
    ],
    [
      "4",
      "แปลงเวลา Drawing เป็นช่วงที่ต้องตรวจในใบ Doffing",
      canReady
        ? `Drawing เดินมา ${result.elapsed} นาที เทียบกับ ${result.drawLayerMinutes} นาทีต่อชั้น จึงอยู่ประมาณชั้นที่ ${primary.topLayer} จากด้านบน และตรงกับชั้น Doffing ${primary.doffingLayer}/${primary.layerCount}`
        : doffingLookupText
    ],
    [
      "5",
      "ตรวจสอบใบ Doffing และเหตุการณ์ Spinning",
      canReady
        ? `ตรวจสอบ ${primary.id} ชั้นนี้ช่วง ${formatTime(primary.spinSectionStart)} - ${formatTime(primary.spinSectionEnd)} เทียบกับ Laydown, Tension, Wrapping และหมายเหตุหน้างาน`
        : `ตรวจสอบเครื่อง ${form.spinningLine || "Spinning machine ที่เกี่ยวข้อง"}, Can laydown, Tension/wrapping และหมายเหตุจากผู้ปฏิบัติงานในช่วงเวลาที่ระบบคำนวณได้`
    ],
    [
      "6",
      "คัดแยกเส้นใยในช่วงที่มีความเสี่ยง",
      canReady
        ? `คัดแยกเส้นใยเฉพาะบริเวณที่มีความเสี่ยง ${formatRemovalRange(primary.removeTopStartPct, primary.removeTopEndPct)} แล้วให้ QC ยืนยันก่อนใช้ส่วนที่เหลือต่อ`
        : "หากพบ Defect ต่อเนื่อง ให้ Hold เฉพาะส่วนที่สัมพันธ์กับเวลาและตำแหน่งที่พบ Defect"
    ]
  ];

  return (
    <div className="shell">
      {!mobileNavOpen ? (
        <button
          className="mobile-nav-toggle"
          type="button"
          aria-expanded={mobileNavOpen}
          aria-controls="primary-navigation"
          onClick={() => setMobileNavOpen(true)}
        >
          เมนู
        </button>
      ) : null}
      {mobileNavOpen ? <button className="mobile-nav-backdrop" type="button" aria-label="ปิดเมนู" onClick={() => setMobileNavOpen(false)} /> : null}
      <aside className={`sidebar ${mobileNavOpen ? "open" : ""}`}>
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
            <h1>TRACE FIBER</h1>
            <p>ระบบวิเคราะห์ข้อมูลย้อนกลับเพื่อระบุตำแหน่งที่เส้นใยเกิดความผิดปกติ</p>
          </div>
          <button
            className="mobile-menu-button"
            type="button"
            aria-expanded={mobileNavOpen}
            aria-controls="primary-navigation"
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            ปิด
          </button>
        </section>

        <nav id="primary-navigation" className={`nav ${mobileNavOpen ? "open" : ""}`} aria-label="เมนูหลัก">
          <button className={activeView === "home" ? "active" : ""} type="button" onClick={() => goToView("home")}>หน้าหลัก</button>
          <button className={activeView === "input" ? "active" : ""} type="button" onClick={() => goToView("input")}>บันทึกข้อมูล</button>
          <button className={activeView === "overview" ? "active" : ""} type="button" onClick={() => goToView("overview")}>วิเคราะห์ข้อมูล</button>
          {!quickMode && hasAnalyzed ? (
            <button className={activeView === "origin" ? "active" : ""} type="button" onClick={() => goToView("origin")}>วิเคราะห์สาเหตุ</button>
          ) : null}
          <button className={activeView === "timeline" ? "active" : ""} type="button" onClick={() => goToView("timeline")}>รายการตรวจสอบ</button>
          <button className={activeView === "matrix" ? "active" : ""} type="button" onClick={() => goToView("matrix")}>คู่มืออ้างอิง</button>
        </nav>

      </aside>

      <main className="main">
        {activeView !== "home" ? (
          <header className="page-heading">
            <span>{activeView === "input" ? (quickMode ? "โหมดคำนวณเวลา" : "โหมดตรวจสอบละเอียด") : "TRACE FIBER"}</span>
            <h2>{pageHeading[activeView]?.[0] || "TRACE FIBER"}</h2>
            <p>{pageHeading[activeView]?.[1] || ""}</p>
          </header>
        ) : null}

        <section className={`home-grid ${activeView !== "home" ? "page-hidden" : ""}`} aria-label="หน้าเริ่มต้น">
          <article className="home-hero">
            <div className="home-hero-content">
              <span>Short Fiber Defect Traceability</span>
              <h3>TRACE FIBER</h3>
              <p></p>
            </div>
          </article>

          <div className="home-action-grid" aria-label="ฟังก์ชันหลัก">
            <button
              className="home-card primary"
              type="button"
              onClick={() => {
                setTraceMode("quick");
                setHasAnalyzed(false);
                setActiveView("input");
              }}
            >
              <span className="home-card-top">
                <i aria-hidden="true">
                  <svg viewBox="0 0 24 24" focusable="false">
                    <path d="M12 7v5l3 2" />
                    <path d="M21 12a9 9 0 1 1-3.2-6.9" />
                    <path d="M21 4v5h-5" />
                  </svg>
                </i>
                <b>ใช้งานเร็ว</b>
              </span>
              <span className="home-card-body">
                <strong>คำนวณเวลาเพื่อตรวจสอบเบื้องต้น</strong>
                <p>ระบุเวลาเริ่ม Drawing เวลาเก็บตัวอย่าง และเวลาต่อชั้น เพื่อคำนวณใบ Doffing ที่เกี่ยวข้อง</p>
              </span>
              <small><span>เริ่มคำนวณเวลา</span><em aria-hidden="true">→</em></small>
            </button>

            <button
              className="home-card primary soft"
              type="button"
              onClick={() => {
                setTraceMode("detailed");
                setHasAnalyzed(false);
                setActiveView("input");
              }}
            >
              <span className="home-card-top">
                <i aria-hidden="true">
                  <svg viewBox="0 0 24 24" focusable="false">
                    <path d="M4 7c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Z" />
                    <path d="M4 7v10c0 1.7 3.6 3 8 3s8-1.3 8-3V7" />
                    <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
                  </svg>
                </i>
                <b>ตรวจละเอียด</b>
              </span>
              <span className="home-card-body">
                <strong>วิเคราะห์ Can / ชั้นในถัง</strong>
                <p>ใช้ข้อมูล Doffing เพื่อระบุ Can ชั้นในถัง และช่วงเวลา Spinning ที่เกี่ยวข้อง</p>
              </span>
              <small><span>เริ่มวิเคราะห์ละเอียด</span><em aria-hidden="true">→</em></small>
            </button>
          </div>
        </section>

        <section className={`summary-band ${quickMode ? "quick-summary" : ""} ${activeView !== "overview" ? "page-hidden" : ""}`} aria-label="สรุปผลสำคัญ">
          {quickMode ? (
            <>
              <article className="summary-card hero">
                <span>1. ฟังก์ชันที่ใช้</span>
                <strong>คำนวณเวลาเปิดใบ Doffing</strong>
                <p></p>
                <small></small>
              </article>
              <article className="summary-card">
                <span>2. ช่วงเวลาที่ควรตรวจสอบ</span>
                <strong>{quickResultTitle}</strong>
                <p>{doffingLookupText}</p>
                {result.doffingLookup?.cctvStart ? (
                  <small>{`${quickCctvWindowText} | ${quickRecordTarget}`}</small>
                ) : null}
              </article>
              <article className="summary-card">
                <span>3. ตำแหน่งจากเวลา Drawing</span>
                <strong>{quickSummaryPositionText}</strong>
                <p>{quickElapsedText}</p>
              </article>
            </>
          ) : (
            <>
              <article className="summary-card hero">
                <span>1. จุดเริ่มต้นการตรวจสอบ</span>
                <strong>{firstAction}</strong>
                <p>{result.origin.firstCheck}</p>
                <small>{originReason}</small>
              </article>
              <article className="summary-card">
                <span>2. Can / ชั้นที่เกี่ยวข้อง</span>
                <strong>{canReady ? `${primary.id} / ชั้น ${primary.doffingLayer}` : "รอข้อมูล Doffing Record"}</strong>
                <p>{canReady ? `เวลาชั้นนี้ ${formatTime(primary.spinSectionStart)} - ${formatTime(primary.spinSectionEnd)}` : result.traceMessage}</p>
              </article>
              <article className="summary-card">
                <span>3. ช่วงที่ควรคัดแยก</span>
                <strong>{canReady ? formatRemovalRange(primary.removeTopStartPct, primary.removeTopEndPct) : "รอข้อมูล Can"}</strong>
                <p>{canReady ? primary.id : ""}</p>
              </article>
              <article className="summary-card">
                <span>4. ความมั่นใจของผลวิเคราะห์</span>
                <strong>{canReady ? `${result.confidence}%` : "รอข้อมูล"}</strong>
                <p>{canReady ? `${result.risk} | Drawing ${result.origin.drawingRisk}% / Can ${result.origin.spinningRisk}%` : ""}</p>
              </article>
            </>
          )}
        </section>

        <section className={`layout ${showLayout ? "" : "page-hidden"} ${activeView === "input" ? "single" : "full"}`}>
          <section className={`panel pad ${activeView !== "input" ? "page-hidden" : ""}`} id="input">
            <h3>บันทึกข้อมูลเพื่อการวิเคราะห์</h3>
            <form className="form" onSubmit={handleSubmit}>
              <datalist id="brand-options">
                {brandOptions.map((brand) => <option key={brand} value={brand} />)}
              </datalist>
              <datalist id="drawing-machine-options">
                {drawingMachineOptions.map((machine) => <option key={machine} value={machine} />)}
              </datalist>
              <datalist id="spinning-machine-options">
                {spinningMachineOptions.map((machine) => <option key={machine} value={machine} />)}
              </datalist>

              <details className="advanced compact">
                <summary>ข้อมูลพื้นฐาน</summary>
                <div className="advanced-body machine-guide">
                  <div>
                    <strong>Spinning machine</strong>
                    <p>SM-31, SM-32, SM-4, SM-5, SM-61, SM-62</p>
                  </div>
                  <div>
                    <strong>Drawing machine</strong>
                    <p>3KS, 4KS, 4KN, 5KS, 5KN, 6KS, 6KN, 7KN</p>
                  </div>
                  <div>
                    <strong>Machine link</strong>
                    <p>4KN → SM-4, 5KN → SM-5, 6KN → SM-62, 6KS → SM-61, 3KS/7KN → SM-32</p>
                  </div>
                </div>
              </details>

              <section className="mode-switch" aria-label="เลือกฟังก์ชันวิเคราะห์">
                <button className={quickMode ? "active" : ""} type="button" onClick={() => setTraceMode("quick")}>
                  <strong>1. คำนวณช่วงเวลา</strong>
                  <span>วิเคราะห์ช่วงเวลาที่ควรตรวจสอบ ในกรณีที่ไม่มีข้อมูล Record และ Can no.</span>
                </button>
                <button className={!quickMode ? "active" : ""} type="button" onClick={() => setTraceMode("detailed")}>
                  <strong>2. วิเคราะห์ข้อมูล Can</strong>
                  <span>วิเคราะห์ช่วงเวลาที่ควรตรวจสอบ ในกรณีที่มีข้อมูล Spinning และ Drawing Record</span>
                </button>
              </section>

              <section className={`calc-preview ${canReady || result.doffingLookup ? "ready" : "idle"}`} aria-label="ผลคำนวณตำแหน่งเบื้องต้น">
                <div>
                  <span>{quickMode ? "ผลคำนวณช่วงเวลา" : "ผลการวิเคราะห์"}</span>
                  <strong>{canReady && !quickMode ? `${primary.id} / ชั้น Doffing ${primary.doffingLayer}` : quickMode ? quickResultTitle : result.doffingLookup ? "ช่วงใบ doffing ที่ควรตรวจ" : "กรุณากรอกข้อมูล"}</strong>
                  <p>
                    {canReady && !quickMode
                      ? `Drawing เดินมา ${result.elapsed} นาที เทียบกับ ${result.drawLayerMinutes} นาทีต่อชั้น จึงใช้เส้นใยถึงชั้นที่ ${primary.topLayer} จากด้านบน`
                      : doffingLookupText}
                  </p>
                </div>
                {quickMode ? (
                  <div className="quick-result-grid">
                    <span>
                      <b>{result.doffingLookup ? `${formatMinutesValue(result.doffingLookup.elapsedMinutes)} นาที` : "-"}</b>
                      เวลาเริ่ม Drawing
                    </span>
                    <span>
                      <b>{quickReviewWindowText}</b>
                      ช่วงเวลา Doffing
                    </span>
                    <span>
                      <b>{quickCctvWindowText}</b>
                      เวลาที่ควรตรวจสอบ
                    </span>
                    <span>
                      <b>{quickPositionText}</b>
                      ชั้นที่ใช้เทียบเวลา
                    </span>
                  </div>
                ) : (
                  <div className="calc-preview-metrics">
                    <span>
                      <b>{canReady ? `${formatPercent(primary.positionFromTopPct)}` : result.doffingLookup ? result.doffingLookup.exceedsOneCan ? "เกิน 1 ถัง" : `${result.doffingLookup.layersFromTop} ชั้น` : "-"}</b>
                      ตำแหน่งใน Can จากด้านบน
                    </span>
                    <span>
                      <b>{canReady ? `${formatTime(primary.spinSectionStart)} - ${formatTime(primary.spinSectionEnd)}` : result.doffingLookup ? result.doffingLookup.exceedsOneCan ? "ต้องดู Can ถัดไป" : `0 - ${formatMinutesValue(result.doffingLookup.minutesFromDoffingEnd)} นาที` : "-"}</b>
                      ช่วงเวลา Spinning / Doffing
                    </span>
                  </div>
                )}
              </section>

              {quickMode ? (
                <section className="form-card quick-essential">
                  <div className="form-card-head">
                    <span>01</span>
                    <div>
                      <strong>ข้อมูลสำหรับการคำนวณ</strong>
                      <p>กรุณาระบุข้อมูลที่เกี่ยวข้องกับกระบวนการผลิต เพื่อความแม่นยำในการคำนวณช่วงเวลาตรวจสอบ</p>
                    </div>
                  </div>

                  <div className="accuracy-guide compact">
                    <div>
                      <b>แม่นยำที่สุดเมื่อระบุ Can No. ที่เดินพร้อมกัน</b>
                      <span>Can จะถูกอ่านจาก Doffing record เป็นหลัก และใช้เวลาเริ่ม Drawing เป็นฐานคำนวณ</span>
                    </div>
                    <div>
                      <b>กรอกเวลาเก็บ Sample</b>
                      <span>ใส่เวลาที่พนักงานเขียนบนถุง sample ระบบจะคำนวณนาทีหลังเริ่ม Drawing ให้ในผลลัพธ์</span>
                    </div>
                    <div>
                      <b>ค่าต่อชั้นต้องมาจากหน้างาน</b>
                      <span>Drawing = นาทีที่ดึงออก 1 ชั้น, Doffing = นาทีที่เติมลงถัง 1 ชั้น</span>
                    </div>
                  </div>

                  <div className="quick-input-block">
                    <div className="quick-input-title">
                      <span className="section-index">01</span>
                      <b>ข้อมูล</b>
                    </div>
                    <div className="form-grid time-grid">
                      <Field id="brand" label="Brand / Product" help="">
                        <TextInput form={form} id="brand" onChange={updateField} list="brand-options" />
                      </Field>
                      <Field id="drawingLine" label="Drawing Machine" help="">
                        <select id="drawingLine" name="drawingLine" value={form.drawingLine} onChange={updateField}>
                          <option value=""></option>
                          {drawingMachineOptions.map((machine) => (
                            <option key={machine} value={machine}>{machine}</option>
                          ))}
                        </select>
                      </Field>
                      <Field id="spinningLine" label="Spinning Machine" help="">
                        <TextInput form={form} id="spinningLine" onChange={updateField} list="spinning-machine-options" />
                      </Field>
                    </div>
                  </div>

                  <div className="quick-input-block">
                    <div className="quick-input-title">
                      <span className="section-index">02</span>
                      <b>ข้อมูลเวลา</b>
                    </div>
                    <div className="form-grid time-grid">
                      <Field id="doffingStart" label="เวลาเริ่ม Doffing" help="">
                        <TextInput form={form} id="doffingStart" type="datetime-local" onChange={updateField} />
                      </Field>
                      <Field id="drawingStart" label="เวลาเริ่ม Drawing" help="">
                        <TextInput form={form} id="drawingStart" type="datetime-local" onChange={updateField} required />
                      </Field>
                      <Field id="defectTime" label="เวลาเก็บตัวอย่าง" help="">
                        <TextInput form={form} id="defectTime" type="datetime-local" onChange={updateField} required />
                      </Field>
                    </div>
                  </div>

                  <div className="quick-input-block">
                    <div className="quick-input-title">
                      <span className="section-index">03</span>
                      <b>ข้อมูลการผลิต</b>
                    </div>
                    <div className="form-grid time-grid">
                      <Field id="doffTimeHeader" label="ระยะเวลา Doffing รวม (นาที)" help="">
                        <TextInput form={form} id="doffTimeHeader" type="number" min="1" step="0.1" onChange={updateField} required />
                      </Field>
                      <Field id="layerMinutes" label="ระยะเวลา Doffing ต่อชั้น (นาที)" help="ตัวอย่าง หากใช้เวลา 1 นาทีต่อชั้น ให้กรอก 1">
                        <TextInput form={form} id="layerMinutes" type="number" min="0.1" step="0.1" onChange={updateField} required />
                      </Field>
                      <Field id="drawLayerMinutes" label="ระยะเวลา Drawing ต่อชั้น (นาที)" help="ตัวอย่าง หากใช้เวลา 10 นาทีต่อชั้น ให้กรอก 10">
                        <TextInput form={form} id="drawLayerMinutes" type="number" min="0.1" step="0.1" onChange={updateField} required />
                      </Field>
                    </div>
                  </div>

                </section>
              ) : null}

              {!quickMode ? (
              <section className="form-card">
                <div className="form-card-head">
                  <span>01</span>
                  <div>
                    <strong>ข้อมูล</strong>
                  </div>
                </div>

                <div className="form-grid time-grid">
                  <Field id="brand" label="Brand / Product" help="">
                    <TextInput form={form} id="brand" onChange={updateField} required list="brand-options" />
                  </Field>
                  <Field id="drawingLine" label="Drawing Machine" help="">
                    <select id="drawingLine" name="drawingLine" value={form.drawingLine} onChange={updateField}>
                      <option value=""></option>
                      {drawingMachineOptions.map((machine) => (
                        <option key={machine} value={machine}>{machine}</option>
                      ))}
                    </select>
                  </Field>
                  <Field id="baleNo" label="Bale No.">
                    <TextInput form={form} id="baleNo" onChange={updateField} />
                  </Field>
                  <Field id="productionDate" label="Production date">
                    <TextInput form={form} id="productionDate" type="date" onChange={updateField} />
                  </Field>
                  <Field id="defect" label="ประเภทเส้นใยที่ผิดปกติที่ตรวจพบ">
                    <select id="defect" name="defect" value={form.defect} onChange={updateField} required>
                      <option value=""></option>
                      <option value="bundle">Bundle</option>
                      <option value="twist">Twist</option>
                      <option value="tangle">Tangle</option>
                      <option value="defect">Defect</option>
                      <option value="long">Long Filament</option>
                    </select>
                  </Field>
                </div>
              </section>
              ) : null}

              {!quickMode ? (
              <section className="form-card">
                <div className="form-card-head">
                  <span>02</span>
                  <div>
                    <strong>ข้อมูลเวลา</strong>
                    <p></p>
                  </div>
                </div>

                <div className="form-grid time-grid time-entry-grid">
                  <Field id="doffingStart" label="เวลาเริ่ม Doffing" help="">
                    <TextInput form={form} id="doffingStart" type="datetime-local" onChange={updateField} />
                  </Field>
                  <Field id="drawingStart" label="เวลาเริ่ม Drawing" help="">
                    <TextInput form={form} id="drawingStart" type="datetime-local" onChange={updateField} required />
                  </Field>
                  <Field id="defectTime" label="เวลาเก็บตัวอย่าง" help="">
                    <TextInput form={form} id="defectTime" type="datetime-local" onChange={updateField} required />
                  </Field>
                </div>
              </section>
              ) : null}

              {!quickMode ? (
              <section className="form-card">
                <div className="form-card-head">
                  <span>03</span>
                  <div>
                    <strong>ข้อมูลการผลิต</strong>
                    <p></p>
                  </div>
                </div>

                <div className="form-grid time-grid">
                  <Field id="doffTimeHeader" label="ระยะเวลา Doffing รวม (นาที)" help="">
                    <TextInput form={form} id="doffTimeHeader" type="number" min="1" step="0.1" onChange={updateField} required />
                  </Field>
                  <Field id="layerMinutes" label="ระยะเวลา Doffing ต่อชั้น (นาที)" help="ตัวอย่าง หากใช้เวลา 1 นาทีต่อชั้น ให้กรอก 1">
                    <TextInput form={form} id="layerMinutes" type="number" min="0.1" step="0.1" onChange={updateField} required />
                  </Field>
                  <Field id="drawLayerMinutes" label="ระยะเวลา Drawing ต่อชั้น (นาที)" help="ตัวอย่าง หากใช้เวลา 1 นาทีต่อชั้น ให้กรอก 1">
                    <TextInput form={form} id="drawLayerMinutes" type="number" min="0.1" step="0.1" onChange={updateField} required />
                  </Field>
                </div>
              </section>
              ) : null}

              {!quickMode ? (
              <section className="form-card">
                <div className="form-card-head">
                  <span>04</span>
                  <div>
                    <strong>Doffing record</strong>
                    <p></p>
                  </div>
                </div>

                <Field id="spinningLine" label="Spinning machine" help="">
                  <TextInput form={form} id="spinningLine" onChange={updateField} list="spinning-machine-options" />
                </Field>

                <div className="record-helper" aria-label="ตัวช่วยเพิ่ม Doffing record">
                  <div className="record-helper-head">
                    <strong>เพิ่มรายการ Doffing Record</strong>
                    <span></span>
                  </div>
                  <div className="record-grid">
                    <label>
                      Can No.
                      <input name="canNo" value={doffingDraft.canNo} onChange={updateDoffingDraft} />
                    </label>
                    <label>
                      เวลาเริ่ม Doffing ของ Can นี้
                      <input name="startedAt" type="datetime-local" value={doffingDraft.startedAt} onChange={updateDoffingDraft} data-empty={!doffingDraft.startedAt ? "true" : undefined} />
                    </label>
                    <label>
                      เวลาสิ้นสุด Doffing ของ Can นี้
                      <input name="endedAt" type="datetime-local" value={doffingDraft.endedAt} onChange={updateDoffingDraft} data-empty={!doffingDraft.endedAt ? "true" : undefined} />
                    </label>
                    <label>
                      ระยะเวลา Doffing รวมของ Can นี้ (นาที)
                      <input value={doffingDraftMinutes} readOnly />
                    </label>
                    <label>
                      Position
                      <input name="position" value={doffingDraft.position} onChange={updateDoffingDraft} placeholder="ถ้ามี" />
                    </label>
                    <label className="record-note-field">
                      Remark
                      <input name="remark" value={doffingDraft.remark} onChange={updateDoffingDraft} />
                    </label>
                  </div>
                  <button className="btn secondary record-add-button" type="button" onClick={addDoffingRecord} disabled={!doffingDraft.startedAt || !doffingDraft.endedAt}>
                    เพิ่มรายการ
                  </button>
                </div>

                <Field id="doffingRows" label="Doffing / Spinning record" help="">
                  <TextArea form={form} id="doffingRows" onChange={updateField} />
                </Field>
              </section>
              ) : null}

              {!quickMode ? (
              <section className="form-card">
                <div className="form-card-head">
                  <span>05</span>
                  <div>
                    <strong>บันทึกข้อมูลการทำงานของ Drawing</strong>
                    <p></p>
                  </div>
                </div>

                <div className="form-grid condition-grid">
                  <Field id="drawingStopStart" label="มีการหยุด/เริ่มเครื่อง หรือเปลี่ยนการตั้งค่าหรือไม่">
                    <select id="drawingStopStart" name="drawingStopStart" value={form.drawingStopStart} onChange={updateField}>
                      <option value="no">ไม่มี</option>
                      <option value="yes">มี</option>
                      <option value="unknown">ไม่ทราบ</option>
                    </select>
                  </Field>
                  <Field id="drawingTension" label="ค่า Tension ในกระบวนการ Drawing">
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
                  <Field id="drawingRoller" label="Roller / Nip">
                    <select id="drawingRoller" name="drawingRoller" value={form.drawingRoller} onChange={updateField}>
                      <option value="normal">ปกติ</option>
                      <option value="abnormal">ผิดปกติ</option>
                      <option value="unknown">ไม่ทราบ</option>
                    </select>
                  </Field>
                  <Field id="drawingCutter" label="Cutter / Tow Transfer">
                    <select id="drawingCutter" name="drawingCutter" value={form.drawingCutter} onChange={updateField}>
                      <option value="normal">ปกติ</option>
                      <option value="abnormal">ผิดปกติ</option>
                      <option value="unknown">ไม่ทราบ</option>
                    </select>
                  </Field>
                </div>
                <Field id="drawingNote" label="หมายเหตุจาก Drawing / เหตุการณ์ก่อนพบ Defect">
                  <TextArea form={form} id="drawingNote" onChange={updateField} />
                </Field>
              </section>
              ) : null}

              <button className="btn" type="submit">
                วิเคราะห์ย้อนกลับ
              </button>
            </form>
          </section>

          <section className={`results ${activeView === "input" ? "page-hidden" : ""}`}>
            <section className={`decision-grid ${!showTracePosition || !canReady ? "page-hidden" : ""}`} aria-label="ผลสรุปตำแหน่ง">
              <div className="decision-card">
                <span>ระดับความมั่นใจของผลวิเคราะห์</span>
                <b>{canReady ? `${result.confidence}%` : "รอข้อมูล"}</b>
                <small>{canReady ? result.risk : ""}</small>
              </div>
              <div className="decision-card">
                <span>Can ที่เกี่ยวข้องหลัก</span>
                <b>{canReady ? primary.id : "ยังระบุไม่ได้"}</b>
                <small>{canReady ? `คะแนนความเกี่ยวข้อง ${primary.score}%` : ""}</small>
              </div>
              <div className="decision-card">
                <span>ตำแหน่งของเส้นใยใน Can</span>
                <b>{canReady ? formatPercent(primary.positionFromTopPct) : "-"}</b>
                <small>{canReady ? "จากปากถังลงไป" : ""}</small>
              </div>
              <div className="decision-card">
                <span>ชั้นของเส้นใย</span>
                <b>{canReady ? `${primary.doffingLayer}/${primary.layerCount}` : "-"}</b>
                <small>{canReady ? "Doffing จากล่างขึ้นบน" : ""}</small>
              </div>
            </section>

            <section className={`panel ${activeView !== "origin" || !hasAnalyzed ? "page-hidden" : ""}`}>
              <div className="head">
                <h3>ผลประเมินสาเหตุเบื้องต้น</h3>
                <span className="tag">{result.origin.likelyOrigin}</span>
              </div>
              <div className="origin-grid">
                <article className="origin-card">
                  <div className="cause-top">
                    <h4>สาเหตุจาก Spinning</h4>
                    <div className="bar">
                      <i style={{ width: `${result.origin.spinningRisk}%` }} />
                    </div>
                  </div>
                  <p>{result.origin.spinningRisk}% | {result.origin.spinningReasons.join(" / ") || "ยังไม่พบสัญญาณผิดปกติจากสภาพการทำงานของ Can หรือ Doffing record"}</p>
                </article>
                <article className="origin-card">
                  <div className="cause-top">
                    <h4>สาเหตุจาก Drawing</h4>
                    <div className="bar">
                      <i style={{ width: `${result.origin.drawingRisk}%` }} />
                    </div>
                  </div>
                  <p>{result.origin.drawingRisk}% | {result.origin.drawingReasons.join(" / ") || "ยังไม่พบสัญญาณผิดปกติจากสภาพการทำงานของ Drawing"}</p>
                </article>
              </div>
            </section>

            <section className={`panel ${!showTracePosition || !canReady ? "page-hidden" : ""}`} id="trace">
              <div className="head">
                <h3>ตำแหน่งที่เกี่ยวข้อง</h3>
                <span className={`badge ${confidenceClass}`}>{result.risk}</span>
              </div>
              <div className="trace-list">
                {canReady && result.traced.length ? (
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
                        <span>ชั้นที่ Drawing ดึงถึงจากด้านบน: {can.topLayer}/{can.layerCount}</span>
                        <span>ชั้น Doffing จากด้านล่าง: {can.doffingLayer}/{can.layerCount}</span>
                        <span>เวลาของชั้น: {formatTime(can.spinSectionStart)} - {formatTime(can.spinSectionEnd)}</span>
                        <span>Position: {can.position || "-"}</span>
                        <span>Grade: {can.grade || "-"}</span>
                        <span>Fluff: {can.fluff || "-"}</span>
                        <span>คะแนนความเป็นไปได้ {can.score}%</span>
                      </div>
                      <p>
                        แนะนำให้คัดแยกเส้นใย {formatRemovalRange(can.removeTopStartPct, can.removeTopEndPct)}
                        {" "}และตรวจสอบยืนยันก่อนนำเส้นใยส่วนที่เหลือไปใช้งาน | {can.note}
                      </p>
                    </article>
                  ))
                ) : (
                  <article className="trace-card empty-state">
                    <div className="trace-top">
                      <h4>ยังระบุ Can ไม่ได้</h4>
                      <span className="tag warn">Need Doffing data</span>
                    </div>
                    <p>{result.traceMessage}</p>
                    <p>ให้วางข้อมูลในช่อง <b>Doffing / Spinning record</b> เช่น No, วันที่, เวลา, Can No., Position, Grade, Doff time, Fluff check, ผู้บันทึก, Remark แล้วกดวิเคราะห์อีกครั้ง</p>
                  </article>
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
                      {canReady ? ` | เริ่มจาก ${primary.id}` : " | ต้องเพิ่ม Doffing/Can record เพื่อระบุ Can"}
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
            {form.brand ? <span className="tag warn">{form.brand}</span> : null}
          </div>
          <div className="timeline">
            {timeline.map((step) => (
              <div className="step" key={step[0]}>
                <div className="time">ขั้นตอน {step[0]}</div>
                <div>
                  <strong>{step[1]}</strong>
                  <p>{hasAnalyzed ? step[2] : "บันทึกข้อมูลและกดวิเคราะห์ย้อนกลับ เพื่อให้ระบบแสดงรายละเอียดจากผลการวิเคราะห์"}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={`panel matrix ${activeView !== "matrix" ? "page-hidden" : ""}`} id="matrix">
          <div className="head">
            <h3>ประเภทของเส้นใยเกิดความผิดปกติ</h3>
            <span className="tag"></span>
          </div>
          <table>
            <thead>
              <tr>
                <th>ประเภท</th>
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
