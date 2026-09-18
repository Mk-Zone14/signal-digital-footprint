import {
  Activity,
  Category,
  SignalScore,
  Archetype,
  PeakHoursData,
  DigitalDNA,
  MomentumData,
  Interest,
  Skill,
  TimelineEvent,
  DateRange,
  DateRangeObservation,
  CategoryDistributionItem,
  ActivityChangeResult,
  TopicTrend,
  PeakHourObservation,
  WeekdayDistribution,
  ConsistencyStats,
  TopicActivityGap,
  TopicCooccurrenceEdge,
  TopicIndexEntry,
  ActivityNormalizationIssue,
  ActivityNormalizationResult,
  ActivityScopes,
  V2Analytics,
  V2AnalyticsOptions,
} from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_COMPARISON_WINDOW_DAYS = 30;

/**
 * Calendar policy: YYYY-MM-DD values are literal calendar dates. Observed
 * timestamps are instants and are grouped by UTC calendar day/hour/weekday.
 * Relative windows are inclusive calendar-day ranges ending on referenceDate.
 */

export const CATEGORIES: Category[] = [
  'coding',
  'ai-ml',
  'finance',
  'filmmaking',
  'reading',
  'learning',
  'social',
  'projects',
];

export const categoryColors: Record<Category, string> = {
  coding: '#00D4AA',
  'ai-ml': '#6366F1',
  finance: '#F5A623',
  filmmaking: '#EC4899',
  reading: '#3B82F6',
  learning: '#10B981',
  social: '#F97316',
  projects: '#8B5CF6',
};

export const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export const TOPIC_GAP_THRESHOLDS = {
  ACTIVE_DAYS: 14,
  COOLING_DAYS: 45,
} as const;

// ============================================================================
// DATA NORMALIZATION
// ============================================================================

function readProp(obj: Record<string, unknown>, key: string): unknown {
  return Object.prototype.hasOwnProperty.call(obj, key) ? obj[key] : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function issue(
  index: number,
  code: ActivityNormalizationIssue['code'],
  message: string,
  field?: string
): ActivityNormalizationIssue {
  return { index, code, field, message };
}

/** Returns the canonical identity used to compare tags without changing display copy. */
export function canonicalizeTag(tag: string): string {
  return tag.trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-US');
}

function cleanTagLabel(tag: string): string {
  return tag.trim().replace(/\s+/g, ' ');
}

function normalizeTagList(value: unknown, index: number, warnings: ActivityNormalizationIssue[]): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    warnings.push(issue(index, 'malformed-optional-value', 'Tags must be an array of strings; the value was ignored.', 'tags'));
    return [];
  }

  const labelsByKey = new Map<string, string>();
  let ignoredValue = false;
  for (const item of value) {
    if (typeof item !== 'string') {
      ignoredValue = true;
      continue;
    }
    const label = cleanTagLabel(item);
    const key = canonicalizeTag(label);
    if (key && !labelsByKey.has(key)) labelsByKey.set(key, label);
  }
  if (ignoredValue) {
    warnings.push(issue(index, 'malformed-optional-value', 'Non-string tag values were ignored.', 'tags'));
  }
  return Array.from(labelsByKey.values());
}

function isValidCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === month - 1
    && parsed.getUTCDate() === day;
}

function parseObservedTimestamp(value: unknown): Date | null {
  if (typeof value !== 'string' || !value.includes('T')) return null;
  // A timezone is required so imported data never depends on the machine locale.
  if (!/(?:Z|[+-]\d{2}:\d{2})$/i.test(value)) return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function calendarDateFromTimestamp(timestamp: Date): string {
  return timestamp.toISOString().slice(0, 10);
}

function calendarDateToOrdinal(date: string): number {
  const [year, month, day] = date.split('-').map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / DAY_MS);
}

function ordinalToCalendarDate(ordinal: number): string {
  return new Date(ordinal * DAY_MS).toISOString().slice(0, 10);
}

function referenceCalendarDate(referenceDate: Date): string {
  if (!Number.isFinite(referenceDate.getTime())) {
    throw new RangeError('referenceDate must be a valid Date');
  }
  return referenceDate.toISOString().slice(0, 10);
}

function activityCalendarDate(activity: Activity): string | null {
  const timestamp = parseObservedTimestamp(activity.timestamp);
  if (timestamp) return calendarDateFromTimestamp(timestamp);
  return typeof activity.date === 'string' && isValidCalendarDate(activity.date) ? activity.date : null;
}

interface NormalizedActivityRecord {
  activity: Activity | null;
  errors: ActivityNormalizationIssue[];
  warnings: ActivityNormalizationIssue[];
  suppliedId: boolean;
}

