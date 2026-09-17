import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '../utils/helpers';
import { SearchResult, Activity, Category } from '../types';
import { formatDate } from '../utils/helpers';
import { categoryColors } from '../analytics';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { Keyboard, X, Search as SearchIcon } from 'lucide-react';

interface SearchProps {
  isOpen: boolean;
  onClose: () => void;
  onResultClick: (result: SearchResult) => void;
  results: {
    activities: Activity[];
    skills?: Array<{ id: string; name: string; category: string }>;
    timeline?: Array<{ id: string; title: string; category: string; date: string; description?: string }>;
    interests?: Array<{ id: string; name: string; category: string }>;
  } | null;
  query: string;
  onQueryChange: (query: string) => void;
}

const EMPTY_ACTIVITIES: Activity[] = [];

export function Search({ isOpen, onClose, onResultClick, results, query, onQueryChange }: SearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const activities = results?.activities ?? EMPTY_ACTIVITIES;

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSelectActivity = useCallback((activity: Activity) => {
    onResultClick({
      type: 'activity',
      id: activity.id,
      title: activity.title,
      subtitle: activity.category,
      category: activity.category,
      date: activity.date,
    });
    onClose();
  }, [onResultClick, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, Math.max(0, activities.length - 1)));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (activities[selectedIndex]) {
            handleSelectActivity(activities[selectedIndex]);
          }
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, activities, handleSelectActivity, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
      <div className="absolute inset-0 bg-signal-bg/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl">
        <Card variant="elevated" className="overflow-hidden shadow-2xl">
          <div className="flex items-center gap-3 p-4 border-b border-signal-border">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-signal-fgSubtle" />
              <Input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => {
                  onQueryChange(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Search activities across title, category, tags, description..."
                className="pl-10 py-2.5 text-sm bg-signal-bg border-signal-border"
                autoComplete="off"
              />
            </div>
            <kbd className="px-2 py-1 bg-signal-bg border border-signal-border rounded text-xs text-signal-fgMuted font-mono">⎋</kbd>
            <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {query.trim() === '' ? (
              <div className="p-8 text-center">
                <Keyboard className="w-12 h-12 mx-auto text-signal-borderHover mb-4" />
                <p className="text-sm text-signal-fgMuted mb-1">Type to search your recorded activities</p>
                <p className="text-xs text-signal-fgSubtle">Search by title, tag (#TypeScript), platform, or category</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-signal-fgMuted">No activities found matching "{query}"</p>
              </div>
            ) : (
              <div>
                <div className="px-4 py-2 bg-signal-bg/50 flex items-center justify-between border-b border-signal-border/50">
                  <span className="text-xs font-semibold text-signal-fgMuted uppercase tracking-wider font-mono">
                    Activities
                  </span>
                  <span className="px-2 py-0.5 bg-signal-bg border border-signal-border rounded text-xs font-mono text-signal-fgSubtle">
                    {activities.length} found
                  </span>
                </div>
                <div className="divide-y divide-signal-border/50">
                  {activities.map((activity, itemIdx) => {
                    const isSelected = selectedIndex === itemIdx;
                    const color = categoryColors[activity.category as Category] || '#00D4AA';

                    return (
                      <button
                        key={activity.id}
                        onClick={() => handleSelectActivity(activity)}
                        className={cn(
                          'w-full px-4 py-3 text-left transition-colors',
                          'hover:bg-signal-bgElevated',
                          isSelected && 'bg-signal-accent/10 border-l-2 border-signal-accent'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-sm font-medium truncate', isSelected ? 'text-signal-accent' : 'text-signal-fg')}>
                              {activity.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-signal-fgSubtle flex-wrap">
                              <Badge variant="muted" size="sm">{activity.category}</Badge>
                              {activity.date && (
                                <span>{formatDate(activity.date)}</span>
                              )}
                              {activity.tags && activity.tags.length > 0 && (
                                <span className="font-mono text-signal-fgMuted">
                                  #{activity.tags.slice(0, 3).join(' #')}
                                </span>
                              )}
                            </div>
                            {activity.description && (
                              <p className="text-xs text-signal-fgMuted mt-1 line-clamp-1">
                                {activity.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </Card>
        <p className="text-center text-xs text-signal-fgSubtle mt-3 font-mono">
          ↑↓ Navigate · ⏎ Select · ⎋ Close
        </p>
      </div>
    </div>
  );
}
