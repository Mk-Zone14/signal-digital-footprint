import type { Activity, ManualActivityInput, PersistedActivitySource } from '../types';
import type { ActivityRow, Database } from './database.types';
import { activityRowToDomain, activityToPersistence, manualInputToPersistence } from './activityMapping';

type ActivityInsert = Database['public']['Tables']['activities']['Insert'];
type ActivityUpdate = Database['public']['Tables']['activities']['Update'];

export interface ActivityStore {
  list(userId: string): Promise<ActivityRow[]>;
  get(userId: string, id: string): Promise<ActivityRow | null>;
  insert(row: ActivityInsert): Promise<ActivityRow>;
  upsert(rows: ActivityInsert[]): Promise<ActivityRow[]>;
  update(userId: string, id: string, values: ActivityUpdate): Promise<ActivityRow>;
  delete(userId: string, id: string): Promise<void>;
}

export class ActivityRepository {
  constructor(private readonly store: ActivityStore, private readonly userId: string) {
    if (!userId) throw new Error('ActivityRepository requires an authenticated user.');
  }

  async listActivities(): Promise<Activity[]> {
    return (await this.store.list(this.userId)).map(row => activityRowToDomain(row, this.userId));
  }

  async getActivity(id: string): Promise<Activity | null> {
    const row = await this.store.get(this.userId, id);
    return row ? activityRowToDomain(row, this.userId) : null;
  }

  async createManualActivity(input: ManualActivityInput): Promise<Activity> {
    return activityRowToDomain(await this.store.insert(manualInputToPersistence(input, this.userId)), this.userId);
  }

  async bulkImportActivities(activities: Activity[], source: 'json' | 'csv'): Promise<Activity[]> {
    const rows = activities.map(activity => activityToPersistence(
      activity,
      this.userId,
      source,
      activity.externalId ?? activity.id,
    ));
    if (rows.length === 0) return [];
    return (await this.store.upsert(rows)).map(row => activityRowToDomain(row, this.userId));
  }

  async upsertExternalActivities(activities: Activity[]): Promise<Activity[]> {
    const rows = activities.map(activity => {
      const source = activity.source as PersistedActivitySource | undefined;
      if (!source || source === 'manual' || source === 'json' || source === 'csv' || !activity.externalId) {
        throw new Error('External activities require a provider source and stable external ID.');
      }
      return activityToPersistence(activity, this.userId, source, activity.externalId);
    });
    if (rows.length === 0) return [];
    return (await this.store.upsert(rows)).map(row => activityRowToDomain(row, this.userId));
  }

  async updateActivity(id: string, patch: Partial<Activity>): Promise<Activity> {
    const current = await this.getActivity(id);
    if (!current) throw new Error('Activity not found.');
    const next = { ...current, ...patch, id: current.id };
    const mapped = activityToPersistence(next, this.userId, current.source as PersistedActivitySource, current.externalId ?? null);
    const { user_id: _userId, ...values } = mapped;
    return activityRowToDomain(await this.store.update(this.userId, id, values), this.userId);
  }

  async deleteActivity(id: string): Promise<void> {
    await this.store.delete(this.userId, id);
  }
}