function normalizeActivityRecord(raw: unknown, index: number): NormalizedActivityRecord {
  const errors: ActivityNormalizationIssue[] = [];
  const warnings: ActivityNormalizationIssue[] = [];
  if (!isRecord(raw)) {
    errors.push(issue(index, 'invalid-record', 'Activity must be a JSON object.'));
    return { activity: null, errors, warnings, suppliedId: false };
  }

  const rawTimestamp = readProp(raw, 'timestamp');
  const rawDate = readProp(raw, 'date');
  let observedTimestamp: Date | null = null;

  if (rawTimestamp !== undefined) {
    observedTimestamp = parseObservedTimestamp(rawTimestamp);
    if (!observedTimestamp) {
      errors.push(issue(index, 'invalid-timestamp', 'Timestamp must be a valid ISO-8601 instant with a timezone.', 'timestamp'));
    }
  }

  let literalDate: string | null = null;
  if (rawDate !== undefined) {
    if (typeof rawDate === 'string' && isValidCalendarDate(rawDate)) {
      literalDate = rawDate;
    } else if (rawTimestamp === undefined) {
      const legacyTimestamp = parseObservedTimestamp(rawDate);
      if (legacyTimestamp) {
        observedTimestamp = legacyTimestamp;
      } else {
        errors.push(issue(index, 'invalid-date', 'Date must be a real calendar date in YYYY-MM-DD format.', 'date'));
      }
    } else {
      errors.push(issue(index, 'invalid-date', 'Date must be a real calendar date in YYYY-MM-DD format.', 'date'));
    }
  }

  if (!observedTimestamp && !literalDate && rawDate === undefined && rawTimestamp === undefined) {
    errors.push(issue(index, 'invalid-date', 'Activity requires either a valid date or timestamp.', 'date'));
  }

  const rawDuration = readProp(raw, 'duration');
  if (typeof rawDuration !== 'number' || !Number.isFinite(rawDuration) || rawDuration < 0) {
    errors.push(issue(index, 'invalid-duration', 'Duration must be a finite, non-negative number of minutes.', 'duration'));
  }

  const rawCategory = readProp(raw, 'category');
  if (typeof rawCategory !== 'string' || !CATEGORIES.includes(rawCategory as Category)) {
    errors.push(issue(index, 'invalid-category', 'Category must be one of the supported Signal V2 categories.', 'category'));
  }

  const rawTitle = readProp(raw, 'title');
  if (typeof rawTitle !== 'string' || rawTitle.trim().length === 0) {
    errors.push(issue(index, 'invalid-title', 'Title must be a non-empty string.', 'title'));
  }

  if (errors.length > 0) {
    return { activity: null, errors, warnings, suppliedId: false };
  }

  const rawId = readProp(raw, 'id');
  const suppliedId = typeof rawId === 'string' && rawId.trim().length > 0;
  const id = suppliedId ? (rawId as string).trim() : `activity-${String(index + 1).padStart(6, '0')}`;
  if (!suppliedId) {
    warnings.push(issue(index, 'fallback-id', `Missing ID was replaced with deterministic fallback "${id}".`, 'id'));
  }

  const timestamp = observedTimestamp?.toISOString();
  const date = observedTimestamp ? calendarDateFromTimestamp(observedTimestamp) : literalDate!;
  if (observedTimestamp && literalDate && literalDate !== date) {
    warnings.push(issue(index, 'date-normalized-from-timestamp', `Date was normalized to ${date} using the timestamp's UTC calendar day.`, 'date'));
  }

  const category = rawCategory as Category;
  const title = (rawTitle as string).trim();

  const tagsValue = readProp(raw, 'tags') ?? readProp(raw, 'topics');
  const tags = normalizeTagList(tagsValue, index, warnings);
  const duration = rawDuration as number;

  const optionalString = (field: string): string | undefined => {
    const value = readProp(raw, field);
    if (value === undefined) return undefined;
    if (typeof value === 'string') return value;
    warnings.push(issue(index, 'malformed-optional-value', `${field} must be a string; the value was ignored.`, field));
    return undefined;
  };

  const rawMetadata = readProp(raw, 'metadata');
  let metadata: Record<string, unknown> | undefined;
  if (rawMetadata !== undefined) {
    if (isRecord(rawMetadata)) metadata = rawMetadata;
    else warnings.push(issue(index, 'malformed-optional-value', 'metadata must be an object; the value was ignored.', 'metadata'));
  }

  const rawImpactScore = readProp(raw, 'impactScore');
  const impactScore = typeof rawImpactScore === 'number' && Number.isFinite(rawImpactScore)
    ? rawImpactScore
    : undefined;
  if (rawImpactScore !== undefined && impactScore === undefined) {
    warnings.push(issue(index, 'malformed-optional-value', 'impactScore must be finite; the legacy value was ignored.', 'impactScore'));
  }

  return {
    activity: {
      id,
      timestamp,
      date,
      category,
      title,
      duration,
      platform: optionalString('platform'),
      tags,
      description: optionalString('description'),
      url: optionalString('url'),
      metadata,
      impactScore,
    },
    errors,
    warnings,
    suppliedId,
  };
}

/** Normalizes one record. Invalid or unusable records return null instead of fabricated data. */
export function normalizeActivity(raw: unknown, fallbackIndex: number = 0): Activity | null {
  return normalizeActivityRecord(raw, fallbackIndex).activity;
}

/**
 * Normalizes a complete activity payload and preserves every rejection for the
 * import boundary. Fallback IDs are deterministic and unique within the payload.
 */
export function normalizeActivities(rawActivities: unknown): ActivityNormalizationResult {
  if (!Array.isArray(rawActivities)) {
    const recordIssue = issue(-1, 'invalid-record', 'activities must be an array.', 'activities');
    return { activities: [], rejected: [{ index: -1, record: rawActivities, issues: [recordIssue] }], warnings: [] };
  }

  const activities: Activity[] = [];
  const rejected: ActivityNormalizationResult['rejected'] = [];
  const warnings: ActivityNormalizationIssue[] = [];
  const usedIds = new Set<string>();
  const reservedSuppliedIds = new Set(
    rawActivities.flatMap(record => {
      if (!isRecord(record)) return [];
      const id = readProp(record, 'id');
      return typeof id === 'string' && id.trim() ? [id.trim()] : [];
    })
  );

  rawActivities.forEach((record, index) => {
    const normalized = normalizeActivityRecord(record, index);
    warnings.push(...normalized.warnings);
    if (!normalized.activity) {
      rejected.push({ index, record, issues: normalized.errors });
      return;
    }

    if (normalized.suppliedId && usedIds.has(normalized.activity.id)) {
      const duplicateIssue = issue(index, 'duplicate-id', `Duplicate activity ID "${normalized.activity.id}".`, 'id');
      rejected.push({ index, record, issues: [duplicateIssue] });
      return;
    }

    if (!normalized.suppliedId && (usedIds.has(normalized.activity.id) || reservedSuppliedIds.has(normalized.activity.id))) {
      const baseId = normalized.activity.id;
      let suffix = 2;
      while (usedIds.has(`${baseId}-${suffix}`) || reservedSuppliedIds.has(`${baseId}-${suffix}`)) suffix++;
      normalized.activity.id = `${baseId}-${suffix}`;
      const fallbackWarning = warnings.find(item => item.index === index && item.code === 'fallback-id');
      if (fallbackWarning) fallbackWarning.message = `Missing ID was replaced with deterministic fallback "${normalized.activity.id}".`;
    }

    usedIds.add(normalized.activity.id);
    activities.push(normalized.activity);
  });

  return { activities, rejected, warnings };
}

// ============================================================================
// FILTERING & HELPERS
// ============================================================================

export function resolveReferenceDate(activities: Activity[]): Date | null {
  let latestOrdinal = -Infinity;
  for (const activity of activities || []) {
    const date = activityCalendarDate(activity);
    if (date) latestOrdinal = Math.max(latestOrdinal, calendarDateToOrdinal(date));
  }
  return Number.isFinite(latestOrdinal)
    ? new Date((latestOrdinal + 1) * DAY_MS - 1)
    : null;
}

