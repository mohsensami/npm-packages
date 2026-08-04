import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createRef } from 'react';
import * as printModule from './printElement';
import { PrintButton } from './PrintButton';

vi.mock('./printElement', () => ({
  printElement: vi.fn(),
}));

describe('PrintButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the default label and triggers printElement on click', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <>
        <PrintButton targetRef={ref} pageStyle=".no-print { display: none }" />
        <div ref={ref}>content</div>
      </>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Print' }));

    expect(printModule.printElement).toHaveBeenCalledWith(ref.current, {
      pageStyle: '.no-print { display: none }',
    });
  });

  it('renders custom children as the label', () => {
    const ref = createRef<HTMLDivElement>();
    render(<PrintButton targetRef={ref}>Print invoice</PrintButton>);
    expect(screen.getByRole('button', { name: 'Print invoice' })).toBeInTheDocument();
  });

  it('does nothing when the target ref is not attached', () => {
    const ref = createRef<HTMLDivElement>();
    render(<PrintButton targetRef={ref} />);

    fireEvent.click(screen.getByRole('button', { name: 'Print' }));

    expect(printModule.printElement).not.toHaveBeenCalled();
  });
});
