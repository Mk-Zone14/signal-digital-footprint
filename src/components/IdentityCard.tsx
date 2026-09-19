import { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { cn } from '../utils/helpers';
import { categoryColors } from '../analytics';
import { V2Analytics } from '../types';
import { Badge } from './ui/Badge';
import { exportAsImage } from '../utils/helpers';
import { Calendar, Clock, Activity as ActivityIcon } from 'lucide-react';

interface IdentityCardProps {
  v2Analytics: V2Analytics;
  username?: string;
  className?: string;
}

export interface IdentityCardHandle {
  exportCard: () => Promise<void>;
}

export const IdentityCard = forwardRef<IdentityCardHandle, IdentityCardProps>(
  ({ v2Analytics, username = 'Signal User', className }, ref) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);

    const {
      totalActivities,
      activeDays,
      dateRange,
      categoryDistribution,
      topTopics,
      peakHours,
      observedTimestampCount,
      consistencyStats,
      referenceDate,
    } = v2Analytics;

    // A peak hour is meaningful only when at least one valid timestamp was observed.
    const peakHour = observedTimestampCount > 0 && peakHours.length > 0
      ? peakHours.reduce((max, hour) => (hour.count > max.count ? hour : max), peakHours[0])
      : null;

    const topCategories = categoryDistribution
      .filter(c => c.count > 0)
      .slice(0, 4);

    const top5Topics = topTopics.slice(0, 5);

    useImperativeHandle(ref, () => ({
      exportCard: async () => {
        if (!cardRef.current) return;
        setIsExporting(true);
        try {
          await exportAsImage(
            cardRef.current,
            `signal-activity-record-${username.toLowerCase().replace(/\s+/g, '-')}.png`
          );
        } catch (err) {
          console.error('Export failed:', err);
        } finally {
          setIsExporting(false);
        }
      },
    }));

    return (
      <div
        ref={cardRef}
        className={cn(
          'relative max-w-md mx-auto p-6 bg-signal-bg border border-signal-border rounded-[12px] shadow-elevated overflow-hidden',
          className,
          isExporting && 'rounded-none border-0 shadow-none'
        )}
        style={{ background: 'linear-gradient(180deg, #0c100e 0%, #070a08 100%)' }}
      >
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(184,255,61,0.06)_0%,_transparent_55%)]"
          style={{ pointerEvents: 'none' }}
        />

        {/* Card Header */}
        <div className="relative flex items-center justify-between mb-6 pb-4 border-b border-signal-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-signal-accent/20 flex items-center justify-center">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-signal-accent"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-signal-fgSubtle uppercase tracking-widest font-mono font-semibold">
                SIGNAL
              </p>
              <p className="text-xs text-signal-fg font-medium">Activity Intelligence Record</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-signal-fgSubtle uppercase tracking-wide font-mono">Date Range</p>
            <p className="text-xs text-signal-fgMuted font-mono">
              {dateRange.startStr && dateRange.endStr
                ? `${dateRange.startStr.slice(0, 7)} – ${dateRange.endStr.slice(0, 7)}`
                : 'All Time'}
            </p>
            {referenceDate && (
              <p className="text-[10px] text-signal-fgSubtle font-mono mt-0.5">
                As of {referenceDate}
              </p>
            )}
          </div>
        </div>

        {/* Factual Primary Observations */}
        <div className="relative mb-6">
          <p className="text-[10px] text-signal-fgSubtle uppercase tracking-widest font-mono font-semibold mb-2">
            RECORD SUMMARY
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-signal-bgElevated border border-signal-border rounded-xl">
              <p className="text-xs text-signal-fgMuted flex items-center gap-1.5">
                <ActivityIcon className="w-3.5 h-3.5 text-signal-accent" /> Total Activities
              </p>
              <p className="text-2xl font-bold font-mono text-signal-fg mt-1">
                {totalActivities}
              </p>
            </div>
            <div className="p-3 bg-signal-bgElevated border border-signal-border rounded-xl">
              <p className="text-xs text-signal-fgMuted flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-signal-accent" /> Active Days
              </p>
              <p className="text-2xl font-bold font-mono text-signal-fg mt-1">
                {activeDays}
                <span className="text-xs font-normal text-signal-fgMuted ml-1">
                  / {dateRange.totalDays}d
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="relative mb-6">
          <p className="text-[10px] text-signal-fgSubtle uppercase tracking-widest font-mono font-semibold mb-2.5">
            CATEGORY DISTRIBUTION
          </p>
          <div className="space-y-2">
            {topCategories.map(cat => {
              const color = categoryColors[cat.category] || '#b8ff3d';
              return (
                <div key={cat.category} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-signal-fg capitalize font-medium">
                      {cat.category.replace('-', ' ')}
                    </span>
                    <span className="font-mono text-signal-fgMuted">
                      {cat.count} acts ({cat.percentage}%)
                    </span>
                  </div>
                  <div className="h-1.5 bg-signal-bg rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Topics */}
        {top5Topics.length > 0 && (
          <div className="relative mb-6">
            <p className="text-[10px] text-signal-fgSubtle uppercase tracking-widest font-mono font-semibold mb-2">
              FREQUENT TOPICS
            </p>
            <div className="flex flex-wrap gap-1.5">
              {top5Topics.map(t => (
                <span
                  key={t.topic}
                  className="px-2 py-1 rounded bg-signal-bgElevated border border-signal-border text-xs font-mono text-signal-fg"
                >
                  #{t.topic} <span className="text-signal-fgSubtle ml-0.5">({t.count})</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Temporal Pattern / Streak Highlights */}
        <div className="relative mb-6 grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-signal-bgElevated/50 border border-signal-border rounded-lg">
            <p className="text-[10px] text-signal-fgSubtle font-mono uppercase flex items-center gap-1">
              <Clock className="w-3 h-3 text-signal-accent" /> {peakHour ? 'Peak Hour (UTC)' : 'Hourly Data'}
            </p>
            <p className="text-sm font-bold font-mono text-signal-fg mt-1">
              {peakHour
                ? peakHour.hour === 0
                  ? '12 AM'
                  : peakHour.hour < 12
                  ? `${peakHour.hour} AM`
                  : peakHour.hour === 12
                  ? '12 PM'
                  : `${peakHour.hour - 12} PM`
                : 'Unavailable'}
            </p>
            <p className="text-[10px] text-signal-fgMuted">
              {peakHour ? `${peakHour.count} observed sessions` : 'No observed timestamps'}
            </p>
          </div>

          <div className="p-3 bg-signal-bgElevated/50 border border-signal-border rounded-lg">
            <p className="text-[10px] text-signal-fgSubtle font-mono uppercase">Longest Streak</p>
            <p className="text-sm font-bold font-mono text-signal-fg mt-1">
              {consistencyStats.longestActiveDayStreak} days
            </p>
            <p className="text-[10px] text-signal-fgMuted">
              Current: {consistencyStats.currentActiveDayStreak}d
            </p>
          </div>
        </div>

        {/* Card Footer */}
        <div className="relative pt-4 border-t border-signal-border/50 flex items-center justify-between">
          <div>
            <p className="font-display text-sm font-bold text-signal-fg">{username}</p>
            <p className="text-[10px] text-signal-fgMuted">Personal activity record</p>
          </div>
          <Badge variant="accent" size="sm" className="font-mono text-[10px]">
            FROM ACTIVITY HISTORY
          </Badge>
        </div>
      </div>
    );
  }
);

IdentityCard.displayName = 'IdentityCard';
