import { describe, expect, it } from 'vitest';
import type { Activity } from '../types';
import type { ActivityRow, Database } from './database.types';
import { activityRowToDomain, activityToPersistence } from './activityMapping';
import { ActivityRepository, type ActivityStore } from './activityRepository';

const USER_ID = '11111111-1111-4111-8111-111111111111';

function row(overrides: Partial<ActivityRow> = {}): ActivityRow {
  return {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', user_id: USER_ID, connection_id: null,
    source: 'manual', external_id: null, type: 'activity', title: 'Read documentation',
    description: null, date: '2026-09-17', occurred_at: null, has_observed_time: false,
    category: 'learning', topics: ['Supabase'], project: null, duration_minutes: null,
    url: null, source_metadata: {}, created_at: '2026-09-17T10:00:00.000Z', updated_at: '2026-09-17T10:00:00.000Z',
    ...overrides,
  };
}

class MemoryActivityStore implements ActivityStore {
  rows: ActivityRow[] = [];
  sequence = 1;
  async list(userId: string) { return this.rows.filter(item => item.user_id === userId); }
  async get(userId: string, id: string) { return this.rows.find(item => item.user_id === userId && item.id === id) ?? null; }
  async insert(input: Database['public']['Tables']['activities']['Insert']) {
    const created = row({ ...input, id: `00000000-0000-4000-8000-${String(this.sequence++).padStart(12, '0')}` }) as ActivityRow;
    this.rows.push(created);
    return created;
  }
  async upsert(inputs: Database['public']['Tables']['activities']['Insert'][]) {
    return Promise.all(inputs.map(async input => {
      const existing = this.rows.find(item => item.user_id === input.user_id && item.source === input.source && item.external_id === input.external_id && input.external_id !== null);
      if (!existing) return this.insert(input);
      Object.assign(existing, input, { updated_at: '2026-09-17T11:00:00.000Z' });
      return existing;
    }));
  }
  async update(userId: string, id: string, values: Database['public']['Tables']['activities']['Update']) {
    const existing = await this.get(userId, id);
    if (!existing) throw new Error('not found');
    Object.assign(existing, values);
    return existing;
  }
  async delete(userId: string, id: string) { this.rows = this.rows.filter(item => item.user_id !== userId || item.id !== id); }
}

describe('activity persistence boundary', () => {
  it('maps a date-only database record without fabricating a timestamp or duration', () => {
    const activity = activityRowToDomain(row(), USER_ID);
    expect(activity.timestamp).toBeUndefined();
    expect(activity.duration).toBeUndefined();
    expect(activity.source).toBe('manual');
  });

  it('maps an observed timestamp and provenance to persistence fields', () => {
    const activity: Activity = {
      id: 'provider-1', date: '2026-09-17', timestamp: '2026-09-17T12:30:00+00:00',
      category: 'coding', title: 'Pushed commit', duration: 15, tags: ['TypeScript'],
      source: 'github', externalId: 'account-1:commit-1', url: 'https://github.com/example/repo/commit/1',
    };
    const persisted = activityToPersistence(activity, USER_ID, 'github', activity.externalId);
    expect(persisted).toMatchObject({ user_id: USER_ID, source: 'github', external_id: 'account-1:commit-1', has_observed_time: true });
    expect(persisted.occurred_at).toBe('2026-09-17T12:30:00.000Z');
  });

  it('rejects a database record belonging to another user', () => {
    expect(() => activityRowToDomain(row({ user_id: 'other-user' }), USER_ID)).toThrow(/ownership/i);
  });

  it('rejects unsafe URL protocols before persistence', () => {
    expect(() => activityToPersistence({
      id: 'unsafe', date: '2026-09-17', category: 'coding', title: 'Unsafe link', tags: [], url: 'javascript:alert(1)',
    }, USER_ID, 'json', 'unsafe')).toThrow(/http or https/i);
  });

  it('persists manual activity with server-controlled ownership and null external identifiers', async () => {
    const store = new MemoryActivityStore();
    const repository = new ActivityRepository(store, USER_ID);
    const created = await repository.createManualActivity({
      title: 'Write notes', date: '2026-09-17', category: 'learning', topics: ['Notes'],
    });
    expect(store.rows[0]).toMatchObject({ user_id: USER_ID, source: 'manual', connection_id: null, external_id: null, occurred_at: null });
    expect(created.source).toBe('manual');
  });

  it('persists validated imports and remains idempotent for a repeated source record', async () => {
    const store = new MemoryActivityStore();
    const repository = new ActivityRepository(store, USER_ID);
    const imported: Activity = { id: 'import-row-1', date: '2026-09-16', category: 'projects', title: 'Imported item', duration: 20, tags: [] };
    await repository.bulkImportActivities([imported], 'json');
    await repository.bulkImportActivities([{ ...imported, title: 'Imported item updated' }], 'json');
    expect(store.rows).toHaveLength(1);
    expect(store.rows[0]).toMatchObject({ source: 'json', external_id: 'import-row-1', title: 'Imported item updated' });
  });

  it('requires provider activities to carry a stable external identifier', async () => {
    const repository = new ActivityRepository(new MemoryActivityStore(), USER_ID);
    await expect(repository.upsertExternalActivities([{ id: 'x', date: '2026-09-17', category: 'coding', title: 'Commit', tags: [], source: 'github' }])).rejects.toThrow(/external ID/i);
  });
});
