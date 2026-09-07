import { useEffect, useState } from 'react';
import { cn } from '../utils/helpers';

interface MetricCardProps {
  label: string;
  value: number | string;
  suffix?: string;
  prefix?: string;
  trend?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
  className?: string;
  animate?: boolean;
  delay?: number;
}

export function MetricCard({ label, value, suffix = '', prefix = '', trend, trendLabel, icon, className, animate = true, delay = 0 }: MetricCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0;

  useEffect(() => {
    if (!animate) {
      setDisplayValue(numericValue);
      return;
    }

    const timer = setTimeout(() => {
      const duration = 1500;
      const startTime = Date.now();
      const startValue = 0;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = startValue + (numericValue - startValue) * eased;
        setDisplayValue(current);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }, delay);

    return () => clearTimeout(timer);
  }, [numericValue, animate, delay]);

  const formattedValue = typeof value === 'string' && !/^\d/.test(value)
    ? value
    : `${prefix}${displayValue.toLocaleString(undefined, { maximumFractionDigits: numericValue === Math.floor(numericValue) ? 0 : 1 })}${suffix}`;

  return (
    <div className={cn('card p-5', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="metric-label">{label}</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="metric-value tabular-nums" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}>
              {formattedValue}
            </span>
            {trend !== undefined && (
              <span className={cn(
                'text-xs font-medium px-2 py-0.5 rounded-full',
                trend >= 0 ? 'bg-signal-accent/10 text-signal-accent' : 'bg-signal-danger/10 text-signal-danger'
              )}>
                {trend >= 0 ? '+' : ''}{trend}% {trendLabel || 'vs last period'}
              </span>
            )}
          </div>
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-lg bg-signal-accent/10 flex items-center justify-center text-signal-accent flex-shrink-0">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}