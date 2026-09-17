// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SourcesPage } from './SourcesPage';

afterEach(cleanup);

describe('SourcesPage demo mode', () => {
  it('offers demo users sign-in without writing account data', () => {
    const createManual = vi.fn();
    const requestSignIn = vi.fn();
    render(<SourcesPage mode="demo" connections={[]} onCreateManual={createManual} onOpenImport={() => undefined} onRequestSignIn={requestSignIn} />);
    fireEvent.click(screen.getByRole('button', { name: /sign in to save/i }));
    expect(requestSignIn).toHaveBeenCalledOnce();
    expect(createManual).not.toHaveBeenCalled();
    expect(screen.getAllByText('Not connected')).toHaveLength(3);
  });
});
