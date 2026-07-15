import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = "C:/Users/timet/Downloads/internship_2026(1).xlsx";
const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);

for (const sheetName of ["summary", "SD0.5_5N(E)", "SD1.1_5NU(E)", "SD1.1_5NU(E)T", "SDJC1.5_5N(E)", "SDJC2.0_5N(E)", "SD1.1_5NUK(C)"]) {
  const info = await workbook.inspect({
    kind: "table,region",
    sheetId: sheetName,
    range: "A1:Q90",
    maxChars: 6000,
    tableMaxRows: 6,
    tableMaxCols: 17,
    tableMaxCellChars: 60,
  });
  console.log(`--- ${sheetName} ---`);
  console.log(info.ndjson);
}
