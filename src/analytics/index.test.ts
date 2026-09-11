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
  getV2Analytics,
  normalizeActivity,
  calculateSignalScore,
  calculateArchetype,
  calculatePeakHours,
  calculateDigitalDNA,
  calculateMomentum,
  calculateSkillGrowth,
  calculateInterestStrength,
  getFilteredActivities,
  REFERENCE_DATE,
} from './index';
import { Activity } from '../types';
import { demoData } from '../data/demoData';

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
      const change = getActivityChange(empty, 30, REFERENCE_DATE);
      expect(change.currentCount).toBe(0);
      expect(change.previousCount).toBe(0);
      expect(change.percentChange).toBeNull();
      expect(change.status).toBe('no activity');
    });

    it('returns empty topic trends and cooccurrences', () => {
      expect(getTopicTrends(empty, 30, REFERENCE_DATE)).toEqual([]);
      expect(getTopicCooccurrence(empty)).toEqual([]);
      expect(getActivityGaps(empty, REFERENCE_DATE)).toEqual([]);
    });

    it('returns 0 for consistency stats', () => {
      const consistency = getConsistencyStats(empty, REFERENCE_DATE);
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
      // In local time or UTC (new Date().getHours() on timestamp)
      const expectedHour = new Date(single[0].timestamp!).getHours();
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
    it('normalizes malformed object into valid activity', () => {
      const malformed = {
        title: 123,
        date: '2025-05-10',
        duration: 'sixty',
        tags: 'not-an-array',
        category: 'invalid-category',
      };

      const normalized = normalizeActivity(malformed, 99);
      expect(normalized.id).toBe('act_99');
      expect(normalized.date).toBe('2025-05-10');
      expect(normalized.category).toBe('projects'); // fallback
      expect(normalized.title).toBe('Untitled Activity'); // fallback
      expect(normalized.duration).toBe(0); // fallback
      expect(normalized.tags).toEqual([]); // fallback
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
      const normalized = customJson.activities.map((a, i) => normalizeActivity(a, i));
      const v2 = getV2Analytics(normalized, new Date('2025-08-10T23:59:59.999Z'));

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
      const v2 = getV2Analytics(demoData.activities, REFERENCE_DATE);
      expect(v2.totalActivities).toBe(demoData.activities.length);
      expect(v2.activeDays).toBeGreaterThan(50);
      expect(v2.topTopics.length).toBeGreaterThan(0);
      expect(v2.consistencyStats.activeDayRatio).toBeGreaterThan(0);
    });
  });
});
