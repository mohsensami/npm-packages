import * as XLSX from 'xlsx-js-style';
import type { CellStyle, ExtraRow } from './types';

/** Normalizes `'#4F46E5'` / `'4f46e5'` into the 6-digit uppercase hex xlsx-js-style expects. */
function normalizeHex(color: string): string {
  return color.replace(/^#/, '').toUpperCase();
}

/**
 * Builds the `.s` style object xlsx-js-style expects on a cell from our
 * simpler `CellStyle` shape (`fill`, `fontColor`, `bold`, `italic`, `align`).
 */
export function buildCellStyle(style: CellStyle | undefined): Record<string, unknown> | undefined {
  if (!style) return undefined;

  const s: Record<string, unknown> = {};

  if (style.fill) {
    s.fill = { patternType: 'solid', fgColor: { rgb: normalizeHex(style.fill) } };
  }

  if (style.fontColor || style.bold || style.italic) {
    s.font = {
      ...(style.fontColor ? { color: { rgb: normalizeHex(style.fontColor) } } : {}),
      ...(style.bold ? { bold: true } : {}),
      ...(style.italic ? { italic: true } : {}),
    };
  }

  if (style.align) {
    s.alignment = { horizontal: style.align, vertical: 'center' };
  }

  return Object.keys(s).length ? s : undefined;
}

/** Applies a `CellStyle` to a single cell, creating an empty cell if none exists yet. */
export function applyCellStyle(
  ws: XLSX.WorkSheet,
  addr: string,
  style: CellStyle | undefined
): void {
  const builtStyle = buildCellStyle(style);
  if (!builtStyle) return;

  const cell = (ws as Record<string, XLSX.CellObject>)[addr];
  if (cell) {
    cell.s = builtStyle;
  } else {
    (ws as Record<string, XLSX.CellObject>)[addr] = { t: 's', v: '', s: builtStyle };
  }
}

/**
 * Colors an entire column (data rows `rowStart..rowEnd`, 0-indexed,
 * inclusive) with the given style. Used for per-column coloring on both
 * data-driven and DOM-table exports.
 */
export function applyColumnStyle(
  ws: XLSX.WorkSheet,
  colIndex: number,
  rowStart: number,
  rowEnd: number,
  style: CellStyle | undefined
): void {
  if (!style) return;
  for (let r = rowStart; r <= rowEnd; r++) {
    applyCellStyle(ws, XLSX.utils.encode_cell({ r, c: colIndex }), style);
  }
}

/**
 * Shifts every existing cell (and merge range) in a worksheet down by
 * `shift` rows, freeing up rows `0..shift-1` at the top. SheetJS's
 * community API has no built-in "insert row" — this is the standard way
 * to make room for content above an already-built sheet.
 */
export function shiftSheetRowsDown(ws: XLSX.WorkSheet, shift: number): void {
  if (shift <= 0) return;
  const ref = ws['!ref'];
  if (!ref) return;

  const range = XLSX.utils.decode_range(ref);
  const sheet = ws as Record<string, XLSX.CellObject>;

  const entries: Array<[string, XLSX.CellObject]> = [];
  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = sheet[addr];
      if (cell !== undefined) {
        delete sheet[addr];
        entries.push([XLSX.utils.encode_cell({ r: R + shift, c: C }), cell]);
      }
    }
  }
  entries.forEach(([addr, cell]) => {
    sheet[addr] = cell;
  });

  if (ws['!merges']) {
    ws['!merges'] = ws['!merges']!.map((m) => ({
      s: { r: m.s.r + shift, c: m.s.c },
      e: { r: m.e.r + shift, c: m.e.c },
    }));
  }

  ws['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: range.s.c },
    e: { r: range.e.r + shift, c: range.e.c },
  });
}

/**
 * Writes one or more `ExtraRow`s into the top rows (`0..extraRows.length-1`)
 * of a worksheet that already has that many blank rows reserved (via
 * `shiftSheetRowsDown`), then extends `!ref` to cover them.
 */
export function writeExtraRows(ws: XLSX.WorkSheet, extraRows: ExtraRow[], columnCount: number): void {
  if (extraRows.length === 0) return;

  const sheet = ws as Record<string, XLSX.CellObject>;

  extraRows.forEach((row, rowIndex) => {
    const isStringRow = typeof row.values === 'string';
    const values = isStringRow ? [row.values as string] : (row.values as (string | number)[]);
    const shouldMerge = row.merge ?? isStringRow;
    const builtStyle = buildCellStyle(row);

    const lastCol = shouldMerge ? Math.max(columnCount - 1, 0) : Math.max(values.length - 1, 0);

    for (let c = 0; c <= lastCol; c++) {
      const value = c < values.length ? values[c] : '';
      const addr = XLSX.utils.encode_cell({ r: rowIndex, c });
      sheet[addr] = {
        t: typeof value === 'number' ? 'n' : 's',
        v: value,
        ...(builtStyle ? { s: builtStyle } : {}),
      };
    }

    if (shouldMerge && columnCount > 1) {
      ws['!merges'] = ws['!merges'] || [];
      ws['!merges']!.push({
        s: { r: rowIndex, c: 0 },
        e: { r: rowIndex, c: columnCount - 1 },
      });
    }
  });

  const existingRef = ws['!ref'];
  const existingRange = existingRef
    ? XLSX.utils.decode_range(existingRef)
    : { s: { r: 0, c: 0 }, e: { r: -1, c: columnCount - 1 } };

  ws['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: Math.min(0, existingRange.s.c) },
    e: {
      r: Math.max(existingRange.e.r, extraRows.length - 1),
      c: Math.max(existingRange.e.c, columnCount - 1),
    },
  });
}

/** Inserts `extraRows` above whatever is currently in the worksheet. */
export function prependExtraRows(
  ws: XLSX.WorkSheet,
  extraRows: ExtraRow[] | undefined,
  columnCount: number
): void {
  if (!extraRows || extraRows.length === 0) return;
  shiftSheetRowsDown(ws, extraRows.length);
  writeExtraRows(ws, extraRows, columnCount);
}
