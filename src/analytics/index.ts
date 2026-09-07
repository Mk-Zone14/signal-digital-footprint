import { Activity, Category, SignalScore, Archetype, PeakHoursData, DigitalDNA, MomentumData, Interest, Skill, TimelineEvent, DateRange } from '../types';

/** Centralized reference date for all analytics — demo data revolves around this. */
export const REFERENCE_DATE = new Date('2025-09-07');

const categories: Category[] = ['coding', 'ai-ml', 'finance', 'filmmaking', 'reading', 'learning', 'social', 'projects'];

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

/** Simple deterministic hash from a string — returns 0..1 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0xffffffff;
  }
  return (hash >>> 0) / 0xffffffff;
}

function filterActivitiesByDateRange(activities: Activity[], dateRange: DateRange): Activity[] {
  const now = REFERENCE_DATE;
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
    case 'all':
    default:
      return activities;
  }

  return activities.filter(a => new Date(a.date) >= cutoff);
}

function filterActivitiesByCategories(activities: Activity[], selectedCategories: Category[]): Activity[] {
  if (selectedCategories.length === 0) {
    return activities;
  }
  return activities.filter(a => selectedCategories.includes(a.category));
}

/** Accepts the actual activities array — no longer imports demoData. */
export function getFilteredActivities(activities: Activity[], dateRange: DateRange, selectedCategories: Category[]): Activity[] {
  let filtered = [...activities];
  filtered = filterActivitiesByDateRange(filtered, dateRange);
  filtered = filterActivitiesByCategories(filtered, selectedCategories);
  return filtered;
}

export function calculateSignalScore(activities: Activity[]): SignalScore {
  if (activities.length === 0) {
    return { activity: 0, consistency: 0, exploration: 0, momentum: 0, overall: 0 };
  }

  const totalDuration = activities.reduce((sum, a) => sum + a.duration, 0);
  const activityScore = Math.min(100, Math.round((totalDuration / 60 / 200) * 100));

  const dateMap = new Map<string, number>();
  activities.forEach(a => {
    dateMap.set(a.date, (dateMap.get(a.date) || 0) + 1);
  });

  const activeDays = dateMap.size;
  const dateRange = getDateRange(activities);
  const totalDays = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const consistency = Math.min(100, Math.round((activeDays / totalDays) * 100 * 1.5));

  const uniqueCategories = new Set(activities.map(a => a.category)).size;
  const exploration = Math.min(100, Math.round((uniqueCategories / categories.length) * 100 * 1.3));

  const thirtyDaysAgo = new Date(REFERENCE_DATE);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date(REFERENCE_DATE);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const recentActivities = activities.filter(a => new Date(a.date) >= thirtyDaysAgo);
  const previousActivities = activities.filter(a => {
    const date = new Date(a.date);
    return date >= sixtyDaysAgo && date < thirtyDaysAgo;
  });

  const recentDuration = recentActivities.reduce((sum, a) => sum + a.duration, 0);
  const previousDuration = previousActivities.reduce((sum, a) => sum + a.duration, 0);
  const momentum = previousDuration > 0
    ? Math.round(((recentDuration - previousDuration) / previousDuration) * 100)
    : 0;

  const overall = Math.round((activityScore * 0.3 + consistency * 0.25 + exploration * 0.2 + Math.max(0, momentum + 50) * 0.25));

  return {
    activity: Math.min(100, activityScore),
    consistency: Math.min(100, consistency),
    exploration: Math.min(100, exploration),
    momentum: Math.max(-100, Math.min(100, momentum)),
    overall: Math.min(100, Math.max(0, overall)),
  };
}

function getDateRange(activities: Activity[]): { start: Date; end: Date } {
  if (activities.length === 0) {
    return { start: new Date(), end: new Date() };
  }
  const dates = activities.map(a => new Date(a.date)).sort((a, b) => a.getTime() - b.getTime());
  return { start: dates[0], end: dates[dates.length - 1] };
}

