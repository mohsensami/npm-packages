import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as XLSX from 'xlsx';
import { exportDataToExcel, exportDomTableToExcel } from './exportTable';

vi.mock('xlsx', () => ({
  utils: {
    json_to_sheet: vi.fn(() => ({ mockSheet: true })),
    table_to_sheet: vi.fn(() => ({ mockSheet: true })),
    book_new: vi.fn(() => ({ mockBook: true })),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

describe('exportDataToExcel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports plain data rows without a columns mapping', () => {
    const data = [{ name: 'Ada', email: 'ada@example.com' }];
    exportDataToExcel({ data, fileName: 'users.xlsx' });

    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith(data);
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(
      { mockBook: true },
      { mockSheet: true },
      'Sheet1'
    );
    expect(XLSX.writeFile).toHaveBeenCalledWith({ mockBook: true }, 'users.xlsx');
  });

  it('maps columns using accessor keys and accessor functions', () => {
    const data = [{ id: 1, fullName: 'Ada Lovelace', createdAt: '2024-01-01' }];
    exportDataToExcel({
      data,
      columns: [
        { header: 'Name', accessor: 'fullName' },
        { header: 'Year', accessor: (row) => row.createdAt.slice(0, 4) },
      ],
      fileName: 'report',
    });

    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith([
      { Name: 'Ada Lovelace', Year: '2024' },
    ]);
    // fileName should get .xlsx appended automatically when missing
    expect(XLSX.writeFile).toHaveBeenCalledWith({ mockBook: true }, 'report.xlsx');
  });
});

describe('exportDomTableToExcel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports an existing DOM table element', () => {
    const table = document.createElement('table');
    exportDomTableToExcel({ table, fileName: 'dom-table.xlsx' });

    expect(XLSX.utils.table_to_sheet).toHaveBeenCalledWith(table);
    expect(XLSX.writeFile).toHaveBeenCalledWith({ mockBook: true }, 'dom-table.xlsx');
  });
});
