export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ProfileRow = {
  id: string;
  display_name: string;
  username: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
};

export type ConnectionRow = {
  id: string;
  user_id: string;
  provider: string;
  provider_account_id: string | null;
  provider_account_name: string | null;
  status: string;
  connected_at: string;
  last_synced_at: string | null;
  sync_cursor: string | null;
  sync_error: string | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
};

export type ActivityRow = {
  id: string;
  user_id: string;
  connection_id: string | null;
  source: string;
  external_id: string | null;
  type: string;
  title: string;
  description: string | null;
  date: string;
  occurred_at: string | null;
  has_observed_time: boolean;
  category: string;
  topics: string[];
  project: string | null;
  duration_minutes: number | null;
  url: string | null;
  source_metadata: Json;
  created_at: string;
  updated_at: string;
};

export type SyncRunRow = {
  id: string;
  user_id: string;
  connection_id: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  records_created: number;
  records_updated: number;
  records_skipped: number;
  error_message: string | null;
  created_at: string;
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Omit<ProfileRow, 'created_at' | 'updated_at'> & Partial<Pick<ProfileRow, 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<ProfileRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      connections: {
        Row: ConnectionRow;
        Insert: Omit<ConnectionRow, 'id' | 'created_at' | 'updated_at' | 'connected_at'> & Partial<Pick<ConnectionRow, 'id' | 'created_at' | 'updated_at' | 'connected_at'>>;
        Update: Partial<Omit<ConnectionRow, 'id' | 'user_id' | 'created_at'>>;
        Relationships: [];
      };
      activities: {
        Row: ActivityRow;
        Insert: Omit<ActivityRow, 'id' | 'created_at' | 'updated_at'> & Partial<Pick<ActivityRow, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<ActivityRow, 'id' | 'user_id' | 'created_at'>>;
        Relationships: [];
      };
      sync_runs: {
        Row: SyncRunRow;
        Insert: Omit<SyncRunRow, 'id' | 'created_at' | 'started_at'> & Partial<Pick<SyncRunRow, 'id' | 'created_at' | 'started_at'>>;
        Update: Partial<Omit<SyncRunRow, 'id' | 'user_id' | 'connection_id' | 'created_at'>>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
