import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../src/platform/database.types';

/** Server-only. Never import this module from the Vite application under src/. */
export function createSupabaseAdminClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('Server Supabase configuration is incomplete.');
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
