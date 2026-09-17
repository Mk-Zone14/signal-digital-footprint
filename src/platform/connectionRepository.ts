import type { Connection, ConnectionProvider, ConnectionStatus } from '../types';
import type { ConnectionRow, Database, SyncRunRow } from './database.types';

type ConnectionInsert = Database['public']['Tables']['connections']['Insert'];
type ConnectionUpdate = Database['public']['Tables']['connections']['Update'];
type SyncRunInsert = Database['public']['Tables']['sync_runs']['Insert'];

const providers = new Set<ConnectionProvider>(['github', 'google_calendar', 'linear', 'notion', 'toggl', 'browser_extension']);
const statuses = new Set<ConnectionStatus>(['not_connected', 'connecting', 'connected', 'syncing', 'error', 'disconnected']);

export interface SyncResult {
  status: 'succeeded' | 'failed' | 'partial';
  startedAt: string;
  finishedAt: string;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  errorMessage?: string;
  nextCursor?: string;
}

export interface ConnectionStore {
  list(userId: string): Promise<ConnectionRow[]>;
  get(userId: string, id: string): Promise<ConnectionRow | null>;
  insert(row: ConnectionInsert): Promise<ConnectionRow>;
  update(userId: string, id: string, values: ConnectionUpdate): Promise<ConnectionRow>;
  insertSyncRun(row: SyncRunInsert): Promise<SyncRunRow>;
}

export function connectionRowToDomain(row: ConnectionRow, expectedUserId: string): Connection {
  if (row.user_id !== expectedUserId) throw new Error('Connection ownership mismatch.');
  if (!providers.has(row.provider as ConnectionProvider)) throw new Error(`Unsupported connection provider: ${row.provider}`);
  if (!statuses.has(row.status as ConnectionStatus)) throw new Error(`Unsupported connection status: ${row.status}`);
  const metadata = row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
    ? row.metadata as Record<string, unknown>
    : {};
  return {
    id: row.id,
    provider: row.provider as ConnectionProvider,
    providerAccountId: row.provider_account_id ?? undefined,
    providerAccountName: row.provider_account_name ?? undefined,
    status: row.status as ConnectionStatus,
    connectedAt: row.connected_at,
    lastSyncedAt: row.last_synced_at ?? undefined,
    syncError: row.sync_error ?? undefined,
    metadata,
  };
}

export class ConnectionRepository {
  constructor(private readonly store: ConnectionStore, private readonly userId: string) {
    if (!userId) throw new Error('ConnectionRepository requires an authenticated user.');
  }

  async listConnections(): Promise<Connection[]> {
    return (await this.store.list(this.userId)).map(row => connectionRowToDomain(row, this.userId));
  }

  async getConnection(id: string): Promise<Connection | null> {
    const row = await this.store.get(this.userId, id);
    return row ? connectionRowToDomain(row, this.userId) : null;
  }

  async createConnection(provider: ConnectionProvider, account?: { id?: string; name?: string }): Promise<Connection> {
    return connectionRowToDomain(await this.store.insert({
      user_id: this.userId,
      provider,
      provider_account_id: account?.id ?? null,
      provider_account_name: account?.name ?? null,
      status: 'connecting',
      last_synced_at: null,
      sync_cursor: null,
      sync_error: null,
      metadata: {},
    }), this.userId);
  }

  async updateConnectionStatus(id: string, status: ConnectionStatus, syncError?: string): Promise<Connection> {
    return connectionRowToDomain(await this.store.update(this.userId, id, {
      status,
      sync_error: syncError ?? null,
    }), this.userId);
  }

  async disconnectConnection(id: string): Promise<Connection> {
    return this.updateConnectionStatus(id, 'disconnected');
  }

  async recordSyncResult(connectionId: string, result: SyncResult): Promise<void> {
    await this.store.insertSyncRun({
      user_id: this.userId,
      connection_id: connectionId,
      started_at: result.startedAt,
      finished_at: result.finishedAt,
      status: result.status,
      records_created: result.recordsCreated,
      records_updated: result.recordsUpdated,
      records_skipped: result.recordsSkipped,
      error_message: result.errorMessage ?? null,
    });
    await this.store.update(this.userId, connectionId, {
      status: result.status === 'failed' ? 'error' : 'connected',
      last_synced_at: result.finishedAt,
      sync_cursor: result.nextCursor ?? undefined,
      sync_error: result.errorMessage ?? null,
    });
  }
}
