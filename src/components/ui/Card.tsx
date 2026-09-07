import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/helpers';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'flat' | 'interactive';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-signal-bgElevated border border-signal-border rounded-xl p-6 transition-all duration-200 hover:border-signal-borderHover hover:shadow-elevated-hover',
      elevated: 'bg-signal-bgElevated border border-signal-border rounded-xl shadow-elevated p-6',
      flat: 'bg-signal-bgElevated border border-signal-border rounded-xl p-6',
      interactive: 'bg-signal-bgElevated border border-signal-border rounded-xl p-6 transition-all duration-200 hover:border-signal-accent/50 hover:shadow-[0_0_24px_-4px_rgba(0,212,170,0.3)] cursor-pointer',
    };

    return (
      <div
        ref={ref}
        className={cn(variants[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('mb-4', className)} {...props}>{children}</div>
  )
);

CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-lg font-semibold text-signal-fg', className)} {...props}>{children}</h3>
  )
);

CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-signal-fgMuted mt-1', className)} {...props}>{children}</p>
  )
);

CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn(className)} {...props}>{children}</div>
  )
);

CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('mt-4 pt-4 border-t border-signal-border flex items-center gap-2', className)} {...props}>{children}</div>
  )
);

CardFooter.displayName = 'CardFooter';