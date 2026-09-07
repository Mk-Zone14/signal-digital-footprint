import { useMemo, useState } from 'react';
import { cn } from '../utils/helpers';
import { formatDuration } from '../utils/helpers';
import { PeakHoursData } from '../types';

interface PeakHoursProps {
  data: PeakHoursData[];
  className?: string;
}

export function PeakHours({ data, className }: PeakHoursProps) {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  const maxCount = useMemo(() => Math.max(...data.map(d => d.activityCount), 1), [data]);
  const maxDuration = useMemo(() => Math.max(...data.map(d => d.totalDuration), 1), [data]);

  const peakHour = useMemo(() => {
    if (!data || data.length === 0) return { hour: 0, activityCount: 0, topCategory: 'none' };
    return data.reduce((max, d) => d.activityCount > max.activityCount ? d : max);
  }, [data]);
  
  const avgSession = useMemo(() => {
    if (!data || data.length === 0) return 0;
    return Math.round(data.reduce((sum, d) => sum + d.avgSessionLength, 0) / data.length);
  }, [data]);

  const barWidth = 28;
  const chartHeight = 200;
  const paddingTop = 30;

  const hoveredData = useMemo(() => {
    if (hoveredHour === null) return null;
    return data.find(d => d.hour === hoveredHour) || null;
  }, [hoveredHour, data]);

  return (
    <div className={cn('relative', className)}>
      <div className="overflow-x-auto no-scrollbar pb-2">
        <div className="flex items-end justify-between h-[230px] gap-1 px-2 min-w-[700px]" role="img" aria-label="Peak hours activity chart">
          {data.map((hour, idx) => {
            const isPeak = hour.hour === peakHour.hour;
            const isHovered = hoveredHour === hour.hour;
            const height = Math.max(4, (hour.activityCount / maxCount) * (chartHeight - paddingTop));
            const durationHeight = Math.max(2, (hour.totalDuration / maxDuration) * (chartHeight - paddingTop));

            return (
              <div
                key={hour.hour}
                className="relative flex flex-col items-center cursor-pointer group"
                onMouseEnter={() => setHoveredHour(hour.hour)}
                onMouseLeave={() => setHoveredHour(null)}
                style={{ width: barWidth }}
              >
                <div
                  className={cn(
                    'relative w-full rounded-t transition-all duration-200',
                    isPeak && 'bg-signal-accent',
                    !isPeak && 'bg-signal-borderHover',
                    isHovered && 'bg-signal-accent',
                  )}
                  style={{
                    height: `${height}px`,
                    minHeight: '4px',
                  }}
                >
                  {isPeak && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-signal-accent whitespace-nowrap bg-signal-bg px-1 rounded">
                      PEAK
                    </div>
                  )}
                </div>

                <div
                  className={cn(
                    'absolute bottom-0 w-full rounded-b transition-all duration-200 bg-signal-accent/20',
                    isHovered && 'bg-signal-accent/40',
                  )}
                  style={{ height: `${durationHeight}px` }}
                />

                <span
                  className={cn(
                    'mt-2 text-[10px] font-mono font-medium transition-colors',
                    (isPeak || isHovered) && 'text-signal-accent',
                    !isPeak && !isHovered && 'text-signal-fgSubtle'
                  )}
                >
                  {hour.hour === 0 ? '12a' : hour.hour < 12 ? `${hour.hour}a` : hour.hour === 12 ? '12p' : `${hour.hour - 12}p`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {hoveredData && (
        <div className="mt-4 p-4 bg-signal-bgElevated border border-signal-border rounded-lg animate-in">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-signal-fgSubtle uppercase tracking-wide">Hour</p>
              <p className="font-display text-xl font-bold text-signal-fg">
                {hoveredData.hour === 0 ? '12:00 AM' : hoveredData.hour < 12 ? `${hoveredData.hour}:00 AM` : hoveredData.hour === 12 ? '12:00 PM' : `${hoveredData.hour - 12}:00 PM`}
              </p>
            </div>
            <div>
              <p className="text-xs text-signal-fgSubtle uppercase tracking-wide">Sessions</p>
              <p className="font-display text-xl font-bold text-signal-fg">{hoveredData.activityCount}</p>
            </div>
            <div>
              <p className="text-xs text-signal-fgSubtle uppercase tracking-wide">Total Time</p>
              <p className="font-display text-xl font-bold text-signal-fg">{formatDuration(hoveredData.totalDuration)}</p>
            </div>
            <div>
              <p className="text-xs text-signal-fgSubtle uppercase tracking-wide">Avg Session</p>
              <p className="font-display text-xl font-bold text-signal-fg">{formatDuration(hoveredData.avgSessionLength)}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-signal-border flex items-center gap-3">
            <span className="text-xs text-signal-fgMuted">Top Category:</span>
            <span className="px-2 py-1 bg-signal-accentMuted text-signal-accent text-xs font-medium rounded-full">
              {hoveredData.topCategory}
            </span>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-signal-bgElevated border border-signal-border rounded-lg">
        <h4 className="text-sm font-semibold text-signal-fg mb-3">Peak Hours Insight</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-signal-fgSubtle uppercase tracking-wide">Strongest Window</p>
            <p className="font-display text-lg font-bold text-signal-fg mt-1">
              {peakHour.hour === 0 ? '12 AM' : peakHour.hour < 12 ? `${peakHour.hour} AM` : peakHour.hour === 12 ? '12 PM' : `${peakHour.hour - 12} PM`} – {(peakHour.hour + 3) % 24 === 0 ? '12 AM' : (peakHour.hour + 3) % 24 < 12 ? `${(peakHour.hour + 3) % 24} AM` : `${(peakHour.hour + 3) % 24 - 12} PM`}
            </p>
          </div>
          <div>
            <p className="text-xs text-signal-fgSubtle uppercase tracking-wide">Avg Session Length</p>
            <p className="font-display text-lg font-bold text-signal-fg mt-1">{formatDuration(avgSession)}</p>
          </div>
          <div>
            <p className="text-xs text-signal-fgSubtle uppercase tracking-wide">Most Active Category</p>
            <p className="font-display text-lg font-bold text-signal-fg mt-1 capitalize">{peakHour.topCategory.replace('-', '/')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}