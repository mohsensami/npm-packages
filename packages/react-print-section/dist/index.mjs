// src/printElement.ts
var IFRAME_ID = "__react-print-section-iframe__";
var PRINT_ROOT_CLASS = "rps-print";
var DEFAULT_PRINT_STYLES = `
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
async function printElement(target, options = {}) {
  var _a;
  if (!target) {
    throw new Error("printElement: no target element was provided.");
  }
  const {
    documentTitle = document.title,
    pageStyle = "",
    pageSize,
    margin,
    copyStyles = true,
    removeAfterPrint = true,
    cleanupDelay = 1e3,
    onBeforePrint,
    onAfterPrint,
    snapshotCanvases = true,
    printClassName,
    disableDefaultStyles = false
  } = options;
  await (onBeforePrint == null ? void 0 : onBeforePrint());
  (_a = document.getElementById(IFRAME_ID)) == null ? void 0 : _a.remove();
  const iframe = document.createElement("iframe");
  iframe.id = IFRAME_ID;
  iframe.setAttribute("aria-hidden", "true");
  Object.assign(iframe.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "0",
    visibility: "hidden"
  });
  document.body.appendChild(iframe);
  const iframeDoc = iframe.contentDocument;
  const iframeWindow = iframe.contentWindow;
  if (!iframeDoc || !iframeWindow) {
    iframe.remove();
    throw new Error("printElement: could not access the print iframe document.");
  }
  iframeDoc.open();
  iframeDoc.write("<!DOCTYPE html><html><head></head><body></body></html>");
  iframeDoc.close();
  iframeDoc.title = documentTitle;
  if (copyStyles) {
    document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
      iframeDoc.head.appendChild(node.cloneNode(true));
    });
  }
  const pageRule = buildPageRule(pageSize, margin);
  const styleParts = [pageRule, disableDefaultStyles ? "" : DEFAULT_PRINT_STYLES, pageStyle].filter(
    Boolean
  );
  if (styleParts.length) {
    const styleEl = iframeDoc.createElement("style");
    styleEl.textContent = styleParts.join("\n");
    iframeDoc.head.appendChild(styleEl);
  }
  const clonedTarget = target.cloneNode(true);
  if (snapshotCanvases) {
    snapshotCanvasesInto(target, clonedTarget);
  }
  clonedTarget.classList.add(PRINT_ROOT_CLASS);
  if (printClassName) {
    printClassName.split(/\s+/).filter(Boolean).forEach((cls) => clonedTarget.classList.add(cls));
  }
  iframeDoc.body.appendChild(clonedTarget);
  await waitUntilReady(iframeWindow);
  let cleanedUp = false;
  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    onAfterPrint == null ? void 0 : onAfterPrint();
    if (removeAfterPrint) {
      iframe.remove();
    }
  };
  if ("onafterprint" in iframeWindow) {
    iframeWindow.onafterprint = cleanup;
  }
  setTimeout(cleanup, cleanupDelay);
  iframeWindow.focus();
  iframeWindow.print();
}
async function printElementById(id, options) {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`printElementById: no element found with id "${id}".`);
  }
  await printElement(el, options);
}
function snapshotCanvasesInto(original, clone) {
  const originalCanvases = original.querySelectorAll("canvas");
  if (originalCanvases.length === 0) return;
  const clonedCanvases = clone.querySelectorAll("canvas");
  const doc = clone.ownerDocument;
  originalCanvases.forEach((canvas, index) => {
    var _a;
    const clonedCanvas = clonedCanvases[index];
    if (!clonedCanvas || !doc) return;
    let dataUrl;
    try {
      dataUrl = canvas.toDataURL("image/png");
    } catch {
      return;
    }
    if (!dataUrl || dataUrl === "data:,") return;
    const img = doc.createElement("img");
    img.src = dataUrl;
    img.alt = (_a = canvas.getAttribute("aria-label")) != null ? _a : "";
    img.className = canvas.className;
    const style = canvas.getAttribute("style");
    if (style) img.setAttribute("style", style);
    const rect = canvas.getBoundingClientRect();
    if (rect.width) img.style.width = `${rect.width}px`;
    if (rect.height) img.style.height = `${rect.height}px`;
    clonedCanvas.replaceWith(img);
  });
}
function buildPageRule(pageSize, margin) {
  if (!pageSize && !margin) return "";
  const size = pageSize ? `size: ${pageSize};` : "";
  const marginRule = margin ? `margin: ${margin};` : "";
  return `@page { ${size} ${marginRule} }`;
}
function waitUntilReady(win) {
  var _a, _b;
  const doc = win.document;
  const fontsReady = (_b = (_a = doc.fonts) == null ? void 0 : _a.ready) != null ? _b : Promise.resolve();
  const imagesReady = Promise.all(
    Array.from(doc.images).map(
      (img) => img.complete ? Promise.resolve() : new Promise((resolve) => {
        img.addEventListener("load", () => resolve(), { once: true });
        img.addEventListener("error", () => resolve(), { once: true });
      })
    )
  );
  return Promise.all([fontsReady, imagesReady]).then(() => void 0);
}

// src/usePrint.ts
import { useCallback, useRef } from "react";
function usePrint(options) {
  const targetRef = useRef(null);
  const print = useCallback(
    async (overrides) => {
      if (!targetRef.current) {
        throw new Error("usePrint: targetRef is not attached to any element yet.");
      }
      await printElement(targetRef.current, { ...options, ...overrides });
    },
    [options]
  );
  return { targetRef, print };
}

// src/PrintButton.tsx
import { jsx } from "react/jsx-runtime";
function PrintButton({
  targetRef,
  children = "Print",
  className,
  disabled,
  ...printOptions
}) {
  const handleClick = () => {
    if (!targetRef.current) return;
    void printElement(targetRef.current, printOptions);
  };
  return /* @__PURE__ */ jsx("button", { type: "button", className, disabled, onClick: handleClick, children });
}
export {
  PrintButton,
  printElement,
  printElementById,
  usePrint
};
