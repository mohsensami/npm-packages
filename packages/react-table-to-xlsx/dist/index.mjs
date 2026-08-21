// src/exportTable.ts
import * as XLSX2 from "xlsx-js-style";

// src/styling.ts
import * as XLSX from "xlsx-js-style";
function normalizeHex(color) {
  return color.replace(/^#/, "").toUpperCase();
}
function buildCellStyle(style) {
  if (!style) return void 0;
  const s = {};
  if (style.fill) {
    s.fill = { patternType: "solid", fgColor: { rgb: normalizeHex(style.fill) } };
  }
  if (style.fontColor || style.bold || style.italic) {
    s.font = {
      ...style.fontColor ? { color: { rgb: normalizeHex(style.fontColor) } } : {},
      ...style.bold ? { bold: true } : {},
      ...style.italic ? { italic: true } : {}
    };
  }
  if (style.align) {
    s.alignment = { horizontal: style.align, vertical: "center" };
  }
  return Object.keys(s).length ? s : void 0;
}
function applyCellStyle(ws, addr, style) {
  const builtStyle = buildCellStyle(style);
  if (!builtStyle) return;
  const cell = ws[addr];
  if (cell) {
    cell.s = builtStyle;
  } else {
    ws[addr] = { t: "s", v: "", s: builtStyle };
  }
}
function applyColumnStyle(ws, colIndex, rowStart, rowEnd, style) {
  if (!style) return;
  for (let r = rowStart; r <= rowEnd; r++) {
    applyCellStyle(ws, XLSX.utils.encode_cell({ r, c: colIndex }), style);
  }
}
function shiftSheetRowsDown(ws, shift) {
  if (shift <= 0) return;
  const ref = ws["!ref"];
  if (!ref) return;
  const range = XLSX.utils.decode_range(ref);
  const sheet = ws;
  const entries = [];
  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = sheet[addr];
      if (cell !== void 0) {
        delete sheet[addr];
        entries.push([XLSX.utils.encode_cell({ r: R + shift, c: C }), cell]);
      }
    }
  }
  entries.forEach(([addr, cell]) => {
    sheet[addr] = cell;
  });
  if (ws["!merges"]) {
    ws["!merges"] = ws["!merges"].map((m) => ({
      s: { r: m.s.r + shift, c: m.s.c },
      e: { r: m.e.r + shift, c: m.e.c }
    }));
  }
  ws["!ref"] = XLSX.utils.encode_range({
    s: { r: 0, c: range.s.c },
    e: { r: range.e.r + shift, c: range.e.c }
  });
}
function writeExtraRows(ws, extraRows, columnCount) {
  if (extraRows.length === 0) return;
  const sheet = ws;
  extraRows.forEach((row, rowIndex) => {
    var _a;
    const isStringRow = typeof row.values === "string";
    const values = isStringRow ? [row.values] : row.values;
    const shouldMerge = (_a = row.merge) != null ? _a : isStringRow;
    const builtStyle = buildCellStyle(row);
    const lastCol = shouldMerge ? Math.max(columnCount - 1, 0) : Math.max(values.length - 1, 0);
    for (let c = 0; c <= lastCol; c++) {
      const value = c < values.length ? values[c] : "";
      const addr = XLSX.utils.encode_cell({ r: rowIndex, c });
      sheet[addr] = {
        t: typeof value === "number" ? "n" : "s",
        v: value,
        ...builtStyle ? { s: builtStyle } : {}
      };
    }
    if (shouldMerge && columnCount > 1) {
      ws["!merges"] = ws["!merges"] || [];
      ws["!merges"].push({
        s: { r: rowIndex, c: 0 },
        e: { r: rowIndex, c: columnCount - 1 }
      });
    }
  });
  const existingRef = ws["!ref"];
  const existingRange = existingRef ? XLSX.utils.decode_range(existingRef) : { s: { r: 0, c: 0 }, e: { r: -1, c: columnCount - 1 } };
  ws["!ref"] = XLSX.utils.encode_range({
    s: { r: 0, c: Math.min(0, existingRange.s.c) },
    e: {
      r: Math.max(existingRange.e.r, extraRows.length - 1),
      c: Math.max(existingRange.e.c, columnCount - 1)
    }
  });
}
function prependExtraRows(ws, extraRows, columnCount) {
  if (!extraRows || extraRows.length === 0) return;
  shiftSheetRowsDown(ws, extraRows.length);
  writeExtraRows(ws, extraRows, columnCount);
}

