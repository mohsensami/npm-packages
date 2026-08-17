import type { PrintOptions } from './types';

const IFRAME_ID = '__react-print-section-iframe__';
const PRINT_ROOT_CLASS = 'rps-print';

/**
 * Small, unopinionated print reset scoped to `.rps-print` so it never leaks
 * into the live page. Keeps canvas-snapshot `<img>`s, real `<img>`s and SVG
 * charts from overflowing the page, and makes sure backgrounds/colors used
 * by charts actually show up in print (browsers strip them by default).
 */
const DEFAULT_PRINT_STYLES = `
.${PRINT_ROOT_CLASS}, .${PRINT_ROOT_CLASS} * {
  box-sizing: border-box;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.${PRINT_ROOT_CLASS} img,
.${PRINT_ROOT_CLASS} svg,
.${PRINT_ROOT_CLASS} canvas {
  max-width: 100%;
}
`.trim();

/**
 * Prints a single DOM element using its own hidden iframe, with the page's
 * stylesheets (and therefore fonts, colors, spacing) copied in so the
 * printed output matches what's on screen. Uses only native browser APIs —
 * no runtime dependencies.
 */
export async function printElement(target: HTMLElement, options: PrintOptions = {}): Promise<void> {
  if (!target) {
    throw new Error('printElement: no target element was provided.');
  }

  const {
    documentTitle = document.title,
    pageStyle = '',
    pageSize,
    margin,
    copyStyles = true,
    removeAfterPrint = true,
    cleanupDelay = 1000,
    onBeforePrint,
    onAfterPrint,
    snapshotCanvases = true,
    printClassName,
    disableDefaultStyles = false,
  } = options;

  await onBeforePrint?.();

  // Clean up any leftover iframe from a previous call that didn't tear down.
  document.getElementById(IFRAME_ID)?.remove();

  const iframe = document.createElement('iframe');
  iframe.id = IFRAME_ID;
  iframe.setAttribute('aria-hidden', 'true');
  Object.assign(iframe.style, {
    position: 'fixed',
    right: '0',
    bottom: '0',
    width: '0',
    height: '0',
    border: '0',
    visibility: 'hidden',
  });

  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument;
  const iframeWindow = iframe.contentWindow;

  if (!iframeDoc || !iframeWindow) {
    iframe.remove();
    throw new Error('printElement: could not access the print iframe document.');
  }

  iframeDoc.open();
  iframeDoc.write('<!DOCTYPE html><html><head></head><body></body></html>');
  iframeDoc.close();
  iframeDoc.title = documentTitle;

  if (copyStyles) {
    document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
      iframeDoc.head.appendChild(node.cloneNode(true));
    });
  }

  const pageRule = buildPageRule(pageSize, margin);
  const styleParts = [pageRule, disableDefaultStyles ? '' : DEFAULT_PRINT_STYLES, pageStyle].filter(
    Boolean
  );
  if (styleParts.length) {
    const styleEl = iframeDoc.createElement('style');
    styleEl.textContent = styleParts.join('\n');
    iframeDoc.head.appendChild(styleEl);
  }

  const clonedTarget = target.cloneNode(true) as HTMLElement;

  if (snapshotCanvases) {
    snapshotCanvasesInto(target, clonedTarget);
  }

  clonedTarget.classList.add(PRINT_ROOT_CLASS);
  if (printClassName) {
    printClassName
      .split(/\s+/)
      .filter(Boolean)
      .forEach((cls) => clonedTarget.classList.add(cls));
  }

  iframeDoc.body.appendChild(clonedTarget);

  await waitUntilReady(iframeWindow);

  let cleanedUp = false;
  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    onAfterPrint?.();
    if (removeAfterPrint) {
      iframe.remove();
    }
  };

  if ('onafterprint' in iframeWindow) {
    (iframeWindow as Window).onafterprint = cleanup;
  }
  // Fallback in case the browser never fires `afterprint` (older Safari, etc).
  setTimeout(cleanup, cleanupDelay);

  iframeWindow.focus();
  iframeWindow.print();
}

/** Convenience helper: print by element id instead of holding a ref. */
export async function printElementById(id: string, options?: PrintOptions): Promise<void> {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`printElementById: no element found with id "${id}".`);
  }
  await printElement(el, options);
}

/**
 * `cloneNode()` copies DOM structure/attributes only — it never copies a
 * `<canvas>`'s drawn pixels, since those live in a bitmap buffer that isn't
 * part of the DOM. Left alone, every canvas-based chart (Chart.js,
 * react-chartjs-2, ApexCharts' canvas renderer, etc.) prints as an empty
 * box. This walks the original/clone in parallel and swaps each cloned
 * `<canvas>` for a snapshotted `<img>` so the chart actually shows up.
 *
 * SVG-based charts (Recharts, Victory, most of Highcharts, etc.) don't need
 * this — SVG is real DOM and `cloneNode()` already copies it correctly.
 */
function snapshotCanvasesInto(original: HTMLElement, clone: HTMLElement): void {
  const originalCanvases = original.querySelectorAll('canvas');
  if (originalCanvases.length === 0) return;

  const clonedCanvases = clone.querySelectorAll('canvas');
  const doc = clone.ownerDocument;

  originalCanvases.forEach((canvas, index) => {
    const clonedCanvas = clonedCanvases[index];
    if (!clonedCanvas || !doc) return;

    let dataUrl: string;
    try {
      dataUrl = canvas.toDataURL('image/png');
    } catch {
      // Cross-origin ("tainted") canvas content, or `toDataURL` isn't
      // available in this environment — best effort, leave the empty
      // cloned <canvas> in place rather than throwing.
      return;
    }

    // An untouched canvas still "succeeds" but yields this exact string.
    if (!dataUrl || dataUrl === 'data:,') return;

    const img = doc.createElement('img');
    img.src = dataUrl;
    img.alt = canvas.getAttribute('aria-label') ?? '';
    img.className = canvas.className;

    // Preserve the *rendered* (CSS) size, not the canvas's internal pixel
    // resolution, so the snapshot lines up with how the chart looked on
    // screen (chart libs commonly render at devicePixelRatio for
    // sharpness, which would otherwise make the snapshot look oversized).
    const style = canvas.getAttribute('style');
    if (style) img.setAttribute('style', style);
    const rect = canvas.getBoundingClientRect();
    if (rect.width) img.style.width = `${rect.width}px`;
    if (rect.height) img.style.height = `${rect.height}px`;

    clonedCanvas.replaceWith(img);
  });
}

function buildPageRule(pageSize?: string, margin?: string): string {
  if (!pageSize && !margin) return '';
  const size = pageSize ? `size: ${pageSize};` : '';
  const marginRule = margin ? `margin: ${margin};` : '';
  return `@page { ${size} ${marginRule} }`;
}

/** Waits for fonts and images inside the print document to finish loading. */
function waitUntilReady(win: Window): Promise<void> {
  const doc = win.document;
  const fontsReady = (doc as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready ?? Promise.resolve();

  const imagesReady = Promise.all(
    Array.from(doc.images).map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.addEventListener('load', () => resolve(), { once: true });
            img.addEventListener('error', () => resolve(), { once: true });
          })
    )
  );

  return Promise.all([fontsReady, imagesReady]).then(() => undefined);
}
