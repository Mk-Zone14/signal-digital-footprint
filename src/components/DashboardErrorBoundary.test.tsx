// @vitest-environment jsdom

import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DashboardErrorBoundary } from './DashboardErrorBoundary';

function BrokenDashboard(): never {
  throw new Error('render failed');
}

describe('DashboardErrorBoundary', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows recoverable actions when a dashboard descendant throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <DashboardErrorBoundary onLoadDemo={vi.fn()} onReturnToImport={vi.fn()}>
        <BrokenDashboard />
      </DashboardErrorBoundary>
    );

    expect(screen.getByRole('heading', { name: /dataset could not be displayed/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /choose another file/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /load demo dataset/i })).toBeTruthy();
  });

  it('retries its children after a recovery action changes the failing input', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    function RecoverableDashboard() {
      const [broken, setBroken] = useState(true);
      return (
        <DashboardErrorBoundary
          onLoadDemo={() => setBroken(false)}
          onReturnToImport={() => setBroken(false)}
        >
          {broken ? <BrokenDashboard /> : <p>Dashboard recovered</p>}
        </DashboardErrorBoundary>
      );
    }

    render(<RecoverableDashboard />);
    fireEvent.click(screen.getByRole('button', { name: /load demo dataset/i }));

    expect(screen.getByText('Dashboard recovered')).toBeTruthy();
  });
});
