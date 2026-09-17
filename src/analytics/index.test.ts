import { describe, it, expect } from 'vitest';
import {
  getTotalActivities,
  getActiveDays,
  getDateRange,
  getTopTopics,
  getCategoryDistribution,
  getActivityChange,
  getTopicTrends,
  getPeakHours,
  getWeekdayDistribution,
  getConsistencyStats,
  getActivityGaps,
  getTopicCooccurrence,
  getTopicIndex,
  getV2Analytics,
  normalizeActivity,
  normalizeActivities,
  resolveReferenceDate,
  selectActivityScopes,
  canonicalizeTag,
  calculateSignalScore,
  calculateArchetype,
  calculatePeakHours,
  calculateDigitalDNA,
  calculateMomentum,
} from './index';
import { Activity } from '../types';
import { demoData, DEMO_REFERENCE_DATE } from '../data/demoData';

describe('V2 Analytics Foundation & Edge Cases', () => {
  // Edge Case 1: Empty dataset
  describe('Case 1: Empty dataset', () => {
    const empty: Activity[] = [];

    it('returns 0 total activities', () => {
      expect(getTotalActivities(empty)).toBe(0);
    });

    it('returns 0 active days', () => {
      expect(getActiveDays(empty)).toBe(0);
    });

    it('returns empty date range safely', () => {
      const range = getDateRange(empty);
      expect(range.start).toBeNull();
      expect(range.end).toBeNull();
      expect(range.totalDays).toBe(0);
    });

    it('returns empty top topics', () => {
      expect(getTopTopics(empty)).toEqual([]);
    });

    it('returns 0% for all categories in distribution', () => {
      const dist = getCategoryDistribution(empty);
      expect(dist.length).toBe(8);
      dist.forEach(d => {
        expect(d.count).toBe(0);
        expect(d.percentage).toBe(0);
      });
    });

    it('returns no activity status for activity change', () => {
      const change = getActivityChange(empty, 30, DEMO_REFERENCE_DATE);
      expect(change.currentCount).toBe(0);
      expect(change.previousCount).toBe(0);
      expect(change.percentChange).toBeNull();
      expect(change.status).toBe('no activity');
    });

    it('returns empty topic trends and cooccurrences', () => {
      expect(getTopicTrends(empty, 30, DEMO_REFERENCE_DATE)).toEqual([]);
      expect(getTopicCooccurrence(empty)).toEqual([]);
      expect(getActivityGaps(empty, DEMO_REFERENCE_DATE)).toEqual([]);
    });

    it('returns 0 for consistency stats', () => {
      const consistency = getConsistencyStats(empty, DEMO_REFERENCE_DATE);
      expect(consistency.activeDays).toBe(0);
      expect(consistency.totalDaysInRange).toBe(0);
      expect(consistency.activeDayRatio).toBe(0);
      expect(consistency.longestActiveDayStreak).toBe(0);
      expect(consistency.currentActiveDayStreak).toBe(0);
    });

    it('neutralized legacy functions handle empty dataset safely', () => {
      expect(calculateSignalScore(empty)).toEqual({ activity: 0, consistency: 0, exploration: 0, momentum: 0, overall: 0 });
      expect(calculateArchetype(empty).id).toBe('void');
      expect(calculatePeakHours(empty).length).toBe(24);
      expect(calculateDigitalDNA(empty)).toEqual({ builder: 0, explorer: 0, researcher: 0, creator: 0, connector: 0, learner: 0 });
      expect(calculateMomentum(empty).current).toBe(0);
    });
  });

  // Edge Case 2: One activity
  describe('Case 2: One activity', () => {
    const single: Activity[] = [
      {
        id: 'single_1',
        timestamp: '2025-09-05T14:30:00.000Z',
        date: '2025-09-05',
        category: 'coding',
        title: 'Single Activity',
        duration: 90,
        tags: ['TypeScript'],
      },
    ];

    it('accurately observes 1 activity and 1 active day', () => {
      expect(getTotalActivities(single)).toBe(1);
      expect(getActiveDays(single)).toBe(1);
    });

    it('accurately observes date range of single day (1 total day)', () => {
      const range = getDateRange(single);
      expect(range.startStr).toBe('2025-09-05');
      expect(range.endStr).toBe('2025-09-05');
      expect(range.totalDays).toBe(1);
    });

    it('observes peak hour at 14', () => {
      const peak = getPeakHours(single);
      const expectedHour = new Date(single[0].timestamp!).getUTCHours();
      expect(peak[expectedHour].count).toBe(1);
      expect(peak[expectedHour].duration).toBe(90);
    });

    it('calculates 100% distribution for coding', () => {
      const dist = getCategoryDistribution(single);
      const coding = dist.find(d => d.category === 'coding');
      expect(coding?.count).toBe(1);
      expect(coding?.percentage).toBe(100);
    });
  });

  // Edge Case 3: Multiple activities on the same day
  describe('Case 3: Multiple activities on the same day', () => {
    const sameDay: Activity[] = [
      {
        id: 'sd_1',
        timestamp: '2025-09-05T09:00:00.000Z',
        date: '2025-09-05',
        category: 'coding',
        title: 'Morning Code',
        duration: 60,
        tags: ['React'],
      },
      {
        id: 'sd_2',
        timestamp: '2025-09-05T15:00:00.000Z',
        date: '2025-09-05',
        category: 'learning',
        title: 'Afternoon Study',
        duration: 45,
        tags: ['Algorithms'],
      },
      {
        id: 'sd_3',
        timestamp: '2025-09-05T20:00:00.000Z',
        date: '2025-09-05',
        category: 'reading',
        title: 'Evening Book',
        duration: 30,
        tags: ['Systems'],
      },
    ];

    it('observes 3 activities but only 1 active day', () => {
      expect(getTotalActivities(sameDay)).toBe(3);
      expect(getActiveDays(sameDay)).toBe(1);
    });

    it('consistency stats show streak of 1 day', () => {
      const stats = getConsistencyStats(sameDay, new Date('2025-09-05T23:59:59.999Z'));
      expect(stats.activeDays).toBe(1);
      expect(stats.longestActiveDayStreak).toBe(1);
    });
  });

  // Edge Case 4: Previous period = 0 activities (division by zero honest handling)
  describe('Case 4: Previous period = 0 activities', () => {
    const ref = new Date('2025-09-07T23:59:59.999Z');
    const recentOnly: Activity[] = [
      {
        id: 'rec_1',
        date: '2025-09-01',
        timestamp: '2025-09-01T10:00:00.000Z',
        category: 'coding',
        title: 'Recent Activity',
        duration: 60,
        tags: ['React'],
      },
    ];

    it('does not return Infinity or NaN on activity change', () => {
      const change = getActivityChange(recentOnly, 30, ref);
      expect(change.currentCount).toBe(1);
      expect(change.previousCount).toBe(0);
      expect(change.percentChange).toBeNull();
      expect(change.status).toBe('new activity');
    });
  });

  // Edge Case 5: Current period = 0 activities
  describe('Case 5: Current period = 0 activities', () => {
    const ref = new Date('2025-09-07T23:59:59.999Z');
    // 45 days before reference date: in previous 30-day window [ref-60d, ref-30d)
    const oldDate = new Date(ref);
    oldDate.setDate(oldDate.getDate() - 45);

    const prevOnly: Activity[] = [
      {
        id: 'old_1',
        date: oldDate.toISOString().split('T')[0],
        timestamp: oldDate.toISOString(),
        category: 'coding',
        title: 'Old Activity',
        duration: 120,
        tags: ['Rust'],
      },
    ];

    it('calculates -100% change cleanly with decreased status', () => {
      const change = getActivityChange(prevOnly, 30, ref);
      expect(change.currentCount).toBe(0);
      expect(change.previousCount).toBe(1);
      expect(change.percentChange).toBe(-100);
      expect(change.status).toBe('decreased');
    });
  });

  // Edge Case 6 & 7: Topic appears only in current period or only in previous period
  describe('Case 6 & 7: Topic asymmetric period trends', () => {
    const ref = new Date('2025-09-07T23:59:59.999Z');
    const oldDate = new Date(ref);
    oldDate.setDate(oldDate.getDate() - 40); // Previous period
    const recentDate = new Date(ref);
    recentDate.setDate(recentDate.getDate() - 10); // Current period

    const activities: Activity[] = [
      {
        id: 'a_curr',
        date: recentDate.toISOString().split('T')[0],
        timestamp: recentDate.toISOString(),
        category: 'coding',
        title: 'New Trend',
        duration: 60,
        tags: ['Zig'],
      },
      {
        id: 'a_prev',
        date: oldDate.toISOString().split('T')[0],
        timestamp: oldDate.toISOString(),
        category: 'coding',
        title: 'Old Trend',
        duration: 60,
        tags: ['Fortran'],
      },
    ];

    it('handles "new" topic direction for topic appearing only currently', () => {
      const trends = getTopicTrends(activities, 30, ref);
      const zig = trends.find(t => t.topic === 'Zig');
      expect(zig?.currentCount).toBe(1);
      expect(zig?.previousCount).toBe(0);
      expect(zig?.direction).toBe('new');
      expect(zig?.percentChange).toBeNull();
    });

    it('handles "down" topic direction for topic appearing only previously', () => {
      const trends = getTopicTrends(activities, 30, ref);
      const fortran = trends.find(t => t.topic === 'Fortran');
      expect(fortran?.currentCount).toBe(0);
      expect(fortran?.previousCount).toBe(1);
      expect(fortran?.direction).toBe('down');
      expect(fortran?.percentChange).toBe(-100);
    });
  });

  // Edge Case 8: Multiple tags on the same activity (co-occurrence)
  describe('Case 8: Multiple tags on same activity', () => {
    const coOccurring: Activity[] = [
      {
        id: 'co_1',
        date: '2025-09-01',
        category: 'coding',
        title: 'Fullstack App',
        duration: 100,
        tags: ['React', 'TypeScript', 'Tailwind'],
      },
      {
        id: 'co_2',
        date: '2025-09-02',
        category: 'coding',
        title: 'Frontend Component',
        duration: 50,
        tags: ['React', 'TypeScript'],
      },
    ];

    it('generates co-occurrence pairs properly with accurate counts', () => {
      const edges = getTopicCooccurrence(coOccurring);
      const reactTs = edges.find(e =>
        (e.source === 'React' && e.target === 'TypeScript') ||
        (e.source === 'TypeScript' && e.target === 'React')
      );
      expect(reactTs?.count).toBe(2);

      const reactTailwind = edges.find(e =>
        (e.source === 'React' && e.target === 'Tailwind') ||
        (e.source === 'Tailwind' && e.target === 'React')
      );
      expect(reactTailwind?.count).toBe(1);
    });
  });

  // Edge Case 9: Invalid / missing optional fields
  describe('Case 9: Invalid or missing optional fields', () => {
    it('rejects an activity with an invalid duration', () => {
      const malformed = {
        title: 123,
        date: '2025-05-10',
        duration: 'sixty',
        tags: 'not-an-array',
        category: 'invalid-category',
      };

      const normalized = normalizeActivity(malformed, 99);
      expect(normalized).toBeNull();
    });
  });

  // Edge Case 10: Imported custom dataset
  describe('Case 10: Imported custom dataset', () => {
    const customJson = {
      activities: [
        {
          id: 'custom_1',
          date: '2025-08-01',
          category: 'ai-ml',
          title: 'Fine-tuning Model',
          duration: 180,
          platform: 'Colab',
          tags: ['PyTorch', 'LLMs'],
        },
        {
          id: 'custom_2',
          timestamp: '2025-08-02T16:00:00.000Z',
          date: '2025-08-02',
          category: 'ai-ml',
          title: 'Evaluating Benchmarks',
          duration: 60,
          platform: 'Hugging Face',
          tags: ['PyTorch', 'Evaluation'],
        },
      ],
    };

    it('processes custom dataset without crashing and returns correct v2 metrics', () => {
      const normalized = normalizeActivities(customJson.activities);
      expect(normalized.rejected).toEqual([]);
      const v2 = getV2Analytics(normalized.activities, { referenceDate: new Date('2025-08-10T23:59:59.999Z') });

      expect(v2.totalActivities).toBe(2);
      expect(v2.activeDays).toBe(2);
      expect(v2.topTopics[0].topic).toBe('PyTorch');
      expect(v2.topTopics[0].count).toBe(2);
      expect(v2.categoryDistribution.find(c => c.category === 'ai-ml')?.percentage).toBe(100);
    });
  });

  // Edge Case 11: Demo dataset
  describe('Case 11: Demo dataset integrity', () => {
    it('contains deterministic, valid activities with ISO timestamps', () => {
      expect(demoData.activities.length).toBeGreaterThan(100);

      const first = demoData.activities[0];
      expect(first.timestamp).toBeDefined();
      expect(first.date).toBeDefined();
      expect(new Date(first.timestamp!).getTime()).not.toBeNaN();

      // Check peak hours directly bucket observed timestamps
      const peak = getPeakHours(demoData.activities);
      expect(peak.length).toBe(24);
      const totalObserved = peak.reduce((sum, p) => sum + p.count, 0);
      expect(totalObserved).toBe(demoData.activities.length);

      // Check full v2 analytics pipeline on demo data
      const v2 = getV2Analytics(demoData.activities, { referenceDate: DEMO_REFERENCE_DATE });
      expect(v2.totalActivities).toBe(demoData.activities.length);
      expect(v2.activeDays).toBeGreaterThan(50);
      expect(v2.topTopics.length).toBeGreaterThan(0);
      expect(v2.consistencyStats.activeDayRatio).toBeGreaterThan(0);
    });
  });

  describe('Phase A correctness regressions', () => {
    const activity = (id: string, date: string, tags: string[] = []): Activity => ({
      id,
      date,
      category: 'coding',
      title: id,
      duration: 30,
      tags,
    });

    it('quarantines null, invalid dates, invalid timestamps, and non-finite durations', () => {
      const result = normalizeActivities([
        null,
        { date: '2025-02-30', title: 'bad date', duration: 1 },
        { timestamp: 'not-a-time', title: 'bad time', duration: 1 },
        { date: '2025-02-01', title: 'bad duration', duration: Infinity },
      ]);

      expect(result.activities).toEqual([]);
      expect(result.rejected).toHaveLength(4);
      expect(result.activities.some(item => item.date === '1970-01-01')).toBe(false);
    });

    it('keeps date-only activities date-only and excludes them from hourly analytics', () => {
      const normalized = normalizeActivity({
        date: '2026-06-10',
        category: 'learning',
        title: 'Read docs',
        duration: 20,
        tags: ['Docs'],
      });

      expect(normalized).not.toBeNull();
      expect(normalized?.timestamp).toBeUndefined();
      expect(getPeakHours([normalized!]).reduce((sum, bucket) => sum + bucket.count, 0)).toBe(0);
    });

    it('creates deterministic unique fallback IDs and rejects duplicate supplied IDs', () => {
      const result = normalizeActivities([
        { date: '2026-01-01', category: 'coding', title: 'Fallback one', duration: 1 },
        { id: 'activity-000001', date: '2026-01-02', category: 'coding', title: 'Reserved ID', duration: 1 },
        { id: 'duplicate', date: '2026-01-03', category: 'coding', title: 'First duplicate', duration: 1 },
        { id: 'duplicate', date: '2026-01-04', category: 'coding', title: 'Second duplicate', duration: 1 },
      ]);

      expect(result.activities.map(item => item.id)).toEqual([
        'activity-000001-2',
        'activity-000001',
        'duplicate',
      ]);
      expect(result.rejected[0].issues[0].code).toBe('duplicate-id');
    });

    it('quarantines records that would require invented core fields', () => {
      const result = normalizeActivities([
        { date: '2026-01-01', title: 'Missing category', duration: 1 },
        { date: '2026-01-02', category: 'coding', duration: 1 },
        { date: '2026-01-03', category: 'coding', title: 'Missing duration' },
      ]);

      expect(result.activities).toEqual([]);
      expect(result.rejected.map(item => item.issues[0].code)).toEqual([
        'invalid-category',
        'invalid-title',
        'invalid-duration',
      ]);
    });

    it('resolves imported historical data against its latest valid activity date', () => {
      const imported = [activity('a', '2026-04-01'), activity('b', '2026-05-20')];
      const reference = resolveReferenceDate(imported);
      expect(reference?.toISOString()).toBe('2026-05-20T23:59:59.999Z');
      expect(getActivityChange(imported, 30, reference!).currentCount).toBe(1);
    });

    it('retains the previous period when a 30-day display window is selected', () => {
      const source = [
        activity('previous', '2026-05-15'),
        activity('current-1', '2026-06-01'),
        activity('current-2', '2026-06-30'),
      ];
      const referenceDate = new Date('2026-06-30T23:59:59.999Z');
      const scopes = selectActivityScopes(source, '30d', [], referenceDate);
      const analytics = getV2Analytics(scopes.visibleActivities, {
        referenceDate,
        comparisonActivities: scopes.comparisonSourceActivities,
        historyActivities: scopes.analyticsSourceActivities,
        comparisonWindowDays: scopes.comparisonWindowDays,
      });

      expect(scopes.visibleActivities.map(item => item.id)).toEqual(['current-1', 'current-2']);
      expect(analytics.activityChange.currentCount).toBe(2);
      expect(analytics.activityChange.previousCount).toBe(1);
      expect(analytics.comparisonWindowDays).toBe(30);
    });

    it('keeps full-history topic recency while limiting equal-period comparisons', () => {
      const oldTopic = activity('old-topic', '2026-01-01', ['COBOL']);
      const currentTopic = activity('current-topic', '2026-06-30', ['TypeScript']);
      const referenceDate = new Date('2026-06-30T23:59:59.999Z');
      const scopes = selectActivityScopes([oldTopic, currentTopic], '30d', [], referenceDate);
      const analytics = getV2Analytics(scopes.visibleActivities, {
        referenceDate,
        comparisonActivities: scopes.comparisonSourceActivities,
        historyActivities: scopes.analyticsSourceActivities,
        comparisonWindowDays: scopes.comparisonWindowDays,
      });

      expect(scopes.comparisonSourceActivities).not.toContain(oldTopic);
      expect(analytics.activityGaps.find(gap => gap.topic === 'COBOL')?.lastActivityDate).toBe('2026-01-01');
    });

    it('builds a complete topic index independently of the top-ten summary', () => {
      const frequent = Array.from({ length: 10 }, (_, index) => [
        activity(`frequent-${index}-a`, '2026-01-01', [`Topic ${index}`]),
        activity(`frequent-${index}-b`, '2026-01-02', [`Topic ${index}`]),
      ]).flat();
      const activities = [...frequent, activity('docker', '2026-01-03', ['Docker'])];

      expect(getTopTopics(activities)).toHaveLength(10);
      expect(getTopTopics(activities).some(item => item.topic === 'Docker')).toBe(false);
      expect(getTopicIndex(activities).find(item => item.topic === 'Docker')?.count).toBe(1);
    });

    it('canonicalizes and deduplicates tags while keeping delimiter characters safe', () => {
      const activities = [
        activity('one', '2026-01-01', ['React', ' react ', 'REACT', 'A|B', 'C']),
        activity('two', '2026-01-02', ['react', 'A|B', 'C']),
      ];

      expect(canonicalizeTag('  ReAcT  ')).toBe('react');
      expect(getTopicIndex(activities).find(item => canonicalizeTag(item.topic) === 'react')?.count).toBe(2);
      const delimiterEdge = getTopicCooccurrence(activities).find(edge =>
        [edge.source, edge.target].includes('A|B') && [edge.source, edge.target].includes('C')
      );
      expect(delimiterEdge?.count).toBe(2);
    });

    it('uses literal calendar dates and keeps active weeks within intersecting weeks', () => {
      const sundayAndMonday = [activity('sun', '2025-09-07'), activity('mon', '2025-09-08')];
      const range = getDateRange(sundayAndMonday);
      const stats = getConsistencyStats(sundayAndMonday, new Date('2025-09-08T23:59:59.999Z'));
      const weekdays = getWeekdayDistribution(sundayAndMonday);

      expect(range.totalDays).toBe(2);
      expect(weekdays[0].count).toBe(1);
      expect(weekdays[1].count).toBe(1);
      expect(stats.activeWeeks).toBe(2);
      expect(stats.totalWeeks).toBe(2);
      expect(stats.activeWeeks).toBeLessThanOrEqual(stats.totalWeeks);
    });

    it('groups timezone-bearing timestamps by their UTC calendar day and hour', () => {
      const normalized = normalizeActivity({
        timestamp: '2025-03-09T23:30:00-05:00',
        date: '2025-03-09',
        category: 'coding',
        title: 'DST boundary',
        duration: 10,
      });

      expect(normalized?.date).toBe('2025-03-10');
      expect(getPeakHours([normalized!])[4].count).toBe(1);
      expect(getWeekdayDistribution([normalized!])[1].count).toBe(1);
    });
  });
});
