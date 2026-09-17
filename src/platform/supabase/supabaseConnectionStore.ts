import type { SupabaseClient } from '@supabase/supabase-js';
import type { ConnectionStore } from '../connectionRepository';
import type { ConnectionRow, Database, SyncRunRow } from '../database.types';

function requireData<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  if (data === null) throw new Error('Supabase returned no data.');
  return data;
}

export class SupabaseConnectionStore implements ConnectionStore {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async list(userId: string): Promise<ConnectionRow[]> {
    const { data, error } = await this.client.from('connections').select('*').eq('user_id', userId).order('created_at');
    return requireData(data, error);
  }

  async get(userId: string, id: string): Promise<ConnectionRow | null> {
    const { data, error } = await this.client.from('connections').select('*').eq('user_id', userId).eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  async insert(row: Database['public']['Tables']['connections']['Insert']): Promise<ConnectionRow> {
    const { data, error } = await this.client.from('connections').insert(row).select('*').single();
    return requireData(data, error);
  }

  async update(userId: string, id: string, values: Database['public']['Tables']['connections']['Update']): Promise<ConnectionRow> {
    const { data, error } = await this.client.from('connections').update(values).eq('user_id', userId).eq('id', id).select('*').single();
    return requireData(data, error);
  }

  async insertSyncRun(row: Database['public']['Tables']['sync_runs']['Insert']): Promise<SyncRunRow> {
    const { data, error } = await this.client.from('sync_runs').insert(row).select('*').single();
    return requireData(data, error);
  }
}
