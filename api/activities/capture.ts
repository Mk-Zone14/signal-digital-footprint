import type { Activity, Category } from '../../src/types';
import { activityToPersistence } from '../../src/platform/activityMapping';
import { createSupabaseAdminClient } from '../_lib/supabaseAdmin';

const categories = new Set<Category>([
  'coding', 'ai-ml', 'finance', 'filmmaking', 'reading', 'learning', 'social', 'projects',
]);

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function parseCapture(value: unknown): Activity {
  if (!isObject(value)) throw new Error('Capture body must be an object.');
  if (typeof value.externalId !== 'string' || !/^[A-Za-z0-9._:-]{1,200}$/.test(value.externalId)) {
    throw new Error('A stable externalId is required.');
  }
  if (typeof value.title !== 'string' || !value.title.trim()) throw new Error('Title is required.');
  if (typeof value.date !== 'string') throw new Error('Date is required.');
  if (typeof value.category !== 'string' || !categories.has(value.category as Category)) throw new Error('Category is invalid.');
  if (value.topics !== undefined && (!Array.isArray(value.topics) || value.topics.some(topic => typeof topic !== 'string'))) {
    throw new Error('Topics must be an array of strings.');
  }
  if (typeof value.url !== 'string') throw new Error('URL is required.');
  if (value.metadata !== undefined && !isObject(value.metadata)) throw new Error('Metadata must be an object.');
  if (value.durationMinutes !== undefined && (typeof value.durationMinutes !== 'number' || !Number.isFinite(value.durationMinutes))) {
    throw new Error('Duration is invalid.');
  }

  return {
    id: '',
    source: 'browser_extension',
    externalId: value.externalId,
    title: value.title,
    date: value.date,
    timestamp: typeof value.occurredAt === 'string' ? value.occurredAt : undefined,
    category: value.category as Category,
    tags: (value.topics as string[] | undefined) ?? [],
    description: typeof value.description === 'string' ? value.description : undefined,
    duration: typeof value.durationMinutes === 'number' ? value.durationMinutes : undefined,
    url: value.url,
    metadata: value.metadata as Record<string, unknown> | undefined,
  };
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') return Response.json({ error: 'Method not allowed.' }, { status: 405, headers: { Allow: 'POST' } });
    const authorization = request.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) return Response.json({ error: 'Authentication required.' }, { status: 401 });

    const admin = createSupabaseAdminClient();
    const token = authorization.slice('Bearer '.length).trim();
    const { data: authData, error: authError } = await admin.auth.getUser(token);
    if (authError || !authData.user) return Response.json({ error: 'Invalid or expired session.' }, { status: 401 });

    try {
      const contentLength = Number(request.headers.get('content-length') ?? '0');
      if (contentLength > 64_000) return Response.json({ error: 'Capture body is too large.' }, { status: 413 });
      const activity = parseCapture(await request.json());
      const row = activityToPersistence(activity, authData.user.id, 'browser_extension', activity.externalId!);
      const { data, error } = await admin.from('activities')
        .upsert(row, { onConflict: 'user_id,source,external_id' })
        .select('id, created_at, updated_at')
        .single();
      if (error) throw error;
      return Response.json({ activity: data }, { status: 200 });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Capture request failed.';
      const status = cause instanceof SyntaxError || message.includes('required') || message.includes('invalid') || message.includes('must') ? 400 : 500;
      return Response.json({ error: status === 400 ? message : 'Capture request failed.' }, { status });
    }
  },
};
