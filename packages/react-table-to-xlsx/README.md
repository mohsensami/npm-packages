# react-table-to-xlsx

React + TypeScript utilities and components for exporting HTML tables (or plain data arrays) to a downloadable `.xlsx` file, right in the browser. Built on top of [SheetJS (`xlsx`)](https://www.npmjs.com/package/xlsx).

## Install

```bash
npm install react-table-to-xlsx
```

`react` (>=16.8, for hooks) is a peer dependency and `xlsx` is bundled as a direct dependency.

## What you get

- `exportDataToExcel()` / `exportDomTableToExcel()` — plain functions, no React required
- `useExportTableToExcel()` — a hook returning an `exportToExcel()` function
- `<ExportTableButton />` — a ready-made button component

You can export in two ways:

1. **From a rendered `<table>` element** (via a ref) — exports exactly what's on screen.
2. **From a data array** — exports your raw data, with optional column mapping/formatting, even if nothing is rendered as a `<table>` at all.

## Usage

### 1. Button next to a real `<table>`

```tsx
import { useRef } from 'react';
import { ExportTableButton } from 'react-table-to-xlsx';

function UsersTable() {
  const tableRef = useRef<HTMLTableElement>(null);

  return (
    <div>
      <ExportTableButton tableRef={tableRef} fileName="users.xlsx">
        Download as Excel
      </ExportTableButton>

      <table ref={tableRef}>
        <thead>
          <tr><th>Name</th><th>Email</th></tr>
        </thead>
        <tbody>
          <tr><td>Ada Lovelace</td><td>ada@example.com</td></tr>
          <tr><td>Alan Turing</td><td>alan@example.com</td></tr>
        </tbody>
      </table>
    </div>
  );
}
```

### 2. Button driven by data (no DOM table required)

```tsx
import { ExportTableButton } from 'react-table-to-xlsx';

interface User {
  id: number;
  fullName: string;
  email: string;
  createdAt: string;
}

const users: User[] = [
  { id: 1, fullName: 'Ada Lovelace', email: 'ada@example.com', createdAt: '2024-01-01' },
  { id: 2, fullName: 'Alan Turing', email: 'alan@example.com', createdAt: '2024-02-01' },
];

function App() {
  return (
    <ExportTableButton
      data={users}
      columns={[
        { header: 'Full Name', accessor: 'fullName' },
        { header: 'Email', accessor: 'email' },
        { header: 'Joined', accessor: (row) => new Date(row.createdAt).toLocaleDateString() },
      ]}
      fileName="users-export.xlsx"
      sheetName="Users"
    />
  );
}
```

### 3. Using the hook directly (custom trigger, e.g. a menu item)

```tsx
import { useRef } from 'react';
import { useExportTableToExcel } from 'react-table-to-xlsx';

function Report() {
  const tableRef = useRef<HTMLTableElement>(null);
  const { exportToExcel } = useExportTableToExcel({ tableRef, fileName: 'report.xlsx' });

  return (
    <>
      <button onClick={() => exportToExcel({ fileName: 'custom-name.xlsx' })}>
        Export
      </button>
      <table ref={tableRef}>{/* ... */}</table>
    </>
  );
}
```

### 4. Plain functions (no hook/component, e.g. from an event handler outside React)

```ts
import { exportDataToExcel, exportDomTableToExcel } from 'react-table-to-xlsx';

exportDataToExcel({
  data: users,
  fileName: 'users.xlsx',
});

exportDomTableToExcel({
  table: document.querySelector('table')!,
  fileName: 'table.xlsx',
});
```

## API

### `exportDataToExcel(options)`
| Option | Type | Description |
|---|---|---|
| `data` | `T[]` | Row objects to export (required) |
| `columns` | `ExportColumn<T>[]` | Optional header/accessor mapping |
| `fileName` | `string` | Defaults to `table.xlsx` |
| `sheetName` | `string` | Defaults to `Sheet1` |

### `exportDomTableToExcel(options)`
| Option | Type | Description |
|---|---|---|
| `table` | `HTMLTableElement` | The table element to export (required) |
| `fileName` | `string` | Defaults to `table.xlsx` |
| `sheetName` | `string` | Defaults to `Sheet1` |

### `useExportTableToExcel(options)`
Accepts the same options as above (either `data`+`columns` or `tableRef`), returns `{ exportToExcel }`. `exportToExcel(overrides?)` accepts optional per-call `fileName`/`sheetName` overrides.

### `<ExportTableButton />`
Accepts the same props as the hook, plus `children` (button label) and `className`.

## Build locally

```bash
npm install
npm run build   # outputs CJS + ESM + .d.ts to dist/
```

## Testing

Tests use [Vitest](https://vitest.dev) + [React Testing Library](https://testing-library.com/react), with `xlsx` mocked so no real files are written during tests.

```bash
npm install
npm test              # run once
npm run test:watch    # watch mode
npm run test:coverage # with coverage report
```

Test files live next to the code they cover: `src/exportTable.test.ts`, `src/useExportTableToExcel.test.tsx`, `src/ExportTableButton.test.tsx`.

## License

MIT
