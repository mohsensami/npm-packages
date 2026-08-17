export interface PrintOptions {
  /** Title used for the print job / print preview tab. Defaults to the current document title. */
  documentTitle?: string;

  /**
   * Extra CSS injected into the print document. Use this to tweak spacing,
   * hide/show things, or restyle content specifically for the printed output
   * (e.g. `.no-print { display: none; }`).
   */
  pageStyle?: string;

  /** Shorthand for the CSS `@page` size, e.g. "A4", "Letter", "210mm 297mm landscape". */
  pageSize?: string;

  /** Shorthand for the CSS `@page` margin, e.g. "10mm" or "1in 0.5in". */
  margin?: string;

  /**
   * Copy every `<link rel="stylesheet">` and `<style>` tag from the main
   * document into the print document, so fonts/colors/layout match what's
   * on screen. Defaults to `true`.
   */
  copyStyles?: boolean;

  /** Remove the hidden print iframe once printing has finished. Defaults to `true`. */
  removeAfterPrint?: boolean;

  /**
   * How long (ms) to wait before force-cleaning-up if the browser never
   * fires the `afterprint` event. Defaults to 1000.
   */
  cleanupDelay?: number;

  /** Called right before the print document is built, e.g. to toggle app state. Can be async. */
  onBeforePrint?: () => void | Promise<void>;

  /** Called after the print dialog has closed (or after `cleanupDelay` as a fallback). */
  onAfterPrint?: () => void;

  /**
   * By default every `<canvas>` inside the printed section (charts from
   * Chart.js, react-chartjs-2, ApexCharts' canvas renderer, etc.) is
   * snapshotted with `toDataURL()` and swapped for an `<img>` in the print
   * document, because `cloneNode()` alone never copies a canvas's drawn
   * pixels — that's why charts used to print blank. Set this to `false` to
   * skip snapshotting (e.g. if you already handle it yourself).
   */
  snapshotCanvases?: boolean;

  /**
   * One or more extra class names (space separated) added to the cloned
   * print root, on top of the always-present `rps-print` class. Use this
   * together with a normal (copied-in) stylesheet rule to style the print
   * output without having to write a `pageStyle` string every time, e.g.
   * `.rps-print.invoice { padding: 24px; }`.
   */
  printClassName?: string;

  /**
   * The library injects a tiny, unopinionated print reset scoped to
   * `.rps-print` (box-sizing, print-color-adjust so backgrounds/colors
   * actually print, and `max-width: 100%` for images/canvas-snapshots/SVGs
   * so charts don't overflow the page). Set to `true` to skip it entirely
   * and rely only on your own styles.
   */
  disableDefaultStyles?: boolean;
}
