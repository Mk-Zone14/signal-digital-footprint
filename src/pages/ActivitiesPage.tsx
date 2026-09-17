import { useState, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Activity, Category, DateRange } from '../types';
import { categoryColors, CATEGORIES } from '../analytics';
import { formatDuration, formatDate, cn } from '../utils/helpers';
import { Search, X, ExternalLink, Calendar, Clock, Filter, ArrowUpDown, Tag } from 'lucide-react';

interface ActivitiesPageProps {
  activities: Activity[];
  allActivities: Activity[];
  selectedCategory?: Category | 'all';
  onCategorySelect?: (category: Category | 'all') => void;
  selectedTopic?: string | null;
  onTopicSelect?: (topic: string | null) => void;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange) => void;
}

export function ActivitiesPage({
  activities,
  allActivities,
  selectedCategory = 'all',
  onCategorySelect,
  selectedTopic = null,
  onTopicSelect,
}: ActivitiesPageProps) {
  const [localSearch, setLocalSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);

  // Extract all available tags across all activities for quick tag filtering
  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of allActivities) {
      if (Array.isArray(a.tags)) {
        for (const t of a.tags) {
          if (typeof t === 'string' && t.trim().length > 0) {
            counts.set(t, (counts.get(t) || 0) + 1);
          }
        }
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);
  }, [allActivities]);

  // Apply local search, category filter, topic filter, and sort
  const filteredList = useMemo(() => {
    let result = [...activities];

    if (selectedCategory && selectedCategory !== 'all') {
      result = result.filter(a => a.category === selectedCategory);
    }

    if (selectedTopic) {
      result = result.filter(a => Array.isArray(a.tags) && a.tags.includes(selectedTopic));
    }

    if (localSearch.trim().length > 0) {
      const q = localSearch.toLowerCase().trim();
      result = result.filter(a => {
        const titleMatch = a.title.toLowerCase().includes(q);
        const catMatch = a.category.toLowerCase().includes(q);
        const tagMatch = Array.isArray(a.tags) && a.tags.some(t => t.toLowerCase().includes(q));
        const descMatch = typeof a.description === 'string' && a.description.toLowerCase().includes(q);
        const platMatch = typeof a.platform === 'string' && a.platform.toLowerCase().includes(q);
        return titleMatch || catMatch || tagMatch || descMatch || platMatch;
      });
    }

    result.sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : new Date(a.date).getTime();
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : new Date(b.date).getTime();
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [activities, selectedCategory, selectedTopic, localSearch, sortOrder]);

  const hasActiveFilters =
    (selectedCategory && selectedCategory !== 'all') ||
    selectedTopic !== null ||
    localSearch.trim().length > 0;

  const handleClearFilters = () => {
    setLocalSearch('');
    if (onCategorySelect) onCategorySelect('all');
    if (onTopicSelect) onTopicSelect(null);
  };

  return (
    <div className="space-y-4">
      {/* FILTER & SEARCH CONTROL BAR */}
      <Card variant="elevated" className="p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-signal-fgSubtle" />
            <Input
              type="text"
              placeholder="Search activities by title, tag, platform..."
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              className="pl-9 pr-8 bg-signal-bg border-signal-border text-xs h-9 w-full"
            />
            {localSearch && (
              <button
                onClick={() => setLocalSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-signal-fgSubtle hover:text-signal-fg"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort & Stats */}
          <div className="flex items-center gap-3 justify-between md:justify-end text-xs text-signal-fgMuted">
            <span className="font-mono">
              Showing <strong className="text-signal-fg font-semibold">{filteredList.length}</strong> of {activities.length} acts
            </span>

            <button
              onClick={() => setSortOrder(prev => (prev === 'newest' ? 'oldest' : 'newest'))}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-signal-bg border border-signal-border hover:border-signal-borderHover text-signal-fg transition-colors"
              title="Toggle sort order"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}</span>
            </button>
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-signal-border/50 text-xs">
          <span className="text-signal-fgSubtle mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Category:
          </span>
          <button
            onClick={() => onCategorySelect && onCategorySelect('all')}
            className={cn(
              'px-2.5 py-1 rounded-md transition-colors text-xs font-medium',
              selectedCategory === 'all'
                ? 'bg-signal-accent text-signal-bg font-semibold'
                : 'bg-signal-bg border border-signal-border text-signal-fgMuted hover:text-signal-fg'
            )}
          >
            All
          </button>
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat;
            const color = categoryColors[cat];
            return (
              <button
                key={cat}
                onClick={() => onCategorySelect && onCategorySelect(isSelected ? 'all' : cat)}
                className={cn(
                  'px-2.5 py-1 rounded-md transition-colors text-xs font-medium capitalize',
                  isSelected
                    ? 'text-signal-bg font-semibold'
                    : 'bg-signal-bg border border-signal-border text-signal-fgMuted hover:text-signal-fg'
                )}
                style={{
                  backgroundColor: isSelected ? color : undefined,
                  borderColor: isSelected ? color : undefined,
                }}
              >
                {cat.replace('-', ' ')}
              </button>
            );
          })}
        </div>

        {/* Top Tags / Topics Filter Row */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-signal-border/50 text-xs">
            <span className="text-signal-fgSubtle mr-1 flex items-center gap-1">
              <Tag className="w-3 h-3" /> Topic:
            </span>
            {allTags.slice(0, 10).map(tag => {
              const isSelected = selectedTopic === tag;
              return (
                <button
                  key={tag}
                  onClick={() => onTopicSelect && onTopicSelect(isSelected ? null : tag)}
                  className={cn(
                    'px-2 py-0.5 rounded text-[11px] font-mono transition-colors',
                    isSelected
                      ? 'bg-signal-accent text-signal-bg font-semibold'
                      : 'bg-signal-bg border border-signal-border text-signal-fgMuted hover:text-signal-fg'
                  )}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        )}

        {/* Active Filters Row (if topic or search active) */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 pt-2 border-t border-signal-border/50 flex-wrap text-xs">
            <span className="text-signal-fgSubtle">Active filters:</span>
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-signal-bg border border-signal-border text-signal-fg font-mono text-[11px]">
                category: {selectedCategory}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-signal-danger"
                  onClick={() => onCategorySelect && onCategorySelect('all')}
                />
              </span>
            )}
            {selectedTopic && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-signal-bg border border-signal-border text-signal-accent font-mono text-[11px]">
                topic: #{selectedTopic}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-signal-danger"
                  onClick={() => onTopicSelect && onTopicSelect(null)}
                />
              </span>
            )}
            {localSearch && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-signal-bg border border-signal-border text-signal-fg font-mono text-[11px]">
                query: "{localSearch}"
                <X
                  className="w-3 h-3 cursor-pointer hover:text-signal-danger"
                  onClick={() => setLocalSearch('')}
                />
              </span>
            )}
            <button
              onClick={handleClearFilters}
              className="text-signal-accent hover:underline text-[11px] ml-auto font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}
      </Card>

      {/* ACTIVITIES COMPACT LIST */}
      {filteredList.length === 0 ? (
        <Card variant="elevated" className="p-12 text-center">
          <p className="text-sm font-medium text-signal-fg mb-1">No activities match these filters</p>
          <p className="text-xs text-signal-fgMuted mb-4">
            Try adjusting your search terms or clearing active filters.
          </p>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-1.5 rounded-lg bg-signal-accent text-signal-bg text-xs font-semibold hover:bg-signal-accent/90 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </Card>
      ) : (
        <div className="bg-signal-bgElevated border border-signal-border rounded-xl divide-y divide-signal-border overflow-hidden">
          {filteredList.map(activity => {
            const color = categoryColors[activity.category] || '#00D4AA';
            const formattedDate = activity.timestamp
              ? formatDate(activity.timestamp)
              : activity.date;
            const isExpanded = expandedActivityId === activity.id;

            return (
              <div
                key={activity.id}
                onClick={() => setExpandedActivityId(isExpanded ? null : activity.id)}
                className="p-3.5 sm:p-4 hover:bg-signal-bg/50 transition-colors cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    {/* Header Row: Category, Date, Platform, Duration */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider"
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
                      {activity.duration > 0 && (
                        <span className="text-xs text-signal-fgSubtle font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(activity.duration)}
                        </span>
                      )}
                      {activity.platform && (
                        <span className="text-[11px] text-signal-fgMuted bg-signal-bg px-1.5 py-0.5 rounded border border-signal-border">
                          {activity.platform}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h4 className="text-sm font-medium text-signal-fg">
                      {activity.title}
                    </h4>

                    {/* Tags */}
                    {activity.tags && activity.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {activity.tags.map(tag => (
                          <button
                            key={tag}
                            onClick={e => {
                              e.stopPropagation();
                              if (onTopicSelect) onTopicSelect(tag);
                            }}
                            className={cn(
                              'text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors',
                              selectedTopic === tag
                                ? 'bg-signal-accent text-signal-bg font-semibold'
                                : 'bg-signal-bg border border-signal-border text-signal-fgMuted hover:border-signal-accent/50 hover:text-signal-accent'
                            )}
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {activity.url && (
                    <div className="flex-shrink-0 self-start sm:self-center">
                      <a
                        href={activity.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="p-1.5 text-signal-fgMuted hover:text-signal-accent rounded hover:bg-signal-bg transition-colors inline-block"
                        title="Open external link"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Expanded Details (Description, Metadata) */}
                {isExpanded && activity.description && (
                  <div className="mt-3 pt-3 border-t border-signal-border/50 text-xs text-signal-fgMuted space-y-2">
                    <p className="leading-relaxed">{activity.description}</p>
                    {activity.url && (
                      <p className="text-[11px] font-mono truncate text-signal-fgSubtle">
                        URL: <a href={activity.url} target="_blank" rel="noopener noreferrer" className="text-signal-accent hover:underline">{activity.url}</a>
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
