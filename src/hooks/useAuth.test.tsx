// @vitest-environment jsdom

import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { AuthService, SignalSession } from '../platform/auth';
import { useAuth } from './useAuth';

const session: SignalSession = { user: { id: 'user-1', email: 'person@example.com' }, accessToken: 'token' };

class FakeAuthService implements AuthService {
  listener: (session: SignalSession | null) => void = () => undefined;
  constructor(private restored: SignalSession | null, private restoreError?: Error) {}
  async restoreSession() { if (this.restoreError) throw this.restoreError; return this.restored; }
  subscribe(listener: (session: SignalSession | null) => void) { this.listener = listener; return () => undefined; }
  async signInWithMagicLink() { return undefined; }
  async signOut() { this.listener(null); }
}

describe('useAuth', () => {
  it('restores an existing account session', async () => {
    const service = new FakeAuthService(session);
    const { result } = renderHook(() => useAuth(service));
    await waitFor(() => expect(result.current.status).toBe('signed_in'));
    expect(result.current.session?.user.email).toBe('person@example.com');
  });

  it('handles session expiration as a signed-out state', async () => {
    const service = new FakeAuthService(session);
    const { result } = renderHook(() => useAuth(service));
    await waitFor(() => expect(result.current.status).toBe('signed_in'));
    act(() => service.listener(null));
    expect(result.current.status).toBe('signed_out');
    expect(result.current.session).toBeNull();
  });

  it('exposes session restoration failures without creating a session', async () => {
    const service = new FakeAuthService(null, new Error('Invalid magic link'));
    const { result } = renderHook(() => useAuth(service));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.session).toBeNull();
    expect(result.current.error).toBe('Invalid magic link');
  });
});
