import { describe, expect, it } from 'vitest';
import { validateImportedData } from './importData';

const validActivity = {
  id: 'imported-1',
  date: '2026-04-12',
  category: 'coding',
  title: 'Reviewed import boundary',
  duration: 45,
  tags: ['TypeScript'],
};

describe('validateImportedData', () => {
  it('accepts V2 activities when malformed legacy skills are present', () => {
    const result = validateImportedData({
      activities: [validActivity],
      skills: [null],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.data.activities).toHaveLength(1);
    expect(result.value.data.activities[0].timestamp).toBeUndefined();
    expect(result.value.data.skills).toEqual([]);
    expect(result.value.warnings.some(issue => /skills.*ignored/i.test(issue.message))).toBe(true);
  });

  it('quarantines bad records without creating January 1970 activities', () => {
    const result = validateImportedData({
      activities: [null, validActivity],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.report.invalidActivityRecords).toBe(1);
    expect(result.value.data.activities.map(activity => activity.date)).toEqual(['2026-04-12']);
    expect(result.value.data.activities.some(activity => activity.date === '1970-01-01')).toBe(false);
  });

  it('rejects a payload when every activity is unusable', () => {
    const result = validateImportedData({
      activities: [null, { ...validActivity, date: 'not-a-date' }],
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.report.validActivityRecords).toBe(0);
    expect(result.report.invalidActivityRecords).toBe(2);
    expect(result.errors.map(issue => issue.message).join(' ')).toMatch(/no usable activities/i);
  });

  it('resolves an imported dataset reference from its latest valid activity date', () => {
    const result = validateImportedData({
      activities: [
        validActivity,
        { ...validActivity, id: 'imported-2', date: '2026-07-03' },
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.referenceDate.toISOString()).toBe('2026-07-03T23:59:59.999Z');
  });
});