export function calculateArchetype(activities: Activity[]): Archetype {
  if (activities.length === 0) {
    return {
      id: 'void',
      name: 'THE VOID',
      description: 'No digital activity detected. Your signal is quiet.',
      confidence: 0,
      primaryTraits: [],
    };
  }

  const categoryStats: Record<Category, { count: number; duration: number; impact: number }> = {} as Record<Category, { count: number; duration: number; impact: number }>;
  categories.forEach(c => categoryStats[c] = { count: 0, duration: 0, impact: 0 });

  activities.forEach(a => {
    categoryStats[a.category].count++;
    categoryStats[a.category].duration += a.duration;
    categoryStats[a.category].impact += a.impactScore;
  });

  const sortedCategories = categories
    .map(c => ({ category: c, ...categoryStats[c] }))
    .sort((a, b) => b.duration - a.duration);

  const topCategory = sortedCategories[0].category;
  const topDuration = sortedCategories[0].duration;
  const totalDuration = activities.reduce((sum, a) => sum + a.duration, 0);
  const dominance = topDuration / totalDuration;

  const archetypes: Record<string, { name: string; description: string; traits: string[] }> = {
    coding: {
      name: 'THE BUILDER',
      description: 'You spend most of your digital energy creating things, learning systems, and turning ideas into working artifacts.',
      traits: ['Systems Thinker', 'Code Craftsman', 'Problem Solver'],
    },
    'ai-ml': {
      name: 'THE ARCHITECT',
      description: 'You explore the frontiers of intelligence, building models that learn, reason, and create. The future is your laboratory.',
      traits: ['Model Builder', 'Research Oriented', 'Innovation Seeker'],
    },
    finance: {
      name: 'THE STRATEGIST',
      description: 'You navigate markets with data-driven precision, turning uncertainty into calculated opportunity.',
      traits: ['Quantitative', 'Risk Aware', 'Long-term Thinker'],
    },
    filmmaking: {
      name: 'THE CREATOR',
      description: 'You craft visual narratives that move people. Every frame is intentional, every cut has purpose.',
      traits: ['Visual Storyteller', 'Detail Obsessed', 'Emotional Architect'],
    },
    reading: {
      name: 'THE SCHOLAR',
      description: 'You consume knowledge voraciously, connecting dots across domains. Your library is your laboratory.',
      traits: ['Deep Reader', 'Cross-domain Thinker', 'Knowledge Synthesizer'],
    },
    learning: {
      name: 'THE EXPLORER',
      description: 'You chase the unknown, constantly expanding your mental models. New domains are playgrounds, not obstacles.',
      traits: ['Perpetual Student', 'Pattern Matcher', 'Rapid Learner'],
    },
    social: {
      name: 'THE CONNECTOR',
      description: 'You amplify ideas through community. Your network is your multiplier, conversation your catalyst.',
      traits: ['Community Builder', 'Idea Amplifier', 'Network Weaver'],
    },
    projects: {
      name: 'THE SHIPPER',
      description: 'You finish what you start. Ideas become products, prototypes become platforms. Done is better than perfect.',
      traits: ['Execution Focused', 'Product Minded', 'Iterative Builder'],
    },
  };

  const secondaryWeight = sortedCategories[1] ? sortedCategories[1].duration / totalDuration : 0;

  const primary = archetypes[topCategory] || archetypes.coding;
  let confidence = Math.round(dominance * 100);

  if (secondaryWeight > 0.25) {
    confidence = Math.round((dominance + secondaryWeight) * 50);
  }

  return {
    id: topCategory,
    name: primary.name,
    description: primary.description,
    confidence: Math.min(95, Math.max(50, confidence)),
    primaryTraits: primary.traits,
  };
}

/** Deterministic peak hours — uses hash of date+category instead of Math.random() */
export function calculatePeakHours(activities: Activity[]): PeakHoursData[] {
  const hourStats: Record<number, { count: number; duration: number; categories: Record<Category, number> }> = {};

  for (let h = 0; h < 24; h++) {
    hourStats[h] = { count: 0, duration: 0, categories: {} as Record<Category, number> };
    categories.forEach(c => hourStats[h].categories[c] = 0);
  }

  activities.forEach(a => {
    // Deterministic hour assignment based on activity id + date
    const h = hashString(a.id + a.date);
    const offset = Math.floor(h * 6) - 3;
    const baseHour = new Date(a.date + 'T12:00:00').getHours();
    const simulatedHour = ((baseHour + offset) % 24 + 24) % 24;
    hourStats[simulatedHour].count++;
    hourStats[simulatedHour].duration += a.duration;
    hourStats[simulatedHour].categories[a.category]++;
  });

  return Object.entries(hourStats).map(([hour, stats]) => {
    const topCategoryEntry = Object.entries(stats.categories).sort((a, b) => b[1] - a[1])[0];
    return {
      hour: parseInt(hour),
      activityCount: stats.count,
      totalDuration: stats.duration,
      topCategory: (topCategoryEntry?.[0] as Category) || 'coding',
      avgSessionLength: stats.count > 0 ? Math.round(stats.duration / stats.count) : 0,
    };
  });
}

