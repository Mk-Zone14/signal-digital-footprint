import { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { cn } from '../utils/helpers';
import { categoryColors } from '../analytics';
import { Archetype, SignalScore, DigitalDNA, MomentumData, PeakHoursData } from '../types';
import { Badge } from './ui/Badge';
import { exportAsImage } from '../utils/helpers';

interface IdentityCardProps {
  archetype: Archetype;
  signalScore: SignalScore;
  digitalDNA: DigitalDNA;
  momentum: MomentumData;
  peakHours: PeakHoursData[];
  username: string;
  className?: string;
}

export interface IdentityCardHandle {
  exportCard: () => Promise<void>;
}

const dimensionLabels = {
  builder: 'Builder',
  explorer: 'Explorer',
  researcher: 'Researcher',
  creator: 'Creator',
  connector: 'Connector',
  learner: 'Learner',
} as const;

export const IdentityCard = forwardRef<IdentityCardHandle, IdentityCardProps>(({ archetype, signalScore, digitalDNA, momentum, peakHours, username, className }, ref) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const peakHour = peakHours.length > 0
    ? peakHours.reduce((max, h) => h.activityCount > max.activityCount ? h : max, peakHours[0])
    : { hour: 0, activityCount: 0, topCategory: 'none' };

  const topDimensions = Object.entries(digitalDNA)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  useImperativeHandle(ref, () => ({
    exportCard: async () => {
      if (!cardRef.current) return;
      setIsExporting(true);
      try {
        await exportAsImage(cardRef.current, `signal-identity-${username.toLowerCase()}.png`);
      } catch (err) {
        console.error('Export failed:', err);
      } finally {
        setIsExporting(false);
      }
    }
  }));

  return (
    <div
      ref={cardRef}
      className={cn(
        'relative max-w-md mx-auto p-6 bg-signal-bg border border-signal-border rounded-2xl shadow-[0_0_60px_-10px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.02)] overflow-hidden',
        className,
        isExporting && 'rounded-none border-0 shadow-none'
      )}
      style={{ background: 'linear-gradient(180deg, #0A0B0D 0%, #0D1015 100%)' }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(0,212,170,0.08)_0%,_transparent_60%)]" style={{ pointerEvents: 'none' }} />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(0,212,170,0.03)_0%,_transparent_50%)]" style={{ pointerEvents: 'none' }} />

      <div className="relative flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-signal-accent/20 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-signal-accent">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-signal-fgSubtle uppercase tracking-widest font-medium">SIGNAL</p>
            <p className="text-xs text-signal-fgMuted">Digital Intelligence</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-signal-fgSubtle uppercase tracking-wide">Generated</p>
          <p className="text-xs text-signal-fgMuted font-mono">SEP 2025</p>
        </div>
      </div>

      <div className="relative mb-6">
        <p className="text-xs text-signal-fgSubtle uppercase tracking-widest font-medium mb-1">ARCHETYPE</p>
        <div className="flex items-baseline gap-3">
          <p className="font-display text-2xl font-bold text-signal-fg">{archetype.name}</p>
          <Badge variant="accent" size="sm" className="font-mono">{archetype.confidence}%</Badge>
        </div>
        <p className="text-sm text-signal-fgMuted mt-2 line-clamp-2">{archetype.description}</p>
      </div>

      <div className="relative mb-6">
        <p className="text-xs text-signal-fgSubtle uppercase tracking-widest font-medium mb-3">SIGNAL SCORE</p>
        <div className="flex items-end gap-6">
          <div className="flex-1">
            <div className="relative h-24 flex items-end justify-center">
              <svg width="80" height="80" viewBox="0 0 80 80" className="transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke="#1E2128"
                  strokeWidth="6"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke="#00D4AA"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${(signalScore.overall / 100) * 213.6} 213.6`}
                  className="transition-all duration-1000"
                  style={{ filter: 'drop-shadow(0 0 8px #00D4AA)' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display text-3xl font-bold text-signal-fg tabular-nums">{signalScore.overall}</span>
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-signal-fgMuted">Activity</span>
              <span className="font-mono font-bold text-signal-fg">{signalScore.activity}%</span>
            </div>
            <div className="h-1.5 bg-signal-bg rounded-full overflow-hidden">
              <div className="h-full bg-signal-accent rounded-full transition-all duration-500" style={{ width: `${signalScore.activity}%` }} />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-signal-fgMuted">Consistency</span>
              <span className="font-mono font-bold text-signal-fg">{signalScore.consistency}%</span>
            </div>
            <div className="h-1.5 bg-signal-bg rounded-full overflow-hidden">
              <div className="h-full bg-signal-accent rounded-full transition-all duration-500" style={{ width: `${signalScore.consistency}%` }} />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-signal-fgMuted">Exploration</span>
              <span className="font-mono font-bold text-signal-fg">{signalScore.exploration}%</span>
            </div>
            <div className="h-1.5 bg-signal-bg rounded-full overflow-hidden">
              <div className="h-full bg-signal-accent rounded-full transition-all duration-500" style={{ width: `${signalScore.exploration}%` }} />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-signal-fgMuted">Momentum</span>
              <span className={cn('font-mono font-bold', momentum.current >= 0 ? 'text-signal-accent' : 'text-signal-danger')}>
                {momentum.current >= 0 ? '+' : ''}{momentum.current}%
              </span>
            </div>
            <div className="h-1.5 bg-signal-bg rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500', momentum.current >= 0 ? 'bg-signal-accent' : 'bg-signal-danger')}
                style={{ width: `${Math.min(100, Math.max(0, momentum.current + 50))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="relative mb-6">
        <p className="text-xs text-signal-fgSubtle uppercase tracking-widest font-medium mb-3">TOP SIGNALS</p>
        <div className="flex flex-wrap gap-2">
          {topDimensions.map(([key, value]) => (
            <Badge
              key={key}
              variant="accent"
              size="sm"
              dot
              dotColor={categoryColors[key as keyof typeof categoryColors] || '#00D4AA'}
            >
              {dimensionLabels[key as keyof typeof dimensionLabels]} <span className="font-mono">{value}%</span>
            </Badge>
          ))}
        </div>
      </div>

      <div className="relative mb-6">
        <p className="text-xs text-signal-fgSubtle uppercase tracking-widest font-medium mb-3">PEAK HOURS</p>
        <div className="flex items-center gap-3 p-3 bg-signal-bgElevated/50 border border-signal-border/50 rounded-lg">
          <div className="w-10 h-10 rounded-lg bg-signal-accent/20 flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-signal-accent">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <div>
            <p className="font-display text-lg font-bold text-signal-fg">
              {peakHour.hour === 0 ? '12 AM' : peakHour.hour < 12 ? `${peakHour.hour} AM` : peakHour.hour === 12 ? '12 PM' : `${peakHour.hour - 12} PM`} – {(peakHour.hour + 3) % 24 === 0 ? '12 AM' : (peakHour.hour + 3) % 24 < 12 ? `${(peakHour.hour + 3) % 24} AM` : `${(peakHour.hour + 3) % 24 - 12} PM`}
            </p>
            <p className="text-xs text-signal-fgMuted">{peakHour.activityCount} sessions • {peakHour.topCategory}</p>
          </div>
        </div>
      </div>

      <div className="relative mb-6">
        <p className="text-xs text-signal-fgSubtle uppercase tracking-widest font-medium mb-3">MOMENTUM</p>
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold text-signal-accent">
              {momentum.current >= 0 ? '+' : ''}{momentum.current}%
            </span>
            <span className="text-xs text-signal-fgMuted">vs last month</span>
          </div>
          <Badge variant={momentum.current >= 0 ? 'success' : 'danger'} size="sm">
            {momentum.current >= 0 ? 'Accelerating' : 'Decelerating'}
          </Badge>
        </div>
        <p className="text-xs text-signal-fgMuted mt-2">
          Strongest growth: <span className="text-signal-fg font-medium">{momentum.strongestGrowthArea.category}</span> ({momentum.strongestGrowthArea.growth >= 0 ? '+' : ''}{momentum.strongestGrowthArea.growth}%)
        </p>
      </div>

      <div className="relative pt-4 border-t border-signal-border/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-xl font-bold text-signal-fg">{username}</p>
            <p className="text-xs text-signal-fgMuted">Digital Identity Card</p>
          </div>
        </div>
      </div>
    </div>
  );
});

IdentityCard.displayName = 'IdentityCard';