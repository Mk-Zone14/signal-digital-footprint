import { useMemo, useState, useEffect, useRef } from 'react';
import { cn } from '../utils/helpers';
import { Interest } from '../types';
import { categoryColors } from '../analytics';

interface InterestConstellationProps {
  interests: Interest[];
  selectedInterest?: Interest;
  onInterestClick?: (interest: Interest) => void;
  className?: string;
}

const NODE_RADIUS_MIN = 16;
const NODE_RADIUS_MAX = 48;
const CENTER_RADIUS = 32;

export function InterestConstellation({ interests, selectedInterest, onInterestClick, className }: InterestConstellationProps) {
  const [hoveredNode, setHoveredNode] = useState<Interest | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const nodes = useMemo(() => {
    const sortedInterests = [...interests].sort((a, b) => b.strength - a.strength);
    const maxStrength = sortedInterests[0]?.strength || 1;
    const minStrength = sortedInterests[sortedInterests.length - 1]?.strength || 1;

    return sortedInterests.map((interest, idx) => {
      const angle = (idx / sortedInterests.length) * Math.PI * 2 - Math.PI / 2;
      const distance = 140 + (1 - interest.strength / maxStrength) * 60;
      const radius = NODE_RADIUS_MIN + (interest.strength / maxStrength) * (NODE_RADIUS_MAX - NODE_RADIUS_MIN);

      return {
        ...interest,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        radius,
        angle,
        distance,
        color: categoryColors[interest.category as keyof typeof categoryColors] || '#00D4AA',
      };
    });
  }, [interests]);

  const edges = useMemo(() => {
    const edges: Array<{ source: string; target: string; strength: number }> = [];
    nodes.forEach(node => {
      node.relatedInterests.forEach(relatedName => {
        const target = nodes.find(n => n.name === relatedName);
        if (target) {
          edges.push({
            source: node.id,
            target: target.id,
            strength: Math.min(node.strength, target.strength) / 100,
          });
        }
      });
    });
    return edges;
  }, [nodes]);

  const getCenterPosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      return { x: rect.width / 2, y: rect.height / 2 };
    }
    return { x: 200, y: 200 };
  };

  const displayNode = hoveredNode || selectedInterest;

  return (
    <div ref={containerRef} className={cn('relative', className)} style={{ width: '100%', height: '420px' }}>
      <svg
        ref={svgRef}
        className="w-full h-full"
        viewBox="0 0 400 400"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00D4AA" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00D4AA" stopOpacity="0" />
          </radialGradient>
          <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMerge in="coloredBlur" />
              <feMerge in="SourceGraphic" />
            </feMerge>
          </filter>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L8,3 Z" fill="#2A2E38" />
          </marker>
        </defs>

        <circle
          cx="200"
          cy="200"
          r={CENTER_RADIUS * 2.5}
          fill="url(#centerGlow)"
          className="transition-opacity duration-300"
        />

        {edges.map((edge, idx) => {
          const source = nodes.find(n => n.id === edge.source);
          const target = nodes.find(n => n.id === edge.target);
          if (!source || !target) return null;

          const sx = 200 + source.x;
          const sy = 200 + source.y;
          const tx = 200 + target.x;
          const ty = 200 + target.y;

          const dx = tx - sx;
          const dy = ty - sy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const ux = dx / dist;
          const uy = dy / dist;

          const startX = sx + ux * source.radius;
          const startY = sy + uy * source.radius;
          const endX = tx - ux * target.radius;
          const endY = ty - uy * target.radius;

          const isHighlighted = (hoveredNode && (hoveredNode.id === edge.source || hoveredNode.id === edge.target)) ||
            (selectedInterest && (selectedInterest.id === edge.source || selectedInterest.id === edge.target));

          return (
            <line
              key={idx}
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              stroke="#1E2128"
              strokeWidth={1 + edge.strength * 2}
              strokeOpacity={isHighlighted ? 0.8 : 0.3}
              className="transition-all duration-200"
              style={{ filter: isHighlighted ? 'drop-shadow(0 0 4px #00D4AA)' : 'none' }}
            />
          );
        })}

        <circle
          cx="200"
          cy="200"
          r={CENTER_RADIUS}
          fill="#00D4AA"
          className="cursor-pointer transition-all duration-200"
          onMouseEnter={() => setHoveredNode({ id: 'center', name: 'YOU', category: 'coding', strength: 100, activityCount: 0, projectCount: 0, growth: 0, relatedInterests: [] } as Interest)}
          onMouseLeave={() => setHoveredNode(null)}
          onClick={() => onInterestClick?.({ id: 'center', name: 'YOU', category: 'coding', strength: 100, activityCount: 0, projectCount: 0, growth: 0, relatedInterests: [] } as Interest)}
        >
          <animate
            attributeName="r"
            values={`${CENTER_RADIUS};${CENTER_RADIUS * 1.1};${CENTER_RADIUS}`}
            dur="3s"
            repeatCount="indefinite"
          />
        </circle>

        <text x="200" y="205" textAnchor="middle" className="text-signal-bg font-display font-bold text-[14px]" pointerEvents="none">
          YOU
        </text>

        {nodes.map((node, idx) => {
          const isSelected = selectedInterest?.id === node.id;
          const isHovered = hoveredNode?.id === node.id;
          const isHighlighted = isSelected || isHovered;
          const cx = 200 + node.x;
          const cy = 200 + node.y;

          return (
            <g
              key={node.id}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredNode(node)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => onInterestClick?.(node)}
            >
              <circle
                cx={cx}
                cy={cy}
                r={node.radius + (isHighlighted ? 4 : 0)}
                fill={node.color}
                fillOpacity={isHighlighted ? 1 : 0.85}
                stroke="#0A0B0D"
                strokeWidth={2}
                filter={isHighlighted ? 'url(#nodeGlow)' : 'none'}
                className="transition-all duration-200"
              />

              <circle
                cx={cx}
                cy={cy}
                r={node.radius * 1.4}
                fill="none"
                stroke={node.color}
                strokeWidth={1}
                strokeOpacity={isHighlighted ? 0.6 : 0}
                strokeDasharray="4 4"
                className="transition-all duration-300"
              >
                <animate
                  attributeName="strokeDashoffset"
                  values="0;-8"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </circle>

              <text
                x={cx}
                y={cy + 4}
                textAnchor="middle"
                className={cn(
                  'pointer-events-none transition-all duration-200',
                  'font-medium',
                  isHighlighted ? 'text-signal-bg text-[11px]' : 'text-signal-fg text-[10px]'
                )}
              >
                {node.name.length > 12 ? node.name.substring(0, 11) + '…' : node.name}
              </text>

              {isHighlighted && (
                <text
                  x={cx}
                  y={cy + node.radius + 16}
                  textAnchor="middle"
                  className="text-signal-fgMuted text-[10px] font-mono pointer-events-none"
                >
                  {node.activityCount} activities
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {displayNode && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-sm animate-in"
          style={{ pointerEvents: 'none' }}
        >
          <div className="card-elevated p-4">
            {displayNode.id === 'center' ? (
              <div className="text-center">
                <p className="text-xs text-signal-fgSubtle uppercase tracking-wide">Central Node</p>
                <p className="font-display text-2xl font-bold text-signal-accent mt-1">YOU</p>
                <p className="text-sm text-signal-fgMuted mt-2">The center of your digital constellation</p>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: categoryColors[displayNode.category as keyof typeof categoryColors] }} />
                <div className="flex-1 min-w-0">
                  <h5 className="font-semibold text-signal-fg truncate">{displayNode.name}</h5>
                  <p className="text-xs text-signal-fgMuted capitalize">{displayNode.category}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-signal-fgSubtle">
                    <span>{displayNode.activityCount} activities</span>
                    <span>{displayNode.projectCount} projects</span>
                    <span className={cn('font-medium', displayNode.growth >= 0 ? 'text-signal-accent' : 'text-signal-danger')}>
                      {displayNode.growth >= 0 ? '+' : ''}{displayNode.growth}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}