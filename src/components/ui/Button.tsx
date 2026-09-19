import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/helpers';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', disabled, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-[8px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-accent focus-visible:ring-offset-2 focus-visible:ring-offset-signal-bg disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-signal-accent text-signal-bg hover:bg-signal-accentHover',
      secondary: 'bg-signal-bgElevated text-signal-fg border border-signal-border hover:border-signal-borderHover hover:bg-signal-bg hover:shadow-elevated',
      ghost: 'text-signal-fgMuted hover:text-signal-fg hover:bg-signal-bgElevated',
      danger: 'bg-signal-danger/10 text-signal-danger border border-signal-danger/20 hover:bg-signal-danger/20 hover:border-signal-danger/40',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-2',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
