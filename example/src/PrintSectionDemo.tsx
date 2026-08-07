import { useRef } from 'react';
import { PrintButton, usePrint } from 'react-print-section';

/**
 * Demonstrates the two ways to use `react-print-section`:
 *
 * 1. `<PrintButton>` — a drop-in button, you just give it a ref.
 * 2. `usePrint()` — a hook, for when you want your own trigger
 *    (a menu item, a keyboard shortcut, printing after some async work, etc).
 */
export function PrintSectionDemo() {
  // --- Usage 1: PrintButton component ---
  const invoiceRef = useRef<HTMLDivElement>(null);

  // --- Usage 2: usePrint hook ---
  const { targetRef: receiptRef, print: printReceipt } = usePrint<HTMLDivElement>({
    documentTitle: 'Receipt',
    pageSize: 'A4',
  });

  return (
    <section style={{ border: '1px solid #ddd', borderRadius: 8, padding: 24, marginBottom: 32 }}>
      <h2>react-print-section</h2>
      <p style={{ color: '#666' }}>
        Prints exactly the DOM node you point it at, using the page's current fonts and styles.
      </p>

      <h3>1. Component usage — {'<PrintButton>'}</h3>
      <div
        ref={invoiceRef}
        style={{ border: '1px dashed #aaa', padding: 16, marginBottom: 12, maxWidth: 360 }}
      >
        <h4 style={{ margin: 0 }}>Invoice #1042</h4>
        <p>Customer: Ada Lovelace</p>
        <p>Total: $128.00</p>
      </div>
      <PrintButton
        targetRef={invoiceRef}
        documentTitle="Invoice #1042"
        pageStyle=".no-print { display: none; }"
      >
        Print invoice
      </PrintButton>

      <h3 style={{ marginTop: 24 }}>2. Hook usage — usePrint()</h3>
      <div
        ref={receiptRef}
        style={{ border: '1px dashed #aaa', padding: 16, marginBottom: 12, maxWidth: 360 }}
      >
        <h4 style={{ margin: 0 }}>Receipt #77</h4>
        <p>Item: Coffee</p>
        <p>Total: $4.50</p>
      </div>
      <button type="button" onClick={() => printReceipt()}>
        Print receipt
      </button>
    </section>
  );
}
