import { useState, type FormEvent } from 'react';
import { AlertCircle, ArrowLeft, Mail } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

interface AuthPageProps {
  configured: boolean;
  error: string | null;
  magicLinkSentTo: string | null;
  onSignIn(email: string): Promise<void>;
  onBack(): void;
}

export function AuthPage({ configured, error, magicLinkSentTo, onSignIn, onBack }: AuthPageProps) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try { await onSignIn(email.trim()); } catch { /* Hook exposes the safe error message. */ }
    finally { setSubmitting(false); }
  };

  return (
    <main className="min-h-screen bg-signal-bg flex items-center justify-center p-6">
      <section className="card w-full max-w-md p-6" aria-labelledby="sign-in-title">
        <button onClick={onBack} className="text-sm text-signal-fgMuted hover:text-signal-fg flex items-center gap-2 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <Mail className="w-8 h-8 text-signal-accent mb-4" aria-hidden="true" />
        <h1 id="sign-in-title" className="text-2xl font-bold text-signal-fg">Sign in to Signal</h1>
        <p className="text-sm text-signal-fgMuted mt-2">We’ll email you a secure magic link. No password is required.</p>

        {!configured ? (
          <div className="mt-6 p-4 rounded-lg border border-signal-warning/30 bg-signal-warning/10 text-sm text-signal-fgMuted" role="status">
            Account mode is not configured on this deployment. Demo mode remains available.
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-sm text-signal-fg" htmlFor="auth-email">Email address</label>
            <Input id="auth-email" type="email" required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} />
            <Button className="w-full" type="submit" disabled={submitting}>{submitting ? 'Sending…' : 'Email me a magic link'}</Button>
          </form>
        )}

        {magicLinkSentTo && <p className="mt-4 text-sm text-signal-accent" role="status">Check {magicLinkSentTo} for your sign-in link.</p>}
        {error && <p className="mt-4 text-sm text-signal-danger flex gap-2" role="alert"><AlertCircle className="w-4 h-4 shrink-0" />{error}</p>}
      </section>
    </main>
  );
}
