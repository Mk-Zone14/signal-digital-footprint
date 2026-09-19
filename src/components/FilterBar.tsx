import { useState, useRef, useEffect } from 'react';
import { cn } from '../utils/helpers';
import { DateRange, Category } from '../types';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { X, Calendar, Filter, ChevronDown, Check } from 'lucide-react';

interface FilterBarProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  selectedCategories: Category[];
  onCategoryToggle: (category: Category) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
  className?: string;
  compact?: boolean;
}

const dateRanges: { value: DateRange; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '3m', label: '3 months' },
  { value: '6m', label: '6 months' },
  { value: 'all', label: 'All time' },
];

const categories: { value: Category; label: string; color: string }[] = [
  { value: 'coding', label: 'Coding', color: '#00D4AA' },
  { value: 'ai-ml', label: 'AI/ML', color: '#6366F1' },
  { value: 'finance', label: 'Finance', color: '#F5A623' },
  { value: 'filmmaking', label: 'Filmmaking', color: '#EC4899' },
  { value: 'reading', label: 'Reading', color: '#3B82F6' },
  { value: 'learning', label: 'Learning', color: '#10B981' },
  { value: 'social', label: 'Social', color: '#F97316' },
  { value: 'projects', label: 'Projects', color: '#8B5CF6' },
];

export function FilterBar({ dateRange, onDateRangeChange, selectedCategories, onCategoryToggle, onClearAll, hasActiveFilters, className, compact }: FilterBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  if (compact) {
    return (
      <div className={cn('flex items-center justify-between gap-3 w-full', className)}>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-signal-fgMuted flex-shrink-0" />
          <select
            value={dateRange}
            onChange={e => onDateRangeChange(e.target.value as DateRange)}
            className="px-2 py-1 bg-signal-bgElevated border border-signal-border rounded-lg text-sm text-signal-fg focus:border-signal-accent focus:ring-2 focus:ring-signal-accent/20 focus:outline-none appearance-none pr-6"
            style={{ backgroundImage: 'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA3TDExIDEiIHN0cm9rZT0iIzhCN0Y5QSIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4=")', backgroundPosition: 'right 6px center', backgroundRepeat: 'no-repeat' }}
          >
            {dateRanges.map(range => (
              <option key={range.value} value={range.value}>{range.label}</option>
            ))}
          </select>
        </div>

        <div className="relative" ref={dropdownRef}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={cn("flex items-center gap-2", selectedCategories.length > 0 && "text-signal-accent")}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">Categories</span>
            {selectedCategories.length > 0 && (
              <Badge variant="accent" size="sm" className="ml-1 px-1.5 py-0 min-w-5 justify-center rounded-full text-xs">
                {selectedCategories.length}
              </Badge>
            )}
            <ChevronDown className="w-4 h-4 text-signal-fgMuted" />
          </Button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 max-h-80 overflow-y-auto bg-signal-bgElevated border border-signal-border rounded-xl shadow-elevated py-2 z-50">
              {categories.map(cat => {
                const isSelected = selectedCategories.includes(cat.value);
                return (
                  <button
                    key={cat.value}
                    onClick={() => onCategoryToggle(cat.value)}
                    className="w-full px-4 py-2 text-left text-sm flex items-center justify-between hover:bg-signal-bg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className={isSelected ? "text-signal-fg font-medium" : "text-signal-fgMuted"}>{cat.label}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-signal-accent" />}
                  </button>
                );
              })}
              {selectedCategories.length > 0 && (
                <>
                  <hr className="my-2 border-signal-border" />
                  <button
                    onClick={() => {
                      onClearAll();
                      setDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-signal-danger hover:bg-signal-bg transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Clear categories
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearAll} className="px-2 hidden sm:flex">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-signal-fgMuted" />
        <select
          value={dateRange}
          onChange={e => onDateRangeChange(e.target.value as DateRange)}
          className="px-3 py-1.5 bg-signal-bgElevated border border-signal-border rounded-lg text-sm text-signal-fg focus:border-signal-accent focus:ring-2 focus:ring-signal-accent/20 focus:outline-none appearance-none pr-8"
          style={{ backgroundImage: 'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA3TDExIDEiIHN0cm9rZT0iIzhCN0Y5QSIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4=")', backgroundPosition: 'right 8px center', backgroundRepeat: 'no-repeat' }}
        >
          {dateRanges.map(range => (
            <option key={range.value} value={range.value}>{range.label}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {categories.map(cat => {
          const isSelected = selectedCategories.includes(cat.value);
          return (
            <button
              key={cat.value}
              onClick={() => onCategoryToggle(cat.value)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 border',
                isSelected
                  ? 'bg-signal-accent/10 text-signal-fg'
                  : 'bg-signal-bgElevated border-signal-border text-signal-fgMuted hover:border-signal-borderHover hover:text-signal-fg'
              )}
              style={{ borderColor: isSelected ? cat.color : undefined, color: isSelected ? cat.color : undefined }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClearAll} className="ml-auto">
          <X className="w-4 h-4 mr-1" />
          Clear all
        </Button>
      )}
    </div>
  );
}
