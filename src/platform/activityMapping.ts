import type { Activity, Category, ManualActivityInput, PersistedActivitySource } from '../types';
import type { ActivityRow, Database, Json } from './database.types';

export type ActivityInsert = Database['public']['Tables']['activities']['Insert'];

const categories = new Set<Category>([
  'coding', 'ai-ml', 'finance', 'filmmaking', 'reading', 'learning', 'social', 'projects',
]);

const persistedSources = new Set<PersistedActivitySource>([
  'manual', 'csv', 'json', 'github', 'google_calendar', 'linear', 'notion', 'toggl', 'browser_extension',
]);

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}

function optionalText(value: string | null | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function validateActivityUrl(value: string | undefined): string | undefined {
  const normalized = optionalText(value);
  if (!normalized) return undefined;
  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error('URL must be a valid http or https URL.');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('URL must be a valid http or https URL.');
  }
  return parsed.toString();
}

export function safeActivityUrl(value: string | undefined): string | undefined {
  try { return validateActivityUrl(value); } catch { return undefined; }
}

function toMetadata(value: Json): Record<string, unknown> | undefined {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  return undefined;
}

export function activityRowToDomain(row: ActivityRow, expectedUserId: string): Activity {
  if (row.user_id !== expectedUserId) throw new Error('Activity ownership mismatch.');
  if (!categories.has(row.category as Category)) throw new Error(`Unsupported activity category: ${row.category}`);
  if (!persistedSources.has(row.source as PersistedActivitySource)) throw new Error(`Unsupported activity source: ${row.source}`);
  if (!isCalendarDate(row.date)) throw new Error('Database activity has an invalid calendar date.');
  if (row.has_observed_time !== Boolean(row.occurred_at)) throw new Error('Database activity has inconsistent observed-time fields.');

  return {
    id: row.id,
    timestamp: row.occurred_at ?? undefined,
    date: row.date,
    category: row.category as Category,
    title: row.title,
    duration: row.duration_minutes ?? undefined,
    platform: undefined,
    tags: Array.isArray(row.topics) ? row.topics : [],
    description: row.description ?? undefined,
    url: row.url ?? undefined,
    source: row.source as PersistedActivitySource,
    connectionId: row.connection_id ?? undefined,
    externalId: row.external_id ?? undefined,
    type: row.type,
    project: row.project ?? undefined,
    metadata: toMetadata(row.source_metadata),
  };
}

export function activityToPersistence(
  activity: Activity,
  userId: string,
  source: PersistedActivitySource,
  externalId: string | null = activity.externalId ?? null,
): ActivityInsert {
  if (!userId) throw new Error('An authenticated user is required.');
  if (!isCalendarDate(activity.date)) throw new Error('Activity date must be a real YYYY-MM-DD calendar date.');
  if (!categories.has(activity.category)) throw new Error('Activity category is not supported.');
  const title = activity.title.trim();
  if (!title) throw new Error('Activity title is required.');
  if (activity.duration !== undefined && (!Number.isFinite(activity.duration) || activity.duration < 0)) {
    throw new Error('Duration must be a non-negative number of minutes.');
  }

  let occurredAt: string | null = null;
  if (activity.timestamp) {
    const parsed = new Date(activity.timestamp);
    if (Number.isNaN(parsed.getTime()) || !/(Z|[+-]\d{2}:\d{2})$/i.test(activity.timestamp)) {
      throw new Error('Observed time must be an ISO-8601 instant with a timezone.');
    }
    occurredAt = parsed.toISOString();
  }

  return {
    user_id: userId,
    connection_id: activity.connectionId ?? null,
    source,
    external_id: externalId,
    type: optionalText(activity.type) ?? 'activity',
    title,
    description: optionalText(activity.description) ?? null,
    date: activity.date,
    occurred_at: occurredAt,
    has_observed_time: occurredAt !== null,
    category: activity.category,
    topics: activity.tags.map(topic => topic.trim()).filter(Boolean),
    project: optionalText(activity.project) ?? null,
    duration_minutes: activity.duration === undefined ? null : Math.round(activity.duration),
    url: validateActivityUrl(activity.url) ?? null,
    source_metadata: (activity.metadata ?? {}) as Json,
  };
}

export function manualInputToPersistence(input: ManualActivityInput, userId: string): ActivityInsert {
  const observedTime = optionalText(input.observedTime);
  if (observedTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(observedTime)) {
    throw new Error('Observed time must use HH:MM in UTC.');
  }
  const timestamp = observedTime ? `${input.date}T${observedTime}:00.000Z` : undefined;
  return activityToPersistence({
    id: '',
    title: input.title,
    date: input.date,
    timestamp,
    category: input.category,
    tags: input.topics,
    description: input.description,
    duration: input.durationMinutes,
    url: input.url,
    project: input.project,
    source: 'manual',
  }, userId, 'manual', null);
}
