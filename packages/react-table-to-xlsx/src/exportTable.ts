import * as XLSX from 'xlsx-js-style';
import type { ExportColumn, ExtraRow, CellStyle } from './types';
import { applyColumnStyle, prependExtraRows } from './styling';

export interface ExportFromDataOptions<T> {
  /** Array of row objects to export. */
  data: T[];
  /** Optional column definitions to control headers, order, and formatting. */
  columns?: ExportColumn<T>[];
  /** Output file name. `.xlsx` is appended automatically if missing. */
  fileName?: string;
  /** Name of the worksheet tab. */
  sheetName?: string;
  /**
   * One or more rows inserted above the header row — e.g. a title,
   * description, or a summary of filters applied to the table before
   * exporting. See `ExtraRow`.
   */
  extraRows?: (ExtraRow | string)[];
}

function normalizeExtraRows(extraRows: (ExtraRow | string)[] | undefined): ExtraRow[] | undefined {
  return extraRows?.map((row) => (typeof row === 'string' ? { values: row } : row));
}

/**
 * Builds the workbook for `exportDataToExcel` without triggering a
 * download. Exported (unlisted from the package's public `index.ts`) so it
 * can be unit tested directly — cell values, colors, and merges are all
 * inspectable on the returned `XLSX.WorkBook` without needing to intercept
 * `XLSX.writeFile`/the browser download.
 */
export function buildWorkbookFromData<T extends Record<string, any>>({
  data,
  columns,
  sheetName = 'Sheet1',
  extraRows,
}: Omit<ExportFromDataOptions<T>, 'fileName'>): XLSX.WorkBook {
  const rows = columns
    ? data.map((row) => {
        const out: Record<string, unknown> = {};
        columns.forEach((col) => {
          out[col.header] =
            typeof col.accessor === 'function'
              ? col.accessor(row)
              : row[col.accessor as keyof T];
        });
        return out;
      })
    : data;

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const columnCount = columns ? columns.length : Object.keys(data[0] ?? {}).length;

  // Apply per-column colors/formatting (header cell in row 0, data cells in
  // rows 1..data.length) before any rows get shifted down for `extraRows`.
  if (columns) {
    columns.forEach((col, colIndex) => {
      if (!col.style) return;
      const headerStyle: CellStyle = { ...col.style, ...(col.style.header ?? {}) };
      applyColumnStyle(worksheet, colIndex, 0, 0, headerStyle);
      if (data.length > 0) {
        applyColumnStyle(worksheet, colIndex, 1, data.length, col.style);
      }
    });
  }

  prependExtraRows(worksheet, normalizeExtraRows(extraRows), columnCount);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return workbook;
}

/**
 * Exports an array of plain objects to a downloadable .xlsx file.
 * Use this when your table is rendered from data rather than a raw <table>.
 */
export function exportDataToExcel<T extends Record<string, any>>({
  fileName = 'table.xlsx',
  ...rest
}: ExportFromDataOptions<T>): void {
  const workbook = buildWorkbookFromData(rest);
  XLSX.writeFile(workbook, ensureXlsxExtension(fileName));
}

export interface ExportFromDomOptions {
  /** The actual <table> DOM element to export (e.g. from a ref). */
  table: HTMLTableElement;
  /** Output file name. `.xlsx` is appended automatically if missing. */
  fileName?: string;
  /** Name of the worksheet tab. */
  sheetName?: string;
  /**
   * One or more rows inserted above the table's first row — e.g. a title,
   * description, or a summary of filters applied to the table before
   * exporting. See `ExtraRow`.
   */
  extraRows?: (ExtraRow | string)[];
  /**
   * Per-column styling, positioned by column index (0-based, matching the
   * visible column order in `table`). `columnStyles[0]` colors the first
   * column, `columnStyles[1]` the second, and so on. `undefined` entries
   * are skipped, so you only need to specify the columns you want colored.
   */
  columnStyles?: (CellStyle | undefined)[];
}

/**
 * Builds the workbook for `exportDomTableToExcel` without triggering a
 * download. See `buildWorkbookFromData` for why this is exported.
 */
export function buildWorkbookFromTable({
  table,
  sheetName = 'Sheet1',
  extraRows,
  columnStyles,
}: Omit<ExportFromDomOptions, 'fileName'>): XLSX.WorkBook {
  const worksheet = XLSX.utils.table_to_sheet(table);

  if (columnStyles && worksheet['!ref']) {
    const range = XLSX.utils.decode_range(worksheet['!ref'] as string);
    columnStyles.forEach((style, colIndex) => {
      if (!style) return;
      applyColumnStyle(worksheet, colIndex, range.s.r, range.e.r, style);
    });
  }

  const columnCount = worksheet['!ref']
    ? XLSX.utils.decode_range(worksheet['!ref'] as string).e.c + 1
    : (columnStyles?.length ?? 0);

  prependExtraRows(worksheet, normalizeExtraRows(extraRows), columnCount);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return workbook;
}

/**
 * Exports an existing rendered <table> element to a downloadable .xlsx file,
 * preserving the visible rows/columns exactly as the DOM shows them.
 */
export function exportDomTableToExcel({
  fileName = 'table.xlsx',
  ...rest
}: ExportFromDomOptions): void {
  const workbook = buildWorkbookFromTable(rest);
  XLSX.writeFile(workbook, ensureXlsxExtension(fileName));
}

function ensureXlsxExtension(name: string): string {
  return name.toLowerCase().endsWith('.xlsx') ? name : `${name}.xlsx`;
}
