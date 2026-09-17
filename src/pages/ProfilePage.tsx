import { useRef } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { IdentityCard, IdentityCardHandle } from '../components/IdentityCard';
import { Activity, V2Analytics } from '../types';
import { formatDuration } from '../utils/helpers';
import { Download, Share2, ShieldCheck, User } from 'lucide-react';

interface ProfilePageProps {
  activities: Activity[];
  v2Analytics: V2Analytics;
  username?: string;
}

export function ProfilePage({
  activities,
  v2Analytics,
  username = 'Signal user',
}: ProfilePageProps) {
  const identityCardRef = useRef<IdentityCardHandle>(null);

  const {
    totalActivities,
    activeDays,
    dateRange,
    categoryDistribution,
    topicIndex,
    consistencyStats,
    referenceDate,
  } = v2Analytics;

  if (!activities || activities.length === 0 || totalActivities === 0) {
    return (
      <div className="py-12 text-center max-w-md mx-auto">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-signal-bgElevated border border-signal-border flex items-center justify-center text-signal-fgMuted">
          <User className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-signal-fg mb-1">Import activity data to generate your profile</h3>
        <p className="text-sm text-signal-fgMuted">
          Once activity records are loaded, a verifiable, shareable activity profile will appear here.
        </p>
      </div>
    );
  }

  const handleExport = () => {
    identityCardRef.current?.exportCard();
  };

  const totalDuration = activities.reduce((sum, a) => sum + (a.duration || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-signal-fg flex items-center gap-2">
            <User className="w-5 h-5 text-signal-accent" />
            Activity Record &amp; Profile
          </h2>
          <p className="text-xs text-signal-fgMuted mt-0.5">
            Concise, verifiable summary of your recorded digital activity history
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleExport}
          className="flex items-center gap-2 self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          Export PNG Card
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT 7 COLS: Factual summary table & details */}
        <div className="lg:col-span-7 space-y-6">
          <Card variant="elevated" className="p-5 sm:p-6">
            <h3 className="text-sm font-semibold text-signal-fg mb-1">Summary of Observations</h3>
            <p className="text-xs text-signal-fgMuted mb-4">
              All metrics are direct counts and empirical ratios
            </p>

            <div className="divide-y divide-signal-border/50 text-xs">
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-signal-fgMuted">Account / Identifier</span>
                <span className="font-mono font-medium text-signal-fg">{username}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-signal-fgMuted">Observed Date Span</span>
                <span className="font-mono font-medium text-signal-fg">
                  {dateRange.startStr && dateRange.endStr
                    ? `${dateRange.startStr} to ${dateRange.endStr}`
                    : 'All Time'}
                </span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-signal-fgMuted">Analytics Reference Date</span>
                <span className="font-mono font-medium text-signal-fg">
                  {referenceDate || 'Unavailable'}
                </span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-signal-fgMuted">Total Logged Activities</span>
                <span className="font-mono font-bold text-signal-fg">{totalActivities}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-signal-fgMuted">Active Calendar Days</span>
                <span className="font-mono font-medium text-signal-fg">
                  {activeDays} of {dateRange.totalDays} days ({Math.round(consistencyStats.activeDayRatio * 100)}%)
                </span>
              </div>
              {totalDuration > 0 && (
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-signal-fgMuted">Total Duration Logged</span>
                  <span className="font-mono font-medium text-signal-fg">{formatDuration(totalDuration)}</span>
                </div>
              )}
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-signal-fgMuted">Active Day Streak Record</span>
                <span className="font-mono font-medium text-signal-fg">
                  {consistencyStats.longestActiveDayStreak} days (current: {consistencyStats.currentActiveDayStreak}d)
                </span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-signal-fgMuted">Distinct Categories Recorded</span>
                <span className="font-mono font-medium text-signal-fg">
                  {categoryDistribution.filter(c => c.count > 0).length} of 8 categories
                </span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-signal-fgMuted">Total Unique Topics / Tags</span>
                <span className="font-mono font-medium text-signal-fg">
                  {topicIndex.length} distinct tags
                </span>
              </div>
            </div>
          </Card>

          <Card variant="elevated" className="p-5 sm:p-6">
            <h3 className="text-sm font-semibold text-signal-fg mb-1 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-signal-accent" />
              Evidence-Based Integrity Guarantee
            </h3>
            <p className="text-xs text-signal-fgMuted leading-relaxed mt-2">
              Signal V2 profile cards contain zero synthetic personality scoring, career predictions, or arbitrary confidence multipliers. Every statistic is calculated from logged activity dates and observed timestamps where available.
            </p>
          </Card>
        </div>

        {/* RIGHT 5 COLS: Interactive Exportable Identity Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-signal-fgSubtle font-mono uppercase tracking-wider">
              Shareable Card Preview
            </p>
            <span className="text-[11px] text-signal-fgMuted flex items-center gap-1">
              <Share2 className="w-3 h-3" /> PNG export ready
            </span>
          </div>

          <IdentityCard
            ref={identityCardRef}
            v2Analytics={v2Analytics}
            username={username}
          />
        </div>
      </div>
    </div>
  );
}
