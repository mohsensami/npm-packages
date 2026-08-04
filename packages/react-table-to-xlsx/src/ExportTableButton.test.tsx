import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as exportModule from './exportTable';
import { ExportTableButton } from './ExportTableButton';

vi.mock('./exportTable', () => ({
  exportDataToExcel: vi.fn(),
  exportDomTableToExcel: vi.fn(),
}));

describe('ExportTableButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the default label and triggers export on click', () => {
    const data = [{ name: 'Ada' }];
    render(<ExportTableButton data={data} fileName="users.xlsx" />);

    const button = screen.getByRole('button', { name: 'Download as Excel' });
    fireEvent.click(button);

    expect(exportModule.exportDataToExcel).toHaveBeenCalledWith({
      data,
      columns: undefined,
      fileName: 'users.xlsx',
      sheetName: 'Sheet1',
    });
  });

  it('renders custom children as the button label', () => {
    render(<ExportTableButton data={[]}>Export now</ExportTableButton>);
    expect(screen.getByRole('button', { name: 'Export now' })).toBeInTheDocument();
  });
});
