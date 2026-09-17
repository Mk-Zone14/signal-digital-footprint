import type { Connection, ConnectionProvider } from '../types';

export interface SourceCardState {
  provider: ConnectionProvider | 'manual' | 'import';
  label: string;
  status: string;
  detail?: string;
}

export function deriveSourceCards(connections: Connection[]): SourceCardState[] {
  const connected = (provider: ConnectionProvider) => connections.find(item => item.provider === provider && item.status !== 'disconnected');
  const providerState = (provider: ConnectionProvider, label: string): SourceCardState => {
    if (provider === 'browser_extension') return { provider, label, status: 'Coming later', detail: 'Not installed' };
    const connection = connected(provider);
    return {
      provider,
      label,
      status: connection ? connection.status.replace('_', ' ') : 'Not connected',
      detail: connection?.providerAccountName,
    };
  };
  return [
    providerState('github', 'GitHub'),
    providerState('google_calendar', 'Google Calendar'),
    providerState('linear', 'Linear'),
    providerState('browser_extension', 'Browser Extension'),
    { provider: 'manual', label: 'Manual Activity', status: 'Available' },
    { provider: 'import', label: 'Import Data', status: 'Available' },
  ];
}
