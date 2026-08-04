/**
 * Describes a single exported column.
 * - `header` is the column title that will appear in row 1 of the sheet.
 * - `accessor` is either the key on the row object, or a function that
 *   derives a value from the row (useful for computed/formatted columns).
 */
export interface ExportColumn<T> {
  header: string;
  accessor: keyof T | ((row: T) => unknown);
}
