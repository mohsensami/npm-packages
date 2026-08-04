import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { printElement, printElementById } from './printElement';

/**
 * jsdom's HTMLIFrameElement.contentWindow/contentDocument are real, but
 * `window.print` isn't implemented. We override the instance-level
 * properties right after the iframe is appended so printElement gets a
 * controllable contentWindow with a spyable `print`/`focus`, while the
 * real contentDocument (from jsdom) is still used to build up the DOM.
 */
function interceptNextIframe() {
  const printSpy = vi.fn();
  const focusSpy = vi.fn();
  const originalAppendChild = document.body.appendChild.bind(document.body);

  const spy = vi.spyOn(document.body, 'appendChild').mockImplementation((node: any) => {
    const result = originalAppendChild(node);
    if (node?.tagName === 'IFRAME') {
      const realWindow = node.contentWindow;
      Object.defineProperty(node, 'contentWindow', {
        configurable: true,
        get: () => {
          if (realWindow && !(realWindow as any).__patched) {
            realWindow.print = printSpy;
            realWindow.focus = focusSpy;
            (realWindow as any).__patched = true;
          }
          return realWindow;
        },
      });
    }
    return result;
  });

  return { printSpy, focusSpy, restore: () => spy.mockRestore() };
}

describe('printElement', () => {
  let intercept: ReturnType<typeof interceptNextIframe>;

  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    intercept = interceptNextIframe();
  });

  afterEach(() => {
    intercept.restore();
    document.getElementById('__react-print-section-iframe__')?.remove();
  });

  it('throws when no target element is provided', async () => {
    // @ts-expect-error intentionally passing an invalid value
    await expect(printElement(null)).rejects.toThrow('no target element was provided');
  });

  it('calls onBeforePrint, then triggers print, then onAfterPrint', async () => {
    const target = document.createElement('div');
    target.textContent = 'Hello';
    document.body.appendChild(target);

    const onBeforePrint = vi.fn();
    const onAfterPrint = vi.fn();

    await printElement(target, { onBeforePrint, onAfterPrint, cleanupDelay: 0 });

    expect(onBeforePrint).toHaveBeenCalledTimes(1);
    expect(intercept.printSpy).toHaveBeenCalledTimes(1);

    // onAfterPrint fires via the fallback timer (cleanupDelay: 0)
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(onAfterPrint).toHaveBeenCalledTimes(1);
  });

  it('copies stylesheets from the main document when copyStyles is true', async () => {
    const style = document.createElement('style');
    style.textContent = 'body { color: red; }';
    document.head.appendChild(style);

    const target = document.createElement('div');
    document.body.appendChild(target);

    await printElement(target, { cleanupDelay: 0 });

    const iframe = document.getElementById('__react-print-section-iframe__') as HTMLIFrameElement;
    const copiedStyle = iframe.contentDocument?.head.querySelector('style');
    expect(copiedStyle?.textContent).toContain('color: red');
  });

  it('injects a custom @page rule and pageStyle', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);

    await printElement(target, {
      pageSize: 'A4',
      margin: '10mm',
      pageStyle: '.no-print { display: none; }',
      cleanupDelay: 0,
    });

    const iframe = document.getElementById('__react-print-section-iframe__') as HTMLIFrameElement;
    const styles = Array.from(iframe.contentDocument?.head.querySelectorAll('style') ?? [])
      .map((s) => s.textContent)
      .join('\n');

    expect(styles).toContain('@page');
    expect(styles).toContain('size: A4;');
    expect(styles).toContain('margin: 10mm;');
    expect(styles).toContain('.no-print { display: none; }');
  });

  it('clones the target content into the print document', async () => {
    const target = document.createElement('div');
    target.innerHTML = '<p>Printable content</p>';
    document.body.appendChild(target);

    await printElement(target, { cleanupDelay: 0 });

    const iframe = document.getElementById('__react-print-section-iframe__') as HTMLIFrameElement;
    expect(iframe.contentDocument?.body.textContent).toContain('Printable content');
  });
});

describe('printElementById', () => {
  let intercept: ReturnType<typeof interceptNextIframe>;

  beforeEach(() => {
    document.body.innerHTML = '';
    intercept = interceptNextIframe();
  });

  afterEach(() => {
    intercept.restore();
    document.getElementById('__react-print-section-iframe__')?.remove();
  });

  it('throws when the id does not exist', async () => {
    await expect(printElementById('missing-id')).rejects.toThrow(
      'no element found with id "missing-id"'
    );
  });

  it('prints the element matching the given id', async () => {
    const target = document.createElement('div');
    target.id = 'receipt';
    target.textContent = 'Receipt content';
    document.body.appendChild(target);

    await printElementById('receipt', { cleanupDelay: 0 });

    expect(intercept.printSpy).toHaveBeenCalledTimes(1);
  });
});
