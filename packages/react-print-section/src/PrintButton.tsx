import React from 'react';
import type { RefObject, ReactNode } from 'react';
import { printElement } from './printElement';
import type { PrintOptions } from './types';

export interface PrintButtonProps extends PrintOptions {
  /** Ref to the element you want printed. */
  targetRef: RefObject<HTMLElement | null>;
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
}

/**
 * Drop-in button that prints whatever `targetRef` points to, with the
 * page's current fonts/styles, when clicked.
 *
 * @example
 * const ref = useRef<HTMLDivElement>(null);
 * <PrintButton targetRef={ref} pageStyle=".no-print { display: none }">Print</PrintButton>
 * <div ref={ref}>...content...</div>
 */
export function PrintButton({
  targetRef,
  children = 'Print',
  className,
  disabled,
  ...printOptions
}: PrintButtonProps) {
  const handleClick = () => {
    if (!targetRef.current) return;
    void printElement(targetRef.current, printOptions);
  };

  return (
    <button type="button" className={className} disabled={disabled} onClick={handleClick}>
      {children}
    </button>
  );
}
