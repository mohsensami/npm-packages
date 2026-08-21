# react-table-to-xlsx

React + TypeScript utilities and components for exporting HTML tables (or plain data arrays) to a downloadable `.xlsx` file, right in the browser. Built on top of [`xlsx-js-style`](https://www.npmjs.com/package/xlsx-js-style) (a drop-in [SheetJS](https://www.npmjs.com/package/xlsx)-compatible engine with cell styling support), so exported files can have **colored columns, bold headers, and custom rows** — not just plain data.

## Install

```bash
npm install react-table-to-xlsx
```

`react` (>=16.8, for hooks) is a peer dependency and `xlsx-js-style` is bundled as a direct dependency.

## What you get

- `exportDataToExcel()` / `exportDomTableToExcel()` — plain functions, no React required
- `useExportTableToExcel()` — a hook returning an `exportToExcel()` function
- `<ExportTableButton />` — a ready-made button component

You can export in two ways:

1. **From a rendered `<table>` element** (via a ref) — exports exactly what's on screen.
2. **From a data array** — exports your raw data, with optional column mapping/formatting, even if nothing is rendered as a `<table>` at all.

Both ways support column colors and extra rows above the table — see below.

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

## Coloring columns

Colors are hex strings, with or without a leading `#` (e.g. `'#4F46E5'` or `'4F46E5'`).

### Data-driven export — set `style` on each column

```tsx
<ExportTableButton
  data={users}
  columns={[
    {
      header: 'Name',
      accessor: 'fullName',
      // Data cells get a light fill; the header cell gets a bolder one.
      style: { fill: '#DDEBFF', header: { fill: '#1D4ED8', fontColor: '#FFFFFF', bold: true } },
    },
    {
      header: 'Status',
      accessor: 'status',
      style: { fill: '#DFF5E1', bold: true }, // no `header` override → same style everywhere
    },
  ]}
  fileName="users.xlsx"
/>
```

- `style.fill` / `style.fontColor` / `style.bold` / `style.italic` / `style.align` apply to every data cell in that column.
- `style.header` optionally overrides any of those just for the header cell (row 1). Anything not set on `header` falls back to the column-level style.

### DOM-table export — `columnStyles`, positioned by column index

```tsx
<ExportTableButton
  tableRef={tableRef}
  fileName="report.xlsx"
  columnStyles={[
    undefined,                 // 1st column: no styling
    { fill: '#DFF5E1' },       // 2nd column ("Status" in the table below)
    { fill: '#FEE2E2', bold: true }, // 3rd column
  ]}
/>
```

`columnStyles[i]` colors the column at index `i` (0-based), matching the visible column order of the `<table>`. Skip a column with `undefined`.

## Adding a custom row above the table (description, applied filters, a title, ...)

Use `extraRows` — works with both data-driven and DOM-table exports. A plain string becomes one row, merged across the full width of the sheet:

```tsx
<ExportTableButton
  data={users}
  columns={columns}
  extraRows={[
    'Filters: Status = Active, Region = EU',
  ]}
  fileName="filtered-users.xlsx"
/>
```

Pass an object instead of a string for more control — multiple rows, styling, or several values in one row instead of a merged single cell:

```tsx
<ExportTableButton
  data={users}
  columns={columns}
  extraRows={[
    { values: 'Monthly Active Users Report', bold: true, fill: '#FDE68A', align: 'center' },
    { values: 'Filters: Status = Active · Exported ' + new Date().toLocaleDateString() },
    { values: ['Generated by', 'Admin'], merge: false }, // two separate cells, not merged
  ]}
  fileName="report.xlsx"
/>
```

- `values`: a `string` (merged across the sheet width) or an array of `string | number` (one value per cell, left to right).
- `merge`: defaults to `true` for a string, `false` for an array — override either way.
- `bold` / `italic` / `fill` / `fontColor` / `align`: same styling options as column colors.

The header row (and all data rows) are automatically pushed down to make room — you don't need to account for the offset yourself.

## API

### `ExportColumn<T>`
| Field | Type | Description |
|---|---|---|
| `header` | `string` | Column title, shown in row 1 |
| `accessor` | `keyof T \| ((row: T) => unknown)` | Key on the row, or a function deriving the value |
| `style` | `ExportColumnStyle` | Optional coloring/formatting for this column, see above |

### `ExtraRow`
| Field | Type | Description |
|---|---|---|
| `values` | `string \| (string \| number)[]` | Row content — a string merges across the sheet, an array is per-cell |
| `merge` | `boolean` | Force merge on/off; defaults based on `values`'s type |
| `fill` / `fontColor` / `bold` / `italic` / `align` | — | Same styling options as `CellStyle` |

### `exportDataToExcel(options)`
| Option | Type | Description |
|---|---|---|
| `data` | `T[]` | Row objects to export (required) |
| `columns` | `ExportColumn<T>[]` | Optional header/accessor/style mapping |
| `fileName` | `string` | Defaults to `table.xlsx` |
| `sheetName` | `string` | Defaults to `Sheet1` |
| `extraRows` | `(ExtraRow \| string)[]` | Rows inserted above the header |

### `exportDomTableToExcel(options)`
| Option | Type | Description |
|---|---|---|
| `table` | `HTMLTableElement` | The table element to export (required) |
| `fileName` | `string` | Defaults to `table.xlsx` |
| `sheetName` | `string` | Defaults to `Sheet1` |
| `extraRows` | `(ExtraRow \| string)[]` | Rows inserted above the table's first row |
| `columnStyles` | `(CellStyle \| undefined)[]` | Per-column coloring, by column index |

### `useExportTableToExcel(options)`
Accepts the same options as above (either `data`+`columns` or `tableRef`+`columnStyles`, plus `extraRows` either way), returns `{ exportToExcel }`. `exportToExcel(overrides?)` accepts optional per-call `fileName`/`sheetName` overrides.

### `<ExportTableButton />`
Accepts the same props as the hook, plus `children` (button label) and `className`.

## Build locally

```bash
npm install
npm run build   # outputs CJS + ESM + .d.ts to dist/
```

## Testing

Tests use [Vitest](https://vitest.dev) + [React Testing Library](https://testing-library.com/react). The core export logic (`exportTable.test.ts`) runs against the real `xlsx-js-style` engine via internal `buildWorkbookFrom*` helpers, so cell values, colors, and merges are verified end-to-end without needing to fake the library or trigger an actual browser download.

```bash
npm install
npm test              # run once
npm run test:watch    # watch mode
npm run test:coverage # with coverage report
```

Test files live next to the code they cover: `src/exportTable.test.ts`, `src/useExportTableToExcel.test.tsx`, `src/ExportTableButton.test.tsx`.

## Changelog

### 1.1.0
- **New:** per-column coloring/formatting — `style` on `ExportColumn` for data-driven exports, `columnStyles` for DOM-table exports (fill color, font color, bold, italic, alignment; the header cell can be styled separately from data cells).
- **New:** `extraRows` — insert one or more custom rows (a title, description, or a summary of applied filters) above the header/first row, with optional styling and merging.
- **Changed:** switched the underlying engine from `xlsx` to `xlsx-js-style` (drop-in, same core API) to support cell styling.

## License

MIT
