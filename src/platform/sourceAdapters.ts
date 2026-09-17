import type { Activity, ActivitySource, ConnectionProvider } from '../types';

export interface AdapterContext {
  userId: string;
  connectionId: string;
  providerAccountId?: string;
  receivedAt: string;
}

export type ExternalActivitySource = Extract<ActivitySource, ConnectionProvider | 'browser_extension'>;

export type NormalizedExternalActivity = Activity & {
  source: ExternalActivitySource;
  externalId: string;
  connectionId?: string;
};

export interface SourceAdapter<TExternal> {
  readonly provider: ExternalActivitySource;
  normalize(external: TExternal, context: AdapterContext): NormalizedExternalActivity | NormalizedExternalActivity[];
}

export interface WebhookSyncService<TEvent> {
  verifyRequest(request: Request): Promise<TEvent>;
  processEvent(event: TEvent): Promise<void>;
}

export interface ReconciliationSyncService {
  reconcile(connectionId: string): Promise<void>;
}

export interface BrowserCaptureRequest {
  /** Client-generated UUID used for retry-safe idempotency. */
  externalId: string;
  title: string;
  date: string;
  occurredAt?: string;
  category: Activity['category'];
  topics?: string[];
  description?: string;
  durationMinutes?: number;
  url: string;
  metadata?: Record<string, unknown>;
}
