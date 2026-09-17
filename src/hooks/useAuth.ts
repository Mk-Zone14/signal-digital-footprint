import { useCallback, useEffect, useState } from 'react';
import type { AuthService, SignalSession } from '../platform/auth';

export type AuthStatus = 'loading' | 'signed_out' | 'signed_in' | 'error';

export function useAuth(service: AuthService | null) {
  const [status, setStatus] = useState<AuthStatus>(() => service ? 'loading' : 'signed_out');
  const [session, setSession] = useState<SignalSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSentTo, setMagicLinkSentTo] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!service) {
      return;
    }

    setStatus('loading');
    let authEventObserved = false;
    const unsubscribe = service.subscribe(nextSession => {
      if (!active) return;
      authEventObserved = true;
      setSession(nextSession);
      setError(null);
      setStatus(nextSession ? 'signed_in' : 'signed_out');
    });

    service.restoreSession()
      .then(restored => {
        if (!active || authEventObserved) return;
        setSession(restored);
        setStatus(restored ? 'signed_in' : 'signed_out');
      })
      .catch(cause => {
        if (!active) return;
        setSession(null);
        setError(cause instanceof Error ? cause.message : 'Signal could not restore your session.');
        setStatus('error');
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [service]);

  const signIn = useCallback(async (email: string) => {
    if (!service) throw new Error('Account sign-in is not configured.');
    setError(null);
    setMagicLinkSentTo(null);
    try {
      await service.signInWithMagicLink(email, window.location.origin);
      setMagicLinkSentTo(email);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Signal could not send the sign-in link.';
      setError(message);
      throw new Error(message);
    }
  }, [service]);

  const signOut = useCallback(async () => {
    if (!service) return;
    try {
      await service.signOut();
      setSession(null);
      setStatus('signed_out');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Signal could not sign out.');
      setStatus('error');
    }
  }, [service]);

  return { status, session, error, magicLinkSentTo, signIn, signOut };
}
