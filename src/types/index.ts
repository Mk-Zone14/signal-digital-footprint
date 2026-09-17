export interface Activity {
  id: string;
  /** ISO-8601 timestamp string representing when the activity occurred */
  timestamp?: string;
  /** Calendar date YYYY-MM-DD for grouping and backward compatibility */
  date: string;
  category: Category;
  title: string;
  /** Duration in minutes when observed or supplied */
  duration?: number;
  platform?: string;
  tags: string[];
  description?: string;
  url?: string;
  source?: ActivitySource;
  connectionId?: string;
  externalId?: string;
  type?: string;
  project?: string;
  metadata?: Record<string, unknown>;
  /** @deprecated Legacy V1 impact score - arbitrary heuristic retained only for backward compatibility */
  impactScore?: number;
}

export type Category =
  | 'coding'
  | 'ai-ml'
  | 'finance'
  | 'filmmaking'
  | 'reading'
  | 'learning'
  | 'social'
  | 'projects';

export type ActivitySource =
  | 'demo'
  | 'manual'
  | 'csv'
  | 'json'
  | 'github'
  | 'google_calendar'
  | 'linear'
  | 'notion'
  | 'toggl'
  | 'browser_extension';

export type PersistedActivitySource = Exclude<ActivitySource, 'demo'>;

export type ConnectionProvider = Extract<
  ActivitySource,
  'github' | 'google_calendar' | 'linear' | 'notion' | 'toggl' | 'browser_extension'
>;

export type ConnectionStatus =
  | 'not_connected'
  | 'connecting'
  | 'connected'
  | 'syncing'
  | 'error'
  | 'disconnected';

export interface Connection {
  id: string;
  provider: ConnectionProvider;
  providerAccountId?: string;
  providerAccountName?: string;
  status: ConnectionStatus;
  connectedAt: string;
  lastSyncedAt?: string;
  syncError?: string;
  metadata: Record<string, unknown>;
}

export interface ManualActivityInput {
  title: string;
  date: string;
  observedTime?: string;
  category: Category;
  topics: string[];
  description?: string;
  durationMinutes?: number;
  url?: string;
  project?: string;
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  category: Category;
  description: string;
  /** @deprecated Legacy V1 score */
  impactScore?: number;
}

export interface Interest {
  id: string;
  name: string;
  category: Category;
  /** @deprecated Legacy heuristic strength */
  strength: number;
  activityCount: number;
  projectCount: number;
  growth: number;
  relatedInterests: string[];
}

export interface Skill {
  id: string;
  name: string;
  category: Category;
  /** @deprecated Legacy heuristic skill level */
  level: number;
  history: SkillHistoryPoint[];
}

export interface SkillHistoryPoint {
  date: string;
  level: number;
}

// ==========================================
// V2 Defensible Metrics Interfaces
// ==========================================

export interface DateRangeObservation {
  start: Date | null;
  end: Date | null;
  startStr: string;
  endStr: string;
  totalDays: number;
}

export interface CategoryDistributionItem {
  category: Category;
  count: number;
  duration: number;
  percentage: number;
}

export interface ActivityChangeResult {
  currentCount: number;
  previousCount: number;
  absoluteChange: number;
  percentChange: number | null;
  status: 'increased' | 'decreased' | 'unchanged' | 'new activity' | 'no activity';
}

export interface TopicTrend {
  topic: string;
  currentCount: number;
  previousCount: number;
  absoluteChange: number;
  percentChange: number | null;
  direction: 'up' | 'down' | 'flat' | 'new';
}

export interface PeakHourObservation {
  hour: number;
  count: number;
  duration: number;
}

export interface WeekdayDistribution {
  day: number;
  dayName: string;
  count: number;
  duration: number;
}

export interface ConsistencyStats {
  activeDays: number;
  totalDaysInRange: number;
  activeDayRatio: number;
  longestActiveDayStreak: number;
  currentActiveDayStreak: number;
  activeWeeks: number;
  totalWeeks: number;
}

export type TopicActivityStatus = 'active' | 'cooling' | 'dormant';

export interface TopicActivityGap {
  topic: string;
  lastActivityDate: string | null;
  daysSinceLastActivity: number | null;
  totalActivityCount: number;
  status: TopicActivityStatus;
}

export interface TopicCooccurrenceEdge {
  source: string;
  target: string;
  count: number;
}

