import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import * as printModule from './printElement';
import { usePrint } from './usePrint';

vi.mock('./printElement', () => ({
  printElement: vi.fn(),
}));

describe('usePrint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws if print() is called before the ref is attached', async () => {
    const { result } = renderHook(() => usePrint());
    await expect(result.current.print()).rejects.toThrow(
      'targetRef is not attached to any element yet'
    );
  });

  it('calls printElement with the ref target and merged options', async () => {
    const { result } = renderHook(() => usePrint({ documentTitle: 'Invoice' }));

    const el = document.createElement('div');
    // React 19: RefObject.current is mutable, no cast/expect-error needed
    result.current.targetRef.current = el;

    await result.current.print({ margin: '5mm' });

    expect(printModule.printElement).toHaveBeenCalledWith(el, {
      documentTitle: 'Invoice',
      margin: '5mm',
    });
  });
});