function subtractUtcMonths(date: string, months: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const targetMonthIndex = year * 12 + (month - 1) - months;
  const targetYear = Math.floor(targetMonthIndex / 12);
  const targetMonth = targetMonthIndex - targetYear * 12;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  return new Date(Date.UTC(targetYear, targetMonth, Math.min(day, lastDay))).toISOString().slice(0, 10);
}

function getRangeBounds(dateRange: DateRange, referenceDate: Date): { start: number; end: number; windowDays: number } | null {
  if (dateRange === 'all') return null;
  const reference = referenceCalendarDate(referenceDate);
  const end = calendarDateToOrdinal(reference);
  let start: number;
  switch (dateRange) {
    case '7d':
      start = end - 6;
      break;
    case '30d':
      start = end - 29;
      break;
    case '3m':
      start = calendarDateToOrdinal(subtractUtcMonths(reference, 3)) + 1;
      break;
    case '6m':
      start = calendarDateToOrdinal(subtractUtcMonths(reference, 6)) + 1;
      break;
  }
  return { start, end, windowDays: end - start + 1 };
}

function filterActivitiesByOrdinalBounds(activities: Activity[], start: number, end: number): Activity[] {
  return activities.filter(activity => {
    const date = activityCalendarDate(activity);
    if (!date) return false;
    const ordinal = calendarDateToOrdinal(date);
    return ordinal >= start && ordinal <= end;
  });
}

export function filterActivitiesByDateRange(activities: Activity[], dateRange: DateRange, referenceDate: Date): Activity[] {
  if (!activities || activities.length === 0) return [];
  if (dateRange === 'all') return activities;
  const bounds = getRangeBounds(dateRange, referenceDate);
  return bounds ? filterActivitiesByOrdinalBounds(activities, bounds.start, bounds.end) : activities;
}

export function filterActivitiesByCategories(activities: Activity[], selectedCategories: Category[]): Activity[] {
  if (!activities || activities.length === 0) return [];
  if (!selectedCategories || selectedCategories.length === 0) return activities;
  return activities.filter(a => selectedCategories.includes(a.category));
}

export function getFilteredActivities(
  activities: Activity[],
  dateRange: DateRange,
  selectedCategories: Category[],
  referenceDate?: Date
): Activity[] {
  const categoryScoped = filterActivitiesByCategories(activities, selectedCategories);
  if (dateRange === 'all') return categoryScoped;
  if (!referenceDate) throw new Error('referenceDate is required for relative date filters');
  return filterActivitiesByDateRange(categoryScoped, dateRange, referenceDate);
}

/** Selects display and historical sources once so pages cannot accidentally discard comparison history. */
export function selectActivityScopes(
  sourceActivities: Activity[],
  dateRange: DateRange,
  selectedCategories: Category[],
  referenceDate: Date
): ActivityScopes {
  const analyticsSourceActivities = filterActivitiesByCategories(sourceActivities, selectedCategories);
  const bounds = getRangeBounds(dateRange, referenceDate);
  const visibleActivities = bounds
    ? filterActivitiesByOrdinalBounds(analyticsSourceActivities, bounds.start, bounds.end)
    : analyticsSourceActivities;
  const comparisonWindowDays = bounds?.windowDays ?? DEFAULT_COMPARISON_WINDOW_DAYS;
  const referenceOrdinal = calendarDateToOrdinal(referenceCalendarDate(referenceDate));
  const comparisonSourceActivities = filterActivitiesByOrdinalBounds(
    analyticsSourceActivities,
    referenceOrdinal - (comparisonWindowDays * 2 - 1),
    referenceOrdinal
  );

  return {
    sourceActivities,
    analyticsSourceActivities,
    visibleActivities,
    comparisonSourceActivities,
    comparisonWindowDays,
  };
}

// ============================================================================
// V2 DEFENSIBLE ANALYTICS (Direct Observations & Defensible Derived Metrics)
// ============================================================================

/**
 * 1. TOTAL ACTIVITIES (Direct observation)
 * Count of activities in selected dataset.
 */
export function getTotalActivities(activities: Activity[]): number {
  return Array.isArray(activities) ? activities.length : 0;
}

/**
 * 2. ACTIVE DAYS (Direct observation)
 * Number of unique calendar dates containing at least 1 activity.
 */
export function getActiveDays(activities: Activity[]): number {
  if (!activities || activities.length === 0) return 0;
  const uniqueDates = new Set<string>();
  for (const a of activities) {
    const date = activityCalendarDate(a);
    if (date) uniqueDates.add(date);
  }
  return uniqueDates.size;
}

/**
 * 3. DATE RANGE (Direct observation)
 * Earliest and latest activity dates in current dataset, plus total calendar span.
 */
export function getDateRange(activities: Activity[]): DateRangeObservation {
  if (!activities || activities.length === 0) {
    return {
      start: null,
      end: null,
      startStr: '',
      endStr: '',
      totalDays: 0,
    };
  }

  let minOrdinal = Infinity;
  let maxOrdinal = -Infinity;
  for (const activity of activities) {
    const date = activityCalendarDate(activity);
    if (!date) continue;
    const ordinal = calendarDateToOrdinal(date);
    minOrdinal = Math.min(minOrdinal, ordinal);
    maxOrdinal = Math.max(maxOrdinal, ordinal);
  }

  if (!Number.isFinite(minOrdinal) || !Number.isFinite(maxOrdinal)) {
    return {
      start: null,
      end: null,
      startStr: '',
      endStr: '',
      totalDays: 0,
    };
  }

  const startStr = ordinalToCalendarDate(minOrdinal);
  const endStr = ordinalToCalendarDate(maxOrdinal);
  const start = new Date(minOrdinal * DAY_MS);
  const end = new Date(maxOrdinal * DAY_MS);

  return {
    start,
    end,
    startStr,
    endStr,
    totalDays: maxOrdinal - minOrdinal + 1,
  };
}

/**
 * Complete topic index. Each canonical tag counts at most once per activity;
 * the most frequently observed human-readable label is retained for display.
 */
