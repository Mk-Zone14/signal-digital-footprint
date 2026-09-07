export interface Activity {
  id: string;
  date: string;
  category: Category;
  title: string;
  duration: number;
  platform: string;
  tags: string[];
  impactScore: number;
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

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  category: Category;
  description: string;
  impactScore: number;
}

export interface Interest {
  id: string;
  name: string;
  category: Category;
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
  level: number;
  history: SkillHistoryPoint[];
}

export interface SkillHistoryPoint {
  date: string;
  level: number;
}

export interface Archetype {
  id: string;
  name: string;
  description: string;
  confidence: number;
  primaryTraits: string[];
}

export interface PeakHoursData {
  hour: number;
  activityCount: number;
  totalDuration: number;
  topCategory: Category;
  avgSessionLength: number;
}

export interface DigitalDNA {
  builder: number;
  explorer: number;
  researcher: number;
  creator: number;
  connector: number;
  learner: number;
}

export interface MomentumData {
  current: number;
  previous: number;
  strongestGrowthArea: { category: Category; growth: number };
  mostConsistentActivity: { category: Category; consistency: number };
  projection: ProjectionPoint[];
}

export interface ProjectionPoint {
  date: string;
  projectedScore: number;
  confidence: number;
}

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

export type NavItem = 'overview' | 'activity' | 'interests' | 'skills' | 'timeline' | 'identity';