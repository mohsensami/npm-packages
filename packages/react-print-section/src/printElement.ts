import type { PrintOptions } from './types';

const IFRAME_ID = '__react-print-section-iframe__';

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
  if (pageRule || pageStyle) {
    const styleEl = iframeDoc.createElement('style');
    styleEl.textContent = `${pageRule}\n${pageStyle}`;
    iframeDoc.head.appendChild(styleEl);
  }

  iframeDoc.body.appendChild(target.cloneNode(true));

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
