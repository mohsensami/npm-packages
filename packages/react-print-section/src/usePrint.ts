import { useCallback, useRef } from 'react';
import type { RefObject } from 'react';
import { printElement } from './printElement';
import type { PrintOptions } from './types';

/**
 * Hook that gives you a ref to attach to any DOM node, plus a `print()`
 * function that prints exactly that node with the page's current fonts/styles.
 *
 * @example
 * const { targetRef, print } = usePrint({ documentTitle: 'Invoice' });
 * <button onClick={() => print()}>Print</button>
 * <div ref={targetRef}>...content to print...</div>
 */
export function usePrint<T extends HTMLElement = HTMLDivElement>(options?: PrintOptions) {
  const targetRef = useRef<T>(null);

  const print = useCallback(
    async (overrides?: PrintOptions) => {
      if (!targetRef.current) {
        throw new Error('usePrint: targetRef is not attached to any element yet.');
      }
      await printElement(targetRef.current, { ...options, ...overrides });
    },
    [options]
  );

  return { targetRef, print } as {
    targetRef: RefObject<T>;
    print: (overrides?: PrintOptions) => Promise<void>;
  };
}
