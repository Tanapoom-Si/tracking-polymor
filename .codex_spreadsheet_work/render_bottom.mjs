import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const path = "C:/Users/timet/OneDrive/Desktop/trackingpolymor/outputs/brand_flat_screen_charts/internship_2026_flat_screen_10min_charts.xlsx";
const input = await FileBlob.load(path);
const workbook = await SpreadsheetFile.importXlsx(input);
const preview = await workbook.render({
  sheetName: "10Min Charts",
  range: "A73:X96",
  scale: 1,
  format: "png",
});
await fs.writeFile("C:/Users/timet/OneDrive/Desktop/trackingpolymor/outputs/brand_flat_screen_charts/10min_charts_bottom_preview.png", new Uint8Array(await preview.arrayBuffer()));
