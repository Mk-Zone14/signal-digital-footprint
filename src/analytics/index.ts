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
  V2Analytics,
} from '../types';

/** Centralized reference date for all analytics — demo data revolves around this. */
export const REFERENCE_DATE = new Date('2025-09-07T23:59:59.999Z');

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

/** Helper: safely read a property from an unknown object, returning undefined if not present or not an object. */
function readProp(obj: Record<string, unknown>, key: string): unknown {
  return Object.prototype.hasOwnProperty.call(obj, key) ? obj[key] : undefined;
}

/**
 * Normalizes an untrusted or legacy activity record into a standard Activity model.
 * Accepts `unknown` input and safely narrows each field — no blind casting.
 * Safe with partial, imported, malformed, or missing data.
 */
export function normalizeActivity(raw: unknown, fallbackIndex: number = 0): Activity {
  if (raw === null || raw === undefined || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      id: `act_${fallbackIndex}`,
      date: '1970-01-01',
      category: 'projects',
      title: 'Untitled Activity',
      duration: 0,
      tags: [],
    };
  }

  const r = raw as Record<string, unknown>;

  const rawId = readProp(r, 'id');
  const id = typeof rawId === 'string' && rawId.length > 0 ? rawId : `act_${fallbackIndex}`;

  // Resolve timestamp and date
  let timestamp: string | undefined = undefined;
  let date = '1970-01-01';

  const rawTimestamp = readProp(r, 'timestamp');
  if (typeof rawTimestamp === 'string' && rawTimestamp.length > 0) {
    timestamp = rawTimestamp;
    const parsed = new Date(rawTimestamp);
    if (!isNaN(parsed.getTime())) {
      date = parsed.toISOString().split('T')[0];
    }
  }

  const rawDate = readProp(r, 'date');
  if (typeof rawDate === 'string' && rawDate.length > 0) {
    if (rawDate.includes('T')) {
      const parsed = new Date(rawDate);
      if (!isNaN(parsed.getTime())) {
        date = parsed.toISOString().split('T')[0];
        if (!timestamp) timestamp = rawDate;
      } else {
        date = rawDate.split('T')[0];
      }
    } else {
      date = rawDate;
      if (!timestamp) {
        timestamp = `${rawDate}T12:00:00.000Z`;
      }
    }
  }

  const rawCategory = readProp(r, 'category');
  const category: Category = typeof rawCategory === 'string' && CATEGORIES.includes(rawCategory as Category)
    ? (rawCategory as Category)
    : 'projects';

  const rawTitle = readProp(r, 'title');
  const title = typeof rawTitle === 'string' && rawTitle.length > 0 ? rawTitle : 'Untitled Activity';

  const rawDuration = readProp(r, 'duration');
  const duration = typeof rawDuration === 'number' && !isNaN(rawDuration) ? Math.max(0, rawDuration) : 0;

  const rawPlatform = readProp(r, 'platform');
  const platform = typeof rawPlatform === 'string' ? rawPlatform : undefined;

  let tags: string[] = [];
  const rawTags = readProp(r, 'tags');
  const rawTopics = readProp(r, 'topics');
  if (Array.isArray(rawTags)) {
    tags = rawTags.filter((t): t is string => typeof t === 'string' && t.trim().length > 0);
  } else if (Array.isArray(rawTopics)) {
    tags = rawTopics.filter((t): t is string => typeof t === 'string' && t.trim().length > 0);
  }

  const rawDescription = readProp(r, 'description');
  const description = typeof rawDescription === 'string' ? rawDescription : undefined;

  const rawUrl = readProp(r, 'url');
  const url = typeof rawUrl === 'string' ? rawUrl : undefined;

  const rawMetadata = readProp(r, 'metadata');
  const metadata = typeof rawMetadata === 'object' && rawMetadata !== null && !Array.isArray(rawMetadata)
    ? (rawMetadata as Record<string, unknown>)
    : undefined;

  const rawImpactScore = readProp(r, 'impactScore');
  const impactScore = typeof rawImpactScore === 'number' ? rawImpactScore : undefined;

  return {
    id,
    timestamp,
    date,
    category,
    title,
    duration,
    platform,
    tags,
    description,
    url,
    metadata,
    impactScore,
  };
}

// ============================================================================
// FILTERING & HELPERS
// ============================================================================

function parseActivityDate(a: Activity): Date {
  if (a.timestamp) {
    const d = new Date(a.timestamp);
    if (!isNaN(d.getTime())) return d;
  }
  const d = new Date(a.date);
  return isNaN(d.getTime()) ? new Date(0) : d;
}

