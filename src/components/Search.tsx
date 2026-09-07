import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '../utils/helpers';
import { SearchResult } from '../types';
import { formatDate, getRelativeTime } from '../utils/helpers';
import { categoryColors } from '../analytics';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { Keyboard, X, Search as SearchIcon, ChevronDown, ExternalLink } from 'lucide-react';

interface SearchProps {
  isOpen: boolean;
  onClose: () => void;
  onResultClick: (result: SearchResult) => void;
  results: {
    activities: Array<{ id: string; title: string; category: string; date: string }>;
    skills: Array<{ id: string; name: string; category: string; level: number }>;
    timeline: Array<{ id: string; title: string; category: string; date: string; description: string }>;
    interests: Array<{ id: string; name: string; category: string; strength: number }>;
  };
  query: string;
  onQueryChange: (query: string) => void;
}

function renderDescription(item: any): React.ReactNode {
  const desc = 'description' in item ? item.description : undefined;
  return desc ? <p className="text-xs text-signal-fgMuted mt-1 line-clamp-1">{desc}</p> : null;
}

export function Search({ isOpen, onClose, onResultClick, results, query, onQueryChange }: SearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeSection, setActiveSection] = useState(0);

  const allResults = useCallback(() => {
    const sections = [
      { key: 'activities', label: 'Activities', items: results.activities },
      { key: 'skills', label: 'Skills', items: results.skills },
      { key: 'timeline', label: 'Timeline', items: results.timeline },
      { key: 'interests', label: 'Interests', items: results.interests },
    ].filter(s => s.items.length > 0);

    return sections;
  }, [results]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setSelectedIndex(0);
      setActiveSection(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      const sections = allResults();
      const currentSection = sections[activeSection];
      if (!currentSection) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, currentSection.items.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (selectedIndex === 0) {
            setActiveSection(prev => Math.max(prev - 1, 0));
          } else {
            setSelectedIndex(prev => prev - 1);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          setActiveSection(prev => Math.min(prev + 1, sections.length - 1));
          setSelectedIndex(0);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setActiveSection(prev => Math.max(prev - 1, 0));
          setSelectedIndex(0);
          break;
        case 'Enter':
          e.preventDefault();
          if (currentSection.items[selectedIndex]) {
            const item = currentSection.items[selectedIndex];
            onResultClick({
              type: currentSection.key as SearchResult['type'],
              id: item.id,
              title: 'title' in item ? item.title : item.name,
              subtitle: 'category' in item ? item.category : '',
              category: 'category' in item ? item.category as any : undefined,
              date: 'date' in item ? item.date : undefined,
            });
            onClose();
          }
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeSection, selectedIndex, allResults, onResultClick, onClose]);

  if (!isOpen) return null;

  const sections = allResults();

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 animate-in">
      <div className="absolute inset-0 bg-signal-bg/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl animate-in">
        <Card variant="elevated" className="overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-signal-border">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-signal-fgSubtle" />
              <Input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => onQueryChange(e.target.value)}
                placeholder="Search activities, skills, timeline, interests..."
                className="pl-10 py-2.5 text-base bg-signal-bg border-signal-borderHover"
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
                <p className="text-signal-fgMuted mb-1">Type to search your digital footprint</p>
                <p className="text-xs text-signal-fgSubtle">Try: "AI", "Rust", "hackathon", "film"</p>
              </div>
            ) : sections.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-signal-fgMuted">No results for "{query}"</p>
              </div>
            ) : (
              sections.map((section, sectionIdx) => (
                <div key={section.key} className="border-t border-signal-border/50">
                  <div className="px-4 py-2 bg-signal-bg/50 flex items-center gap-2 border-b border-signal-border/50">
                    <span className="text-xs font-medium text-signal-fgMuted uppercase tracking-wide">{section.label}</span>
                    <span className="px-2 py-0.5 bg-signal-bg border border-signal-border rounded text-xs font-mono text-signal-fgSubtle">{section.items.length}</span>
                  </div>
                  <div className="divide-y divide-signal-border/50">
                    {section.items.map((item, itemIdx) => {
                      const isSelected = activeSection === sectionIdx && selectedIndex === itemIdx;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onResultClick({
                              type: section.key as SearchResult['type'],
                              id: item.id,
                              title: 'title' in item ? item.title : item.name,
                              subtitle: 'category' in item ? item.category : '',
                              category: 'category' in item ? item.category as any : undefined,
                              date: 'date' in item ? item.date : undefined,
                            });
                            onClose();
                          }}
                          className={cn(
                            'w-full px-4 py-3 text-left transition-colors',
                            'hover:bg-signal-bgElevated',
                            isSelected && 'bg-signal-accent/5'
                          )}
                          style={{ backgroundColor: isSelected ? 'rgba(0, 212, 170, 0.05)' : 'transparent' }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: categoryColors[item.category as keyof typeof categoryColors] || '#00D4AA' }} />
                            <div className="flex-1 min-w-0">
                              <p className={cn('font-medium truncate', isSelected ? 'text-signal-accent' : 'text-signal-fg')}>
                                {'title' in item ? item.title : item.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-signal-fgSubtle">
                                <Badge variant="muted" size="sm">{item.category}</Badge>
                                {'date' in item && item.date && (
                                  <span>{formatDate(item.date)} · {getRelativeTime(item.date)}</span>
                                )}
                                {'level' in item && (
                                  <span className="font-mono text-signal-accent">Lv.{item.level}</span>
                                )}
                                {'strength' in item && (
                                  <span className="font-mono text-signal-fg">{item.strength}%</span>
                                )}
                              </div>
                              {renderDescription(item)}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
        <p className="text-center text-xs text-signal-fgSubtle mt-3">
          ↑↓ Navigate · ←→ Sections · ⏎ Select · ⎋ Close
        </p>
      </div>
    </div>
  );
}