# react-print-section

Print any section of a React page — with the **exact fonts, colors, and layout it has on screen** — using only native browser APIs. **Zero runtime dependencies.**

It works by cloning the target element plus every `<link rel="stylesheet">` and `<style>` tag from your page into a hidden iframe, then calling the browser's native `window.print()` on that iframe. Your page's own fonts/CSS are reused as-is, so there's no visual mismatch between what's on screen and what gets printed.

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

## Styling before / after print

You get two independent ways to control the look of the print output:

- **`pageStyle`** — a plain CSS string injected only into the print document. Use it to hide things (`.no-print { display: none }`), add spacing, force colors, etc. It never touches your live page.
- **`onBeforePrint`** / **`onAfterPrint`** — callbacks for anything you want to do in your app itself right before/after printing (e.g. toggle a "printing…" state, add a temporary class to `<body>`, refresh data first).

```tsx
<PrintButton
  targetRef={ref}
  pageStyle={`
    body { padding: 24px; }
    .no-print { display: none; }
    h1 { font-size: 22px; }
  `}
  pageSize="A4"
  margin="12mm"
  onBeforePrint={() => setIsPrinting(true)}
  onAfterPrint={() => setIsPrinting(false)}
>
  Print
</PrintButton>
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
| `pageStyle` | `string` | `''` | Extra CSS injected into the print document |
| `pageSize` | `string` | — | CSS `@page` size, e.g. `"A4"`, `"210mm 297mm landscape"` |
| `margin` | `string` | — | CSS `@page` margin, e.g. `"10mm"` |
| `copyStyles` | `boolean` | `true` | Copy the main page's stylesheets/fonts into the print document |
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

## License

MIT