function getCanonicalTags(activity: Activity): Map<string, string> {
  const tags = new Map<string, string>();
  if (!Array.isArray(activity.tags)) return tags;
  for (const rawTag of activity.tags) {
    if (typeof rawTag !== 'string') continue;
    const label = cleanTagLabel(rawTag);
    const key = canonicalizeTag(label);
    if (key && !tags.has(key)) tags.set(key, label);
  }
  return tags;
}

function getTopicDisplayLabels(activities: Activity[]): Map<string, string> {
  const labels = new Map<string, Map<string, number>>();
  for (const activity of activities || []) {
    for (const [key, label] of getCanonicalTags(activity)) {
      const labelCounts = labels.get(key) ?? new Map<string, number>();
      labelCounts.set(label, (labelCounts.get(label) ?? 0) + 1);
      labels.set(key, labelCounts);
    }
  }

  const displayLabels = new Map<string, string>();
  for (const [key, labelCounts] of labels) {
    let selected = '';
    let selectedCount = -1;
    for (const [label, count] of labelCounts) {
      if (count > selectedCount) {
        selected = label;
        selectedCount = count;
      }
    }
    displayLabels.set(key, selected);
  }
  return displayLabels;
}

export function getTopicIndex(activities: Activity[]): TopicIndexEntry[] {
  if (!activities || activities.length === 0) return [];
  const counts = new Map<string, number>();
  for (const activity of activities) {
    for (const key of getCanonicalTags(activity).keys()) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  const labels = getTopicDisplayLabels(activities);
  return Array.from(counts, ([key, count]) => ({ topic: labels.get(key) ?? key, count }))
    .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic));
}

/** Summary-only view of the complete topic index. */
export function getTopTopics(activities: Activity[], limit: number = 10): TopicIndexEntry[] {
  return getTopicIndex(activities).slice(0, Math.max(0, limit));
}

/**
 * 5. CATEGORY DISTRIBUTION (Direct observation)
 * Count, duration, and percentage grouped by category.
 */
export function getCategoryDistribution(activities: Activity[]): CategoryDistributionItem[] {
  const totalCount = activities ? activities.length : 0;
  const stats: Record<Category, { count: number; duration: number }> = {
    coding: { count: 0, duration: 0 },
    'ai-ml': { count: 0, duration: 0 },
    finance: { count: 0, duration: 0 },
    filmmaking: { count: 0, duration: 0 },
    reading: { count: 0, duration: 0 },
    learning: { count: 0, duration: 0 },
    social: { count: 0, duration: 0 },
    projects: { count: 0, duration: 0 },
  };

  if (activities) {
    for (const a of activities) {
      if (stats[a.category]) {
        stats[a.category].count++;
        stats[a.category].duration += a.duration || 0;
      }
    }
  }

  return CATEGORIES.map(cat => ({
    category: cat,
    count: stats[cat].count,
    duration: stats[cat].duration,
    percentage: totalCount > 0 ? Number(((stats[cat].count / totalCount) * 100).toFixed(1)) : 0,
  }));
}

/**
 * 6. RECENT ACTIVITY CHANGE (Defensible derived metric)
 * Compares selected recent window against immediately preceding equal-length window.
 * Division-by-zero is handled honestly: returns null percentChange with descriptive status.
 */
export function getActivityChange(
  activities: Activity[],
  windowDays: number,
  referenceDate: Date
): ActivityChangeResult {
  if (!activities || activities.length === 0) {
    return {
      currentCount: 0,
      previousCount: 0,
      absoluteChange: 0,
      percentChange: null,
      status: 'no activity',
    };
  }

  if (!Number.isInteger(windowDays) || windowDays < 1) {
    throw new RangeError('windowDays must be a positive integer');
  }
  const referenceOrdinal = calendarDateToOrdinal(referenceCalendarDate(referenceDate));
  const currentStart = referenceOrdinal - windowDays + 1;
  const previousStart = currentStart - windowDays;

  let currentCount = 0;
  let previousCount = 0;

  for (const activity of activities) {
    const date = activityCalendarDate(activity);
    if (!date) continue;
    const ordinal = calendarDateToOrdinal(date);
    if (ordinal >= currentStart && ordinal <= referenceOrdinal) {
      currentCount++;
    } else if (ordinal >= previousStart && ordinal < currentStart) {
      previousCount++;
    }
  }

  const absoluteChange = currentCount - previousCount;

  if (previousCount === 0) {
    if (currentCount === 0) {
      return {
        currentCount: 0,
        previousCount: 0,
        absoluteChange: 0,
        percentChange: null,
        status: 'no activity',
      };
    }
    return {
      currentCount,
      previousCount: 0,
      absoluteChange,
      percentChange: null,
      status: 'new activity',
    };
  }

  const percentChange = Number((((currentCount - previousCount) / previousCount) * 100).toFixed(1));
  const status = absoluteChange > 0 ? 'increased' : absoluteChange < 0 ? 'decreased' : 'unchanged';

  return {
    currentCount,
    previousCount,
    absoluteChange,
    percentChange,
    status,
  };
}

/**
 * 7. TOPIC TREND (Defensible derived metric)
 * For each topic: compares activity count in recent window vs preceding equal-length window.
 */
