import { useMemo, useState } from 'react';
import { cn } from '../utils/helpers';
import { Skill } from '../types';
import { categoryColors } from '../analytics';

interface SkillEvolutionProps {
  skills: Skill[];
  selectedSkills?: string[];
  onSkillToggle?: (skillId: string) => void;
  className?: string;
}

export function SkillEvolution({ skills, selectedSkills = [], onSkillToggle, className }: SkillEvolutionProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{ skill: Skill; point: { date: string; level: number } } | null>(null);

  const displayedSkills = useMemo(() => {
    if (selectedSkills.length === 0) return skills;
    return skills.filter(s => selectedSkills.includes(s.id));
  }, [skills, selectedSkills]);

  const allPoints = displayedSkills.flatMap(s => s.history.map(p => ({ ...p, skill: s })));
  const maxLevel = useMemo(() => Math.max(...allPoints.map(p => p.level), 100), [allPoints]);
  const minLevel = useMemo(() => Math.max(0, Math.min(...allPoints.map(p => p.level)) - 10), [allPoints]);

  const chartWidth = 600;
  const chartHeight = 280;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const xScale = (dateStr: string, index: number, total: number) => {
    return padding.left + (index / Math.max(1, total - 1)) * innerWidth;
  };

  const yScale = (level: number) => {
    return padding.top + innerHeight - ((level - minLevel) / (maxLevel - minLevel)) * innerHeight;
  };

  const getPath = (history: Skill['history']) => {
    if (history.length < 2) return '';
    return history.map((point, idx) => {
      const x = xScale(point.date, idx, history.length);
      const y = yScale(point.level);
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];

  const gridLines = useMemo(() => {
    return [0, 0.25, 0.5, 0.75, 1].map(ratio => {
      const y = padding.top + innerHeight * ratio;
      const level = Math.round(maxLevel - ratio * (maxLevel - minLevel));
      return { ratio, y, level };
    });
  }, [padding, innerHeight, maxLevel, minLevel]);

  const monthLines = useMemo(() => {
    return months.map((month, idx) => {
      const x = padding.left + (idx / (months.length - 1)) * innerWidth;
      return { month, x };
    });
  }, [padding, innerWidth]);

  const skillPaths = useMemo(() => {
    return displayedSkills.map(skill => {
      const color = categoryColors[skill.category as keyof typeof categoryColors] || '#00D4AA';
      const path = getPath(skill.history);
      return { skill, color, path };
    });
  }, [displayedSkills]);

  const hoveredTooltip = useMemo(() => {
    if (!hoveredPoint) return null;
    const { skill, point } = hoveredPoint;
    const pointIdx = skill.history.findIndex(p => p.date === point.date);
    const x = xScale(point.date, pointIdx, skill.history.length);
    const y = yScale(point.level);
    const color = categoryColors[skill.category as keyof typeof categoryColors] || '#00D4AA';
    return { skill, point, x, y, color };
  }, [hoveredPoint, xScale, yScale]);

  return (
    <div className={cn('relative', className)}>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {skills.map(skill => (
          <button
            key={skill.id}
            onClick={() => onSkillToggle?.(skill.id)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
              selectedSkills.length === 0 || selectedSkills.includes(skill.id)
                ? 'bg-signal-accentMuted border border-signal-accent/30 text-signal-accent'
                : 'bg-signal-bg border border-signal-border text-signal-fgMuted hover:border-signal-borderHover hover:text-signal-fg'
            )}
            style={{ borderColor: categoryColors[skill.category as keyof typeof categoryColors] }}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: categoryColors[skill.category as keyof typeof categoryColors] }} />
            {skill.name}
            <span className="text-xs font-mono tabular-nums">{skill.level}</span>
          </button>
        ))}
      </div>

      <svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full max-w-[600px]">
        <defs>
          <linearGradient id="gridGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1E2128" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#1E2128" stopOpacity="0" />
          </linearGradient>
          <filter id="lineGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMerge in="coloredBlur" />
              <feMerge in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect x={padding.left} y={padding.top} width={innerWidth} height={innerHeight} fill="url(#gridGradient)" />

        {gridLines.map(({ ratio, y, level }) => (
          <g key={ratio}>
            <line
              x1={padding.left}
              y1={y}
              x2={chartWidth - padding.right}
              y2={y}
              stroke="#1E2128"
              strokeWidth="0.5"
              strokeDasharray="4 4"
            />
            <text
              x={padding.left - 10}
              y={y + 4}
              textAnchor="end"
              className="text-[10px] text-signal-fgSubtle font-mono"
            >
              {level}
            </text>
          </g>
        ))}

        {monthLines.map(({ month, x }) => (
          <g key={month}>
            <line
              x1={x}
              y1={padding.top}
              x2={x}
              y2={chartHeight - padding.bottom}
              stroke="#1E2128"
              strokeWidth="0.5"
              strokeDasharray="4 4"
            />
            <text
              x={x}
              y={chartHeight - padding.bottom + 18}
              textAnchor="middle"
              className="text-[10px] text-signal-fgSubtle font-medium"
            >
              {month}
            </text>
          </g>
        ))}

        {skillPaths.map(({ skill, color, path }) => (
          <g key={skill.id}>
            <path
              d={path}
              stroke={color}
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300"
              style={{
                filter: hoveredPoint?.skill.id === skill.id ? 'url(#lineGlow)' : 'none',
                opacity: selectedSkills.length > 0 && !selectedSkills.includes(skill.id) ? 0.2 : 1,
              }}
            />

            {skill.history.map((point, pointIdx) => {
              const x = xScale(point.date, pointIdx, skill.history.length);
              const y = yScale(point.level);
              const isHovered = hoveredPoint?.skill.id === skill.id && hoveredPoint.point.date === point.date;

              return (
                <circle
                  key={point.date}
                  cx={x}
                  cy={y}
                  r={isHovered ? 6 : 4}
                  fill={color}
                  stroke="#0A0B0D"
                  strokeWidth={2}
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHoveredPoint({ skill, point })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              );
            })}
          </g>
        ))}

        {hoveredTooltip && (
          <g>
            <rect
              x={Math.max(padding.left, Math.min(chartWidth - padding.right - 160, hoveredTooltip.x - 80))}
              y={Math.max(padding.top, hoveredTooltip.y - 60)}
              width={160}
              height={50}
              rx={6}
              fill="#111317"
              stroke="#2A2E38"
              strokeWidth="1"
              filter="drop-shadow(0 8px 24px rgba(0,0,0,0.4))"
            />
            <text x={hoveredTooltip.x} y={hoveredTooltip.y - 20} textAnchor="middle" className="text-[11px] font-semibold text-signal-fg" pointerEvents="none">
              {hoveredTooltip.skill.name}
            </text>
            <text x={hoveredTooltip.x} y={hoveredTooltip.y - 5} textAnchor="middle" className="font-display text-xl font-bold text-signal-accent" pointerEvents="none">
              {hoveredTooltip.point.level}
            </text>
            <text x={hoveredTooltip.x} y={hoveredTooltip.y + 15} textAnchor="middle" className="text-[10px] text-signal-fgMuted font-mono" pointerEvents="none">
              {new Date(hoveredTooltip.point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </text>
          </g>
        )}
      </svg>

      <div className="mt-4 flex items-center justify-between text-xs text-signal-fgSubtle">
        <span>Level</span>
        <span>2025</span>
      </div>
    </div>
  );
}