export function calculateDigitalDNA(activities: Activity[], interests: Interest[]): DigitalDNA {
  if (activities.length === 0) {
    return { builder: 0, explorer: 0, researcher: 0, creator: 0, connector: 0, learner: 0 };
  }

  const categoryDuration: Record<Category, number> = {} as Record<Category, number>;
  categories.forEach(c => categoryDuration[c] = 0);

  activities.forEach(a => {
    categoryDuration[a.category] += a.duration;
  });

  const totalDuration = activities.reduce((sum, a) => sum + a.duration, 1);

  const builder = Math.min(100, Math.round(((categoryDuration.coding + categoryDuration.projects) / totalDuration) * 100 * 1.5));
  const explorer = Math.min(100, Math.round(((categoryDuration['ai-ml'] + categoryDuration.learning) / totalDuration) * 100 * 1.8));
  const researcher = Math.min(100, Math.round(((categoryDuration.reading + categoryDuration.finance) / totalDuration) * 100 * 1.6));
  const creator = Math.min(100, Math.round(((categoryDuration.filmmaking + categoryDuration.projects) / totalDuration) * 100 * 1.5));
  const connector = Math.min(100, Math.round((categoryDuration.social / totalDuration) * 100 * 3));
  const learner = Math.min(100, Math.round(((categoryDuration.learning + categoryDuration.reading) / totalDuration) * 100 * 1.4));

  return { builder, explorer, researcher, creator, connector, learner };
}

/** Deterministic momentum — projection uses hash instead of Math.random() */
export function calculateMomentum(activities: Activity[], _interests: Interest[]): MomentumData {
  const now = REFERENCE_DATE;
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const currentPeriod = activities.filter(a => new Date(a.date) >= thirtyDaysAgo);
  const previousPeriod = activities.filter(a => new Date(a.date) >= sixtyDaysAgo && new Date(a.date) < thirtyDaysAgo);

  const currentDuration = currentPeriod.reduce((sum, a) => sum + a.duration, 0);
  const previousDuration = previousPeriod.reduce((sum, a) => sum + a.duration, 0);

  const current = previousDuration > 0 ? Math.round(((currentDuration - previousDuration) / previousDuration) * 100) : 0;

  const prevPreviousPeriod = activities.filter(a => new Date(a.date) >= ninetyDaysAgo && new Date(a.date) < sixtyDaysAgo);
  const prevPreviousDuration = prevPreviousPeriod.reduce((sum, a) => sum + a.duration, 0);
  const previous = prevPreviousDuration > 0 ? Math.round(((previousDuration - prevPreviousDuration) / prevPreviousDuration) * 100) : 0;

  const categoryGrowth: Record<Category, number> = {} as Record<Category, number>;
  categories.forEach(c => {
    const curr = currentPeriod.filter(a => a.category === c).reduce((s, a) => s + a.duration, 0);
    const prev = previousPeriod.filter(a => a.category === c).reduce((s, a) => s + a.duration, 0);
    categoryGrowth[c] = prev > 0 ? Math.round(((curr - prev) / prev) * 100) : 0;
  });

  const strongestGrowth = Object.entries(categoryGrowth).sort((a, b) => b[1] - a[1])[0];
  const strongestGrowthArea = {
    category: strongestGrowth[0] as Category,
    growth: strongestGrowth[1],
  };

  const categoryConsistency: Record<Category, number> = {} as Record<Category, number>;
  categories.forEach(c => {
    const daysWithActivity = new Set(activities.filter(a => a.category === c).map(a => a.date)).size;
    const totalDays = 190;
    categoryConsistency[c] = Math.round((daysWithActivity / totalDays) * 100);
  });

  const mostConsistent = Object.entries(categoryConsistency).sort((a, b) => b[1] - a[1])[0];
  const mostConsistentActivity = {
    category: mostConsistent[0] as Category,
    consistency: mostConsistent[1],
  };

  // Deterministic projection using hash
  const projection: MomentumData['projection'] = [];
  for (let i = 1; i <= 90; i += 7) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const decay = Math.exp(-i / 60);
    const noise = (hashString(`projection-${dateStr}`) * 10) - 5;
    const projectedScore = Math.round(current * decay + noise);
    projection.push({
      date: dateStr,
      projectedScore: Math.max(-50, Math.min(100, projectedScore)),
      confidence: Math.max(0.3, 0.9 - i / 120),
    });
  }

  return {
    current,
    previous,
    strongestGrowthArea,
    mostConsistentActivity,
    projection,
  };
}