export function getTopicTrends(
  activities: Activity[],
  windowDays: number,
  referenceDate: Date
): TopicTrend[] {
  if (!activities || activities.length === 0) return [];

  if (!Number.isInteger(windowDays) || windowDays < 1) {
    throw new RangeError('windowDays must be a positive integer');
  }
  const referenceOrdinal = calendarDateToOrdinal(referenceCalendarDate(referenceDate));
  const currentStart = referenceOrdinal - windowDays + 1;
  const previousStart = currentStart - windowDays;

  const currentMap = new Map<string, number>();
  const previousMap = new Map<string, number>();
  const allTopics = new Set<string>();
  const displayLabels = getTopicDisplayLabels(activities);

  for (const activity of activities) {
    const date = activityCalendarDate(activity);
    if (!date) continue;
    const ordinal = calendarDateToOrdinal(date);

    const inCurrent = ordinal >= currentStart && ordinal <= referenceOrdinal;
    const inPrevious = ordinal >= previousStart && ordinal < currentStart;

    if (!inCurrent && !inPrevious) continue;

    for (const key of getCanonicalTags(activity).keys()) {
      allTopics.add(key);
      if (inCurrent) {
        currentMap.set(key, (currentMap.get(key) ?? 0) + 1);
      } else if (inPrevious) {
        previousMap.set(key, (previousMap.get(key) ?? 0) + 1);
      }
    }
  }

  const results: TopicTrend[] = [];

  for (const key of allTopics) {
    const currentCount = currentMap.get(key) || 0;
    const previousCount = previousMap.get(key) || 0;
    const absoluteChange = currentCount - previousCount;

    let percentChange: number | null = null;
    let direction: TopicTrend['direction'] = 'flat';

    if (previousCount === 0) {
      if (currentCount > 0) {
        direction = 'new';
        percentChange = null;
      } else {
        direction = 'flat';
        percentChange = 0;
      }
    } else {
      percentChange = Number((((currentCount - previousCount) / previousCount) * 100).toFixed(1));
      if (absoluteChange > 0) direction = 'up';
      else if (absoluteChange < 0) direction = 'down';
      else direction = 'flat';
    }

    results.push({
      topic: displayLabels.get(key) ?? key,
      currentCount,
      previousCount,
      absoluteChange,
      percentChange,
      direction,
    });
  }

  return results.sort((a, b) => b.currentCount - a.currentCount || b.absoluteChange - a.absoluteChange || a.topic.localeCompare(b.topic));
}

/**
 * 8. PEAK ACTIVITY HOURS (Direct observation)
 * Buckets actual timestamps by hour 0–23.
 * No random weighting, no synthetic productivity claims.
 */
export function getPeakHours(activities: Activity[]): PeakHourObservation[] {
  const hourCounts = new Array<number>(24).fill(0);
  const hourDurations = new Array<number>(24).fill(0);

  if (activities && activities.length > 0) {
    for (const a of activities) {
      const timestamp = parseObservedTimestamp(a.timestamp);
      if (timestamp) {
        const hour = timestamp.getUTCHours();
        hourCounts[hour]++;
        hourDurations[hour] += a.duration || 0;
      }
    }
  }

  return Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    count: hourCounts[h],
    duration: hourDurations[h],
  }));
}

export function getObservedTimestampCount(activities: Activity[]): number {
  return (activities || []).reduce(
    (count, activity) => count + (parseObservedTimestamp(activity.timestamp) ? 1 : 0),
    0
  );
}

/**
 * 9. DAY-OF-WEEK DISTRIBUTION (Direct observation)
 * Counts activities and duration by weekday (0 = Sunday ... 6 = Saturday).
 */
export function getWeekdayDistribution(activities: Activity[]): WeekdayDistribution[] {
  const counts = new Array<number>(7).fill(0);
  const durations = new Array<number>(7).fill(0);

  if (activities && activities.length > 0) {
    for (const a of activities) {
      const date = activityCalendarDate(a);
      if (!date) continue;
      const day = new Date(calendarDateToOrdinal(date) * DAY_MS).getUTCDay();
      if (day >= 0 && day <= 6) {
        counts[day]++;
        durations[day] += a.duration || 0;
      }
    }
  }

  return Array.from({ length: 7 }, (_, i) => ({
    day: i,
    dayName: WEEKDAY_NAMES[i],
    count: counts[i],
    duration: durations[i],
  }));
}

/**
 * 10. CONSISTENCY STATS (Defensible derived metric)
 * Reframed from arbitrary score into transparent observations:
 * activeDays, totalDaysInRange, activeDayRatio, longestActiveDayStreak, currentActiveDayStreak, activeWeeks.
 */
export function getConsistencyStats(
  activities: Activity[],
  referenceDate: Date
): ConsistencyStats {
  if (!activities || activities.length === 0) {
    return {
      activeDays: 0,
      totalDaysInRange: 0,
      activeDayRatio: 0,
      longestActiveDayStreak: 0,
      currentActiveDayStreak: 0,
      activeWeeks: 0,
      totalWeeks: 0,
    };
  }

  const ordinals = new Set<number>();
  for (const activity of activities) {
    const date = activityCalendarDate(activity);
    if (date) ordinals.add(calendarDateToOrdinal(date));
  }
  if (ordinals.size === 0) {
    return {
      activeDays: 0,
      totalDaysInRange: 0,
      activeDayRatio: 0,
      longestActiveDayStreak: 0,
      currentActiveDayStreak: 0,
      activeWeeks: 0,
      totalWeeks: 0,
    };
  }

  const sortedOrdinals = Array.from(ordinals).sort((a, b) => a - b);
  const rangeStart = sortedOrdinals[0];
  const rangeEnd = sortedOrdinals[sortedOrdinals.length - 1];
  const totalDaysInRange = rangeEnd - rangeStart + 1;
  const activeDays = ordinals.size;
  const activeDayRatio = totalDaysInRange > 0 ? Number((activeDays / totalDaysInRange).toFixed(3)) : 0;

  const mondayWeekStart = (ordinal: number): number => {
    const weekday = new Date(ordinal * DAY_MS).getUTCDay();
    return ordinal - ((weekday + 6) % 7);
  };
  const activeWeekStarts = new Set(sortedOrdinals.map(mondayWeekStart));
  const firstWeekStart = mondayWeekStart(rangeStart);
  const lastWeekStart = mondayWeekStart(rangeEnd);
  const activeWeeks = activeWeekStarts.size;
  const totalWeeks = Math.floor((lastWeekStart - firstWeekStart) / 7) + 1;

  let longestStreak = 0;
  let currentRun = 0;
  let previousOrdinal: number | null = null;
  for (const ordinal of sortedOrdinals) {
    currentRun = previousOrdinal !== null && ordinal === previousOrdinal + 1 ? currentRun + 1 : 1;
    longestStreak = Math.max(longestStreak, currentRun);
    previousOrdinal = ordinal;
  }

  const referenceOrdinal = calendarDateToOrdinal(referenceCalendarDate(referenceDate));
  let currentActiveDayStreak = 0;
  let streakOrdinal = ordinals.has(referenceOrdinal) ? referenceOrdinal : referenceOrdinal - 1;
  while (ordinals.has(streakOrdinal)) {
    currentActiveDayStreak++;
    streakOrdinal--;
  }

  return {
    activeDays,
    totalDaysInRange,
    activeDayRatio,
    longestActiveDayStreak: longestStreak,
    currentActiveDayStreak,
    activeWeeks,
    totalWeeks,
  };
}

