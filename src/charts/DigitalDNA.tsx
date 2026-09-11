import { useMemo } from 'react';
import { cn } from '../utils/helpers';
import { categoryColors } from '../analytics';
import type { DigitalDNA } from '../types';

interface DigitalDNAProps {
  data: DigitalDNA;
  className?: string;
}

const dimensions = [
  { key: 'builder', label: 'Builder', color: '#00D4AA' },
  { key: 'explorer', label: 'Explorer', color: '#6366F1' },
  { key: 'researcher', label: 'Researcher', color: '#3B82F6' },
  { key: 'creator', label: 'Creator', color: '#EC4899' },
  { key: 'connector', label: 'Connector', color: '#F97316' },
  { key: 'learner', label: 'Learner', color: '#10B981' },
] as const;

export function DigitalDNA({ data, className }: DigitalDNAProps) {
  const { width, height, centerX, centerY, maxRadius } = useMemo(() => {
    const size = 360;
    return {
      width: size,
      height: size,
      centerX: size / 2,
      centerY: size / 2,
      maxRadius: size / 2 - 60,
    };
  }, []);

  const getPoint = (angle: number, radius: number) => ({
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius,
  });

  const angleStep = (Math.PI * 2) / dimensions.length;
  const startAngle = -Math.PI / 2;

  const polygonPoints = (ratio: number) => {
    return dimensions.map((_, i) => {
      const angle = startAngle + i * angleStep;
      const point = getPoint(angle, maxRadius * ratio);
      return `${point.x},${point.y}`;
    }).join(' ');
  };

  const dataPoints = dimensions.map((dim, i) => {
    const value = data[dim.key as keyof DigitalDNA] || 0;
    const angle = startAngle + i * angleStep;
    const radius = (value / 100) * maxRadius;
    return getPoint(angle, radius);
  });

  const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[360px] overflow-visible">
        <defs>
          <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00D4AA" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#00D4AA" stopOpacity="0.05" />
          </radialGradient>
          <filter id="radarGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMerge in="coloredBlur" />
              <feMerge in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {[0.25, 0.5, 0.75, 1].map(ratio => (
          <polygon
            key={ratio}
            points={polygonPoints(ratio)}
            fill="none"
            stroke="#1E2128"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ))}

        <polygon
          points={dataPolygon}
          fill="url(#radarFill)"
          stroke="#00D4AA"
          strokeWidth="2"
          filter="url(#radarGlow)"
          className="transition-all duration-500"
        />

        {dimensions.map((dim, i) => {
          // Normalize angle to [0, 2PI)
          let angle = (startAngle + i * angleStep) % (Math.PI * 2);
          if (angle < 0) angle += Math.PI * 2;
          
          const labelRadius = maxRadius + 24;
          const labelPoint = getPoint(angle, labelRadius);
          const axisPoint = getPoint(angle, maxRadius);
          
          // Determine alignment based on angle quadrant
          // 0 = right, PI/2 = bottom, PI = left, 3PI/2 = top
          const isTop = Math.abs(angle - 1.5 * Math.PI) < 0.1;
          const isBottom = Math.abs(angle - 0.5 * Math.PI) < 0.1;
          const isRight = angle > 3 * Math.PI / 2 || angle < Math.PI / 2;
          
          let anchor: 'start' | 'middle' | 'end' = 'middle';
          let dx = 0;
          if (!isTop && !isBottom) {
            anchor = isRight ? 'start' : 'end';
            dx = isRight ? 8 : -8;
          }
          
          let baseline: 'auto' | 'middle' | 'hanging' = 'middle';
          let dy = 0;
          if (isTop) {
            baseline = 'auto';
            dy = -4;
          } else if (isBottom) {
            baseline = 'hanging';
            dy = 4;
          }

          return (
            <g key={dim.key}>
              <line
                x1={centerX}
                y1={centerY}
                x2={axisPoint.x}
                y2={axisPoint.y}
                stroke="#1E2128"
                strokeWidth="1"
              />
              <text
                x={labelPoint.x}
                y={labelPoint.y}
                textAnchor={anchor}
                dominantBaseline={baseline}
                className="text-[11px] font-semibold text-signal-fgMuted tracking-wider uppercase"
                fill="currentColor"
                dx={dx}
                dy={dy}
              >
                {dim.label}
              </text>
            </g>
          );
        })}

        {dataPoints.map((point, i) => {
          const dim = dimensions[i];
          const value = data[dim.key as keyof DigitalDNA] || 0;
          return (
            <circle
              key={dim.key}
              cx={point.x}
              cy={point.y}
              r={5}
              fill={dim.color}
              stroke="#0A0B0D"
              strokeWidth={2}
              className="transition-all duration-200"
            />
          );
        })}
      </svg>

      <div className="grid grid-cols-3 gap-3 mt-6 w-full max-w-[300px]">
        {dimensions.map(dim => {
          const value = data[dim.key as keyof DigitalDNA] || 0;
          return (
            <div
              key={dim.key}
              className="flex items-center gap-2 p-2 bg-signal-bgElevated border border-signal-border rounded-lg"
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dim.color }} />
              <span className="text-xs text-signal-fgMuted flex-1 truncate">{dim.label}</span>
              <span className="font-mono font-bold text-signal-fg tabular-nums">{value}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}