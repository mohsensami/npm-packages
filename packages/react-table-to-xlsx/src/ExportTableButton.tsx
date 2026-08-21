import React from 'react';
import type { RefObject, ReactNode } from 'react';
import { useExportTableToExcel } from './useExportTableToExcel';
import type { ExportColumn, ExtraRow, CellStyle } from './types';

export interface ExportTableButtonProps<T extends Record<string, any>> {
  /** Row data to export (ignored if `tableRef` is provided and mounted). */
  data?: T[];
  /** Optional column definitions used only with `data`. Supports per-column `style`. */
  columns?: ExportColumn<T>[];
  /** Ref to a rendered <table> element. Takes priority over `data`. */
  tableRef?: RefObject<HTMLTableElement | null>;
  /** Output file name, e.g. "report.xlsx". */
  fileName?: string;
  /** Worksheet tab name. */
  sheetName?: string;
  /**
   * One or more rows inserted above the header/first row — e.g. a title,
   * description, or a summary of filters applied to the table.
   */
  extraRows?: (ExtraRow | string)[];
  /**
   * Per-column styling, positioned by column index. Only used with `tableRef`
   * (with `data`, set `style` on each entry in `columns` instead).
   */
  columnStyles?: (CellStyle | undefined)[];
  /** Button label / content. Defaults to "Download as Excel". */
  children?: ReactNode;
  className?: string;
}

/**
 * Drop-in button that downloads a table as an .xlsx file when clicked.
 *
 * @example Data-driven, with colored columns
 * <ExportTableButton
 *   data={users}
 *   columns={[
 *     { header: 'Name', accessor: 'name', style: { fill: '#DDEBFF' } },
 *     { header: 'Status', accessor: 'status', style: { fill: '#DFF5E1', bold: true } },
 *   ]}
 *   extraRows={['Filters: Status = Active']}
 *   fileName="users.xlsx"
 * />
 *
 * @example DOM-driven
 * <ExportTableButton tableRef={tableRef} fileName="report.xlsx" />
 * <table ref={tableRef}>...</table>
 */
export function ExportTableButton<T extends Record<string, any>>({
  data,
  columns,
  tableRef,
  fileName,
  sheetName,
  extraRows,
  columnStyles,
  children = 'Download as Excel',
  className,
}: ExportTableButtonProps<T>) {
  const { exportToExcel } = useExportTableToExcel<T>({
    data,
    columns,
    tableRef,
    fileName,
    sheetName,
    extraRows,
    columnStyles,
  });

  return (
    <button type="button" className={className} onClick={() => exportToExcel()}>
      {children}
    </button>
  );
}
