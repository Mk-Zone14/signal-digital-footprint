import { ReactNode, useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/helpers';

interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export function Tooltip({ children, content, position = 'top', delay = 150 }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipRect, setTooltipRect] = useState<DOMRect | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const childRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  const updatePosition = () => {
    if (childRef.current && tooltipRef.current) {
      const rect = childRef.current.getBoundingClientRect();
      setTooltipRect(rect);
    }
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, { passive: true });
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isVisible]);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrows = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-signal-bgElevated',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-signal-bgElevated',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-signal-bgElevated',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-signal-bgElevated',
  };

  return (
    <div
      ref={childRef}
      className="inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && tooltipRect && (
        <div
          ref={tooltipRef}
          className={cn(
            'fixed z-50 px-3 py-2 bg-signal-bgElevated border border-signal-border rounded-lg shadow-elevated text-sm text-signal-fg pointer-events-none animate-in',
            positions[position]
          )}
          style={{
            top: position === 'top' ? tooltipRect.top : position === 'bottom' ? tooltipRect.bottom : tooltipRect.top + tooltipRect.height / 2,
            left: position === 'left' ? tooltipRect.left : position === 'right' ? tooltipRect.right : tooltipRect.left + tooltipRect.width / 2,
          }}
        >
          {content}
          <div
            className={cn(
              'absolute w-0 h-0 border-4 border-transparent',
              arrows[position]
            )}
          />
        </div>
      )}
    </div>
  );
}