import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = "C:/Users/timet/Downloads/internship_2026(1).xlsx";
const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);

const summary = await workbook.inspect({
  kind: "workbook,sheet,table,region",
  maxChars: 12000,
  tableMaxRows: 8,
  tableMaxCols: 12,
  tableMaxCellChars: 80,
});

console.log(summary.ndjson);