/**
 * 11. ACTIVITY GAPS (Defensible derived metric)
 * For each topic: lastActivityDate, daysSinceLastActivity, totalActivityCount, and status (active/cooling/dormant).
 */
export function getActivityGaps(
  activities: Activity[],
  referenceDate: Date
): TopicActivityGap[] {
  if (!activities || activities.length === 0) return [];

  const referenceOrdinal = calendarDateToOrdinal(referenceCalendarDate(referenceDate));
  const topicStats = new Map<string, { lastOrdinal: number; count: number }>();
  const displayLabels = getTopicDisplayLabels(activities);

  for (const activity of activities) {
    const date = activityCalendarDate(activity);
    if (!date) continue;
    const ordinal = calendarDateToOrdinal(date);

    for (const key of getCanonicalTags(activity).keys()) {
      const existing = topicStats.get(key);
      if (!existing) {
        topicStats.set(key, { lastOrdinal: ordinal, count: 1 });
      } else {
        existing.count++;
        existing.lastOrdinal = Math.max(existing.lastOrdinal, ordinal);
      }
    }
  }

  const results: TopicActivityGap[] = [];

  for (const [key, { lastOrdinal, count }] of topicStats.entries()) {
    const daysSince = Math.max(0, referenceOrdinal - lastOrdinal);

    let status: TopicActivityGap['status'] = 'dormant';
    if (daysSince <= TOPIC_GAP_THRESHOLDS.ACTIVE_DAYS) {
      status = 'active';
    } else if (daysSince <= TOPIC_GAP_THRESHOLDS.COOLING_DAYS) {
      status = 'cooling';
    }

    results.push({
      topic: displayLabels.get(key) ?? key,
      lastActivityDate: ordinalToCalendarDate(lastOrdinal),
      daysSinceLastActivity: daysSince,
      totalActivityCount: count,
      status,
    });
  }

  return results.sort((a, b) => (a.daysSinceLastActivity ?? Infinity) - (b.daysSinceLastActivity ?? Infinity) || b.totalActivityCount - a.totalActivityCount);
}

/**
 * 12. TOPIC CO-OCCURRENCE (Defensible derived metric)
 * Counts how often pairs of topics appear on the same activity.
 * Returns undirected edges { source, target, count }.
 */
export function getTopicCooccurrence(
  activities: Activity[],
  minCount: number = 1
): TopicCooccurrenceEdge[] {
  if (!activities || activities.length === 0) return [];

  const pairCounts = new Map<string, Map<string, number>>();
  const displayLabels = getTopicDisplayLabels(activities);

  for (const activity of activities) {
    const uniqueTags = Array.from(getCanonicalTags(activity).keys()).sort();
    if (uniqueTags.length < 2) continue;

    for (let i = 0; i < uniqueTags.length; i++) {
      for (let j = i + 1; j < uniqueTags.length; j++) {
        const sourceCounts = pairCounts.get(uniqueTags[i]) ?? new Map<string, number>();
        sourceCounts.set(uniqueTags[j], (sourceCounts.get(uniqueTags[j]) ?? 0) + 1);
        pairCounts.set(uniqueTags[i], sourceCounts);
      }
    }
  }

  const edges: TopicCooccurrenceEdge[] = [];

  for (const [sourceKey, targetCounts] of pairCounts) {
    for (const [targetKey, count] of targetCounts) {
      if (count >= minCount) {
        edges.push({
          source: displayLabels.get(sourceKey) ?? sourceKey,
          target: displayLabels.get(targetKey) ?? targetKey,
          count,
        });
      }
    }
  }

  return edges.sort((a, b) => b.count - a.count || a.source.localeCompare(b.source));
}

/**
 * Bundles all defensible V2 analytics into a consolidated, typed object.
 */
export function getV2Analytics(
  activities: Activity[],
  options: V2AnalyticsOptions
): V2Analytics {
  const {
    referenceDate,
    comparisonActivities = activities,
    historyActivities = comparisonActivities,
  } = options;
  const comparisonWindowDays = options.comparisonWindowDays ?? DEFAULT_COMPARISON_WINDOW_DAYS;
  return {
    referenceDate: referenceCalendarDate(referenceDate),
    comparisonWindowDays,
    totalActivities: getTotalActivities(activities),
    activeDays: getActiveDays(activities),
    dateRange: getDateRange(activities),
    topTopics: getTopTopics(activities),
    topicIndex: getTopicIndex(activities),
    categoryDistribution: getCategoryDistribution(activities),
    activityChange: getActivityChange(comparisonActivities, comparisonWindowDays, referenceDate),
    topicTrends: getTopicTrends(comparisonActivities, comparisonWindowDays, referenceDate),
    peakHours: getPeakHours(activities),
    observedTimestampCount: getObservedTimestampCount(activities),
    weekdayDistribution: getWeekdayDistribution(activities),
    consistencyStats: getConsistencyStats(activities, referenceDate),
    activityGaps: getActivityGaps(historyActivities, referenceDate),
    topicCooccurrence: getTopicCooccurrence(activities),
  };
}

// ============================================================================
// LEGACY V1 ANALYTICS (Neutralized Compatibility Layer)
// ============================================================================

/**
 * @deprecated Legacy Signal V1 SignalScore.
 *
 * Signal V2 intentionally does NOT define a universal Signal Score.
 * A composite score collapses independently valid observations (active days,
 * category breadth, recent activity change) into a single number using
 * arbitrary weighting; there is no defensible reason to do this.
 *
 * This function exists ONLY to preserve compile compatibility with existing
 * UI components that consume SignalScore. All returned values are zeroed:
 * do not use this output for display, analytics, or decision-making.
 *
 * When UI components are updated in Phase 2, this function will be deleted.
 */
export function calculateSignalScore(_activities: Activity[]): SignalScore {
  // Intentionally returns zeros. See JSDoc above.
  return { activity: 0, consistency: 0, exploration: 0, momentum: 0, overall: 0 };
}

