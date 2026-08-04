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
}
