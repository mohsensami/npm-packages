import React, { RefObject, ReactNode } from 'react';

/**
 * Cell coloring/formatting applied when exporting to .xlsx. Colors are hex
 * strings, with or without a leading `#` (e.g. `'#4F46E5'` or `'4F46E5'`).
 */
interface CellStyle {
    /** Background (fill) color for the cell. */
    fill?: string;
    /** Font color for the cell's text. */
    fontColor?: string;
    bold?: boolean;
    italic?: boolean;
    /** Horizontal text alignment. */
    align?: 'left' | 'center' | 'right';
}
/**
 * Per-column styling used with data-driven exports (`exportDataToExcel`,
 * or `ExportColumn.style`). `header` lets the header cell (row 1) look
 * different from the column's data cells — e.g. a bold colored header with
 * plain data cells below it. Anything not set on `header` falls back to
 * the column-level style.
 */
interface ExportColumnStyle extends CellStyle {
    header?: CellStyle;
}
/**
 * Describes a single exported column.
 * - `header` is the column title that will appear in row 1 of the sheet.
 * - `accessor` is either the key on the row object, or a function that
 *   derives a value from the row (useful for computed/formatted columns).
 * - `style` optionally colors/formats every cell in this column, including
 *   its header.
 */
interface ExportColumn<T> {
    header: string;
    accessor: keyof T | ((row: T) => unknown);
    style?: ExportColumnStyle;
}
/**
 * A single row inserted above the sheet's header row — e.g. a title,
 * a description, or a summary of filters that were applied to the table
 * before exporting. Not part of the exported `data`/table rows themselves.
 */
interface ExtraRow extends CellStyle {
    /**
     * Cell values for this row. A plain string is treated as one label that
     * spans (merges into) the full width of the sheet — handy for a title or
     * a "Filters: Status = Active, Region = EU" note. An array gives one
     * value per cell instead, left-to-right starting at column A.
     */
    values: string | (string | number)[];
    /**
     * Merge this row's cells into a single cell spanning the full column
     * width of the sheet. Defaults to `true` when `values` is a plain
     * string, and `false` when it's an array.
     */
    merge?: boolean;
}

interface ExportFromDataOptions<T> {
    /** Array of row objects to export. */
    data: T[];
    /** Optional column definitions to control headers, order, and formatting. */
    columns?: ExportColumn<T>[];
    /** Output file name. `.xlsx` is appended automatically if missing. */
    fileName?: string;
    /** Name of the worksheet tab. */
    sheetName?: string;
    /**
     * One or more rows inserted above the header row — e.g. a title,
     * description, or a summary of filters applied to the table before
     * exporting. See `ExtraRow`.
     */
    extraRows?: (ExtraRow | string)[];
}
/**
 * Exports an array of plain objects to a downloadable .xlsx file.
 * Use this when your table is rendered from data rather than a raw <table>.
 */
declare function exportDataToExcel<T extends Record<string, any>>({ fileName, ...rest }: ExportFromDataOptions<T>): void;
interface ExportFromDomOptions {
    /** The actual <table> DOM element to export (e.g. from a ref). */
    table: HTMLTableElement;
    /** Output file name. `.xlsx` is appended automatically if missing. */
    fileName?: string;
    /** Name of the worksheet tab. */
    sheetName?: string;
    /**
     * One or more rows inserted above the table's first row — e.g. a title,
     * description, or a summary of filters applied to the table before
     * exporting. See `ExtraRow`.
     */
    extraRows?: (ExtraRow | string)[];
    /**
     * Per-column styling, positioned by column index (0-based, matching the
     * visible column order in `table`). `columnStyles[0]` colors the first
     * column, `columnStyles[1]` the second, and so on. `undefined` entries
     * are skipped, so you only need to specify the columns you want colored.
     */
    columnStyles?: (CellStyle | undefined)[];
}
/**
 * Exports an existing rendered <table> element to a downloadable .xlsx file,
 * preserving the visible rows/columns exactly as the DOM shows them.
 */
declare function exportDomTableToExcel({ fileName, ...rest }: ExportFromDomOptions): void;

interface UseExportTableToExcelOptions<T extends Record<string, any>> {
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
    /**
     * One or more rows inserted above the header/first row — e.g. a title,
     * description, or a summary of filters applied to the table.
     */
    extraRows?: (ExtraRow | string)[];
    /** Per-column styling, positioned by column index. Only used with `tableRef`. */
    columnStyles?: (CellStyle | undefined)[];
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
declare function useExportTableToExcel<T extends Record<string, any>>(options?: UseExportTableToExcelOptions<T>): {
    exportToExcel: (overrides?: {
        fileName?: string;
        sheetName?: string;
    }) => void;
};

interface ExportTableButtonProps<T extends Record<string, any>> {
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
declare function ExportTableButton<T extends Record<string, any>>({ data, columns, tableRef, fileName, sheetName, extraRows, columnStyles, children, className, }: ExportTableButtonProps<T>): React.JSX.Element;

export { type CellStyle, type ExportColumn, type ExportColumnStyle, type ExportFromDataOptions, type ExportFromDomOptions, ExportTableButton, type ExportTableButtonProps, type ExtraRow, type UseExportTableToExcelOptions, exportDataToExcel, exportDomTableToExcel, useExportTableToExcel };
