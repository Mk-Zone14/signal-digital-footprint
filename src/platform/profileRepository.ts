import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, ProfileRow } from './database.types';

export class ProfileRepository {
  constructor(private readonly client: SupabaseClient<Database>, private readonly userId: string) {
    if (!userId) throw new Error('ProfileRepository requires an authenticated user.');
  }

  async getOrCreateProfile(email?: string): Promise<ProfileRow> {
    const existing = await this.client.from('profiles').select('*').eq('id', this.userId).maybeSingle();
    if (existing.error) throw new Error(existing.error.message);
    if (existing.data) return existing.data;

    const emailName = email?.split('@')[0]?.trim();
    const displayName = (emailName || 'Signal user').slice(0, 100);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const created = await this.client.from('profiles').insert({
      id: this.userId,
      display_name: displayName,
      username: null,
      timezone,
    }).select('*').single();
    if (created.error || !created.data) throw new Error(created.error?.message ?? 'Profile could not be created.');
    return created.data;
  }
}