// src/exportTable.ts
function normalizeExtraRows(extraRows) {
  return extraRows == null ? void 0 : extraRows.map((row) => typeof row === "string" ? { values: row } : row);
}
function buildWorkbookFromData({
  data,
  columns,
  sheetName = "Sheet1",
  extraRows
}) {
  var _a;
  const rows = columns ? data.map((row) => {
    const out = {};
    columns.forEach((col) => {
      out[col.header] = typeof col.accessor === "function" ? col.accessor(row) : row[col.accessor];
    });
    return out;
  }) : data;
  const worksheet = XLSX2.utils.json_to_sheet(rows);
  const columnCount = columns ? columns.length : Object.keys((_a = data[0]) != null ? _a : {}).length;
  if (columns) {
    columns.forEach((col, colIndex) => {
      var _a2;
      if (!col.style) return;
      const headerStyle = { ...col.style, ...(_a2 = col.style.header) != null ? _a2 : {} };
      applyColumnStyle(worksheet, colIndex, 0, 0, headerStyle);
      if (data.length > 0) {
        applyColumnStyle(worksheet, colIndex, 1, data.length, col.style);
      }
    });
  }
  prependExtraRows(worksheet, normalizeExtraRows(extraRows), columnCount);
  const workbook = XLSX2.utils.book_new();
  XLSX2.utils.book_append_sheet(workbook, worksheet, sheetName);
  return workbook;
}
function exportDataToExcel({
  fileName = "table.xlsx",
  ...rest
}) {
  const workbook = buildWorkbookFromData(rest);
  XLSX2.writeFile(workbook, ensureXlsxExtension(fileName));
}
function buildWorkbookFromTable({
  table,
  sheetName = "Sheet1",
  extraRows,
  columnStyles
}) {
  var _a;
  const worksheet = XLSX2.utils.table_to_sheet(table);
  if (columnStyles && worksheet["!ref"]) {
    const range = XLSX2.utils.decode_range(worksheet["!ref"]);
    columnStyles.forEach((style, colIndex) => {
      if (!style) return;
      applyColumnStyle(worksheet, colIndex, range.s.r, range.e.r, style);
    });
  }
  const columnCount = worksheet["!ref"] ? XLSX2.utils.decode_range(worksheet["!ref"]).e.c + 1 : (_a = columnStyles == null ? void 0 : columnStyles.length) != null ? _a : 0;
  prependExtraRows(worksheet, normalizeExtraRows(extraRows), columnCount);
  const workbook = XLSX2.utils.book_new();
  XLSX2.utils.book_append_sheet(workbook, worksheet, sheetName);
  return workbook;
}
function exportDomTableToExcel({
  fileName = "table.xlsx",
  ...rest
}) {
  const workbook = buildWorkbookFromTable(rest);
  XLSX2.writeFile(workbook, ensureXlsxExtension(fileName));
}
function ensureXlsxExtension(name) {
  return name.toLowerCase().endsWith(".xlsx") ? name : `${name}.xlsx`;
}

// src/useExportTableToExcel.ts
import { useCallback } from "react";
function useExportTableToExcel(options) {
  const exportToExcel = useCallback(
    (overrides) => {
      var _a, _b, _c, _d, _e;
      const fileName = (_b = (_a = overrides == null ? void 0 : overrides.fileName) != null ? _a : options == null ? void 0 : options.fileName) != null ? _b : "table.xlsx";
      const sheetName = (_d = (_c = overrides == null ? void 0 : overrides.sheetName) != null ? _c : options == null ? void 0 : options.sheetName) != null ? _d : "Sheet1";
      if ((_e = options == null ? void 0 : options.tableRef) == null ? void 0 : _e.current) {
        exportDomTableToExcel({
          table: options.tableRef.current,
          fileName,
          sheetName,
          extraRows: options.extraRows,
          columnStyles: options.columnStyles
        });
        return;
      }
      if (options == null ? void 0 : options.data) {
        exportDataToExcel({
          data: options.data,
          columns: options.columns,
          fileName,
          sheetName,
          extraRows: options.extraRows
        });
        return;
      }
      throw new Error("useExportTableToExcel: provide either `data` or `tableRef`.");
    },
    [
      options == null ? void 0 : options.data,
      options == null ? void 0 : options.columns,
      options == null ? void 0 : options.tableRef,
      options == null ? void 0 : options.fileName,
      options == null ? void 0 : options.sheetName,
      options == null ? void 0 : options.extraRows,
      options == null ? void 0 : options.columnStyles
    ]
  );
  return { exportToExcel };
}

// src/ExportTableButton.tsx
import { jsx } from "react/jsx-runtime";
function ExportTableButton({
  data,
  columns,
  tableRef,
  fileName,
  sheetName,
  extraRows,
  columnStyles,
  children = "Download as Excel",
  className
}) {
  const { exportToExcel } = useExportTableToExcel({
    data,
    columns,
    tableRef,
    fileName,
    sheetName,
    extraRows,
    columnStyles
  });
  return /* @__PURE__ */ jsx("button", { type: "button", className, onClick: () => exportToExcel(), children });
}
export {
  ExportTableButton,
  exportDataToExcel,
  exportDomTableToExcel,
  useExportTableToExcel
};