export interface TopicIndexEntry {
  topic: string;
  count: number;
}

export type ActivityNormalizationIssueCode =
  | 'invalid-record'
  | 'invalid-date'
  | 'invalid-timestamp'
  | 'invalid-duration'
  | 'invalid-category'
  | 'invalid-title'
  | 'duplicate-id'
  | 'fallback-id'
  | 'malformed-optional-value'
  | 'date-normalized-from-timestamp';

export interface ActivityNormalizationIssue {
  index: number;
  code: ActivityNormalizationIssueCode;
  field?: string;
  message: string;
}

export interface RejectedActivity {
  index: number;
  record: unknown;
  issues: ActivityNormalizationIssue[];
}

export interface ActivityNormalizationResult {
  activities: Activity[];
  rejected: RejectedActivity[];
  warnings: ActivityNormalizationIssue[];
}

export interface ActivityScopes {
  sourceActivities: Activity[];
  analyticsSourceActivities: Activity[];
  visibleActivities: Activity[];
  comparisonSourceActivities: Activity[];
  comparisonWindowDays: number;
}

export interface V2AnalyticsOptions {
  referenceDate: Date;
  comparisonActivities?: Activity[];
  historyActivities?: Activity[];
  comparisonWindowDays?: number;
}

export interface V2Analytics {
  /** UTC calendar date used as the inclusive end of relative analytics windows. */
  referenceDate: string;
  /** Inclusive length of each equal-period comparison window. */
  comparisonWindowDays: number;
  totalActivities: number;
  activeDays: number;
  dateRange: DateRangeObservation;
  topTopics: Array<{ topic: string; count: number }>;
  topicIndex: TopicIndexEntry[];
  categoryDistribution: CategoryDistributionItem[];
  activityChange: ActivityChangeResult;
  topicTrends: TopicTrend[];
  peakHours: PeakHourObservation[];
  observedTimestampCount: number;
  weekdayDistribution: WeekdayDistribution[];
  consistencyStats: ConsistencyStats;
  activityGaps: TopicActivityGap[];
  topicCooccurrence: TopicCooccurrenceEdge[];
}

// ==========================================
// Legacy V1 Types (Maintained for compile compatibility)
// ==========================================

/** @deprecated Legacy V1 Archetype - personality labeling with fake confidence % */
export interface Archetype {
  id: string;
  name: string;
  description: string;
  confidence: number;
  primaryTraits: string[];
}

/** @deprecated Legacy V1 PeakHours format */
export interface PeakHoursData {
  hour: number;
  activityCount: number;
  totalDuration: number;
  topCategory: Category;
  avgSessionLength: number;
}

/** @deprecated Legacy V1 personality radar traits */
export interface DigitalDNA {
  builder: number;
  explorer: number;
  researcher: number;
  creator: number;
  connector: number;
  learner: number;
}

/** @deprecated Legacy V1 momentum with fake 90-day projection */
export interface MomentumData {
  current: number;
  previous: number;
  strongestGrowthArea: { category: Category; growth: number };
  mostConsistentActivity: { category: Category; consistency: number };
  projection: ProjectionPoint[];
}

/** @deprecated Legacy V1 synthetic projection point */
export interface ProjectionPoint {
  date: string;
  projectedScore: number;
  confidence: number;
}

/** @deprecated Legacy V1 composite score with arbitrary weighting */
export interface SignalScore {
  activity: number;
  consistency: number;
  exploration: number;
  momentum: number;
  overall: number;
}

export interface SearchResult {
  type: 'activity' | 'skill' | 'timeline' | 'interest';
  id: string;
  title: string;
  subtitle: string;
  category?: Category;
  date?: string;
}

export interface FilterState {
  dateRange: DateRange;
  categories: Category[];
  searchQuery: string;
}

export type DateRange = '7d' | '30d' | '3m' | '6m' | 'all';

export interface DemoData {
  activities: Activity[];
  timelineEvents: TimelineEvent[];
  interests: Interest[];
  skills: Skill[];
}

export type NavItem = 'overview' | 'activities' | 'patterns' | 'topics' | 'profile' | 'sources';

/** @deprecated Legacy V1 tab identifiers */
export type LegacyNavItem = 'activity' | 'interests' | 'skills' | 'timeline' | 'identity';
