import { useRef } from 'react';
import { ExportTableButton, useExportTableToExcel } from 'react-table-to-xlsx';
import type { ExportColumn } from 'react-table-to-xlsx';

interface User {
  name: string;
  email: string;
  role: string;
}

const users: User[] = [
  { name: 'Ada Lovelace', email: 'ada@example.com', role: 'Engineer' },
  { name: 'Grace Hopper', email: 'grace@example.com', role: 'Admiral' },
  { name: 'Alan Turing', email: 'alan@example.com', role: 'Researcher' },
];

const columns: ExportColumn<User>[] = [
  { header: 'Full name', accessor: 'name' },
  { header: 'Email', accessor: 'email' },
  { header: 'Role', accessor: (row) => row.role.toUpperCase() },
];

/** Same columns, but each one gets its own color and the header row is bold + white text. */
const styledColumns: ExportColumn<User>[] = [
  {
    header: 'Full name',
    accessor: 'name',
    style: { fill: '#DDEBFF', header: { fill: '#1D4ED8', fontColor: '#FFFFFF', bold: true } },
  },
  {
    header: 'Email',
    accessor: 'email',
    style: { fill: '#FDE68A', header: { fill: '#B45309', fontColor: '#FFFFFF', bold: true } },
  },
  {
    header: 'Role',
    accessor: (row) => row.role.toUpperCase(),
    style: { fill: '#DFF5E1', header: { fill: '#15803D', fontColor: '#FFFFFF', bold: true } },
  },
];

/**
 * Demonstrates the two ways to use `react-table-to-xlsx`:
 *
 * 1. Data-driven — export a plain array of objects, no table in the DOM needed.
 * 2. DOM-driven — export an actual rendered <table>, via a ref.
 *
 * Each shows both the ready-made `<ExportTableButton>` and the underlying
 * `useExportTableToExcel()` hook for a custom trigger.
 */
export function TableToXlsxDemo() {
  // --- Usage 2: DOM-driven, via the hook ---
  const tableRef = useRef<HTMLTableElement>(null);
  const { exportToExcel: exportTable } = useExportTableToExcel<User>({
    tableRef,
    fileName: 'users-table.xlsx',
    sheetName: 'Users',
  });

  return (
    <section style={{ border: '1px solid #ddd', borderRadius: 8, padding: 24 }}>
      <h2>react-table-to-xlsx</h2>
      <p style={{ color: '#666' }}>Export data or a rendered table to a downloadable .xlsx file.</p>

      <h3>1. Data-driven — {'<ExportTableButton data={...} />'}</h3>
      <p>No table needs to be rendered at all; the columns just describe the export.</p>
      <ExportTableButton data={users} columns={columns} fileName="users-data.xlsx" sheetName="Users">
        Download users (from data)
      </ExportTableButton>

      <h3 style={{ marginTop: 24 }}>2. DOM-driven — useExportTableToExcel() + a real {'<table>'}</h3>
      <table ref={tableRef} border={1} cellPadding={6} style={{ borderCollapse: 'collapse', marginBottom: 12 }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.email}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" onClick={() => exportTable()}>
        Download users (from table)
      </button>

      <h3 style={{ marginTop: 24 }}>3. Column colors + a filters/description row</h3>
      <p>
        Each column gets its own fill color (with a bolder color on just the header cell), and a
        merged note row is inserted above the header describing what's in the export.
      </p>
      <ExportTableButton
        data={users}
        columns={styledColumns}
        fileName="users-styled.xlsx"
        sheetName="Users"
        extraRows={[
          { values: 'Active users report', bold: true, fill: '#E5E7EB', align: 'center' },
          'Filters: Role = Engineer, Admiral, Researcher · Exported ' + new Date().toLocaleDateString(),
        ]}
      >
        Download users (colored + filter note)
      </ExportTableButton>
    </section>
  );
}