/**
 * @deprecated Legacy Signal V1 Archetype classification.
 *
 * Signal V2 does NOT use archetypes or archetype confidence.
 * The archetype concept assigns personality labels from activity data.
 * This is a category heuristic, not a validated personality classification.
 *
 * The `confidence` field in the returned object is a LEGACY COMPATIBILITY FIELD.
 * It stores the observed activity allocation ratio for the top category.
 * It is NOT a statistical confidence measure. It does not represent:
 *   - likelihood of correct classification
 *   - model certainty
 *   - any validated metric
 *
 * This function exists ONLY to prevent cascading compile errors in existing
 * UI components. It will be removed when those components are updated in Phase 2.
 */
export function calculateArchetype(activities: Activity[]): Archetype {
  if (!activities || activities.length === 0) {
    return {
      id: 'void',
      name: 'THE VOID',
      description: 'No digital activity detected.',
      // Legacy compatibility field. Not a statistical confidence measure.
      // Signal V2 does not use this value.
      confidence: 0,
      primaryTraits: [],
    };
  }

  const categoryDuration: Record<Category, number> = {
    coding: 0, 'ai-ml': 0, finance: 0, filmmaking: 0,
    reading: 0, learning: 0, social: 0, projects: 0,
  };

  for (const a of activities) {
    if (categoryDuration[a.category] !== undefined) {
      categoryDuration[a.category] += a.duration || 0;
    }
  }

  const sorted = CATEGORIES
    .map(c => ({ category: c, duration: categoryDuration[c] }))
    .sort((a, b) => b.duration - a.duration);

  const topCategory = sorted[0].category;
  const totalDuration = activities.reduce((sum, a) => sum + (a.duration || 0), 0);
  // activityAllocationRatio: what fraction of recorded duration is in the top category.
  // This is an observed ratio, NOT a confidence measure.
  const activityAllocationRatio = totalDuration > 0 ? sorted[0].duration / totalDuration : 0;

  const archetypes: Record<string, { name: string; description: string; traits: string[] }> = {
    coding: {
      name: 'THE BUILDER',
      description: 'Primary activity recorded in software development and engineering.',
      traits: ['Engineering', 'Implementation', 'Systems'],
    },
    'ai-ml': {
      name: 'THE ARCHITECT',
      description: 'Primary activity recorded in artificial intelligence and machine learning.',
      traits: ['Models', 'Machine Learning', 'Research'],
    },
    finance: {
      name: 'THE STRATEGIST',
      description: 'Primary activity recorded in financial analysis and quantitative modeling.',
      traits: ['Quantitative', 'Market Data', 'Analysis'],
    },
    filmmaking: {
      name: 'THE CREATOR',
      description: 'Primary activity recorded in video production and visual storytelling.',
      traits: ['Production', 'Visual Design', 'Narrative'],
    },
    reading: {
      name: 'THE SCHOLAR',
      description: 'Primary activity recorded in reading and literature analysis.',
      traits: ['Reading', 'Research', 'Literature'],
    },
    learning: {
      name: 'THE EXPLORER',
      description: 'Primary activity recorded in courses and skill acquisition.',
      traits: ['Study', 'Courses', 'Exploration'],
    },
    social: {
      name: 'THE CONNECTOR',
      description: 'Primary activity recorded in community engagement and discussions.',
      traits: ['Discussion', 'Community', 'Sharing'],
    },
    projects: {
      name: 'THE SHIPPER',
      description: 'Primary activity recorded in project delivery and milestones.',
      traits: ['Delivery', 'Milestones', 'Execution'],
    },
  };

  const primary = archetypes[topCategory] || archetypes.coding;

  return {
    id: topCategory,
    name: primary.name,
    description: primary.description,
    // Legacy compatibility field. Stores observed activity allocation ratio for top category.
    // NOT a statistical confidence measure. Signal V2 does not use this value.
    confidence: Math.round(activityAllocationRatio * 100),
    primaryTraits: primary.traits,
  };
}

/**
 * @deprecated Legacy Signal V1 PeakHours format.
 * Neutralized in V2: utilizes actual observed timestamp hours without pseudo-random hash simulation.
 */
export function calculatePeakHours(activities: Activity[]): PeakHoursData[] {
  const v2Peak = getPeakHours(activities);
  const categoryPerHour: Record<number, Record<Category, number>> = {};

  for (let h = 0; h < 24; h++) {
    categoryPerHour[h] = {
      coding: 0,
      'ai-ml': 0,
      finance: 0,
      filmmaking: 0,
      reading: 0,
      learning: 0,
      social: 0,
      projects: 0,
    };
  }

  if (activities) {
    for (const a of activities) {
      const timestamp = parseObservedTimestamp(a.timestamp);
      const hour = timestamp?.getUTCHours();
      if (hour !== undefined && categoryPerHour[hour][a.category] !== undefined) {
        categoryPerHour[hour][a.category]++;
      }
    }
  }

  return v2Peak.map(item => {
    const topEntry = Object.entries(categoryPerHour[item.hour]).sort((a, b) => b[1] - a[1])[0];
    return {
      hour: item.hour,
      activityCount: item.count,
      totalDuration: item.duration,
      topCategory: (topEntry?.[0] as Category) || 'coding',
      avgSessionLength: item.count > 0 ? Math.round(item.duration / item.count) : 0,
    };
  });
}

/**
 * @deprecated Legacy Signal V1 DigitalDNA radar calculation.
 * Neutralized in V2: calculates genuine category duration shares without arbitrary multipliers.
 */
export function calculateDigitalDNA(activities: Activity[], _interests?: Interest[]): DigitalDNA {
  if (!activities || activities.length === 0) {
    return { builder: 0, explorer: 0, researcher: 0, creator: 0, connector: 0, learner: 0 };
  }

  const categoryDuration: Record<Category, number> = {
    coding: 0,
    'ai-ml': 0,
    finance: 0,
    filmmaking: 0,
    reading: 0,
    learning: 0,
    social: 0,
    projects: 0,
  };

  for (const a of activities) {
    if (categoryDuration[a.category] !== undefined) {
      categoryDuration[a.category] += a.duration || 0;
    }
  }

  const totalDuration = activities.reduce((sum, a) => sum + (a.duration || 0), 0) || 1;

  return {
    builder: Math.min(100, Math.round(((categoryDuration.coding + categoryDuration.projects) / totalDuration) * 100)),
    explorer: Math.min(100, Math.round(((categoryDuration['ai-ml'] + categoryDuration.learning) / totalDuration) * 100)),
    researcher: Math.min(100, Math.round(((categoryDuration.reading + categoryDuration.finance) / totalDuration) * 100)),
    creator: Math.min(100, Math.round(((categoryDuration.filmmaking + categoryDuration.projects) / totalDuration) * 100)),
    connector: Math.min(100, Math.round((categoryDuration.social / totalDuration) * 100)),
    learner: Math.min(100, Math.round(((categoryDuration.learning + categoryDuration.reading) / totalDuration) * 100)),
  };
}

