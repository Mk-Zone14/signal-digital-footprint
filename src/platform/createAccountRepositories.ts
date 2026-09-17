import type { SupabaseClient } from '@supabase/supabase-js';
import type { SignalSession } from './auth';
import { ActivityRepository } from './activityRepository';
import { ConnectionRepository } from './connectionRepository';
import type { Database } from './database.types';
import { ProfileRepository } from './profileRepository';
import { SupabaseActivityStore } from './supabase/supabaseActivityStore';
import { SupabaseConnectionStore } from './supabase/supabaseConnectionStore';
import type { AccountRepositories } from '../hooks/useAccountData';

export function createAccountRepositories(
  client: SupabaseClient<Database>,
  session: SignalSession,
): AccountRepositories {
  const profileRepository = new ProfileRepository(client, session.user.id);
  return {
    activities: new ActivityRepository(new SupabaseActivityStore(client), session.user.id),
    connections: new ConnectionRepository(new SupabaseConnectionStore(client), session.user.id),
    async getProfileDisplayName() {
      return (await profileRepository.getOrCreateProfile(session.user.email)).display_name;
    },
  };
}
