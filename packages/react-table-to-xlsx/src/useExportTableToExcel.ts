import { useCallback, type RefObject } from 'react';
import { exportDataToExcel, exportDomTableToExcel } from './exportTable';
import type { ExportColumn } from './types';

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
        exportDomTableToExcel({ table: options.tableRef.current, fileName, sheetName });
        return;
      }

      if (options?.data) {
        exportDataToExcel({ data: options.data, columns: options.columns, fileName, sheetName });
        return;
      }

      throw new Error('useExportTableToExcel: provide either `data` or `tableRef`.');
    },
    [options?.data, options?.columns, options?.tableRef, options?.fileName, options?.sheetName]
  );

  return { exportToExcel };
}