/**
 * @deprecated Legacy Signal V1 momentum & 90-day projection.
 * Neutralized in V2: fake future projection removed; returns honest recent vs previous period comparison.
 */
export function calculateMomentum(activities: Activity[], _interests?: Interest[]): MomentumData {
  const referenceDate = resolveReferenceDate(activities) ?? new Date(0);
  const change = getActivityChange(activities, 30, referenceDate);
  const current = change.percentChange !== null ? Math.round(change.percentChange) : 0;

  // Comparison for prior 30-day period (60 to 90 days ago)
  const prevChange = getActivityChange(activities, 60, referenceDate);
  const previous = prevChange.percentChange !== null ? Math.round(prevChange.percentChange) : 0;

  // Find category with highest activity in the current 30-day window
  const recentActivities = filterActivitiesByDateRange(activities, '30d', referenceDate);
  const catDistribution = getCategoryDistribution(recentActivities);
  const topCat = catDistribution.sort((a, b) => b.count - a.count)[0];

  const strongestGrowthArea = {
    category: topCat ? topCat.category : ('coding' as Category),
    growth: topCat ? topCat.percentage : 0,
  };

  const consistencyStats = getConsistencyStats(activities, referenceDate);
  const mostConsistentActivity = {
    category: topCat ? topCat.category : ('coding' as Category),
    consistency: Math.round(consistencyStats.activeDayRatio * 100),
  };

  // Fake 90-day projection removed in V2
  return {
    current,
    previous,
    strongestGrowthArea,
    mostConsistentActivity,
    projection: [],
  };
}

/**
 * @deprecated Legacy Signal V1 Interest strength multiplier.
 * Neutralized in V2: reports observed activity counts without synthetic strength inflation.
 */
export function calculateInterestStrength(activities: Activity[], interests: Interest[]): Interest[] {
  if (!interests || !Array.isArray(interests)) return [];
  const referenceDate = resolveReferenceDate(activities) ?? new Date(0);
  return interests.map(interest => {
    const categoryActivities = (activities || []).filter(a => a.category === interest.category);
    const activityCount = categoryActivities.length;
    const projectCount = categoryActivities.filter(a =>
      Array.isArray(a.tags) && a.tags.some(t => ['SaaS', 'Open Source', 'Side Project', 'Startup', 'Research', 'Tool', 'Library', 'Platform'].includes(t))
    ).length;

    const change = getActivityChange(categoryActivities, 30, referenceDate);
    const growth = change.percentChange !== null ? Math.round(change.percentChange) : 0;

    return {
      ...interest,
      activityCount,
      projectCount,
      growth,
      strength: Math.min(100, activityCount),
    };
  });
}

/**
 * @deprecated Legacy Signal V1 Skill growth calculation.
 * Neutralized in V2: returns recorded skill baseline without artificial level boosters.
 */
export function calculateSkillGrowth(skills: Skill[], _activities?: Activity[]): Skill[] {
  if (!skills || !Array.isArray(skills)) return [];
  return skills.map(skill => ({
    ...skill,
    history: Array.isArray(skill.history) ? [...skill.history] : [],
  }));
}

// ============================================================================
// RETAINED DEFENSIBLE PRESENTATION HELPERS
// ============================================================================

export function getHeatmapData(
  activities: Activity[],
  selectedCategory?: Category
): Map<string, { count: number; duration: number; categories: Category[] }> {
  const heatmap = new Map<string, { count: number; duration: number; categories: Category[] }>();
  if (!activities || activities.length === 0) return heatmap;

  const filtered = selectedCategory
    ? activities.filter(a => a.category === selectedCategory)
    : activities;

  for (const a of filtered) {
    if (!a.date) continue;
    const dateKey = a.date.split('T')[0];
    const existing = heatmap.get(dateKey) || { count: 0, duration: 0, categories: [] };
    existing.count++;
    existing.duration += a.duration || 0;
    if (!existing.categories.includes(a.category)) {
      existing.categories.push(a.category);
    }
    heatmap.set(dateKey, existing);
  }

  return heatmap;
}

export function searchActivities(
  query: string,
  activities: Activity[],
  skills: Skill[],
  timelineEvents: TimelineEvent[],
  interests: Interest[]
): {
  activities: Activity[];
  skills: Skill[];
  timeline: TimelineEvent[];
  interests: Interest[];
} {
  const lowerQuery = (query || '').toLowerCase().trim();
  if (!lowerQuery) {
    return {
      activities: [],
      skills: [],
      timeline: [],
      interests: [],
    };
  }

  return {
    activities: (activities || []).filter(a =>
      (a.title && a.title.toLowerCase().includes(lowerQuery)) ||
      (a.category && a.category.toLowerCase().includes(lowerQuery)) ||
      (a.platform && a.platform.toLowerCase().includes(lowerQuery)) ||
      (a.description && a.description.toLowerCase().includes(lowerQuery)) ||
      (Array.isArray(a.tags) && a.tags.some(t => typeof t === 'string' && t.toLowerCase().includes(lowerQuery)))
    ),
    skills: (skills || []).filter(s =>
      (s.name && s.name.toLowerCase().includes(lowerQuery)) ||
      (s.category && s.category.toLowerCase().includes(lowerQuery))
    ),
    timeline: (timelineEvents || []).filter(t =>
      (t.title && t.title.toLowerCase().includes(lowerQuery)) ||
      (t.description && t.description.toLowerCase().includes(lowerQuery)) ||
      (t.category && t.category.toLowerCase().includes(lowerQuery))
    ),
    interests: (interests || []).filter(i =>
      (i.name && i.name.toLowerCase().includes(lowerQuery)) ||
      (i.category && i.category.toLowerCase().includes(lowerQuery)) ||
      (Array.isArray(i.relatedInterests) && i.relatedInterests.some(r => typeof r === 'string' && r.toLowerCase().includes(lowerQuery)))
    ),
  };
}