export function calculateInterestStrength(activities: Activity[], interests: Interest[]): Interest[] {
  if (!interests) return [];
  return interests.map(interest => {
    const categoryActivities = activities.filter(a => a.category === interest.category);
    const activityCount = categoryActivities.length;
    const projectCount = categoryActivities.filter(a => a.tags.some(t => ['SaaS', 'Open Source', 'Side Project', 'Startup', 'Research', 'Tool', 'Library', 'Platform'].includes(t))).length;

    const thirtyDaysAgo = new Date(REFERENCE_DATE);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date(REFERENCE_DATE);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const recentActivities = categoryActivities.filter(a => new Date(a.date) >= thirtyDaysAgo);
    const previousActivities = categoryActivities.filter(a => {
      const date = new Date(a.date);
      return date >= sixtyDaysAgo && date < thirtyDaysAgo;
    });

    const recentCount = recentActivities.length;
    const previousCount = previousActivities.length;
    const growth = previousCount > 0 ? Math.round(((recentCount - previousCount) / previousCount) * 100) : 0;

    return {
      ...interest,
      activityCount,
      projectCount,
      growth,
      strength: Math.min(100, Math.round(interest.strength * (1 + growth / 200))),
    };
  });
}

export function calculateSkillGrowth(skills: Skill[], activities: Activity[]): Skill[] {
  if (!skills) return [];
  return skills.map(skill => {
    const categoryActivities = activities.filter(a => a.category === skill.category);
    const recentActivityCount = categoryActivities.filter(a => {
      const thirtyDaysAgo = new Date(REFERENCE_DATE);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return new Date(a.date) >= thirtyDaysAgo;
    }).length;

    const boost = Math.min(5, recentActivityCount * 0.3);
    const newLevel = Math.min(100, skill.level + boost);

    const newHistory = [...skill.history];
    const lastEntry = newHistory[newHistory.length - 1];
    if (lastEntry) {
      newHistory[newHistory.length - 1] = { ...lastEntry, level: newLevel };
    }

    return {
      ...skill,
      level: newLevel,
      history: newHistory,
    };
  });
}

export function getHeatmapData(activities: Activity[], selectedCategory?: Category): Map<string, { count: number; duration: number; categories: Category[] }> {
  const heatmap = new Map<string, { count: number; duration: number; categories: Category[] }>();

  const filtered = selectedCategory
    ? activities.filter(a => a.category === selectedCategory)
    : activities;

  filtered.forEach(a => {
    const existing = heatmap.get(a.date) || { count: 0, duration: 0, categories: [] };
    existing.count++;
    existing.duration += a.duration;
    if (!existing.categories.includes(a.category)) {
      existing.categories.push(a.category);
    }
    heatmap.set(a.date, existing);
  });

  return heatmap;
}

export function searchActivities(query: string, activities: Activity[], skills: Skill[], timelineEvents: TimelineEvent[], interests: Interest[]): {
  activities: Activity[];
  skills: Skill[];
  timeline: TimelineEvent[];
  interests: Interest[];
} {
  const lowerQuery = query.toLowerCase();

  return {
    activities: (activities || []).filter(a =>
      a.title.toLowerCase().includes(lowerQuery) ||
      a.category.toLowerCase().includes(lowerQuery) ||
      a.platform.toLowerCase().includes(lowerQuery) ||
      (a.tags || []).some(t => t.toLowerCase().includes(lowerQuery))
    ),
    skills: (skills || []).filter(s =>
      s.name.toLowerCase().includes(lowerQuery) ||
      s.category.toLowerCase().includes(lowerQuery)
    ),
    timeline: (timelineEvents || []).filter(t =>
      t.title.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.category.toLowerCase().includes(lowerQuery)
    ),
    interests: (interests || []).filter(i =>
      i.name.toLowerCase().includes(lowerQuery) ||
      i.category.toLowerCase().includes(lowerQuery) ||
      (i.relatedInterests || []).some(r => r.toLowerCase().includes(lowerQuery))
    ),
  };
}