export function filterActivitiesByDateRange(activities: Activity[], dateRange: DateRange, referenceDate: Date = REFERENCE_DATE): Activity[] {
  if (!activities || activities.length === 0) return [];
  if (dateRange === 'all') return activities;

  const now = referenceDate;
  let cutoff: Date;

  switch (dateRange) {
    case '7d':
      cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - 7);
      break;
    case '30d':
      cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - 30);
      break;
    case '3m':
      cutoff = new Date(now);
      cutoff.setMonth(cutoff.getMonth() - 3);
      break;
    case '6m':
      cutoff = new Date(now);
      cutoff.setMonth(cutoff.getMonth() - 6);
      break;
    default:
      return activities;
  }

  const cutoffTime = cutoff.getTime();
  return activities.filter(a => parseActivityDate(a).getTime() >= cutoffTime);
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
  referenceDate: Date = REFERENCE_DATE
): Activity[] {
  let filtered = filterActivitiesByDateRange(activities, dateRange, referenceDate);
  filtered = filterActivitiesByCategories(filtered, selectedCategories);
  return filtered;
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
    if (a.date) {
      uniqueDates.add(a.date.split('T')[0]);
    }
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

  let minTime = Infinity;
  let maxTime = -Infinity;
  let minDateObj: Date | null = null;
  let maxDateObj: Date | null = null;

  for (const a of activities) {
    const d = parseActivityDate(a);
    const t = d.getTime();
    if (isNaN(t)) continue;
    if (t < minTime) {
      minTime = t;
      minDateObj = d;
    }
    if (t > maxTime) {
      maxTime = t;
      maxDateObj = d;
    }
  }

  if (!minDateObj || !maxDateObj) {
    return {
      start: null,
      end: null,
      startStr: '',
      endStr: '',
      totalDays: 0,
    };
  }

  const startStr = minDateObj.toISOString().split('T')[0];
  const endStr = maxDateObj.toISOString().split('T')[0];
  const totalDays = Math.max(1, Math.ceil((maxTime - minTime) / (1000 * 60 * 60 * 24)) + 1);

  return {
    start: minDateObj,
    end: maxDateObj,
    startStr,
    endStr,
    totalDays,
  };
}

/**
 * 4. TOP TOPICS (Direct observation)
 * Topics/tags ranked by frequency of occurrence across activities.
 */
