/**
 * Cell coloring/formatting applied when exporting to .xlsx. Colors are hex
 * strings, with or without a leading `#` (e.g. `'#4F46E5'` or `'4F46E5'`).
 */
export interface CellStyle {
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
export interface ExportColumnStyle extends CellStyle {
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
export interface ExportColumn<T> {
  header: string;
  accessor: keyof T | ((row: T) => unknown);
  style?: ExportColumnStyle;
}

/**
 * A single row inserted above the sheet's header row — e.g. a title,
 * a description, or a summary of filters that were applied to the table
 * before exporting. Not part of the exported `data`/table rows themselves.
 */
export interface ExtraRow extends CellStyle {
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
