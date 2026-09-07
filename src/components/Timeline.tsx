import { cn } from '../utils/helpers';
import { formatMonthYear } from '../utils/helpers';
import { categoryColors } from '../analytics';
import { TimelineEvent, Category } from '../types';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';

interface TimelineProps {
  events: TimelineEvent[];
  selectedCategory?: Category;
  onEventClick?: (event: TimelineEvent) => void;
  className?: string;
}

export function Timeline({ events, selectedCategory, onEventClick, className }: TimelineProps) {
  const filteredEvents = selectedCategory
    ? events.filter(e => e.category === selectedCategory)
    : events;

  const groupedEvents = filteredEvents.reduce((acc, event) => {
    const month = formatMonthYear(event.date);
    if (!acc[month]) acc[month] = [];
    acc[month].push(event);
    return acc;
  }, {} as Record<string, TimelineEvent[]>);

  const sortedMonths = Object.keys(groupedEvents).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div className={cn('space-y-8', className)}>
      {sortedMonths.map((month, monthIdx) => (
        <div key={month} className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-signal-border" style={{ height: 'calc(100% + 1.5rem)' }} />
          <div className="relative pl-14 space-y-4">
            <div className="-ml-14 mb-4">
              <span className="px-3 py-1 bg-signal-bgElevated border border-signal-border rounded-full text-xs font-mono font-medium text-signal-fgMuted">
                {month}
              </span>
            </div>
            {groupedEvents[month].map((event, idx) => (
              <div
                key={event.id}
                className={cn(
                  'relative group',
                  idx === groupedEvents[month].length - 1 && monthIdx === sortedMonths.length - 1 && 'pb-4'
                )}
                onClick={() => onEventClick?.(event)}
              >
                <div className="absolute left-[-14px] top-1 w-3 h-3 rounded-full border-2 bg-signal-bg z-10 transition-all duration-200 group-hover:scale-125"
                  style={{
                    borderColor: categoryColors[event.category as keyof typeof categoryColors],
                    backgroundColor: categoryColors[event.category as keyof typeof categoryColors],
                  }}
                />
                <Card variant="flat" className="p-4 hover:border-signal-borderHover transition-colors cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${categoryColors[event.category as keyof typeof categoryColors]}20` }}
                    >
                      <span className="text-sm" style={{ color: categoryColors[event.category as keyof typeof categoryColors] }}>
                        {getCategoryIcon(event.category)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-signal-fg truncate">{event.title}</h4>
                        <Badge variant="muted" size="sm">{event.category}</Badge>
                        <Badge variant="accent" size="sm" className="font-mono">{event.impactScore}</Badge>
                      </div>
                      <p className="text-sm text-signal-fgMuted line-clamp-2">{event.description}</p>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      ))}

      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-signal-fgMuted">No timeline events found</p>
          <p className="text-xs text-signal-fgSubtle mt-1">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}

function getCategoryIcon(category: Category): string {
  const icons: Record<Category, string> = {
    coding: '</>',
    'ai-ml': '🧠',
    finance: '$',
    filmmaking: '🎬',
    reading: '📖',
    learning: '📚',
    social: '@',
    projects: '🚀',
  };
  return icons[category] || '●';
}