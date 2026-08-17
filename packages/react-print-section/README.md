# react-print-section

Print any section of a React page — with the **exact fonts, colors, and layout it has on screen** — using only native browser APIs. **Zero runtime dependencies.**

It works by cloning the target element plus every `<link rel="stylesheet">` and `<style>` tag from your page into a hidden iframe, then calling the browser's native `window.print()` on that iframe. Your page's own fonts/CSS are reused as-is, so there's no visual mismatch between what's on screen and what gets printed.

**Charts print correctly**, including canvas-based ones (Chart.js, react-chartjs-2, ApexCharts' canvas renderer, etc.) — see [Printing charts](#printing-charts).

## Install

```bash
npm install react-print-section
```

`react` (>=16.8) is the only peer dependency — no other packages required.

## Usage

### 1. `<PrintButton />` — the simplest option

```tsx
import { useRef } from 'react';
import { PrintButton } from 'react-print-section';

function Invoice() {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div>
      <PrintButton targetRef={ref}>Print Invoice</PrintButton>

      <div ref={ref}>
        <h1>Invoice #1024</h1>
        <p>Total: $250.00</p>
      </div>
    </div>
  );
}
```

### 2. `usePrint()` — for a custom trigger

```tsx
import { usePrint } from 'react-print-section';

function Invoice() {
  const { targetRef, print } = usePrint({ documentTitle: 'Invoice #1024' });

  return (
    <div>
      <button onClick={() => print()}>Print</button>
      <div ref={targetRef}>...content to print...</div>
    </div>
  );
}
```

### 3. `printElement()` / `printElementById()` — plain functions, no hook needed

```ts
import { printElement, printElementById } from 'react-print-section';

printElement(document.querySelector('#invoice')!);
// or
printElementById('invoice');
```

## Printing charts

`cloneNode()` — which is how the target section gets copied into the print iframe — only copies DOM structure and attributes. That's perfect for **SVG-based charts** (Recharts, Victory, most of Highcharts, D3-with-SVG, ...) since SVG is real DOM. It's a problem for **canvas-based charts** (Chart.js, react-chartjs-2, ApexCharts' canvas renderer, ...), because a canvas's drawn pixels live in a bitmap buffer that `cloneNode()` never touches — so the printed chart used to come out as an empty box.

As of `1.1.0`, every `<canvas>` inside the printed section is automatically snapshotted with `toDataURL()` and swapped for an `<img>` in the print document, so canvas charts show up correctly. This is on by default — you don't need to do anything:

```tsx
import { useRef } from 'react';
import { Bar } from 'react-chartjs-2'; // or any other canvas-based chart lib
import { PrintButton } from 'react-print-section';

function SalesReport() {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div>
      <div ref={ref}>
        <h2>Q3 Sales</h2>
        <Bar data={chartData} />
      </div>
      <PrintButton targetRef={ref}>Print report</PrintButton>
    </div>
  );
}
```

A few notes:

- **Opt out** with `snapshotCanvases: false` if you want to handle canvases yourself (e.g. you already render a static image for print).
- **Cross-origin ("tainted") canvases** — e.g. a canvas that drew an image loaded from another domain without CORS — can't be read by `toDataURL()`. The library catches that and leaves the canvas as-is rather than throwing; you'll need to serve that image with CORS enabled to snapshot it.
- **WebGL canvases** may print blank unless the context was created with `preserveDrawingBuffer: true` (most 2D chart libraries use the regular 2D context and aren't affected).
- The snapshot preserves the chart's **on-screen (CSS) size**, not its internal pixel resolution, so high-DPI canvases (rendered at 2x/3x for sharpness) don't come out oversized in print.

```tsx
// Opting out, e.g. because you already provide a print-specific image:
<PrintButton targetRef={ref} snapshotCanvases={false}>Print</PrintButton>
```

## Styling the print output

You get several independent, composable ways to style what gets printed — pick whichever fits:

### `pageSize` / `margin` — page setup

```tsx
<PrintButton targetRef={ref} pageSize="A4" margin="15mm">Print</PrintButton>
<PrintButton targetRef={ref} pageSize="210mm 297mm landscape">Print</PrintButton>
<PrintButton targetRef={ref} pageSize="Letter" margin="0.5in 0.75in">Print</PrintButton>
```

### `.rps-print` — always-on class for your own stylesheet

Every print run wraps the cloned section in a root element carrying the `rps-print` class. Since your page's stylesheets are copied into the print document (`copyStyles`, on by default), you can just write normal CSS rules once and they'll apply on every print — no per-call `pageStyle` string needed:

```css
/* in your regular app CSS */
.rps-print {
  padding: 24px;
}
.rps-print h1 {
  font-size: 22px;
}
.rps-print .no-print {
  display: none;
}
.rps-print table {
  border-collapse: collapse;
  width: 100%;
}
```

A small print reset is also injected automatically (box-sizing, `print-color-adjust: exact` so chart colors/backgrounds actually print instead of being stripped, and `max-width: 100%` on images/canvas-snapshots/SVGs so charts never overflow the page). Turn it off with `disableDefaultStyles` if you'd rather do all of it yourself.

### `printClassName` — extra classes for one particular print call

Useful when the same component prints differently depending on context (e.g. a compact vs. a detailed layout):

```tsx
<PrintButton targetRef={ref} printClassName="invoice compact">
  Print (compact)
</PrintButton>
```

```css
.rps-print.compact .line-item-notes { display: none; }
.rps-print.invoice { font-family: 'Georgia', serif; }
```

### `pageStyle` — one-off CSS injected only for that print

Never touches your live page — useful for print-only tweaks you don't want cluttering your main stylesheet:

```tsx
<PrintButton
  targetRef={ref}
  pageStyle={`
    body { padding: 24px; }
    .no-print { display: none; }
    .page-break { break-after: page; }
  `}
>
  Print
</PrintButton>
```

### `onBeforePrint` / `onAfterPrint` — change your app's own state around printing

For anything that needs to happen in the live app itself, not just the print copy — e.g. showing a "Preparing print…" indicator, expanding collapsed sections so they're fully visible in the printout, or refreshing data first:

```tsx
<PrintButton
  targetRef={ref}
  onBeforePrint={async () => {
    setExpanded(true);
    await refreshLatestTotals();
  }}
  onAfterPrint={() => setExpanded(false)}
>
  Print
</PrintButton>
```

### Page breaks and multi-page layouts

```css
.rps-print .page-break { break-after: page; }
.rps-print .avoid-break { break-inside: avoid; }
```

```tsx
<div ref={ref}>
  <section>Page 1 content…</section>
  <div className="page-break" />
  <section>Page 2 content…</section>
</div>
```

### Different content for screen vs. print

```css
.rps-print .screen-only { display: none; }
.on-screen .print-only { display: none; } /* hide print-only elements on screen */
```

```tsx
<div ref={ref}>
  <p className="print-only">Printed on {new Date().toLocaleDateString()}</p>
  <button className="screen-only" onClick={edit}>Edit</button>
</div>
```

## API

### `printElement(target, options?)`
Prints a single `HTMLElement`.

### `printElementById(id, options?)`
Same as above, but looks the element up by `id`.

### `usePrint(options?)`
Returns `{ targetRef, print }`. Attach `targetRef` to the element you want printed; call `print(overrides?)` to trigger it. `print()` returns a `Promise<void>` that resolves once the print dialog has been triggered (not when it's closed).

### `<PrintButton targetRef={ref} {...options} />`
Renders a `<button>` that calls `printElement` on click. Accepts `children` and `className` in addition to all `PrintOptions`.

### `PrintOptions`
| Option | Type | Default | Description |
|---|---|---|---|
| `documentTitle` | `string` | current `document.title` | Title shown in the print preview/tab |
| `pageStyle` | `string` | `''` | Extra CSS injected into the print document only |
| `pageSize` | `string` | — | CSS `@page` size, e.g. `"A4"`, `"210mm 297mm landscape"` |
| `margin` | `string` | — | CSS `@page` margin, e.g. `"10mm"` |
| `copyStyles` | `boolean` | `true` | Copy the main page's stylesheets/fonts into the print document |
| `snapshotCanvases` | `boolean` | `true` | Snapshot every `<canvas>` (charts) to an `<img>` so they survive cloning |
| `printClassName` | `string` | — | Extra class name(s), on top of the always-present `rps-print`, added to the cloned print root |
| `disableDefaultStyles` | `boolean` | `false` | Skip the built-in `.rps-print` print reset |
| `removeAfterPrint` | `boolean` | `true` | Remove the hidden iframe once printing finishes |
| `cleanupDelay` | `number` | `1000` | Fallback delay (ms) before force-cleanup if `afterprint` never fires |
| `onBeforePrint` | `() => void \| Promise<void>` | — | Runs before the print document is built |
| `onAfterPrint` | `() => void` | — | Runs after the print dialog closes (or after `cleanupDelay`) |

## Testing

```bash
npm install
npm test              # run once
npm run test:watch    # watch mode
npm run test:coverage # with coverage report
```

## Build locally

```bash
npm install
npm run build   # outputs CJS + ESM + .d.ts to dist/
```

## Changelog

### 1.1.0
- **Fix:** canvas-based charts (Chart.js, react-chartjs-2, ApexCharts' canvas renderer, etc.) now print correctly. They're automatically snapshotted to an `<img>` before printing instead of coming out as an empty box (opt out with `snapshotCanvases: false`).
- **New:** `printClassName` option and an always-present `rps-print` class on the cloned print root, so you can style print output with ordinary CSS instead of a `pageStyle` string every time.
- **New:** small built-in print reset scoped to `.rps-print` (opt out with `disableDefaultStyles`).

## License

MIT
