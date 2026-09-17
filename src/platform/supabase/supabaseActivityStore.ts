import type { SupabaseClient } from '@supabase/supabase-js';
import type { ActivityStore } from '../activityRepository';
import type { ActivityRow, Database } from '../database.types';

function unwrap<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  if (data === null) throw new Error('Supabase returned no data.');
  return data;
}

export class SupabaseActivityStore implements ActivityStore {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async list(userId: string): Promise<ActivityRow[]> {
    const { data, error } = await this.client.from('activities').select('*').eq('user_id', userId).order('date', { ascending: false });
    return unwrap(data, error);
  }

  async get(userId: string, id: string): Promise<ActivityRow | null> {
    const { data, error } = await this.client.from('activities').select('*').eq('user_id', userId).eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  async insert(row: Database['public']['Tables']['activities']['Insert']): Promise<ActivityRow> {
    const { data, error } = await this.client.from('activities').insert(row).select('*').single();
    return unwrap(data, error);
  }

  async upsert(rows: Database['public']['Tables']['activities']['Insert'][]): Promise<ActivityRow[]> {
    const { data, error } = await this.client.from('activities').upsert(rows, { onConflict: 'user_id,source,external_id' }).select('*');
    return unwrap(data, error);
  }

  async update(userId: string, id: string, values: Database['public']['Tables']['activities']['Update']): Promise<ActivityRow> {
    const { data, error } = await this.client.from('activities').update(values).eq('user_id', userId).eq('id', id).select('*').single();
    return unwrap(data, error);
  }

  async delete(userId: string, id: string): Promise<void> {
    const { error } = await this.client.from('activities').delete().eq('user_id', userId).eq('id', id);
    if (error) throw new Error(error.message);
  }
}