export function getTopTopics(activities: Activity[], limit: number = 10): Array<{ topic: string; count: number }> {
  if (!activities || activities.length === 0) return [];

  const counts = new Map<string, number>();
  for (const a of activities) {
    if (!Array.isArray(a.tags)) continue;
    for (const tag of a.tags) {
      if (typeof tag === 'string' && tag.trim().length > 0) {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      }
    }
  }

  return Array.from(counts.entries())
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic))
    .slice(0, Math.max(1, limit));
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
  windowDays: number = 30,
  referenceDate: Date = REFERENCE_DATE
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

  const refTime = referenceDate.getTime();
  const windowMs = windowDays * 24 * 60 * 60 * 1000;
  const currentStart = refTime - windowMs;
  const previousStart = refTime - 2 * windowMs;

  let currentCount = 0;
  let previousCount = 0;

  for (const a of activities) {
    const t = parseActivityDate(a).getTime();
    if (isNaN(t)) continue;
    if (t >= currentStart && t <= refTime) {
      currentCount++;
    } else if (t >= previousStart && t < currentStart) {
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
  windowDays: number = 30,
  referenceDate: Date = REFERENCE_DATE
): TopicTrend[] {
  if (!activities || activities.length === 0) return [];

  const refTime = referenceDate.getTime();
  const windowMs = windowDays * 24 * 60 * 60 * 1000;
  const currentStart = refTime - windowMs;
  const previousStart = refTime - 2 * windowMs;

  const currentMap = new Map<string, number>();
  const previousMap = new Map<string, number>();
  const allTopics = new Set<string>();

  for (const a of activities) {
    if (!Array.isArray(a.tags)) continue;
    const t = parseActivityDate(a).getTime();
    if (isNaN(t)) continue;

    const inCurrent = t >= currentStart && t <= refTime;
    const inPrevious = t >= previousStart && t < currentStart;

    if (!inCurrent && !inPrevious) continue;

    for (const tag of a.tags) {
      if (typeof tag === 'string' && tag.trim().length > 0) {
        allTopics.add(tag);
        if (inCurrent) {
          currentMap.set(tag, (currentMap.get(tag) || 0) + 1);
        } else if (inPrevious) {
          previousMap.set(tag, (previousMap.get(tag) || 0) + 1);
        }
      }
    }
  }

  const results: TopicTrend[] = [];

  for (const topic of allTopics) {
    const currentCount = currentMap.get(topic) || 0;
    const previousCount = previousMap.get(topic) || 0;
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
      topic,
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
      // Direct observation from timestamp if available
      let hour: number | null = null;

      if (a.timestamp) {
        const d = new Date(a.timestamp);
        if (!isNaN(d.getTime())) {
          hour = d.getHours();
        }
      } else if (a.date && a.date.includes('T')) {
        const d = new Date(a.date);
        if (!isNaN(d.getTime())) {
          hour = d.getHours();
        }
      }

      if (hour !== null && hour >= 0 && hour <= 23) {
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

/**
 * 9. DAY-OF-WEEK DISTRIBUTION (Direct observation)
 * Counts activities and duration by weekday (0 = Sunday ... 6 = Saturday).
 */
export function getWeekdayDistribution(activities: Activity[]): WeekdayDistribution[] {
  const counts = new Array<number>(7).fill(0);
  const durations = new Array<number>(7).fill(0);

  if (activities && activities.length > 0) {
    for (const a of activities) {
      const d = parseActivityDate(a);
      if (isNaN(d.getTime())) continue;
      const day = d.getDay();
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
  referenceDate: Date = REFERENCE_DATE
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

  const range = getDateRange(activities);
  const totalDaysInRange = range.totalDays;

  // Collect unique active calendar dates formatted as YYYY-MM-DD
  const dateSet = new Set<string>();
  const weekSet = new Set<string>();

  for (const a of activities) {
    const d = parseActivityDate(a);
    if (isNaN(d.getTime())) continue;
    const dateStr = d.toISOString().split('T')[0];
    dateSet.add(dateStr);

    // Track active weeks (year + ISO week calculation)
    const temp = new Date(d.getTime());
    temp.setHours(0, 0, 0, 0);
    temp.setDate(temp.getDate() + 3 - ((temp.getDay() + 6) % 7));
    const week1 = new Date(temp.getFullYear(), 0, 4);
    const weekNum = 1 + Math.round(((temp.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
    weekSet.add(`${temp.getFullYear()}-W${String(weekNum).padStart(2, '0')}`);
  }

  const activeDays = dateSet.size;
  const activeDayRatio = totalDaysInRange > 0 ? Number((activeDays / totalDaysInRange).toFixed(3)) : 0;
  const activeWeeks = weekSet.size;
  const totalWeeks = Math.max(1, Math.ceil(totalDaysInRange / 7));

  // Compute streaks
  const sortedDates = Array.from(dateSet).sort();
  let longestStreak = 0;
  let currentRun = 0;
  let prevDate: Date | null = null;

  for (const str of sortedDates) {
    const curDate = new Date(`${str}T00:00:00Z`);
    if (!prevDate) {
      currentRun = 1;
    } else {
      const diffDays = Math.round((curDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        currentRun++;
      } else if (diffDays > 1) {
        currentRun = 1;
      }
    }
    if (currentRun > longestStreak) {
      longestStreak = currentRun;
    }
    prevDate = curDate;
  }

  // Calculate current active day streak relative to referenceDate
  let currentActiveDayStreak = 0;
  const refMidnight = new Date(referenceDate);
  refMidnight.setUTCHours(0, 0, 0, 0);

  const checkDate = new Date(refMidnight);
  const refDateStr = checkDate.toISOString().split('T')[0];

  // If reference date itself is not active, check if yesterday was active
  let streakCheck = new Date(checkDate);
  if (!dateSet.has(refDateStr)) {
    streakCheck.setDate(streakCheck.getDate() - 1);
  }

  while (dateSet.has(streakCheck.toISOString().split('T')[0])) {
    currentActiveDayStreak++;
    streakCheck.setDate(streakCheck.getDate() - 1);
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
  referenceDate: Date = REFERENCE_DATE
): TopicActivityGap[] {
  if (!activities || activities.length === 0) return [];

  const refTime = referenceDate.getTime();
  const topicStats = new Map<string, { lastDate: Date; count: number }>();

  for (const a of activities) {
    if (!Array.isArray(a.tags)) continue;
    const d = parseActivityDate(a);
    const t = d.getTime();
    if (isNaN(t)) continue;

    for (const tag of a.tags) {
      if (typeof tag !== 'string' || tag.trim().length === 0) continue;
      const existing = topicStats.get(tag);
      if (!existing) {
        topicStats.set(tag, { lastDate: d, count: 1 });
      } else {
        existing.count++;
        if (t > existing.lastDate.getTime()) {
          existing.lastDate = d;
        }
      }
    }
  }

  const results: TopicActivityGap[] = [];

  for (const [topic, { lastDate, count }] of topicStats.entries()) {
    const diffMs = refTime - lastDate.getTime();
    const daysSince = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    let status: TopicActivityGap['status'] = 'dormant';
    if (daysSince <= TOPIC_GAP_THRESHOLDS.ACTIVE_DAYS) {
      status = 'active';
    } else if (daysSince <= TOPIC_GAP_THRESHOLDS.COOLING_DAYS) {
      status = 'cooling';
    }

    results.push({
      topic,
      lastActivityDate: lastDate.toISOString().split('T')[0],
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

  const pairCounts = new Map<string, number>();

  for (const a of activities) {
    if (!Array.isArray(a.tags) || a.tags.length < 2) continue;
    // Deduplicate tags on the same activity
    const uniqueTags = Array.from(new Set(a.tags.filter(t => typeof t === 'string' && t.trim().length > 0))).sort();

    for (let i = 0; i < uniqueTags.length; i++) {
      for (let j = i + 1; j < uniqueTags.length; j++) {
        const key = `${uniqueTags[i]}|${uniqueTags[j]}`;
        pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
      }
    }
  }

  const edges: TopicCooccurrenceEdge[] = [];

  for (const [key, count] of pairCounts.entries()) {
    if (count >= minCount) {
      const [source, target] = key.split('|');
      edges.push({ source, target, count });
    }
  }

  return edges.sort((a, b) => b.count - a.count || a.source.localeCompare(b.source));
}

/**
 * Bundles all defensible V2 analytics into a consolidated, typed object.
 */
export function getV2Analytics(
  activities: Activity[],
  referenceDate: Date = REFERENCE_DATE
): V2Analytics {
  return {
    totalActivities: getTotalActivities(activities),
    activeDays: getActiveDays(activities),
    dateRange: getDateRange(activities),
    topTopics: getTopTopics(activities),
    categoryDistribution: getCategoryDistribution(activities),
    activityChange: getActivityChange(activities, 30, referenceDate),
    topicTrends: getTopicTrends(activities, 30, referenceDate),
    peakHours: getPeakHours(activities),
    weekdayDistribution: getWeekdayDistribution(activities),
    consistencyStats: getConsistencyStats(activities, referenceDate),
    activityGaps: getActivityGaps(activities, referenceDate),
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
 * arbitrary weighting — there is no defensible reason to do this.
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
 * It is NOT a statistical confidence measure — it does not represent:
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
      let hour: number | null = null;
      if (a.timestamp) {
        const d = new Date(a.timestamp);
        if (!isNaN(d.getTime())) hour = d.getHours();
      } else if (a.date && a.date.includes('T')) {
        const d = new Date(a.date);
        if (!isNaN(d.getTime())) hour = d.getHours();
      }
      if (hour !== null && hour >= 0 && hour <= 23 && categoryPerHour[hour][a.category] !== undefined) {
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
  const change = getActivityChange(activities, 30, REFERENCE_DATE);
  const current = change.percentChange !== null ? Math.round(change.percentChange) : 0;

  // Comparison for prior 30-day period (60 to 90 days ago)
  const prevChange = getActivityChange(activities, 60, REFERENCE_DATE);
  const previous = prevChange.percentChange !== null ? Math.round(prevChange.percentChange) : 0;

  // Find category with highest activity in the current 30-day window
  const recentActivities = filterActivitiesByDateRange(activities, '30d', REFERENCE_DATE);
  const catDistribution = getCategoryDistribution(recentActivities);
  const topCat = catDistribution.sort((a, b) => b.count - a.count)[0];

  const strongestGrowthArea = {
    category: topCat ? topCat.category : ('coding' as Category),
    growth: topCat ? topCat.percentage : 0,
  };

  const consistencyStats = getConsistencyStats(activities, REFERENCE_DATE);
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
  return interests.map(interest => {
    const categoryActivities = (activities || []).filter(a => a.category === interest.category);
    const activityCount = categoryActivities.length;
    const projectCount = categoryActivities.filter(a =>
      Array.isArray(a.tags) && a.tags.some(t => ['SaaS', 'Open Source', 'Side Project', 'Startup', 'Research', 'Tool', 'Library', 'Platform'].includes(t))
    ).length;

    const change = getActivityChange(categoryActivities, 30, REFERENCE_DATE);
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