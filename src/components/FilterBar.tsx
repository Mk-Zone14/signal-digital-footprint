import { cn } from '../utils/helpers';
import { DateRange, Category } from '../types';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { X, Calendar, Filter } from 'lucide-react';

interface FilterBarProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  selectedCategories: Category[];
  onCategoryToggle: (category: Category) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
  className?: string;
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

export function FilterBar({ dateRange, onDateRangeChange, selectedCategories, onCategoryToggle, onClearAll, hasActiveFilters, className }: FilterBarProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-signal-fgMuted" />
        <select
          value={dateRange}
          onChange={e => onDateRangeChange(e.target.value as DateRange)}
          className="px-3 py-1.5 bg-signal-bgElevated border border-signal-border rounded-lg text-sm text-signal-fg focus:border-signal-accent focus:ring-2 focus:ring-signal-accent/20 focus:outline-none appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA3TDExIDEiIHN0cm9rZT0iIzhCN0Y5QSIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4=')] bg-right-[8px] bg-no-repeat pr-8"
        >
          {dateRanges.map(range => (
            <option key={range.value} value={range.value}>{range.label}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat.value}
            onClick={() => onCategoryToggle(cat.value)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
              selectedCategories.includes(cat.value)
                ? `bg-[${cat.color}]20 border border-[${cat.color}]40 text-[${cat.color}]`
                : 'bg-signal-bgElevated border border-signal-border text-signal-fgMuted hover:border-signal-borderHover hover:text-signal-fg'
            )}
            style={{ borderColor: selectedCategories.includes(cat.value) ? cat.color : undefined }}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
            {cat.label}
          </button>
        ))}
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