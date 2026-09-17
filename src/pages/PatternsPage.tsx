import { useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Activity, V2Analytics } from '../types';
import { formatDuration } from '../utils/helpers';
import { Clock, Calendar, Zap, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PatternsPageProps {
  activities: Activity[];
  v2Analytics: V2Analytics;
  onSelectTopic?: (topic: string) => void;
}

export function PatternsPage({
  activities,
  v2Analytics,
  onSelectTopic,
}: PatternsPageProps) {
  const {
    peakHours,
    weekdayDistribution,
    consistencyStats,
    activityChange,
    activityGaps,
    observedTimestampCount,
    comparisonWindowDays,
  } = v2Analytics;

  // Max peak hour count for scaling bars
  const maxHourCount = useMemo(() => {
    return Math.max(...peakHours.map(h => h.count), 1);
  }, [peakHours]);

  // Max weekday count for scaling bars
  const maxWeekdayCount = useMemo(() => {
    return Math.max(...weekdayDistribution.map(w => w.count), 1);
  }, [weekdayDistribution]);

  // Topic gap groups
  const gapGroups = useMemo(() => {
    const active = activityGaps.filter(g => g.status === 'active');
    const cooling = activityGaps.filter(g => g.status === 'cooling');
    const dormant = activityGaps.filter(g => g.status === 'dormant');
    return { active, cooling, dormant };
  }, [activityGaps]);

  if (!activities || activities.length === 0) {
    return (
      <div className="py-12 text-center max-w-md mx-auto">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-signal-bgElevated border border-signal-border flex items-center justify-center text-signal-fgMuted">
          <Clock className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-signal-fg mb-1">Not enough activity data to show patterns</h3>
        <p className="text-sm text-signal-fgMuted">
          Record or import more activities to discover temporal patterns and consistency observations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* C. CONSISTENCY & RECENT WINDOW HEADER STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card variant="elevated" className="p-4">
          <p className="text-xs text-signal-fgSubtle uppercase tracking-wider font-mono">Active Days</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-signal-fg">
              {consistencyStats.activeDays}
            </span>
            <span className="text-xs text-signal-fgMuted">
              / {consistencyStats.totalDaysInRange}d ({Math.round(consistencyStats.activeDayRatio * 100)}%)
            </span>
          </div>
        </Card>

        <Card variant="elevated" className="p-4">
          <p className="text-xs text-signal-fgSubtle uppercase tracking-wider font-mono">Current Streak</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-signal-accent">
              {consistencyStats.currentActiveDayStreak}
            </span>
            <span className="text-xs text-signal-fgMuted">consecutive days</span>
          </div>
        </Card>

        <Card variant="elevated" className="p-4">
          <p className="text-xs text-signal-fgSubtle uppercase tracking-wider font-mono">Longest Streak</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-signal-fg">
              {consistencyStats.longestActiveDayStreak}
            </span>
            <span className="text-xs text-signal-fgMuted">active days</span>
          </div>
        </Card>

        <Card variant="elevated" className="p-4">
          <p className="text-xs text-signal-fgSubtle uppercase tracking-wider font-mono">Active Weeks</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-signal-fg">
              {consistencyStats.activeWeeks}
            </span>
            <span className="text-xs text-signal-fgMuted">
              / {consistencyStats.totalWeeks} ({consistencyStats.totalWeeks > 0 ? Math.round((consistencyStats.activeWeeks / consistencyStats.totalWeeks) * 100) : 0}%)
            </span>
          </div>
        </Card>
      </div>

      {/* A. PEAK HOURS (Activity by hour) */}
      <Card variant="elevated" className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
          <div>
            <h3 className="text-base font-semibold text-signal-fg flex items-center gap-2">
              <Clock className="w-4 h-4 text-signal-accent" />
              Activity by Hour of Day
            </h3>
            <p className="text-xs text-signal-fgMuted mt-0.5">
              {observedTimestampCount > 0
                ? `UTC distribution from ${observedTimestampCount} activities with observed timestamps`
                : 'Hourly patterns require an observed timestamp'}
            </p>
          </div>
          <span className="text-xs text-signal-fgSubtle font-mono">
            UTC · observed timestamps only
          </span>
        </div>

        {observedTimestampCount === 0 ? (
          <div className="min-h-44 rounded-xl border border-signal-border bg-signal-bg flex items-center justify-center px-6 text-center">
            <div className="max-w-md">
              <Clock className="w-5 h-5 text-signal-fgSubtle mx-auto mb-2" />
              <p className="text-sm font-medium text-signal-fg">Hourly activity is unavailable</p>
              <p className="text-xs text-signal-fgMuted mt-1">
                None of these activities include a valid observed timestamp. Date-only records still contribute to daily and weekday patterns.
              </p>
            </div>
          </div>
        ) : (
          /* 24-hour horizontal scrollable bar chart */
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[640px] flex items-end justify-between gap-1.5 h-44 pt-4 border-b border-signal-border">
              {peakHours.map(hourData => {
                const heightPct = (hourData.count / maxHourCount) * 100;
                const formattedHour =
                  hourData.hour === 0
                    ? '12a'
                    : hourData.hour === 12
                    ? '12p'
                    : hourData.hour < 12
                    ? `${hourData.hour}a`
                    : `${hourData.hour - 12}p`;

                return (
                  <div
                    key={hourData.hour}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-signal-bgElevated border border-signal-border px-2 py-1 rounded text-[10px] font-mono whitespace-nowrap pointer-events-none z-10 text-signal-fg shadow-lg">
                      {hourData.hour}:00 UTC — {hourData.count} acts
                      {hourData.duration > 0 && ` (${formatDuration(hourData.duration)})`}
                    </div>

                    {/* Bar */}
                    <div className="w-full bg-signal-bg rounded-t-sm flex items-end h-full">
                      <div
                        className={`w-full rounded-t-sm transition-all duration-300 ${
                          hourData.count > 0 ? 'bg-signal-accent hover:brightness-110' : 'bg-transparent'
                        }`}
                        style={{ height: `${Math.max(4, heightPct)}%` }}
                      />
                    </div>

                    {/* Hour Label */}
                    <span className="text-[10px] font-mono text-signal-fgSubtle mt-2">
                      {hourData.hour % 3 === 0 ? formattedHour : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* B. WEEKDAY DISTRIBUTION & D. RECENT CHANGE COMPARISON */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WEEKDAY DISTRIBUTION */}
        <Card variant="elevated" className="p-5 sm:p-6">
          <h3 className="text-base font-semibold text-signal-fg flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-signal-accent" />
            Activity by Day of Week
          </h3>
          <p className="text-xs text-signal-fgMuted mb-6">
            Which days contain the most recorded activity
          </p>

          <div className="space-y-3">
            {weekdayDistribution.map(item => {
              const pct = (item.count / maxWeekdayCount) * 100;
              return (
                <div key={item.dayName} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-signal-fg w-24">
                      {item.dayName}
                    </span>
                    <div className="flex items-center gap-3 text-signal-fgMuted font-mono">
                      <span>{item.count} acts</span>
                      {item.duration > 0 && (
                        <span className="text-signal-fgSubtle">
                          ({formatDuration(item.duration)})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-2 w-full bg-signal-bg rounded-full overflow-hidden">
                    <div
                      className="h-full bg-signal-accent rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* ACTIVITY CHANGE EQUAL-WINDOW COMPARISON */}
        <Card variant="elevated" className="p-5 sm:p-6">
          <h3 className="text-base font-semibold text-signal-fg flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-signal-accent" />
            {comparisonWindowDays}-Day Period Comparison
          </h3>
          <p className="text-xs text-signal-fgMuted mb-6">
            Exact volume comparison between the recent {comparisonWindowDays}-day window and prior {comparisonWindowDays} days
          </p>

          <div className="space-y-4">
            <div className="p-4 bg-signal-bg border border-signal-border rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-signal-fgMuted">Recent {comparisonWindowDays} Days</span>
                <span className="text-lg font-bold font-mono text-signal-fg">
                  {activityChange.currentCount} acts
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-signal-border/50">
                <span className="text-xs text-signal-fgMuted">Prior 30 Days</span>
                <span className="text-sm font-mono text-signal-fgSubtle">
                  {activityChange.previousCount} acts
                </span>
              </div>
            </div>

            <div className="p-4 bg-signal-bgElevated border border-signal-border rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-signal-fgSubtle">Net Activity Change</p>
                <p className="text-xl font-bold font-mono text-signal-fg mt-0.5">
                  {activityChange.absoluteChange >= 0 ? `+${activityChange.absoluteChange}` : activityChange.absoluteChange}
                  <span className="text-xs font-normal text-signal-fgMuted ml-1.5">activities</span>
                </p>
              </div>

              <div>
                {activityChange.status === 'new activity' ? (
                  <Badge variant="accent" size="md" className="font-mono">
                    New Activity
                  </Badge>
                ) : activityChange.percentChange !== null ? (
                  <Badge
                    variant={activityChange.percentChange >= 0 ? 'success' : 'danger'}
                    size="md"
                    className="font-mono text-sm"
                  >
                    {activityChange.percentChange >= 0 ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    )}
                    {activityChange.percentChange >= 0 ? '+' : ''}
                    {activityChange.percentChange}%
                  </Badge>
                ) : (
                  <Badge variant="default" size="md" className="font-mono">
                    <Minus className="w-4 h-4 mr-1" /> Flat
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* E. ACTIVITY GAPS & TOPIC RECENCY */}
      <Card variant="elevated" className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <div>
            <h3 className="text-base font-semibold text-signal-fg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-signal-accent" />
              Topic Activity Gaps & Recency
            </h3>
            <p className="text-xs text-signal-fgMuted mt-0.5">
              Heuristic classification based on days since last observed activity
            </p>
          </div>
          <div className="text-[11px] text-signal-fgSubtle font-mono flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-signal-success" /> Active ≤14d
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-signal-warning" /> Cooling 15–45d
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-signal-fgSubtle" /> Dormant &gt;45d
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Active Column */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-signal-fg uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-signal-success" />
              Active ({gapGroups.active.length})
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {gapGroups.active.length === 0 ? (
                <p className="text-xs text-signal-fgMuted italic">None</p>
              ) : (
                gapGroups.active.map(topic => (
                  <div
                    key={topic.topic}
                    onClick={() => onSelectTopic && onSelectTopic(topic.topic)}
                    className="p-2 bg-signal-bg border border-signal-border rounded-lg text-xs flex justify-between items-center cursor-pointer hover:border-signal-borderHover"
                  >
                    <span className="font-medium text-signal-fg truncate">#{topic.topic}</span>
                    <span className="text-[10px] font-mono text-signal-fgMuted flex-shrink-0">
                      {topic.daysSinceLastActivity === 0 ? 'today' : `${topic.daysSinceLastActivity}d ago`}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Cooling Column */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-signal-fg uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-signal-warning" />
              Cooling ({gapGroups.cooling.length})
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {gapGroups.cooling.length === 0 ? (
                <p className="text-xs text-signal-fgMuted italic">None</p>
              ) : (
                gapGroups.cooling.map(topic => (
                  <div
                    key={topic.topic}
                    onClick={() => onSelectTopic && onSelectTopic(topic.topic)}
                    className="p-2 bg-signal-bg border border-signal-border rounded-lg text-xs flex justify-between items-center cursor-pointer hover:border-signal-borderHover"
                  >
                    <span className="font-medium text-signal-fg truncate">#{topic.topic}</span>
                    <span className="text-[10px] font-mono text-signal-warning flex-shrink-0">
                      {topic.daysSinceLastActivity}d ago
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Dormant Column */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-signal-fg uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-signal-fgSubtle" />
              Dormant ({gapGroups.dormant.length})
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {gapGroups.dormant.length === 0 ? (
                <p className="text-xs text-signal-fgMuted italic">None</p>
              ) : (
                gapGroups.dormant.map(topic => (
                  <div
                    key={topic.topic}
                    onClick={() => onSelectTopic && onSelectTopic(topic.topic)}
                    className="p-2 bg-signal-bg border border-signal-border rounded-lg text-xs flex justify-between items-center cursor-pointer hover:border-signal-borderHover"
                  >
                    <span className="font-medium text-signal-fg truncate">#{topic.topic}</span>
                    <span className="text-[10px] font-mono text-signal-fgSubtle flex-shrink-0">
                      {topic.daysSinceLastActivity ? `${topic.daysSinceLastActivity}d ago` : 'no date'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
