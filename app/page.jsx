"use client";

import { useMemo, useState } from "react";

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
  defect: "bundle",
  severity: "medium",
  drawingLine: "",
  spinningLine: "",
  baleNo: "",
  testTime: "",
  productionDate: "",
  drawingStart: "",
  defectTime: "",
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
  day: "",
  time: "",
  position: "",
  doffMinutes: "",
  remark: ""
};

const sampleForm = {
  ...defaultForm,
  brand: "PSF-B220",
  lot: "DR-260706-05",
  defect: "tangle",
  severity: "high",
  drawingLine: "5KN",
  spinningLine: "Spinning Line B",
  drawingStart: "2026-07-06T12:00",
  defectTime: "2026-07-06T14:12",
  canUseMinutes: "42",
  blendLag: "10",
  layerMinutes: "1",
  drawLayerMinutes: "10",
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

function getDoffingLookupWindow(data, elapsed, layerMinutes, drawLayerMinutes, blendLag) {
  const hasLookupInputs = Boolean(data.drawingStart && data.defectTime && data.drawLayerMinutes && data.layerMinutes);
  if (!hasLookupInputs) return null;

  const doffTotal = Number(data.doffTimeHeader) || 0;
  const elapsedMinutes = Math.max(0, elapsed);
  const rawLayersFromTop = Math.max(1, Math.ceil(elapsedMinutes / drawLayerMinutes));
  const totalLayers = doffTotal ? Math.max(1, Math.ceil(doffTotal / layerMinutes)) : null;
  const exceedsOneCan = totalLayers ? rawLayersFromTop > totalLayers : false;
  const layersFromTop = totalLayers ? Math.min(rawLayersFromTop, totalLayers) : rawLayersFromTop;
  const drawingLayerStart = (rawLayersFromTop - 1) * drawLayerMinutes;
  const drawingLayerEnd = rawLayersFromTop * drawLayerMinutes;
  const doffingLayerFromBottom = totalLayers ? Math.max(1, totalLayers - layersFromTop + 1) : null;
  const targetMinuteStart = doffingLayerFromBottom ? (doffingLayerFromBottom - 1) * layerMinutes : null;
  const targetMinuteEnd = doffingLayerFromBottom ? Math.min(doffTotal, doffingLayerFromBottom * layerMinutes) : null;
  const bufferLayers = blendLag > 0 ? Math.ceil(blendLag / drawLayerMinutes) : 1;
  const reviewTopStart = Math.max(1, layersFromTop - bufferLayers);
  const reviewTopEnd = totalLayers ? Math.min(totalLayers, layersFromTop + bufferLayers) : layersFromTop + bufferLayers;
  const reviewBottomStart = totalLayers ? Math.max(1, totalLayers - reviewTopEnd + 1) : null;
  const reviewBottomEnd = totalLayers ? Math.min(totalLayers, totalLayers - reviewTopStart + 1) : null;
  const sheetMinuteStart = reviewBottomStart ? Math.max(0, (reviewBottomStart - 1) * layerMinutes) : null;
  const sheetMinuteEnd = reviewBottomEnd ? Math.min(doffTotal, reviewBottomEnd * layerMinutes) : null;
  const minutesFromDoffingEnd = Math.max(layerMinutes, layersFromTop * layerMinutes);

  return {
    elapsedMinutes,
    rawLayersFromTop,
    layersFromTop,
    totalLayers,
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
    sheetMinuteStart,
    sheetMinuteEnd
  };
}

function analyze(data) {
  const fallbackDate = new Date();
  const drawingStart = parseDate(data.drawingStart) || fallbackDate;
  const defectTime = parseDate(data.defectTime) || drawingStart;
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
  const doffingLookup = getDoffingLookupWindow(data, preciseMinutesBetween(drawingStart, defectTime), layerMinutes, drawLayerMinutes, blendLag);

  const canDataReady = hasTraceableCanData(primary);
  const traceStatus = canDataReady
    ? "ready"
    : hasCanRows ? "partial" : "missing";
  const traceMessage = canDataReady
    ? "ระบุ Can และช่วงเวลา Spinning ได้"
    : hasCanRows
      ? "พบข้อมูล Can บางส่วน แต่ยังขาดเวลาเริ่ม/จบ Spinning ที่ใช้ย้อนชั้นในถัง"
      : "ยังไม่มี Doffing / Can record จึงยังระบุ Can หรือชั้นในถังไม่ได้";

  return {
    drawingStart,
    defectTime,
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

function Field({ id, label, children, help }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {help ? <p className="help">{help}</p> : null}
    </div>
  );
}

function TextInput({ form, id, onChange, type = "text", min, step, placeholder, required = false, list }) {
  return <input id={id} name={id} type={type} min={min} step={step} placeholder={placeholder} value={form[id]} onChange={onChange} required={required} list={list} />;
}

function TextArea({ form, id, onChange }) {
  return <textarea id={id} name={id} value={form[id]} onChange={onChange} />;
}

export default function HomePage() {
  const [form, setForm] = useState(defaultForm);
  const [doffingDraft, setDoffingDraft] = useState(defaultDoffingDraft);
  const [traceMode, setTraceMode] = useState("quick");
  const [activeView, setActiveView] = useState("home");
  const result = useMemo(() => analyze(form), [form]);
  const primary = result.primary;
  const canReady = result.canDataReady;
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
  const quickMode = traceMode === "quick";
  const doffingLookupText = result.doffingLookup
    ? result.doffingLookup.exceedsOneCan
      ? `เวลา Drawing ที่กรอกเทียบได้ ${result.doffingLookup.rawLayersFromTop} ชั้น แต่ใบ doffing นี้มีประมาณ ${result.doffingLookup.totalLayers} ชั้น จึงน่าจะเกิน 1 ถัง ให้ตรวจ Can ถัดไปหรือเช็กเวลาเริ่ม Drawing/เวลาที่พบ Defect อีกครั้ง`
      : result.doffingLookup.sheetMinuteStart !== null
      ? `เปิดใบ doffing ช่วงนาทีที่ ${formatMinutesValue(result.doffingLookup.sheetMinuteStart)} - ${formatMinutesValue(result.doffingLookup.sheetMinuteEnd)} จากเวลาเริ่ม doffing โดยจุดหลักอยู่ราวนาทีที่ ${formatMinutesValue(result.doffingLookup.targetMinuteStart)} - ${formatMinutesValue(result.doffingLookup.targetMinuteEnd)}`
      : `เปิดใบ doffing ช่วงท้าย ย้อนจากเวลาจบประมาณ 0 - ${formatMinutesValue(result.doffingLookup.minutesFromDoffingEnd)} นาที`
    : "กรอกเวลาเริ่ม Drawing, เวลาที่พบ Defect, นาทีต่อชั้นของ Drawing และ Doffing เพื่อคำนวณช่วงใบ doffing";
  const quickResultTitle = result.doffingLookup
    ? result.doffingLookup.exceedsOneCan
      ? "เวลาเกินช่วงของใบนี้"
      : result.doffingLookup.sheetMinuteStart !== null
        ? `เปิดใบ doffing นาทีที่ ${formatMinutesValue(result.doffingLookup.sheetMinuteStart)} - ${formatMinutesValue(result.doffingLookup.sheetMinuteEnd)}`
        : "กรอกเวลา Doffing รวม"
    : "กรุณากรอกข้อมูลเวลา";

function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => {
      if (name === "brand") {
        const preset = findBrandPreset(value);
        return preset
          ? { ...current, brand: preset.brand, baleNo: preset.baleNo, drawingLine: preset.drawingLine, spinningLine: preset.spinningLine, testTime: preset.testTime, productionDate: preset.productionDate }
          : { ...current, brand: value };
      }
    if (name === "drawingLine") {
      return { ...current, drawingLine: value, spinningLine: value ? drawingToSpinningMap[value] || "" : "" };
      }
      return { ...current, [name]: value };
    });
  }

  function updateDoffingDraft(event) {
    const { name, value } = event.target;
    setDoffingDraft((current) => ({ ...current, [name]: value }));
  }

  function addDoffingRecord() {
    const doffMinutes = doffingDraft.doffMinutes || form.doffTimeHeader;
    if (!doffingDraft.day || !doffingDraft.time || !doffMinutes) return;

    const existingLines = form.doffingRows
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const rowNo = existingLines.length + 1;
    const record = [
      rowNo,
      doffingDraft.day,
      doffingDraft.time,
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
      day: current.day,
      doffMinutes
    }));
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
      "แปลงช่วงเวลา Drawing เป็นช่วงที่ควรเปิดดูในใบ Doffing",
      canReady
        ? `Drawing เดินมา ${result.elapsed} นาที เทียบกับ ${result.drawLayerMinutes} นาทีต่อชั้น จึงอยู่ประมาณชั้นที่ ${primary.topLayer} จากด้านบน และตรงกับชั้น Doffing ${primary.doffingLayer}/${primary.layerCount}`
        : doffingLookupText
    ],
    [
      "5",
      "เปิดใบ Doffing แล้วเทียบกับเหตุการณ์ Spinning",
      canReady
        ? `ตรวจสอบ ${primary.id} ชั้นนี้ช่วง ${formatTime(primary.spinSectionStart)} - ${formatTime(primary.spinSectionEnd)} เทียบกับ Laydown, Tension, Wrapping และหมายเหตุหน้างาน`
        : `ตรวจ ${form.spinningLine || "Spinning machine ที่เกี่ยวข้อง"}, can laydown, tension/wrapping และหมายเหตุ operator ในช่วงที่ระบบคำนวณให้`
    ],
    [
      "6",
      "คัดแยกเส้นใยในช่วงที่มีความเสี่ยง",
      canReady
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
          <button className={activeView === "trace" ? "active" : ""} type="button" onClick={() => setActiveView("trace")}>วิเคราะห์ตำแหน่ง</button>
          <button className={activeView === "origin" ? "active" : ""} type="button" onClick={() => setActiveView("origin")}>วิเคราะห์สาเหตุ</button>
          <button className={activeView === "timeline" ? "active" : ""} type="button" onClick={() => setActiveView("timeline")}>ลำดับการตรวจสอบ</button>
          <button className={activeView === "matrix" ? "active" : ""} type="button" onClick={() => setActiveView("matrix")}>คู่มืออ้างอิง</button>
        </nav>

        <section className="side-metrics">
          <div className="side-metric">
            <b>{canReady ? primary.id : "รอข้อมูล Can"}</b>
            {canReady ? "Can ที่ควรย้อนตรวจอันดับแรก" : "เพิ่ม Doffing record เพื่อระบุ Can"}
          </div>
          <div className="side-metric">
            <b>{canReady ? `${formatPercent(primary.positionFromTopPct)} / ชั้น ${primary.doffingLayer}` : "-"}</b>
            {canReady ? "ตำแหน่งในถังที่ควรคัดแยก" : "ยังคำนวณชั้นในถังไม่ได้"}
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
            <p>ระบบคำนวณเวลาย้อนกลับจาก Flat screen และ Drawing เพื่อบอกช่วงที่ควรเปิดดูในใบ doffing ได้เร็วขึ้น</p>
            <button className="btn" type="button" onClick={() => setActiveView("input")}>
              เริ่มวิเคราะห์ใหม่
            </button>
          </article>

          <button className="home-card" type="button" onClick={() => setActiveView("input")}>
            <span>Step 1</span>
            <strong>บันทึกข้อมูล Defect</strong>
            <p>ใส่เวลาเจอ Defect, เวลาเริ่ม Drawing และเวลาต่อชั้น เพื่อคำนวณช่วงใบ doffing ที่ควรตรวจ</p>
          </button>

          <button className="home-card" type="button" onClick={() => setActiveView("overview")}>
            <span>Step 2</span>
            <strong>ผลการวิเคราะห์เบื้องต้น</strong>
            <p>ดูช่วงเวลาในใบ doffing ที่ควรเปิดตรวจ พร้อมคำแนะนำว่าควรเริ่มจาก Drawing หรือ Spinning</p>
          </button>

          <button className="home-card" type="button" onClick={() => setActiveView("trace")}>
            <span>Trace</span>
            <strong>ตรวจสอบตำแหน่งภายใน Can</strong>
            <p>ใช้เมื่อมี Doffing record ครบ เพื่อระบุ Can, ชั้น และช่วงเวลาของชั้นนั้นละเอียดขึ้น</p>
          </button>

          <button className="home-card" type="button" onClick={() => setActiveView("origin")}>
            <span>Check</span>
            <strong>วิเคราะห์สาเหตุ</strong>
            <p>เปรียบเทียบความเสี่ยงระหว่าง Spinning / Can กับ Drawing</p>
          </button>

          <button className="home-card" type="button" onClick={() => setActiveView("timeline")}>
            <span>Action</span>
            <strong>ลำดับการตรวจสอบ</strong>
            <p>แสดงขั้นตอนการตรวจสอบที่ระบบแนะนำตามผลการวิเคราะห์</p>
          </button>
        </section>

        <section className={`summary-band ${activeView !== "overview" ? "page-hidden" : ""}`} aria-label="สรุปผลสำคัญ">
          {quickMode ? (
            <>
              <article className="summary-card hero">
                <span>1. ฟังก์ชันที่ใช้</span>
                <strong>คำนวณเวลาเปิดใบ doffing</strong>
                <p></p>
                <small>{form.spinningLine ? `เปิดใบของเครื่อง ${form.spinningLine}` : "เลือก Drawing machine เพื่อให้ระบบช่วยเติม Spinning machine"}</small>
              </article>
              <article className="summary-card">
                <span>2. ช่วงนาทีที่ควรเปิดดู</span>
                <strong>{quickResultTitle}</strong>
                <p>{doffingLookupText}</p>
              </article>
              <article className="summary-card">
                <span>3. ตำแหน่งจากเวลา Drawing</span>
                <strong>{result.doffingLookup ? result.doffingLookup.exceedsOneCan ? "เกินช่วงใบนี้" : `ชั้น ${result.doffingLookup.layersFromTop} จากด้านบน` : "รอข้อมูลเวลา"}</strong>
                <p>{result.doffingLookup ? `หลังเริ่ม Drawing ${formatMinutesValue(result.doffingLookup.elapsedMinutes)} นาที` : "กรอกเวลาเริ่ม Drawing และเวลาที่พบ Defect"}</p>
              </article>
              <article className="summary-card">
                <span>4. ขั้นตอนต่อไป</span>
                <strong>{result.doffingLookup?.exceedsOneCan ? "ตรวจ Can ถัดไป" : "เปิดใบแล้วเทียบหมายเหตุ"}</strong>
                <p>{result.doffingLookup?.exceedsOneCan ? "เวลาที่พบ Defect อาจไม่ได้อยู่ในถัง/ใบ doffing ใบแรกที่เลือก" : "ดู remark, fluff, tension, wrapping หรือเหตุการณ์ผิดปกติในช่วงนาทีที่ระบบแนะนำ"}</p>
              </article>
            </>
          ) : (
            <>
              <article className="summary-card hero">
                <span>1. เริ่มจากตรงนี้</span>
                <strong>{firstAction}</strong>
                <p>{result.origin.firstCheck}</p>
                <small>{originReason}</small>
              </article>
              <article className="summary-card">
                <span>2. Can / ชั้นที่เกี่ยวข้อง</span>
                <strong>{canReady ? `${primary.id} / ชั้น ${primary.doffingLayer}` : "ยังระบุไม่ได้"}</strong>
                <p>{canReady ? `เวลาชั้นนี้ ${formatTime(primary.spinSectionStart)} - ${formatTime(primary.spinSectionEnd)}` : result.traceMessage}</p>
              </article>
              <article className="summary-card">
                <span>3. ช่วงที่ควรคัดแยก</span>
                <strong>{canReady ? `${formatPercent(primary.removeTopStartPct)} - ${formatPercent(primary.removeTopEndPct)}` : "รอข้อมูล Can"}</strong>
                <p>{canReady ? `จากปากถังของ ${primary.id}` : "ต้องเพิ่ม Doffing / Can record ก่อน"}</p>
              </article>
              <article className="summary-card">
                <span>4. ระดับความมั่นใจ</span>
                <strong>{canReady ? `${result.confidence}%` : "ยังไม่ครบ"}</strong>
                <p>{canReady ? `${result.risk} | Drawing ${result.origin.drawingRisk}% / Can ${result.origin.spinningRisk}%` : "ตอนนี้ยังวิเคราะห์ละเอียดถึง Can/ชั้นไม่ได้"}</p>
              </article>
            </>
          )}
        </section>

        <section className={`layout ${showLayout ? "" : "page-hidden"} ${activeView === "input" ? "single" : "full"}`}>
          <section className={`panel pad ${activeView !== "input" ? "page-hidden" : ""}`} id="input">
            <h3>บันทึกข้อมูลสำหรับวิเคราะห์</h3>
            <form className="form" onSubmit={handleSubmit}>
              <datalist id="brand-options">
                {brandExamples.map((brand) => <option key={brand} value={brand} />)}
              </datalist>
              <datalist id="drawing-machine-options">
                {drawingMachineOptions.map((machine) => <option key={machine} value={machine} />)}
              </datalist>
              <datalist id="spinning-machine-options">
                {spinningMachineOptions.map((machine) => <option key={machine} value={machine} />)}
              </datalist>

              <details className="advanced compact">
                <summary>ข้อมูลพื้นฐานจากเอกสาร Orientation</summary>
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
                  <strong>คำนวณเวลาเปิดใบ doffing</strong>
                  <span>กรอกเฉพาะข้อมูลเวลา ไม่ต้องใส่ Doffing / Spinning record</span>
                </button>
                <button className={!quickMode ? "active" : ""} type="button" onClick={() => setTraceMode("detailed")}>
                  <strong>วิเคราะห์ละเอียดถึง Can / ชั้น</strong>
                  <span>ใช้เมื่อมีข้อมูล record ราย Can และต้องการ trace ตำแหน่งในถัง</span>
                </button>
              </section>

              <section className={`calc-preview ${canReady ? "ready" : ""}`} aria-label="ผลคำนวณตำแหน่งเบื้องต้น">
                <div>
                  <span>{quickMode ? "ผลคำนวณเวลา" : "ผลคำนวณละเอียด"}</span>
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
                      หลังเริ่ม Drawing
                    </span>
                    <span>
                      <b>{result.doffingLookup ? result.doffingLookup.exceedsOneCan ? "เกินใบนี้" : `ชั้น ${result.doffingLookup.layersFromTop}` : "-"}</b>
                      จากด้านบนของถัง
                    </span>
                    <span>
                      <b>{result.doffingLookup && !result.doffingLookup.exceedsOneCan && result.doffingLookup.targetMinuteStart !== null ? `${formatMinutesValue(result.doffingLookup.targetMinuteStart)} - ${formatMinutesValue(result.doffingLookup.targetMinuteEnd)}` : "-"}</b>
                      นาทีเป้าหมายในใบ
                    </span>
                    <span>
                      <b>{result.doffingLookup && !result.doffingLookup.exceedsOneCan && result.doffingLookup.sheetMinuteStart !== null ? `${formatMinutesValue(result.doffingLookup.sheetMinuteStart)} - ${formatMinutesValue(result.doffingLookup.sheetMinuteEnd)}` : result.doffingLookup?.exceedsOneCan ? "เช็ก Can ถัดไป" : "กรอก Doffing รวม"}</b>
                      ช่วงที่ควรเปิดตรวจ
                    </span>
                  </div>
                ) : (
                  <div className="calc-preview-metrics">
                    <span>
                      <b>{canReady ? `${formatPercent(primary.positionFromTopPct)}` : result.doffingLookup ? result.doffingLookup.exceedsOneCan ? "เกิน 1 ถัง" : `${result.doffingLookup.layersFromTop} ชั้น` : "-"}</b>
                      ประมาณจากด้านบน
                    </span>
                    <span>
                      <b>{canReady ? `${formatTime(primary.spinSectionStart)} - ${formatTime(primary.spinSectionEnd)}` : result.doffingLookup ? result.doffingLookup.exceedsOneCan ? "ต้องดู Can ถัดไป" : `0 - ${formatMinutesValue(result.doffingLookup.minutesFromDoffingEnd)} นาที` : "-"}</b>
                      ช่วงท้ายใบ doffing
                    </span>
                  </div>
                )}
              </section>

              <section className="form-card">
                <div className="form-card-head">
                  <span>01</span>
                  <div>
                    <strong>เวลาที่ต้องใช้คำนวณ</strong>
                    <p>ใช้แปลงจากเวลาที่พบ Defect ไปเป็นชั้นของเส้นใยในถัง</p>
                  </div>
                </div>

                <div className="two">
                  <Field id="brand" label="Brand / Product name" help="พิมพ์ได้หลายแบบ เช่น SD 1.1 x 5 NU(E), SD1.1*5NU(E), SD 1.1×5 NU(E) ระบบจะจับคู่ให้เอง">
                    <TextInput form={form} id="brand" onChange={updateField} required list="brand-options" />
                  </Field>
                  <Field id="drawingLine" label="Drawing machine / Line" help="ชื่อเครื่อง Drawing จากเอกสาร เช่น 3KS, 4KN, 5KN, 6KN, 7KN">
                    <select id="drawingLine" name="drawingLine" value={form.drawingLine} onChange={updateField}>
                      <option value="">เลือกเครื่อง Drawing</option>
                      {drawingMachineOptions.map((machine) => (
                        <option key={machine} value={machine}>{machine}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="two">
                  <Field id="baleNo" label="Bale No.">
                    <TextInput form={form} id="baleNo" onChange={updateField} />
                  </Field>
                  <Field id="productionDate" label="Production date">
                    <TextInput form={form} id="productionDate" type="date" onChange={updateField} />
                  </Field>
                </div>

                <div className="two">
                  <Field id="drawingStart" label="เวลาเริ่ม Drawing" help="ใช้คำนวณว่าตอนเจอ Defect กำลังใช้เส้นใยตำแหน่งไหนในถัง">
                    <TextInput form={form} id="drawingStart" type="datetime-local" onChange={updateField} required />
                  </Field>
                  <Field id="defectTime" label="เวลาที่เริ่มพบ Defect จาก Flat screen" help="เป็นเวลาหลักสำหรับย้อนกลับไปหา Can, ชั้น และช่วง Spinning">
                    <TextInput form={form} id="defectTime" type="datetime-local" onChange={updateField} required />
                  </Field>
                  <Field id="defect" label="ประเภท Defect ที่พบ">
                    <select id="defect" name="defect" value={form.defect} onChange={updateField} required>
                      <option value="bundle">Bundle</option>
                      <option value="twist">Twist</option>
                      <option value="tangle">Tangle</option>
                      <option value="defect">Defect</option>
                      <option value="long">Long filament</option>
                    </select>
                  </Field>
                </div>
              </section>

              <section className="form-card">
                <div className="form-card-head">
                  <span>02</span>
                  <div>
                    <strong>สูตรแปลงเวลาเป็นชั้น</strong>
                    <p>ตัวอย่าง: Drawing 30 นาที / 10 นาทีต่อชั้น = ใช้ไป 3 ชั้นจากด้านบน</p>
                  </div>
                </div>

                <div className="two">
                  <Field id="drawLayerMinutes" label="Drawing ใช้เวลาดึงออก 1 ชั้น (นาที)" help="กรอกเป็นจำนวนนาที เช่น 10 หมายถึง 1 ชั้นใช้ 10 นาที">
                    <TextInput form={form} id="drawLayerMinutes" type="number" min="0.1" step="0.1" placeholder="10" onChange={updateField} required />
                  </Field>
                  <Field id="layerMinutes" label="Spinning/Doffing เติมลงถัง 1 ชั้น (นาที)" help="กรอกเป็นจำนวนนาที เช่น 1 หมายถึง 1 ชั้นใช้ 1 นาที ไม่ใช่ 10.1">
                    <TextInput form={form} id="layerMinutes" type="number" min="0.1" step="0.1" placeholder="1" onChange={updateField} required />
                  </Field>
                </div>

                <div className="formula-note">
                  <strong>ตัวอย่างการคำนวณ</strong>
                  <span>Drawing 30 นาที ÷ 10 นาทีต่อชั้น = ใช้ไป 3 ชั้นจากด้านบน</span>
                  <span>Doffing 1 นาทีต่อชั้น = ชั้นนั้นย้อนกลับไปหาเวลา Spinning ได้ทีละ 1 นาที</span>
                  <span>ถ้ากรอก 4.1 ระบบจะอ่านว่า 4.1 นาทีต่อชั้น ไม่ใช่ 4 นาที 1 ชั้น</span>
                </div>

                {Number(form.layerMinutes) > 3 ? (
                  <p className="field-warning">
                    ตรวจสอบค่า Doffing อีกครั้ง: โดยปกติถ้าเติม 1 ชั้นใช้ประมาณ 1 นาที ให้กรอก 1 ไม่ใช่ {form.layerMinutes}
                  </p>
                ) : null}

                <Field id="testTime" label="เวลา Test Flat screen">
                  <TextInput form={form} id="testTime" type="time" onChange={updateField} />
                </Field>

                <div className="two">
                  <Field id="blendLag" label="เผื่อช่วงคัดออกก่อน-หลังจุด defect (นาที)">
                    <TextInput form={form} id="blendLag" type="number" min="0" onChange={updateField} />
                  </Field>
                  <Field id="doffTimeHeader" label="เวลา Doffing รวมตามใบ (นาที)" help="เช่นในใบเขียน 30 min DF ให้กรอก 30 เพื่อให้ระบบบอกนาทีในใบ doffing">
                    <TextInput form={form} id="doffTimeHeader" type="number" min="1" step="0.1" placeholder="30" onChange={updateField} required={quickMode} />
                  </Field>
                </div>
                {!quickMode ? (
                  <Field id="canUseMinutes" label="เวลา Drawing จนใช้ถังหมด (นาที)" help="กรอกเมื่ออยากวิเคราะห์ทั้งถังหรือระบุ Can แบบละเอียด">
                    <TextInput form={form} id="canUseMinutes" type="number" min="1" onChange={updateField} />
                  </Field>
                ) : null}
              </section>

              {!quickMode ? (
              <section className="form-card">
                <div className="form-card-head">
                  <span>03</span>
                  <div>
                    <strong>ข้อมูล Can / Spinning / Doffing</strong>
                    <p>ใช้ย้อนตำแหน่งจากเวลาที่พบ defect ไปหา Can, ชั้นในถัง และช่วงเวลา Spinning</p>
                  </div>
                </div>

                <Field id="spinningLine" label="Spinning machine / Doffing record" help="ระบบเติมจาก Brand หรือ Drawing machine ให้อัตโนมัติ แต่แก้เองได้ถ้าหน้างานใช้เครื่องอื่น">
                  <TextInput form={form} id="spinningLine" onChange={updateField} list="spinning-machine-options" />
                </Field>

                <div className="record-helper" aria-label="ตัวช่วยเพิ่ม Doffing record">
                  <div className="record-helper-head">
                    <strong>ตัวช่วยกรอก Doffing record</strong>
                    <span>กรอกทีละ Can แล้วกดเพิ่ม ระบบจะแปลงเป็นรูปแบบที่อ่านได้ให้เอง</span>
                  </div>
                  <div className="record-grid">
                    <label>
                      Can No.
                      <input name="canNo" value={doffingDraft.canNo} onChange={updateDoffingDraft} placeholder="เช่น 01" />
                    </label>
                    <label>
                      วันที่ Doffing
                      <input name="day" type="date" value={doffingDraft.day} onChange={updateDoffingDraft} />
                    </label>
                    <label>
                      เวลาเริ่ม
                      <input name="time" type="time" value={doffingDraft.time} onChange={updateDoffingDraft} />
                    </label>
                    <label>
                      Doffing รวม (นาที)
                      <input name="doffMinutes" type="number" min="0.1" step="0.1" value={doffingDraft.doffMinutes} onChange={updateDoffingDraft} placeholder={form.doffTimeHeader || "30"} />
                    </label>
                    <label>
                      Position
                      <input name="position" value={doffingDraft.position} onChange={updateDoffingDraft} placeholder="ถ้ามี" />
                    </label>
                    <label>
                      Remark
                      <input name="remark" value={doffingDraft.remark} onChange={updateDoffingDraft} placeholder="ปกติ / พบ fluff / tension swing" />
                    </label>
                  </div>
                  <button className="btn secondary" type="button" onClick={addDoffingRecord} disabled={!doffingDraft.day || !doffingDraft.time || !(doffingDraft.doffMinutes || form.doffTimeHeader)}>
                    เพิ่มเข้า Record
                  </button>
                </div>

                <Field id="doffingRows" label="Doffing / Spinning record" help="ระบบสร้างให้จากตัวช่วยด้านบน หรือวางข้อมูลหลายบรรทัดจาก Excel ได้ | Format: No, Day, Time, Can, Can No., Position, Grade, Doff time, Fluff check, Sign, Remark">
                  <TextArea form={form} id="doffingRows" onChange={updateField} />
                </Field>
              </section>
              ) : (
                <section className="form-card compact-card">
                  <div className="form-card-head">
                    <span>03</span>
                    <div>
                      <strong>เครื่องที่ใช้เปิดใบ doffing</strong>
                      <p>โหมดนี้ไม่ต้องกรอก Doffing / Spinning record ระบบคำนวณช่วงเวลาให้ แล้วผู้ใช้ไปเปิดใบจริงเอง</p>
                    </div>
                  </div>
                  <Field id="spinningLine" label="Spinning machine ที่เกี่ยวข้อง" help="ระบบเติมจาก Drawing machine ให้ ถ้าหน้างานใช้เครื่องอื่นสามารถแก้ได้">
                    <TextInput form={form} id="spinningLine" onChange={updateField} list="spinning-machine-options" />
                  </Field>
                </section>
              )}

              <details className="advanced">
                <summary>ข้อมูลเสริม ถ้ามี</summary>
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
                  <Field id="cans" label="รายการ Can แบบย่อ ถ้าไม่มี Doffing record" help="รูปแบบต่อบรรทัด: Can No, เวลาเริ่ม Spinning, เวลาจบ Spinning, หมายเหตุ">
                    <TextArea form={form} id="cans" onChange={updateField} />
                  </Field>
                  <Field id="note" label="บันทึกจาก Flat screen / หน้างาน">
                    <TextArea form={form} id="note" onChange={updateField} />
                  </Field>
                  <Field id="fsRows" label="Flat screen rows / Test data">
                    <TextArea form={form} id="fsRows" onChange={updateField} />
                  </Field>
                  <div className="two">
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
                  <Field id="drawingNote" label="Drawing note / เหตุการณ์ก่อนพบ Defect">
                    <TextArea form={form} id="drawingNote" onChange={updateField} />
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
                <b>{canReady ? `${result.confidence}%` : "รอข้อมูล"}</b>
                <small>{canReady ? result.risk : "ยังไม่มีข้อมูล Can สำหรับ trace"}</small>
              </div>
              <div className="decision-card">
                <span>Can ที่เกี่ยวข้องหลัก</span>
                <b>{canReady ? primary.id : "ยังระบุไม่ได้"}</b>
                <small>{canReady ? `คะแนนความเกี่ยวข้อง ${primary.score}%` : "เพิ่ม Doffing / Can record ก่อน"}</small>
              </div>
              <div className="decision-card">
                <span>ตำแหน่งของเส้นใยใน Can</span>
                <b>{canReady ? formatPercent(primary.positionFromTopPct) : "-"}</b>
                <small>{canReady ? "จากปากถังลงไป" : "ยังคำนวณไม่ได้"}</small>
              </div>
              <div className="decision-card">
                <span>ชั้นของเส้นใย</span>
                <b>{canReady ? `${primary.doffingLayer}/${primary.layerCount}` : "-"}</b>
                <small>{canReady ? "Doffing จากล่างขึ้นบน" : "ต้องมีเวลา Doffing"}</small>
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
                        แนะนำให้คัดแยกเส้นใยช่วงจากปากถัง {formatPercent(can.removeTopStartPct)} - {formatPercent(can.removeTopEndPct)}
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
            <span className="tag warn">{form.brand}</span>
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
