import { useMemo, useState, type FormEvent } from 'react';
import { AlertCircle, CalendarDays, CheckCircle2, Database, Import, PenLine } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import type { Category, Connection, ManualActivityInput } from '../types';
import { deriveSourceCards } from '../platform/sourceCards';

const categoryOptions: Category[] = ['coding', 'ai-ml', 'finance', 'filmmaking', 'reading', 'learning', 'social', 'projects'];

interface SourcesPageProps {
  mode: 'demo' | 'account';
  connections: Connection[];
  writeError?: string | null;
  onCreateManual(input: ManualActivityInput): Promise<unknown>;
  onOpenImport(): void;
  onRequestSignIn(): void;
  accountSessionAvailable?: boolean;
}

export function SourcesPage({ mode, connections, writeError, onCreateManual, onOpenImport, onRequestSignIn, accountSessionAvailable = false }: SourcesPageProps) {
  const cards = useMemo(() => deriveSourceCards(connections), [connections]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const durationRaw = String(values.get('duration') ?? '').trim();
    const input: ManualActivityInput = {
      title: String(values.get('title') ?? ''),
      date: String(values.get('date') ?? ''),
      observedTime: String(values.get('time') ?? '') || undefined,
      category: String(values.get('category')) as Category,
      topics: String(values.get('topics') ?? '').split(',').map(value => value.trim()).filter(Boolean),
      description: String(values.get('description') ?? '') || undefined,
      durationMinutes: durationRaw ? Number(durationRaw) : undefined,
      url: String(values.get('url') ?? '') || undefined,
      project: String(values.get('project') ?? '') || undefined,
    };
    setSaving(true);
    setFormError(null);
    try {
      await onCreateManual(input);
      form.reset();
      setShowForm(false);
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'Signal could not save the activity.');
    } finally {
      setSaving(false);
    }
  };

  const icons = [Database, CalendarDays, CheckCircle2, Database, PenLine, Import];
  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map((card, index) => {
          const Icon = icons[index];
          return (
            <section key={card.provider} className="card p-5" aria-label={card.label}>
              <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 text-signal-accent mt-0.5" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <h2 className="font-medium text-signal-fg">{card.label}</h2>
                  <p className="text-sm text-signal-fgMuted capitalize">{card.status}</p>
                  {card.detail && <p className="text-xs text-signal-fgSubtle truncate">{card.detail}</p>}
                </div>
              </div>
              {card.provider === 'manual' && (
                <Button size="sm" variant="secondary" className="mt-4" onClick={mode === 'account' ? () => setShowForm(value => !value) : onRequestSignIn}>
                  {mode === 'account' ? 'Add activity' : accountSessionAvailable ? 'Return to account' : 'Sign in to save'}
                </Button>
              )}
              {card.provider === 'import' && <Button size="sm" variant="secondary" className="mt-4" onClick={onOpenImport}>Open JSON import</Button>}
            </section>
          );
        })}
      </div>

      {showForm && mode === 'account' && (
        <form onSubmit={submit} className="card p-5 space-y-4" aria-labelledby="manual-activity-title">
          <h2 id="manual-activity-title" className="text-lg font-semibold text-signal-fg">Add manual activity</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="text-sm text-signal-fg">Title<Input name="title" required maxLength={500} className="mt-1" /></label>
            <label className="text-sm text-signal-fg">Date<Input name="date" type="date" required className="mt-1" /></label>
            <label className="text-sm text-signal-fg">Observed time (UTC, optional)<Input name="time" type="time" className="mt-1" /></label>
            <label className="text-sm text-signal-fg">Category<select name="category" required className="input mt-1 w-full bg-signal-bgElevated border border-signal-border rounded-lg px-3 py-2">{categoryOptions.map(category => <option key={category}>{category}</option>)}</select></label>
            <label className="text-sm text-signal-fg sm:col-span-2">Topics (comma separated)<Input name="topics" className="mt-1" /></label>
            <label className="text-sm text-signal-fg sm:col-span-2">Description<textarea name="description" className="input mt-1 w-full min-h-20 bg-signal-bgElevated border border-signal-border rounded-lg px-3 py-2" /></label>
            <label className="text-sm text-signal-fg">Duration (minutes)<Input name="duration" type="number" min="0" step="1" className="mt-1" /></label>
            <label className="text-sm text-signal-fg">Project<Input name="project" className="mt-1" /></label>
            <label className="text-sm text-signal-fg sm:col-span-2">Source URL<Input name="url" type="url" inputMode="url" placeholder="https://" className="mt-1" /></label>
          </div>
          {(formError || writeError) && <p role="alert" className="text-sm text-signal-danger flex gap-2"><AlertCircle className="w-4 h-4" />{formError || writeError}</p>}
          <div className="flex gap-3"><Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save activity'}</Button><Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button></div>
        </form>
      )}
    </div>
  );
}
