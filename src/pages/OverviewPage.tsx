import { useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Activity, V2Analytics } from '../types';
import { canonicalizeTag, categoryColors } from '../analytics';
import { formatDuration, formatDate } from '../utils/helpers';
import { TrendingUp, TrendingDown, Minus, Sparkles, ArrowRight } from 'lucide-react';

interface OverviewPageProps {
  activities: Activity[];
  v2Analytics: V2Analytics;
  onNavigateTab?: (tab: 'activities' | 'patterns' | 'topics' | 'profile') => void;
  onSelectTopic?: (topic: string) => void;
}

export function OverviewPage({
  activities,
  v2Analytics,
  onNavigateTab,
  onSelectTopic,
}: OverviewPageProps) {
  const {
    totalActivities,
    activeDays,
    dateRange,
    categoryDistribution,
    activityChange,
    comparisonWindowDays,
    topTopics,
    topicTrends,
  } = v2Analytics;

  // 8-10 most recent activities sorted by timestamp/date descending
  const recentActivities = useMemo(() => {
    if (!activities || activities.length === 0) return [];
    return [...activities]
      .sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : new Date(a.date).getTime();
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : new Date(b.date).getTime();
        return timeB - timeA;
      })
      .slice(0, 8);
  }, [activities]);

  // Topic trend lookup map
  const trendMap = useMemo(() => {
    const map = new Map<string, typeof topicTrends[0]>();
    for (const t of topicTrends) {
      map.set(canonicalizeTag(t.topic), t);
    }
    return map;
  }, [topicTrends]);

  // Empty state handling
  if (totalActivities === 0 || activities.length === 0) {
    return (
      <div className="py-12 text-center max-w-md mx-auto">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-signal-bgElevated border border-signal-border flex items-center justify-center text-signal-fgMuted">
          <Minus className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-signal-fg mb-1">No activity data yet</h3>
        <p className="text-sm text-signal-fgMuted">
          Import activity data or adjust your active filters to see your overview.
        </p>
      </div>
    );
  }

  const top5Topics = topTopics.slice(0, 5);
  const spanText = dateRange.startStr && dateRange.endStr
    ? `${dateRange.startStr} to ${dateRange.endStr}`
    : 'All Time';

  return (
    <div className="space-y-6">
      {/* A. DATA CONTEXT BAR */}
      <div className="bg-signal-bgElevated border border-signal-border rounded-xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-signal-fgSubtle">Data Context</p>
            <h2 className="text-base sm:text-lg font-semibold text-signal-fg mt-0.5">
              {spanText}
            </h2>
          </div>
          <div className="flex items-center gap-6 sm:gap-8">
            <div>
              <p className="text-xs text-signal-fgMuted">Total Activities</p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-signal-fg">{totalActivities}</p>
            </div>
            <div className="h-8 w-px bg-signal-border" />
            <div>
              <p className="text-xs text-signal-fgMuted">Active Days</p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-signal-fg">
                {activeDays}
                <span className="text-xs font-normal text-signal-fgMuted ml-1">
                  / {dateRange.totalDays}d
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2-COLUMN MAIN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLS: Distribution & Recent Change */}
        <div className="lg:col-span-2 space-y-6">
          {/* B. ACTIVITY DISTRIBUTION */}
          <Card variant="elevated" className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-signal-fg">Activity Distribution</h3>
                <p className="text-xs text-signal-fgMuted mt-0.5">
                  Recorded activity by category
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {categoryDistribution
                .filter(item => item.count > 0)
                .map(item => {
                  const color = categoryColors[item.category] || '#00D4AA';
                  return (
                    <div key={item.category} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="font-medium text-signal-fg capitalize">
                            {item.category.replace('-', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-signal-fgMuted font-mono">
                          <span>{item.count} acts ({item.percentage}%)</span>
                          {typeof item.duration === 'number' && item.duration > 0 && (
                            <span className="text-signal-fgSubtle">
                              • {formatDuration(item.duration)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="h-2 w-full bg-signal-bg rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${item.percentage}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>

          {/* E. RECENT ACTIVITIES LIST */}
          <Card variant="elevated" className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-signal-fg">Recent Activities</h3>
                <p className="text-xs text-signal-fgMuted mt-0.5">
                  Latest recorded activity
                </p>
              </div>
              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('activities')}
                  className="text-xs text-signal-accent hover:underline flex items-center gap-1 font-medium"
                >
                  View all <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="divide-y divide-signal-border/50">
              {recentActivities.map(activity => {
                const color = categoryColors[activity.category] || '#00D4AA';
                const formattedDate = activity.timestamp
                  ? formatDate(activity.timestamp)
                  : activity.date;

                return (
                  <div key={activity.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className="inline-block px-2 py-0.5 rounded text-[11px] font-medium uppercase tracking-wider"
                          style={{
                            backgroundColor: `${color}15`,
                            color: color,
                            border: `1px solid ${color}30`,
                          }}
                        >
                          {activity.category}
                        </span>
                        <span className="text-[11px] text-signal-fgSubtle font-mono">
                          {formattedDate}
                        </span>
                        {typeof activity.duration === 'number' && activity.duration > 0 && (
                          <span className="text-[11px] text-signal-fgSubtle font-mono">
                            • {formatDuration(activity.duration)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-signal-fg truncate">
                        {activity.title}
                      </p>
                      {activity.tags && activity.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {activity.tags.slice(0, 4).map(tag => (
                            <span
                              key={tag}
                              className="text-[10px] font-mono px-1.5 py-0.5 bg-signal-bg border border-signal-border rounded text-signal-fgMuted"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* RIGHT COL: Recent Change & Top Topics */}
        <div className="space-y-6">
          {/* C. RECENT CHANGE */}
          <Card variant="elevated" className="p-5 sm:p-6">
            <h3 className="text-sm font-semibold text-signal-fg mb-1">Recent Change</h3>
            <p className="text-xs text-signal-fgMuted mb-4">
              Last {comparisonWindowDays} days vs prior {comparisonWindowDays}-day window
            </p>

            <div className="space-y-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-xs text-signal-fgSubtle">Current {comparisonWindowDays}-Day Window</p>
                  <p className="text-2xl font-bold font-mono text-signal-fg mt-0.5">
                    {activityChange.currentCount}
                    <span className="text-xs font-normal text-signal-fgMuted ml-1.5">activities</span>
                  </p>
                </div>
                <div>
                  {activityChange.status === 'new activity' ? (
                    <Badge variant="accent" size="sm" className="font-mono">
                      <Sparkles className="w-3 h-3 mr-1" /> New Period
                    </Badge>
                  ) : activityChange.percentChange !== null ? (
                    <Badge
                      variant={activityChange.percentChange >= 0 ? 'success' : 'danger'}
                      size="sm"
                      className="font-mono"
                    >
                      {activityChange.percentChange >= 0 ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      {activityChange.percentChange >= 0 ? '+' : ''}
                      {activityChange.percentChange}%
                    </Badge>
                  ) : (
                    <Badge variant="default" size="sm" className="font-mono">
                      <Minus className="w-3 h-3 mr-1" /> No change
                    </Badge>
                  )}
                </div>
              </div>

              <div className="p-3 bg-signal-bg border border-signal-border rounded-lg text-xs space-y-1">
                <div className="flex justify-between text-signal-fgMuted">
                  <span>Prior {comparisonWindowDays} days:</span>
                  <span className="font-mono text-signal-fg">{activityChange.previousCount} activities</span>
                </div>
                <div className="flex justify-between text-signal-fgMuted">
                  <span>Absolute delta:</span>
                  <span className="font-mono text-signal-fg">
                    {activityChange.absoluteChange >= 0 ? `+${activityChange.absoluteChange}` : activityChange.absoluteChange} activities
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* D. TOP TOPICS */}
          <Card variant="elevated" className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-signal-fg">Top Topics</h3>
                <p className="text-xs text-signal-fgMuted mt-0.5">
                  Most frequent tags & trends
                </p>
              </div>
              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('topics')}
                  className="text-xs text-signal-accent hover:underline flex items-center gap-1 font-medium"
                >
                  Explore <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {top5Topics.length === 0 ? (
              <p className="text-xs text-signal-fgMuted">No topics recorded</p>
            ) : (
              <div className="space-y-2.5">
                {top5Topics.map(item => {
                  const trend = trendMap.get(canonicalizeTag(item.topic));

                  return (
                    <div
                      key={item.topic}
                      onClick={() => onSelectTopic && onSelectTopic(item.topic)}
                      className="p-2.5 bg-signal-bg border border-signal-border rounded-lg flex items-center justify-between hover:border-signal-borderHover transition-colors cursor-pointer"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-medium text-signal-fg truncate">
                          #{item.topic}
                        </p>
                        <p className="text-[10px] text-signal-fgMuted font-mono">
                          {item.count} total {item.count === 1 ? 'activity' : 'activities'}
                        </p>
                      </div>

                      {trend && (
                        <div className="flex-shrink-0">
                          {trend.direction === 'new' ? (
                            <span className="text-[10px] font-mono text-signal-accent bg-signal-accent/10 px-1.5 py-0.5 rounded border border-signal-accent/20">
                              NEW
                            </span>
                          ) : trend.direction === 'up' ? (
                            <span className="text-[10px] font-mono text-signal-success bg-signal-success/10 px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-signal-success/20">
                              <TrendingUp className="w-3 h-3" /> +{trend.percentChange ?? trend.absoluteChange}%
                            </span>
                          ) : trend.direction === 'down' ? (
                            <span className="text-[10px] font-mono text-signal-danger bg-signal-danger/10 px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-signal-danger/20">
                              <TrendingDown className="w-3 h-3" /> {trend.percentChange ?? trend.absoluteChange}%
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-signal-fgSubtle bg-signal-bgElevated px-1.5 py-0.5 rounded border border-signal-border">
                              flat
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
