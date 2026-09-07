import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, LabelHTMLAttributes } from 'react';
import { cn } from '../../utils/helpers';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full px-4 py-2.5 bg-signal-bgElevated border rounded-lg text-signal-fg placeholder-signal-fgSubtle transition-all duration-150',
          'focus:border-signal-accent focus:ring-2 focus:ring-signal-accent/20 focus:outline-none',
          error && 'border-signal-danger focus:border-signal-danger focus:ring-signal-danger/20',
          !error && 'border-signal-border hover:border-signal-borderHover',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'w-full px-4 py-2.5 bg-signal-bgElevated border rounded-lg text-signal-fg placeholder-signal-fgSubtle transition-all duration-150 resize-y min-h-[100px]',
          'focus:border-signal-accent focus:ring-2 focus:ring-signal-accent/20 focus:outline-none',
          error && 'border-signal-danger focus:border-signal-danger focus:ring-signal-danger/20',
          !error && 'border-signal-border hover:border-signal-borderHover',
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn('block text-sm font-medium text-signal-fgMuted mb-1.5', className)}
        {...props}
      >
        {children}
      </label>
    );
  }
);

Label.displayName = 'Label';