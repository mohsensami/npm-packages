import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { createRef } from 'react';
import * as exportModule from './exportTable';
import { useExportTableToExcel } from './useExportTableToExcel';

vi.mock('./exportTable', () => ({
  exportDataToExcel: vi.fn(),
  exportDomTableToExcel: vi.fn(),
}));

describe('useExportTableToExcel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports from data when no tableRef is mounted', () => {
    const data = [{ name: 'Ada' }];
    const { result } = renderHook(() => useExportTableToExcel({ data, fileName: 'a.xlsx' }));

    result.current.exportToExcel();

    expect(exportModule.exportDataToExcel).toHaveBeenCalledWith({
      data,
      columns: undefined,
      fileName: 'a.xlsx',
      sheetName: 'Sheet1',
    });
    expect(exportModule.exportDomTableToExcel).not.toHaveBeenCalled();
  });

  it('prefers a mounted tableRef over data when both are provided', () => {
    const tableEl = document.createElement('table');
    const tableRef = createRef<HTMLTableElement>();
    // React 19: RefObject.current is mutable, no cast/expect-error needed
    tableRef.current = tableEl;

    const { result } = renderHook(() =>
      useExportTableToExcel({ data: [{ name: 'Ada' }], tableRef, fileName: 'b.xlsx' })
    );

    result.current.exportToExcel();

    expect(exportModule.exportDomTableToExcel).toHaveBeenCalledWith({
      table: tableEl,
      fileName: 'b.xlsx',
      sheetName: 'Sheet1',
    });
    expect(exportModule.exportDataToExcel).not.toHaveBeenCalled();
  });

  it('throws when neither data nor a mounted tableRef is given', () => {
    const { result } = renderHook(() => useExportTableToExcel());
    expect(() => result.current.exportToExcel()).toThrow(
      'useExportTableToExcel: provide either `data` or `tableRef`.'
    );
  });

  it('allows overriding fileName/sheetName per call', () => {
    const data = [{ name: 'Ada' }];
    const { result } = renderHook(() => useExportTableToExcel({ data }));

    result.current.exportToExcel({ fileName: 'override.xlsx', sheetName: 'Custom' });

    expect(exportModule.exportDataToExcel).toHaveBeenCalledWith({
      data,
      columns: undefined,
      fileName: 'override.xlsx',
      sheetName: 'Custom',
      extraRows: undefined,
    });
  });

  it('passes extraRows through for a data export', () => {
    const data = [{ name: 'Ada' }];
    const { result } = renderHook(() =>
      useExportTableToExcel({ data, extraRows: ['Filters: Status = Active'] })
    );

    result.current.exportToExcel();

    expect(exportModule.exportDataToExcel).toHaveBeenCalledWith({
      data,
      columns: undefined,
      fileName: 'table.xlsx',
      sheetName: 'Sheet1',
      extraRows: ['Filters: Status = Active'],
    });
  });

  it('passes extraRows and columnStyles through for a tableRef export', () => {
    const tableEl = document.createElement('table');
    const tableRef = createRef<HTMLTableElement>();
    tableRef.current = tableEl;
    const columnStyles = [undefined, { fill: '#DFF5E1' }];

    const { result } = renderHook(() =>
      useExportTableToExcel({
        tableRef,
        extraRows: ['Exported today'],
        columnStyles,
      })
    );

    result.current.exportToExcel();

    expect(exportModule.exportDomTableToExcel).toHaveBeenCalledWith({
      table: tableEl,
      fileName: 'table.xlsx',
      sheetName: 'Sheet1',
      extraRows: ['Exported today'],
      columnStyles,
    });
  });
});
