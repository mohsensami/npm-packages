import { useCallback, type RefObject } from 'react';
import { exportDataToExcel, exportDomTableToExcel } from './exportTable';
import type { ExportColumn, ExtraRow, CellStyle } from './types';

export interface UseExportTableToExcelOptions<T extends Record<string, any>> {
  /** Row data to export. Ignored if `tableRef` is also provided and mounted. */
  data?: T[];
  /** Optional column definitions used only with `data`. */
  columns?: ExportColumn<T>[];
  /** Ref to a rendered <table> element. Takes priority over `data` when set. */
  tableRef?: RefObject<HTMLTableElement | null>;
  /** Default output file name. */
  fileName?: string;
  /** Default worksheet name. */
  sheetName?: string;
  /**
   * One or more rows inserted above the header/first row — e.g. a title,
   * description, or a summary of filters applied to the table.
   */
  extraRows?: (ExtraRow | string)[];
  /** Per-column styling, positioned by column index. Only used with `tableRef`. */
  columnStyles?: (CellStyle | undefined)[];
}

/**
 * Hook that returns an `exportToExcel` function for downloading a table
 * (either DOM-rendered or data-driven) as an .xlsx file.
 *
 * @example
 * const tableRef = useRef<HTMLTableElement>(null);
 * const { exportToExcel } = useExportTableToExcel({ tableRef, fileName: 'report.xlsx' });
 * <button onClick={() => exportToExcel()}>Download</button>
 * <table ref={tableRef}>...</table>
 */
export function useExportTableToExcel<T extends Record<string, any>>(
  options?: UseExportTableToExcelOptions<T>
) {
  const exportToExcel = useCallback(
    (overrides?: { fileName?: string; sheetName?: string }) => {
      const fileName = overrides?.fileName ?? options?.fileName ?? 'table.xlsx';
      const sheetName = overrides?.sheetName ?? options?.sheetName ?? 'Sheet1';

      if (options?.tableRef?.current) {
        exportDomTableToExcel({
          table: options.tableRef.current,
          fileName,
          sheetName,
          extraRows: options.extraRows,
          columnStyles: options.columnStyles,
        });
        return;
      }

      if (options?.data) {
        exportDataToExcel({
          data: options.data,
          columns: options.columns,
          fileName,
          sheetName,
          extraRows: options.extraRows,
        });
        return;
      }

      throw new Error('useExportTableToExcel: provide either `data` or `tableRef`.');
    },
    [
      options?.data,
      options?.columns,
      options?.tableRef,
      options?.fileName,
      options?.sheetName,
      options?.extraRows,
      options?.columnStyles,
    ]
  );

  return { exportToExcel };
}
