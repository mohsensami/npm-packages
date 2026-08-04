import React from 'react';
import type { RefObject, ReactNode } from 'react';
import { useExportTableToExcel } from './useExportTableToExcel';
import type { ExportColumn } from './types';

export interface ExportTableButtonProps<T extends Record<string, any>> {
  /** Row data to export (ignored if `tableRef` is provided and mounted). */
  data?: T[];
  /** Optional column definitions used only with `data`. */
  columns?: ExportColumn<T>[];
  /** Ref to a rendered <table> element. Takes priority over `data`. */
  tableRef?: RefObject<HTMLTableElement>;
  /** Output file name, e.g. "report.xlsx". */
  fileName?: string;
  /** Worksheet tab name. */
  sheetName?: string;
  /** Button label / content. Defaults to "Download as Excel". */
  children?: ReactNode;
  className?: string;
}

/**
 * Drop-in button that downloads a table as an .xlsx file when clicked.
 *
 * @example Data-driven
 * <ExportTableButton data={users} columns={[{ header: 'Name', accessor: 'name' }]} fileName="users.xlsx" />
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
  children = 'Download as Excel',
  className,
}: ExportTableButtonProps<T>) {
  const { exportToExcel } = useExportTableToExcel<T>({
    data,
    columns,
    tableRef,
    fileName,
    sheetName,
  });

  return (
    <button type="button" className={className} onClick={() => exportToExcel()}>
      {children}
    </button>
  );
}
