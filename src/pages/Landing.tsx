import { useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ArrowRight, Download, BarChart2, Target, TrendingUp, Brain, Zap, Sparkles } from 'lucide-react';
import { cn } from '../utils/helpers';
import { Heatmap } from '../charts/Heatmap';
import { getDemoData } from '../data/demoData';
import { getFilteredActivities, getHeatmapData } from '../analytics';

const features = [
  {
    icon: Brain,
    title: 'Discover Your Digital Archetype',
    description: 'Are you a Builder, Architect, Strategist, or Creator? Signal analyzes your patterns to reveal your core digital identity.',
  },
  {
    icon: TrendingUp,
    title: 'See When You Do Your Best Work',
    description: 'Peak hours visualization shows your most productive windows, average session lengths, and category dominance by time.',
  },
  {
    icon: Target,
    title: 'Map Your Interest Constellation',
    description: 'Interactive network graph connecting your interests. Node size = strength. Edges = relationships. Click to explore.',
  },
  {
    icon: BarChart2,
    title: 'Track Skill Evolution Over Time',
    description: 'Line charts showing 6-month progression for each skill. Toggle skills, hover for exact values, compare trajectories.',
  },
  {
    icon: Zap,
    title: 'Timeline of Milestones',
    description: 'Vertical timeline of your shipped projects, publications, achievements. Filter by category, search by keyword.',
  },
  {
    icon: Sparkles,
    title: 'Generate Your Digital Identity Card',
    description: 'Shareable profile card with archetype, signal score, top signals, peak hours, and momentum. Export as PNG.',
  }
];

const stats = [
  { label: 'Activities Analyzed', value: '2,847' },
  { label: 'Timeline Events', value: '32' },
  { label: 'Interest Nodes', value: '12' },
  { label: 'Skills Tracked', value: '8' },
];

export function Landing({ onExploreDemo, onImportData }: { onExploreDemo: () => void; onImportData: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);

  // Use deterministic demo data for the preview
  const heatmapData = useMemo(() => {
    const rawData = getDemoData();
    const activities = getFilteredActivities(rawData.activities, 'all', []);
    return getHeatmapData(activities);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    const particles: Array<{ x: number; y: number; vx: number; vy: number; size: number; color: string; alpha: number }> = [];
    const colors = ['#00D4AA', '#6366F1', '#F5A623', '#EC4899', '#3B82F6'];

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.5 + 0.1,
      });
    }

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      particles.forEach(p => {
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 200) {
          const force = (200 - dist) / 200 * 0.02;
          p.vx -= (dx / dist) * force;
          p.vy -= (dy / dist) * force;
        }

        p.vx *= 0.99;
        p.vy *= 0.99;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = window.innerWidth;
        if (p.x > window.innerWidth) p.x = 0;
        if (p.y < 0) p.y = window.innerHeight;
        if (p.y > window.innerHeight) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      });

      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach(p2 => {
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = p1.color;
            ctx.globalAlpha = (1 - dist / 120) * 0.15;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      ctx.globalAlpha = 1;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-signal-bg relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none opacity-50 z-0"
        aria-hidden="true"
      />

      <header className="relative z-10 px-6 py-4 max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-signal-accent/20 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-signal-accent">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="font-display font-bold text-xl text-signal-fg">SIGNAL</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onImportData}>Import Data</Button>
          <Button onClick={onExploreDemo}>
            Explore Demo
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-5xl md:text-7xl font-bold text-signal-fg leading-tight mb-6"
          >
            How much of the{' '}
            <span className="relative">
              internet
              <span className="absolute bottom-0 left-0 right-0 h-1 bg-signal-accent/30" />
            </span>{' '}
            is you?
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg md:text-xl text-signal-fgMuted leading-relaxed mb-10 max-w-2xl mx-auto"
          >
            Signal turns your digital activity into a living map of what you build, learn, explore, and obsess over.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="lg" onClick={onExploreDemo} className="w-full sm:w-auto">
              Explore Demo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button variant="secondary" size="lg" onClick={onImportData} className="w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" />
              Import Data
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-20"
        >
          {stats.map((stat, idx) => (
            <Card key={stat.label} variant="elevated" className="text-center p-6" style={{ transitionDelay: `${idx * 100}ms` }}>
              <p className="font-display text-4xl font-bold text-signal-accent tabular-nums">{stat.value}</p>
              <p className="text-sm text-signal-fgMuted mt-1">{stat.label}</p>
            </Card>
          ))}
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mb-20"
        >
          <h2 className="font-display text-3xl font-bold text-signal-fg text-center mb-12">What Signal Reveals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <Card key={feature.title} variant="elevated" className="p-6 group hover:border-signal-accent/50 transition-colors" style={{ transitionDelay: `${idx * 50}ms` }}>
                <div className="w-12 h-12 rounded-xl bg-signal-accent/10 flex items-center justify-center mb-4 group-hover:bg-signal-accent/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-signal-accent" />
                </div>
                <h3 className="font-semibold text-signal-fg mb-2">{feature.title}</h3>
                <p className="text-sm text-signal-fgMuted leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="font-display text-3xl font-bold text-signal-fg text-center mb-12">Dashboard Preview</h2>
          <div className="aspect-video bg-signal-bgElevated border border-signal-border rounded-2xl overflow-hidden relative min-h-[500px]">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,212,170,0.08)_0%,_transparent_70%)]" />
            <div className="relative p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-signal-accent/20 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-signal-accent">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <span className="font-display font-bold text-signal-fg">SIGNAL</span>
                </div>
                <span className="px-2 py-1 bg-signal-accent/10 text-signal-accent text-xs font-mono rounded">LIVE DEMO</span>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div className="bg-signal-bg border border-signal-border rounded-xl p-4">
                  <p className="text-xs text-signal-fgMuted uppercase tracking-wide mb-2">Archetype</p>
                  <p className="font-display text-2xl font-bold text-signal-fg">THE BUILDER</p>
                  <p className="text-xs text-signal-accent font-medium mt-1">87% confidence</p>
                </div>
                <div className="bg-signal-bg border border-signal-border rounded-xl p-4">
                  <p className="text-xs text-signal-fgMuted uppercase tracking-wide mb-2">Signal Score</p>
                  <p className="font-display text-3xl font-bold text-signal-accent">87</p>
                </div>
                <div className="bg-signal-bg border border-signal-border rounded-xl p-4 col-span-2 overflow-hidden flex flex-col">
                  <p className="text-xs text-signal-fgMuted uppercase tracking-wide mb-3 flex-shrink-0">Activity Heatmap</p>
                  <div className="flex-1 min-h-0 relative">
                    <div className="absolute inset-0 pointer-events-none z-10 fade-out-bottom bg-gradient-to-t from-signal-bg to-transparent h-12 bottom-0" />
                    <Heatmap data={heatmapData} className="pointer-events-none scale-90 origin-top-left" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </main>

      <footer className="relative z-10 px-6 py-8 border-t border-signal-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-signal-fgSubtle">Signal — Digital Intelligence Dashboard</p>
          <p className="text-xs text-signal-fgMuted">Built with React, TypeScript, Tailwind, Recharts, Framer Motion</p>
        </div>
      </footer>
    </div>
  );
}