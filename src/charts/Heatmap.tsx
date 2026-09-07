import { useMemo } from 'react';
import { cn } from '../utils/helpers';
import { categoryColors } from '../analytics';

interface HeatmapProps {
  data: Map<string, { count: number; duration: number; categories: string[] }>;
  selectedCategory?: string;
  onDayClick?: (date: string, data: { count: number; duration: number; categories: string[] }) => void;
  className?: string;
}

const WEEKS_TO_SHOW = 26;
const CELL_SIZE = 13;
const CELL_GAP = 2;
const MONTH_LABEL_WIDTH = 36;

export function Heatmap({ data, selectedCategory, onDayClick, className }: HeatmapProps) {
  const { cells, weeks, monthPositions, maxCount, dateRange } = useMemo(() => {
    const endDate = new Date('2025-09-07');
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - WEEKS_TO_SHOW * 7);

    const cells: Array<{
      date: string;
      day: number;
      week: number;
      count: number;
      duration: number;
      categories: string[];
      intensity: number;
    }> = [];

    let maxCount = 0;

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayData = data.get(dateStr);
      const count = dayData?.count || 0;
      const duration = dayData?.duration || 0;
      const categories = dayData?.categories || [];

      if (count > maxCount) maxCount = count;

      const dayOfWeek = d.getDay();
      const weekOffset = Math.floor((d.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));

      cells.push({
        date: dateStr,
        day: dayOfWeek,
        week: weekOffset,
        count,
        duration,
        categories,
        intensity: count > 0 ? Math.min(1, count / Math.max(1, maxCount * 0.7)) : 0,
      });
    }

    const weeks = Array.from({ length: WEEKS_TO_SHOW }, (_, i) => i);

    const monthPositions: Array<{ week: number; label: string }> = [];
    let lastMonth = -1;
    cells.forEach(cell => {
      const date = new Date(cell.date);
      const month = date.getMonth();
      if (month !== lastMonth) {
        lastMonth = month;
        monthPositions.push({ week: cell.week, label: date.toLocaleDateString('en-US', { month: 'short' }) });
      }
    });

    return { cells, weeks, monthPositions, maxCount, dateRange: { start: startDate, end: endDate } };
  }, [data, selectedCategory]);

  const getCellColor = (intensity: number, categories: string[]) => {
    if (intensity === 0) return 'rgba(255,255,255,0.03)';

    if (selectedCategory) {
      const hasCategory = categories.includes(selectedCategory);
      if (!hasCategory) return 'rgba(255,255,255,0.03)';
      return categoryColors[selectedCategory as keyof typeof categoryColors] || '#00D4AA';
    }

    if (categories.length === 1) {
      return categoryColors[categories[0] as keyof typeof categoryColors] || '#00D4AA';
    }

    return '#00D4AA';
  };

  const getOpacity = (intensity: number) => {
    if (intensity === 0) return 0.15;
    return 0.3 + intensity * 0.7;
  };

  return (
    <div className={cn('overflow-x-auto', className)}>
      <svg
        width={WEEKS_TO_SHOW * (CELL_SIZE + CELL_GAP) + MONTH_LABEL_WIDTH + 20}
        height={7 * (CELL_SIZE + CELL_GAP) + 40}
        className="block"
        style={{ maxWidth: '100%' }}
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMerge in="coloredBlur" />
              <feMerge in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {monthPositions.map((month, idx) => (
          <text
            key={month.label}
            x={month.week * (CELL_SIZE + CELL_GAP) + MONTH_LABEL_WIDTH + 4}
            y={-4}
            className="text-signal-fgSubtle text-[10px] font-medium"
            textAnchor="start"
          >
            {month.label}
          </text>
        ))}

        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, dayIdx) => (
          <text
            key={day}
            x={MONTH_LABEL_WIDTH - 8}
            y={dayIdx * (CELL_SIZE + CELL_GAP) + CELL_SIZE - 2 + 20}
            className="text-signal-fgSubtle text-[10px] font-medium"
            textAnchor="end"
            dominantBaseline="middle"
          >
            {dayIdx === 0 || dayIdx === 6 ? day : dayIdx === 1 || dayIdx === 3 || dayIdx === 5 ? day : ''}
          </text>
        ))}

        {cells.map(cell => {
          const color = getCellColor(cell.intensity, cell.categories);
          const opacity = getOpacity(cell.intensity);
          const x = cell.week * (CELL_SIZE + CELL_GAP) + MONTH_LABEL_WIDTH;
          const y = cell.day * (CELL_SIZE + CELL_GAP) + 20;

          const isSelected = selectedCategory && cell.categories.includes(selectedCategory);

          return (
            <rect
              key={cell.date}
              x={x}
              y={y}
              width={CELL_SIZE}
              height={CELL_SIZE}
              rx={2}
              fill={color}
              fillOpacity={opacity}
              filter={cell.intensity > 0.7 && isSelected ? 'url(#glow)' : 'none'}
              className="transition-all duration-150 cursor-pointer"
              onMouseEnter={() => {}}
              onClick={() => onDayClick?.(cell.date, { count: cell.count, duration: cell.duration, categories: cell.categories })}
              style={{
                transformOrigin: `${x + CELL_SIZE / 2}px ${y + CELL_SIZE / 2}px`,
              }}
              onMouseOver={(e) => {
                const rect = e.currentTarget;
                rect.style.transform = 'scale(1.3)';
                rect.style.zIndex = '10';
              }}
              onMouseOut={(e) => {
                const rect = e.currentTarget;
                rect.style.transform = 'scale(1)';
                rect.style.zIndex = 'auto';
              }}
            />
          );
        })}
      </svg>

      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-signal-border">
        <div className="flex items-center gap-2">
          <span className="text-xs text-signal-fgSubtle">Less</span>
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3, 4].map(level => (
              <div
                key={level}
                className="w-3 h-3 rounded"
                style={{
                  backgroundColor: '#00D4AA',
                  opacity: level === 0 ? 0.15 : 0.3 + (level / 4) * 0.7,
                }}
              />
            ))}
          </div>
          <span className="text-xs text-signal-fgSubtle">More</span>
        </div>
        <div className="flex items-center gap-2 ml-auto text-xs text-signal-fgMuted">
          <span>{dateRange.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {dateRange.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>
    </div>
  );
}