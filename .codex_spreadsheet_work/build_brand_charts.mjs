import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = "C:/Users/timet/Downloads/internship_2026(1).xlsx";
const outputDir = "C:/Users/timet/OneDrive/Desktop/trackingpolymor/outputs/brand_flat_screen_charts";
const outputPath = `${outputDir}/internship_2026_flat_screen_10min_charts.xlsx`;

const brandSheets = [
  "SD3.0_5N(C)",
  "SD0.5_5N(E)",
  "SD1.1_5NU(E)",
  "SD1.1_5NU(E)T",
  "SDJC1.5_5N(E)",
  "SDJC2.0_5N(E)",
  "SD1.1_5NUK(C)",
];

const metrics = [
  { label: "Bundle (pcs)", col: "K" },
  { label: "Twist (pcs)", col: "L" },
  { label: "Tangle (pcs)", col: "M" },
  { label: "Defect (pcs)", col: "N" },
  { label: "Long filament", col: "O" },
  { label: "Remain (g)", col: "P" },
];

const quoteSheet = (name) => `'${name.replaceAll("'", "''")}'`;
const colName = (index) => {
  let n = index + 1;
  let out = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    out = String.fromCharCode(65 + r) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
};

const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);

const sheet = workbook.worksheets.getOrAdd("10Min Charts");
sheet.deleteAllDrawings();
sheet.getRange("A1:Z120").clear({ applyTo: "all" });
sheet.showGridLines = false;

sheet.getRange("A1:H1").merge();
sheet.getRange("A1").values = [["Flat Screen Test Summary by Brand"]];
sheet.getRange("A2:H2").merge();
sheet.getRange("A2").values = [["Standard test time: 10 minutes (Remark = 10Min)"]];
sheet.getRange("A1:H2").format = {
  fill: "#17324D",
  font: { color: "#FFFFFF", bold: true },
};
sheet.getRange("A1").format.font.size = 16;
sheet.getRange("A2").format.font.size = 11;

sheet.getRange("A4:G4").values = [["Brand", ...metrics.map((m) => m.label)]];
sheet.getRange("A4:G4").format = {
  fill: "#E8EEF5",
  font: { bold: true, color: "#1F2937" },
  borders: { preset: "outside", style: "thin", color: "#B8C4D2" },
};

const summaryFormulas = brandSheets.map((brand) => {
  const formulas = metrics.map((metric) => `=SUMIFS(${quoteSheet(brand)}!$${metric.col}$68:$${metric.col}$90,${quoteSheet(brand)}!$Q$68:$Q$90,"10Min")`);
  return [brand, ...formulas];
});
sheet.getRange(`A5:G${4 + brandSheets.length}`).formulas = summaryFormulas;
sheet.getRange(`A5:A${4 + brandSheets.length}`).values = brandSheets.map((brand) => [brand]);
sheet.getRange(`A5:G${4 + brandSheets.length}`).format = {
  borders: {
    insideHorizontal: { style: "thin", color: "#D7DEE8" },
    bottom: { style: "thin", color: "#B8C4D2" },
  },
};
sheet.getRange(`B5:G${4 + brandSheets.length}`).format.numberFormat = "#,##0";
sheet.getRange("A:G").format.autofitColumns();
sheet.getRange("A:A").format.columnWidth = 20;

const comparison = sheet.charts.add("bar", sheet.getRange(`A4:G${4 + brandSheets.length}`));
comparison.title = "All Brands: 10-Min Flat Screen Totals";
comparison.hasLegend = true;
comparison.xAxis = { axisType: "textAxis", textStyle: { fontSize: 9 } };
comparison.yAxis = { numberFormatCode: "#,##0" };
comparison.setPosition("J1", "X18");

let helperStart = 15;
for (let i = 0; i < brandSheets.length; i++) {
  const brand = brandSheets[i];
  const summaryRow = 5 + i;
  const startRow = helperStart + i * 9;
  const labelCol = 0;
  const valueCol = 1;
  const startA1 = `${colName(labelCol)}${startRow}`;
  const endA1 = `${colName(valueCol)}${startRow + metrics.length}`;

  sheet.getRange(`${colName(labelCol)}${startRow}:${colName(labelCol)}${startRow + metrics.length}`).values = [
    ["Metric"],
    ...metrics.map((metric) => [metric.label]),
  ];
  sheet.getRange(`${colName(valueCol)}${startRow}`).values = [["Value"]];
  sheet.getRange(`${colName(valueCol)}${startRow + 1}:${colName(valueCol)}${startRow + metrics.length}`).formulas =
    metrics.map((_, metricIndex) => [`=${colName(1 + metricIndex)}${summaryRow}`]);
  sheet.getRange(`${startA1}:${endA1}`).format.font.size = 9;
  sheet.getRange(`${colName(valueCol)}${startRow + 1}:${colName(valueCol)}${startRow + metrics.length}`).format.numberFormat = "#,##0";

  const chartColLeft = i % 2 === 0 ? "D" : "N";
  const chartColRight = i % 2 === 0 ? "M" : "W";
  const chartTop = 21 + Math.floor(i / 2) * 18;
  const chartBottom = chartTop + 14;
  const chart = sheet.charts.add("bar", sheet.getRange(`${startA1}:${endA1}`));
  chart.title = `${brand} - 10 min`;
  chart.hasLegend = false;
  chart.xAxis = { axisType: "textAxis", textStyle: { fontSize: 8 } };
  chart.yAxis = { numberFormatCode: "#,##0" };
  chart.setPosition(`${chartColLeft}${chartTop}`, `${chartColRight}${chartBottom}`);
}

sheet.getRange("A15:B80").format = { fill: "#FFFFFF", font: { color: "#FFFFFF" } };
sheet.freezePanes.freezeRows(4);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);

const summaryCheck = await workbook.inspect({
  kind: "table",
  sheetId: "10Min Charts",
  range: "A1:G12",
  include: "values,formulas",
  tableMaxRows: 12,
  tableMaxCols: 7,
  maxChars: 6000,
});
console.log(summaryCheck.ndjson);

const preview = await workbook.render({
  sheetName: "10Min Charts",
  range: "A1:X88",
  scale: 1,
  format: "png",
});
await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(`${outputDir}/10min_charts_preview.png`, new Uint8Array(await preview.arrayBuffer()));

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(outputPath);
