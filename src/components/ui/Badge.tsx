import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/helpers';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'accent' | 'muted' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  dot?: boolean;
  dotColor?: string;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', dot, dotColor, children, ...props }, ref) => {
    const variants = {
      default: 'bg-signal-bg border-signal-border text-signal-fgMuted',
      accent: 'bg-signal-accentMuted border-signal-accent/30 text-signal-accent',
      muted: 'bg-signal-bg border-signal-border text-signal-fgSubtle',
      success: 'bg-signal-accentMuted border-signal-accent/30 text-signal-accent',
      warning: 'bg-signal-warning/10 border-signal-warning/30 text-signal-warning',
      danger: 'bg-signal-danger/10 border-signal-danger/30 text-signal-danger',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs gap-1',
      md: 'px-2.5 py-1 text-xs gap-1.5',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-medium border rounded-full',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {dot && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dotColor || 'currentColor' }} />}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';