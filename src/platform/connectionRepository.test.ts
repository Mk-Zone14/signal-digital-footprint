import { describe, expect, it } from 'vitest';
import type { ConnectionRow, Database, SyncRunRow } from './database.types';
import { ConnectionRepository, connectionRowToDomain, type ConnectionStore } from './connectionRepository';
import { deriveSourceCards } from './sourceCards';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const baseRow: ConnectionRow = {
  id: '22222222-2222-4222-8222-222222222222', user_id: USER_ID, provider: 'github',
  provider_account_id: '42', provider_account_name: 'octocat', status: 'connected',
  connected_at: '2026-09-17T10:00:00.000Z', last_synced_at: null, sync_cursor: null,
  sync_error: null, metadata: {}, created_at: '2026-09-17T10:00:00.000Z', updated_at: '2026-09-17T10:00:00.000Z',
};

class MemoryConnectionStore implements ConnectionStore {
  rows: ConnectionRow[] = [];
  syncRuns: SyncRunRow[] = [];
  async list(userId: string) { return this.rows.filter(row => row.user_id === userId); }
  async get(userId: string, id: string) { return this.rows.find(row => row.user_id === userId && row.id === id) ?? null; }
  async insert(input: Database['public']['Tables']['connections']['Insert']) {
    const created = { ...baseRow, ...input } as ConnectionRow;
    this.rows.push(created); return created;
  }
  async update(userId: string, id: string, values: Database['public']['Tables']['connections']['Update']) {
    const existing = await this.get(userId, id); if (!existing) throw new Error('not found');
    Object.assign(existing, values); return existing;
  }
  async insertSyncRun(input: Database['public']['Tables']['sync_runs']['Insert']) {
    const created = { id: 'run-1', created_at: input.started_at ?? '', ...input } as SyncRunRow;
    this.syncRuns.push(created); return created;
  }
}

describe('connection boundary', () => {
  it('rejects rows from another owner', () => {
    expect(() => connectionRowToDomain({ ...baseRow, user_id: 'other' }, USER_ID)).toThrow(/ownership/i);
  });

  it('uses truthful source states without inventing connections', () => {
    const cards = deriveSourceCards([connectionRowToDomain(baseRow, USER_ID)]);
    expect(cards.find(card => card.provider === 'github')?.status).toBe('connected');
    expect(cards.find(card => card.provider === 'google_calendar')?.status).toBe('Not connected');
    expect(cards.find(card => card.provider === 'browser_extension')).toMatchObject({ status: 'Coming later', detail: 'Not installed' });
  });

  it('records a sync result and updates the real connection state', async () => {
    const store = new MemoryConnectionStore(); store.rows.push({ ...baseRow, status: 'syncing' });
    const repository = new ConnectionRepository(store, USER_ID);
    await repository.recordSyncResult(baseRow.id, {
      status: 'succeeded', startedAt: '2026-09-17T10:00:00.000Z', finishedAt: '2026-09-17T10:01:00.000Z',
      recordsCreated: 2, recordsUpdated: 1, recordsSkipped: 3, nextCursor: 'cursor-2',
    });
    expect(store.syncRuns).toHaveLength(1);
    expect(store.rows[0]).toMatchObject({ status: 'connected', sync_cursor: 'cursor-2', last_synced_at: '2026-09-17T10:01:00.000Z' });
  });
});
