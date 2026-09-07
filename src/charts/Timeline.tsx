import { cn } from '../utils/helpers';
import { formatMonthYear } from '../utils/helpers';
import { categoryColors } from '../analytics';
import { TimelineEvent, Category } from '../types';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';

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
    <div className={cn('relative', className)}>
      {filteredEvents.length > 0 && (
        <div className="absolute left-[27px] top-2 bottom-4 w-[2px] bg-signal-border" />
      )}
      
      <div className="space-y-8">
        {sortedMonths.map((month) => (
          <div key={month} className="relative">
            <div className="mb-4 relative z-10 flex items-center">
              <div className="w-[56px] flex justify-center">
                <div className="w-2 h-2 rounded-full bg-signal-borderHover ring-4 ring-signal-bg" />
              </div>
              <span className="px-3 py-1 bg-signal-bgElevated border border-signal-border rounded-full text-xs font-mono font-medium text-signal-fgMuted ml-2">
                {month}
              </span>
            </div>
            <div className="space-y-4">
              {groupedEvents[month].map((event) => (
                <div
                  key={event.id}
                  className="relative flex items-start gap-4 group cursor-pointer"
                  onClick={() => onEventClick?.(event)}
                >
                  <div className="w-[56px] flex justify-center pt-5 relative z-10">
                    <div 
                      className="w-3 h-3 rounded-full border-2 bg-signal-bg transition-all duration-200 group-hover:scale-125"
                      style={{
                        borderColor: categoryColors[event.category as keyof typeof categoryColors],
                        backgroundColor: categoryColors[event.category as keyof typeof categoryColors],
                      }}
                    />
                  </div>
                  <Card variant="flat" className="flex-1 p-4 hover:border-signal-borderHover transition-colors">
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
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12 relative z-10">
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
