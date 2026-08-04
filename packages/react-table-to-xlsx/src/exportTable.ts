import * as XLSX from 'xlsx';
import type { ExportColumn } from './types';

export interface ExportFromDataOptions<T> {
  /** Array of row objects to export. */
  data: T[];
  /** Optional column definitions to control headers, order, and formatting. */
  columns?: ExportColumn<T>[];
  /** Output file name. `.xlsx` is appended automatically if missing. */
  fileName?: string;
  /** Name of the worksheet tab. */
  sheetName?: string;
}

/**
 * Exports an array of plain objects to a downloadable .xlsx file.
 * Use this when your table is rendered from data rather than a raw <table>.
 */
export function exportDataToExcel<T extends Record<string, any>>({
  data,
  columns,
  fileName = 'table.xlsx',
  sheetName = 'Sheet1',
}: ExportFromDataOptions<T>): void {
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
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, ensureXlsxExtension(fileName));
}

export interface ExportFromDomOptions {
  /** The actual <table> DOM element to export (e.g. from a ref). */
  table: HTMLTableElement;
  /** Output file name. `.xlsx` is appended automatically if missing. */
  fileName?: string;
  /** Name of the worksheet tab. */
  sheetName?: string;
}

/**
 * Exports an existing rendered <table> element to a downloadable .xlsx file,
 * preserving the visible rows/columns exactly as the DOM shows them.
 */
export function exportDomTableToExcel({
  table,
  fileName = 'table.xlsx',
  sheetName = 'Sheet1',
}: ExportFromDomOptions): void {
  const worksheet = XLSX.utils.table_to_sheet(table);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, ensureXlsxExtension(fileName));
}

function ensureXlsxExtension(name: string): string {
  return name.toLowerCase().endsWith('.xlsx') ? name : `${name}.xlsx`;
}
