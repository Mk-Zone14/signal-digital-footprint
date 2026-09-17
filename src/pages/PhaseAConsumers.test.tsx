// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getV2Analytics } from '../analytics';
import { Activity } from '../types';
import { PatternsPage } from './PatternsPage';
import { ProfilePage } from './ProfilePage';
import { TopicsPage } from './TopicsPage';
import { OverviewPage } from './OverviewPage';

const REFERENCE_DATE = new Date('2026-01-31T23:59:59.999Z');

afterEach(cleanup);

function makeActivity(id: string, tag: string): Activity {
  return {
    id,
    date: '2026-01-31',
    category: 'coding',
    title: `Activity ${id}`,
    duration: 30,
    tags: [tag],
  };
}

describe('Phase A analytics consumers', () => {
  it('explores and summarizes topics outside the top-ten overview limit', () => {
    const activities = Array.from({ length: 12 }, (_, index) =>
      makeActivity(`activity-${index + 1}`, `Topic ${index + 1}`)
    );
    const analytics = getV2Analytics(activities, { referenceDate: REFERENCE_DATE });

    expect(analytics.topTopics).toHaveLength(10);
    expect(analytics.topicIndex).toHaveLength(12);

    const { unmount } = render(
      <TopicsPage
        activities={activities}
        v2Analytics={analytics}
        selectedTopic="Topic 12"
        onSelectTopic={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: 'Topic 12' })).toBeTruthy();
    expect(screen.getByText(/containing this tag \(1 items\)/i)).toBeTruthy();

    unmount();

    render(
      <ProfilePage
        activities={activities}
        v2Analytics={analytics}
        username="test-user"
      />
    );

    expect(screen.getByText('12 distinct tags')).toBeTruthy();
  });

  it('explains unavailable hourly data and does not claim a peak for date-only records', () => {
    const activities = [makeActivity('date-only', 'Date only')];
    const analytics = getV2Analytics(activities, { referenceDate: REFERENCE_DATE });

    const { unmount } = render(
      <PatternsPage
        activities={activities}
        v2Analytics={analytics}
        onSelectTopic={vi.fn()}
      />
    );

    expect(screen.getByText('Hourly activity is unavailable')).toBeTruthy();
    expect(screen.getByText(/date-only records still contribute/i)).toBeTruthy();

    unmount();

    render(
      <ProfilePage
        activities={activities}
        v2Analytics={analytics}
        username="test-user"
      />
    );

    expect(screen.queryByText('Peak Hour (UTC)')).toBeNull();
    expect(screen.getByText('Hourly Data')).toBeTruthy();
    expect(screen.getByText('No observed timestamps')).toBeTruthy();
  });

  it('labels the equal-period window that analytics actually used', () => {
    const activities = [makeActivity('current', 'Current')];
    const analytics = getV2Analytics(activities, {
      referenceDate: REFERENCE_DATE,
      comparisonActivities: activities,
      comparisonWindowDays: 7,
    });

    render(<OverviewPage activities={activities} v2Analytics={analytics} />);

    expect(screen.getByText('Last 7 days vs prior 7-day window')).toBeTruthy();
    expect(screen.getByText('Current 7-Day Window')).toBeTruthy();
  });
});
