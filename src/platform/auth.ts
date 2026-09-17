import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export interface SignalSession {
  user: { id: string; email?: string };
  accessToken: string;
}

export interface AuthService {
  restoreSession(): Promise<SignalSession | null>;
  subscribe(listener: (session: SignalSession | null) => void): () => void;
  signInWithMagicLink(email: string, redirectTo: string): Promise<void>;
  signOut(): Promise<void>;
}

function mapSession(session: { user: { id: string; email?: string }; access_token: string } | null): SignalSession | null {
  if (!session) return null;
  return {
    user: { id: session.user.id, email: session.user.email },
    accessToken: session.access_token,
  };
}

export class SupabaseAuthService implements AuthService {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async restoreSession(): Promise<SignalSession | null> {
    const url = new URL(window.location.href);
    const hash = new URLSearchParams(url.hash.replace(/^#/, ''));
    const callbackError = url.searchParams.get('error_description') ?? hash.get('error_description');
    if (callbackError) throw new Error(callbackError);
    const { data, error } = await this.client.auth.getSession();
    if (error) throw new Error(error.message);
    return mapSession(data.session);
  }

  subscribe(listener: (session: SignalSession | null) => void): () => void {
    const { data } = this.client.auth.onAuthStateChange((_event, session) => listener(mapSession(session)));
    return () => data.subscription.unsubscribe();
  }

  async signInWithMagicLink(email: string, redirectTo: string): Promise<void> {
    const { error } = await this.client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) throw new Error(error.message);
  }

  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut();
    if (error) throw new Error(error.message);
  }
}
