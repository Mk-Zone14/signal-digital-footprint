// @vitest-environment jsdom

import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { SignalSession } from '../platform/auth';
import { ActivityRepository, type ActivityStore } from '../platform/activityRepository';
import { ConnectionRepository, type ConnectionStore } from '../platform/connectionRepository';
import type { ActivityRow, ConnectionRow, Database, SyncRunRow } from '../platform/database.types';
import { useAccountData, type AccountRepositories } from './useAccountData';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const session: SignalSession = { user: { id: USER_ID, email: 'person@example.com' }, accessToken: 'token' };

class TestActivityStore implements ActivityStore {
  constructor(private readonly rowsOrPromise: ActivityRow[] | Promise<ActivityRow[]>) {}
  async list(userId: string) { return (await this.rowsOrPromise).filter(row => row.user_id === userId); }
  async get() { return null; }
  async insert(_row: Database['public']['Tables']['activities']['Insert']): Promise<ActivityRow> { throw new Error('unused'); }
  async upsert(_rows: Database['public']['Tables']['activities']['Insert'][]): Promise<ActivityRow[]> { throw new Error('unused'); }
  async update(_userId: string, _id: string, _values: Database['public']['Tables']['activities']['Update']): Promise<ActivityRow> { throw new Error('unused'); }
  async delete() { return undefined; }
}

class EmptyConnectionStore implements ConnectionStore {
  async list(_userId: string): Promise<ConnectionRow[]> { return []; }
  async get() { return null; }
  async insert(_row: Database['public']['Tables']['connections']['Insert']): Promise<ConnectionRow> { throw new Error('unused'); }
  async update(_userId: string, _id: string, _values: Database['public']['Tables']['connections']['Update']): Promise<ConnectionRow> { throw new Error('unused'); }
  async insertSyncRun(_row: Database['public']['Tables']['sync_runs']['Insert']): Promise<SyncRunRow> { throw new Error('unused'); }
}

function repositories(rowsOrPromise: ActivityRow[] | Promise<ActivityRow[]>): AccountRepositories {
  return {
    activities: new ActivityRepository(new TestActivityStore(rowsOrPromise), USER_ID),
    connections: new ConnectionRepository(new EmptyConnectionStore(), USER_ID),
    async getProfileDisplayName() { return 'Account person'; },
  };
}

function activityRow(): ActivityRow {
  return {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', user_id: USER_ID, connection_id: null,
    source: 'manual', external_id: null, type: 'activity', title: 'Account-only activity',
    description: null, date: '2026-09-17', occurred_at: null, has_observed_time: false,
    category: 'projects', topics: [], project: null, duration_minutes: 30, url: null,
    source_metadata: {}, created_at: '2026-09-17T00:00:00.000Z', updated_at: '2026-09-17T00:00:00.000Z',
  };
}

describe('useAccountData', () => {
  it('starts account loading with an empty dataset instead of demo activities', async () => {
    let resolveRows!: (rows: ActivityRow[]) => void;
    const pending = new Promise<ActivityRow[]>(resolve => { resolveRows = resolve; });
    const repos = repositories(pending);
    const { result } = renderHook(() => useAccountData(session, repos));
    await waitFor(() => expect(result.current.status).toBe('loading'));
    expect(result.current.data.activities).toEqual([]);
    resolveRows([]);
    await waitFor(() => expect(result.current.status).toBe('ready'));
  });

  it('represents an authenticated empty account without demo fallback', async () => {
    const repos = repositories([]);
    const { result } = renderHook(() => useAccountData(session, repos));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.data.activities).toEqual([]);
    expect(result.current.displayName).toBe('Account person');
  });

  it('passes only mapped account activities into the downstream dataset', async () => {
    const repos = repositories([activityRow()]);
    const { result } = renderHook(() => useAccountData(session, repos));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.data.activities.map(activity => activity.title)).toEqual(['Account-only activity']);
    expect(result.current.data.activities.some(activity => activity.source === 'demo')).toBe(false);
  });
});
