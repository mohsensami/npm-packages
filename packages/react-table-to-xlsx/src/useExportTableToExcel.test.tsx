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
    // @ts-expect-error assigning to a readonly ref for test purposes
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
    });
  });
});
