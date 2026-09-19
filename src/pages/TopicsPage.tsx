import { useState, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Activity, V2Analytics } from '../types';
import { canonicalizeTag, categoryColors } from '../analytics';
import { formatDate, formatDuration, cn } from '../utils/helpers';
import {
  Hash,
  Search,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Link2,
  Calendar,
  Clock,
  ArrowUpDown,
  X,
} from 'lucide-react';

interface TopicsPageProps {
  activities: Activity[];
  v2Analytics: V2Analytics;
  selectedTopic: string | null;
  onSelectTopic: (topic: string | null) => void;
}

type TopicSortOption = 'most-active' | 'most-recent' | 'growing' | 'declining';

export function TopicsPage({
  activities,
  v2Analytics,
  selectedTopic,
  onSelectTopic,
}: TopicsPageProps) {
  const [topicSearch, setTopicSearch] = useState('');
  const [sortOption, setSortOption] = useState<TopicSortOption>('most-active');

  const {
    topicIndex,
    topicTrends,
    activityGaps,
    topicCooccurrence,
    comparisonWindowDays,
  } = v2Analytics;

  const selectedTopicKey = useMemo(
    () => (selectedTopic ? canonicalizeTag(selectedTopic) : null),
    [selectedTopic]
  );

  // Trend lookup
  const trendMap = useMemo(() => {
    const map = new Map<string, typeof topicTrends[0]>();
    for (const t of topicTrends) {
      map.set(canonicalizeTag(t.topic), t);
    }
    return map;
  }, [topicTrends]);

  // Activity gap/recency lookup
  const gapMap = useMemo(() => {
    const map = new Map<string, typeof activityGaps[0]>();
    for (const g of activityGaps) {
      map.set(canonicalizeTag(g.topic), g);
    }
    return map;
  }, [activityGaps]);

  // Aggregate topics with trends and recency
  const aggregatedTopics = useMemo(() => {
    return topicIndex.map(t => {
      const topicKey = canonicalizeTag(t.topic);
      const trend = trendMap.get(topicKey);
      const gap = gapMap.get(topicKey);
      return {
        name: t.topic,
        totalCount: t.count,
        currentCount: trend ? trend.currentCount : 0,
        previousCount: trend ? trend.previousCount : 0,
        percentChange: trend ? trend.percentChange : null,
        direction: trend ? trend.direction : 'flat',
        daysSinceLastActivity: gap?.daysSinceLastActivity ?? null,
        lastActivityDate: gap?.lastActivityDate ?? null,
        status: gap?.status ?? 'active',
      };
    });
  }, [topicIndex, trendMap, gapMap]);

  // Filtered & Sorted Topics List
  const displayTopics = useMemo(() => {
    let list = [...aggregatedTopics];

    if (topicSearch.trim()) {
      const q = topicSearch.toLowerCase().trim();
      list = list.filter(t => t.name.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      switch (sortOption) {
        case 'most-active':
          return b.totalCount - a.totalCount || a.name.localeCompare(b.name);
        case 'most-recent':
          return (
            (a.daysSinceLastActivity ?? 9999) - (b.daysSinceLastActivity ?? 9999) ||
            b.totalCount - a.totalCount
          );
        case 'growing': {
          const changeA = a.percentChange ?? (a.direction === 'new' ? 100 : 0);
          const changeB = b.percentChange ?? (b.direction === 'new' ? 100 : 0);
          return changeB - changeA;
        }
        case 'declining': {
          const changeA = a.percentChange ?? 0;
          const changeB = b.percentChange ?? 0;
          return changeA - changeB;
        }
        default:
          return b.totalCount - a.totalCount;
      }
    });

    return list;
  }, [aggregatedTopics, topicSearch, sortOption]);

  // Topic detail: Related topics from co-occurrence
  const relatedTopics = useMemo(() => {
    if (!selectedTopicKey) return [];
    return topicCooccurrence
      .filter(
        e =>
          canonicalizeTag(e.source) === selectedTopicKey ||
          canonicalizeTag(e.target) === selectedTopicKey
      )
      .map(e => ({
        topic: canonicalizeTag(e.source) === selectedTopicKey ? e.target : e.source,
        sharedCount: e.count,
      }))
      .sort((a, b) => b.sharedCount - a.sharedCount);
  }, [selectedTopicKey, topicCooccurrence]);

  // Topic detail: Activity history matching selected topic
  const topicActivities = useMemo(() => {
    if (!selectedTopicKey) return [];
    return activities
      .filter(
        a =>
          Array.isArray(a.tags) &&
          a.tags.some(tag => canonicalizeTag(tag) === selectedTopicKey)
      )
      .sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : new Date(a.date).getTime();
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : new Date(b.date).getTime();
        return timeB - timeA;
      });
  }, [selectedTopicKey, activities]);

  // Empty state handling
  if (topicIndex.length === 0) {
    return (
      <div className="py-12 text-center max-w-md mx-auto">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-signal-bgElevated border border-signal-border flex items-center justify-center text-signal-fgMuted">
          <Hash className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-signal-fg mb-1">No topics found in this dataset</h3>
        <p className="text-sm text-signal-fgMuted">
          Activities with tags or topics will automatically populate the topic explorer.
        </p>
      </div>
    );
  }

  // ==========================================
  // TOPIC DETAIL VIEW
  // ==========================================
  if (selectedTopic) {
    const topicSummary = aggregatedTopics.find(
      t => canonicalizeTag(t.name) === selectedTopicKey
    );

    return (
      <div className="space-y-6">
        {/* Back navigation header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onSelectTopic(null)}
            className="flex items-center gap-2 text-xs font-semibold text-signal-fg hover:text-signal-accent transition-colors py-1.5 px-3 rounded-lg bg-signal-bgElevated border border-signal-border"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to All Topics
          </button>
        </div>

        {/* Topic Header Card */}
        <Card variant="elevated" className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Hash className="w-5 h-5 text-signal-accent" />
                <h2 className="text-2xl font-bold font-display text-signal-fg">
                  {selectedTopic}
                </h2>
              </div>
              <p className="text-xs text-signal-fgMuted">
                Topic activity and shared history
              </p>
            </div>

            <div className="flex items-center gap-4 sm:gap-6">
              <div className="text-right sm:text-left">
                <p className="text-xs text-signal-fgSubtle">Total Activities</p>
                <p className="text-xl font-bold font-mono text-signal-fg">
                  {topicSummary?.totalCount || topicActivities.length}
                </p>
              </div>

              <div className="h-8 w-px bg-signal-border" />

              <div>
                <p className="text-xs text-signal-fgSubtle">Recent {comparisonWindowDays}-Day Window</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-xl font-bold font-mono text-signal-fg">
                    {topicSummary?.currentCount ?? 0}
                  </span>
                  <span className="text-xs text-signal-fgMuted">
                    (vs {topicSummary?.previousCount ?? 0} prior)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* 2-COLUMN: RELATED TOPICS & ACTIVITY HISTORY */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT 1 COL: Related Topics (from measured co-occurrence) */}
          <div className="space-y-4">
            <Card variant="elevated" className="p-5">
              <h3 className="text-sm font-semibold text-signal-fg flex items-center gap-2 mb-1">
                <Link2 className="w-4 h-4 text-signal-accent" />
                Related Topics
              </h3>
              <p className="text-xs text-signal-fgMuted mb-4">
                Topics recorded on the same activities
              </p>

              {relatedTopics.length === 0 ? (
                <p className="text-xs text-signal-fgMuted italic">
                  No co-occurring topics recorded for #{selectedTopic}
                </p>
              ) : (
                <div className="space-y-2">
                  {relatedTopics.map(rel => (
                    <button
                      type="button"
                      key={rel.topic}
                      onClick={() => onSelectTopic(rel.topic)}
                      className="w-full p-2.5 bg-signal-bg border border-signal-border rounded-lg flex items-center justify-between text-xs hover:border-signal-borderHover cursor-pointer transition-colors text-left"
                    >
                      <span className="font-medium text-signal-fg truncate">
                        #{rel.topic}
                      </span>
                      <span className="text-[11px] font-mono text-signal-fgMuted bg-signal-bgElevated px-2 py-0.5 rounded border border-signal-border flex-shrink-0">
                        {rel.sharedCount} shared
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* RIGHT 2 COLS: Activity History */}
          <div className="lg:col-span-2 space-y-4">
            <Card variant="elevated" className="p-5">
              <h3 className="text-sm font-semibold text-signal-fg mb-1">
                Activity History for #{selectedTopic}
              </h3>
              <p className="text-xs text-signal-fgMuted mb-4">
                Chronological list of all recorded sessions containing this tag ({topicActivities.length} items)
              </p>

              <div className="divide-y divide-signal-border">
                {topicActivities.map(activity => {
                  const color = categoryColors[activity.category] || '#00D4AA';
                  const formattedDate = activity.timestamp
                    ? formatDate(activity.timestamp)
                    : activity.date;

                  return (
                    <div key={activity.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider"
                          style={{
                            backgroundColor: `${color}15`,
                            color: color,
                            border: `1px solid ${color}30`,
                          }}
                        >
                          {activity.category}
                        </span>
                        <span className="text-xs text-signal-fgSubtle font-mono flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formattedDate}
                        </span>
                        {typeof activity.duration === 'number' && activity.duration > 0 && (
                          <span className="text-xs text-signal-fgSubtle font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(activity.duration)}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-medium text-signal-fg">
                        {activity.title}
                      </h4>

                      {activity.tags && activity.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {activity.tags.map(t => (
                            <span
                              key={t}
                              className={cn(
                                'text-[10px] font-mono px-1.5 py-0.5 rounded',
                                canonicalizeTag(t) === selectedTopicKey
                                  ? 'bg-signal-accent text-signal-bg font-semibold'
                                  : 'bg-signal-bg border border-signal-border text-signal-fgMuted'
                              )}
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // TOPIC EXPLORER (TOP-LEVEL LIST)
  // ==========================================
  return (
    <div className="space-y-4">
      {/* Search & Sort Controls */}
      <Card variant="elevated" className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Topic search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-signal-fgSubtle" />
            <Input
              type="text"
              placeholder="Search topics..."
              value={topicSearch}
              onChange={e => setTopicSearch(e.target.value)}
              className="pl-9 pr-8 bg-signal-bg border-signal-border text-xs h-9 w-full"
            />
            {topicSearch && (
              <button
                onClick={() => setTopicSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-signal-fgSubtle hover:text-signal-fg"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
            <span className="text-signal-fgSubtle mr-1 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3" /> Sort:
            </span>
            {(
              [
                { id: 'most-active', label: 'Most Active' },
                { id: 'most-recent', label: 'Most Recent' },
                { id: 'growing', label: 'Growing' },
                { id: 'declining', label: 'Declining' },
              ] as const
            ).map(opt => (
              <button
                key={opt.id}
                onClick={() => setSortOption(opt.id)}
                className={cn(
                  'px-2.5 py-1 rounded-md transition-colors text-xs font-medium whitespace-nowrap',
                  sortOption === opt.id
                    ? 'bg-signal-accent text-signal-bg font-semibold'
                    : 'bg-signal-bg border border-signal-border text-signal-fgMuted hover:text-signal-fg'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* TOPICS LIST GRID */}
      {displayTopics.length === 0 ? (
        <Card variant="elevated" className="p-8 text-center">
          <p className="text-sm font-medium text-signal-fg mb-1">No matching topics</p>
          <p className="text-xs text-signal-fgMuted">
            Try adjusting your topic search term.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {displayTopics.map(topic => {
            return (
              <button
                type="button"
                key={topic.name}
                onClick={() => onSelectTopic(topic.name)}
                className="w-full p-4 bg-signal-bgElevated border border-signal-border hover:border-signal-accent/50 rounded-[10px] transition-colors cursor-pointer group space-y-3 text-left"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold text-signal-fg group-hover:text-signal-accent transition-colors truncate">
                    #{topic.name}
                  </h4>

                  {topic.direction === 'new' ? (
                    <Badge variant="accent" size="sm" className="font-mono">
                      <Sparkles className="w-3 h-3 mr-1" /> New
                    </Badge>
                  ) : topic.direction === 'up' ? (
                    <Badge variant="success" size="sm" className="font-mono">
                      <TrendingUp className="w-3 h-3 mr-1" /> +{topic.percentChange}%
                    </Badge>
                  ) : topic.direction === 'down' ? (
                    <Badge variant="danger" size="sm" className="font-mono">
                      <TrendingDown className="w-3 h-3 mr-1" /> {topic.percentChange}%
                    </Badge>
                  ) : null}
                </div>

                <div className="flex items-center justify-between text-xs text-signal-fgMuted pt-2 border-t border-signal-border/50">
                  <span className="font-mono font-medium text-signal-fg">
                    {topic.totalCount} acts
                  </span>

                  <span className="font-mono text-[11px] text-signal-fgSubtle">
                    {topic.daysSinceLastActivity === null
                      ? 'no date'
                      : topic.daysSinceLastActivity === 0
                      ? 'active today'
                      : `${topic.daysSinceLastActivity}d ago`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
