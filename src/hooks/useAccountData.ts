import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Activity, Connection, DemoData, ManualActivityInput } from '../types';
import type { SignalSession } from '../platform/auth';
import type { ActivityRepository } from '../platform/activityRepository';
import type { ConnectionRepository } from '../platform/connectionRepository';

export interface AccountRepositories {
  activities: ActivityRepository;
  connections: ConnectionRepository;
  getProfileDisplayName(): Promise<string>;
}

export type AccountDataStatus = 'idle' | 'loading' | 'ready' | 'error';

const emptyAccountData = (): DemoData => ({ activities: [], timelineEvents: [], interests: [], skills: [] });

export function useAccountData(session: SignalSession | null, repositories: AccountRepositories | null) {
  const [data, setData] = useState<DemoData>(emptyAccountData);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [displayName, setDisplayName] = useState('Signal user');
  const [status, setStatus] = useState<AccountDataStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [writeError, setWriteError] = useState<string | null>(null);
  const requestGeneration = useRef(0);

  const load = useCallback(async () => {
    const generation = ++requestGeneration.current;
    if (!session || !repositories) {
      setData(emptyAccountData());
      setConnections([]);
      setStatus('idle');
      setError(null);
      return;
    }
    setStatus('loading');
    setError(null);
    try {
      const [activities, nextConnections, nextDisplayName] = await Promise.all([
        repositories.activities.listActivities(),
        repositories.connections.listConnections(),
        repositories.getProfileDisplayName(),
      ]);
      if (generation !== requestGeneration.current) return;
      setData({ activities, timelineEvents: [], interests: [], skills: [] });
      setConnections(nextConnections);
      setDisplayName(nextDisplayName);
      setStatus('ready');
    } catch (cause) {
      if (generation !== requestGeneration.current) return;
      setData(emptyAccountData());
      setConnections([]);
      setError(cause instanceof Error ? cause.message : 'Signal could not load account activity.');
      setStatus('error');
    }
  }, [repositories, session]);

  useEffect(() => {
    void load();
    return () => { requestGeneration.current += 1; };
  }, [load]);

  const createManualActivity = useCallback(async (input: ManualActivityInput) => {
    if (!repositories || !session) throw new Error('Sign in to save a manual activity.');
    setWriteError(null);
    const generation = requestGeneration.current;
    try {
      const created = await repositories.activities.createManualActivity(input);
      if (generation === requestGeneration.current) {
        setData(current => ({ ...current, activities: [created, ...current.activities] }));
      }
      return created;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Signal could not save the activity.';
      if (generation === requestGeneration.current) setWriteError(message);
      throw new Error(message);
    }
  }, [repositories, session]);

  const persistImport = useCallback(async (activities: Activity[], source: 'json' | 'csv' = 'json') => {
    if (!repositories || !session) throw new Error('Sign in to persist imported activities.');
    setWriteError(null);
    const generation = requestGeneration.current;
    try {
      await repositories.activities.bulkImportActivities(activities, source);
      const refreshed = await repositories.activities.listActivities();
      if (generation === requestGeneration.current) {
        setData(current => ({ ...current, activities: refreshed }));
      }
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Signal could not persist the import.';
      if (generation === requestGeneration.current) setWriteError(message);
      throw new Error(message);
    }
  }, [repositories, session]);

  return useMemo(() => ({
    data, connections, displayName, status, error, writeError, reload: load, createManualActivity, persistImport,
  }), [data, connections, displayName, status, error, writeError, load, createManualActivity, persistImport]);
}
