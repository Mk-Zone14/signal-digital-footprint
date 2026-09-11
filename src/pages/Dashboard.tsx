import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '../components/DashboardLayout';
import { MetricCard } from '../components/MetricCard';
import { Heatmap } from '../charts/Heatmap';
import { PeakHours } from '../charts/PeakHours';
import { InterestConstellation } from '../charts/InterestConstellation';
import { SkillEvolution } from '../charts/SkillEvolution';
import { DigitalDNA } from '../charts/DigitalDNA';
import { Timeline } from '../components/Timeline';
import { IdentityCard, IdentityCardHandle } from '../components/IdentityCard';
import { Search } from '../components/Search';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { formatDuration } from '../utils/helpers';
import { categoryColors } from '../analytics';
import { Download, TrendingUp, TrendingDown } from 'lucide-react';
import { NavItem, Category, DateRange, Activity, Interest, Skill, DemoData, FilterState, SearchResult, V2Analytics } from '../types';
import { cn } from '../utils/helpers';
import type { SignalScore, Archetype, PeakHoursData, DigitalDNA as DigitalDNAType, MomentumData } from '../types';

const tabConfigs: Record<NavItem, { title: string; description: string }> = {
  overview: { title: 'Overview', description: 'Your digital signal at a glance' },
  activity: { title: 'Activity', description: 'Heatmap, peak hours, and patterns' },
  interests: { title: 'Interests', description: 'Topics, domains, and connections' },
  skills: { title: 'Skills', description: 'Capabilities and growth trajectory' },
  timeline: { title: 'Timeline', description: 'Key milestones and achievements' },
  identity: { title: 'Identity', description: 'Your digital profile and signature' },
};

interface DashboardAnalytics {
  filteredActivities: Activity[];
  signalScore: SignalScore;
  archetype: Archetype;
  peakHours: PeakHoursData[];
  interests: Interest[];
  digitalDNA: DigitalDNAType;
  momentum: MomentumData;
  skills: Skill[];
  heatmapData: Map<string, { count: number; duration: number; categories: Category[] }>;
  searchResults: {
    activities: Activity[];
    skills: Skill[];
    timeline: Array<{ id: string; title: string; category: string; date: string; description: string }>;
    interests: Interest[];
  } | null;
  v2Analytics?: V2Analytics;
}

interface DashboardProps {
  data: DemoData;
  analytics: DashboardAnalytics;
  filters: FilterState;
  onFilterChange: {
    updateDateRange: (range: DateRange) => void;
    toggleCategory: (category: Category) => void;
    setCategories: (categories: Category[]) => void;
    setSearchQuery: (query: string) => void;
  };
  searchOpen: boolean;
  onSearchOpen: () => void;
  onSearchClose: () => void;
  onSearchQueryChange: (query: string) => void;
  searchResults: DashboardAnalytics['searchResults'];
  activeTab: NavItem;
  onTabChange: (tab: NavItem) => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onSignOut: () => void;
  isLoading: boolean;
}

export function Dashboard({
  data,
  analytics,
  filters,
  onFilterChange,
  searchOpen,
  onSearchOpen,
  onSearchClose,
  onSearchQueryChange,
  searchResults,
  activeTab,
  onTabChange,
  sidebarCollapsed,
  onToggleSidebar,
  onSignOut,
  isLoading,
}: DashboardProps) {
  const [selectedHeatmapCategory, setSelectedHeatmapCategory] = useState<Category | 'all'>('all');
  const [selectedTimelineCategory, setSelectedTimelineCategory] = useState<Category | 'all'>('all');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const identityCardRef = useRef<IdentityCardHandle>(null);

  const { signalScore, archetype, peakHours, digitalDNA, momentum, interests, skills, heatmapData, filteredActivities } = analytics;

  const availableHeatmapCategories = useMemo(() => {
    const categories = new Set<Category>();
    if (filteredActivities) {
      filteredActivities.forEach((a: Activity) => categories.add(a.category));
    }
    return ['all', ...Array.from(categories)] as (Category | 'all')[];
  }, [filteredActivities]);

  const availableTimelineCategories = useMemo(() => {
    const categories = new Set<Category>();
    if (data.timelineEvents) {
      data.timelineEvents.forEach(e => categories.add(e.category));
    }
    return ['all', ...Array.from(categories)] as (Category | 'all')[];
  }, [data.timelineEvents]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-signal-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-signal-accent/10 flex items-center justify-center animate-pulse">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-signal-accent">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <p className="text-signal-fgMuted text-sm">Loading your signal...</p>
        </div>
      </div>
    );
  }

  const handleSearchResultClick = (result: SearchResult) => {
    const tabMap: Record<string, NavItem> = {
      activities: 'activity',
      skills: 'skills',
      timeline: 'timeline',
      interests: 'interests',
    };
    const tab = tabMap[result.type];
    if (tab) onTabChange(tab);
    onSearchClose();
  };

  const handleExportCard = () => {
    identityCardRef.current?.exportCard();
  };

  /** Render a sparkline from momentum projection data */
  const renderProjectionSparkline = () => {
    if (!momentum.projection || momentum.projection.length === 0) return null;
    const points = momentum.projection;
    const width = 320;
    const height = 80;
    const padding = 8;
    const innerW = width - padding * 2;
    const innerH = height - padding * 2;

    const scores = points.map(p => p.projectedScore);
    const minScore = Math.min(...scores, 0);
    const maxScore = Math.max(...scores, 10);
    const range = maxScore - minScore || 1;

    const pathD = points.map((p, i) => {
      const x = padding + (i / (points.length - 1)) * innerW;
      const y = padding + innerH - ((p.projectedScore - minScore) / range) * innerH;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    const areaD = pathD + ` L ${padding + innerW} ${padding + innerH} L ${padding} ${padding + innerH} Z`;

    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="projectionFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={momentum.current >= 0 ? '#00D4AA' : '#EF4444'} stopOpacity="0.2" />
            <stop offset="100%" stopColor={momentum.current >= 0 ? '#00D4AA' : '#EF4444'} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#projectionFill)" />
        <path d={pathD} fill="none" stroke={momentum.current >= 0 ? '#00D4AA' : '#EF4444'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Zero line */}
        {minScore < 0 && maxScore > 0 && (
          <line
            x1={padding} y1={padding + innerH - ((0 - minScore) / range) * innerH}
            x2={padding + innerW} y2={padding + innerH - ((0 - minScore) / range) * innerH}
            stroke="#2A2E38" strokeWidth="1" strokeDasharray="4 4"
          />
        )}
      </svg>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card variant="elevated" className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs text-signal-fgSubtle uppercase tracking-widest font-medium mb-2">YOUR DIGITAL SIGNAL</p>
                      <h2 className="font-display text-3xl font-bold text-signal-fg mb-2">{archetype.name}</h2>
                      <p className="text-signal-fgMuted max-w-xl">{archetype.description}</p>
                    </div>
                    <Badge variant="accent" size="md" className="font-mono text-lg px-4 py-2 flex-shrink-0">
                      {archetype.confidence}%
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {archetype.primaryTraits.map((trait: string) => (
                      <Badge key={trait} variant="accent" size="sm" dot dotColor="#00D4AA">{trait}</Badge>
                    ))}
                  </div>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card variant="elevated" className="p-6">
                    <p className="text-xs text-signal-fgSubtle uppercase tracking-wide mb-3">Digital DNA</p>
                    <DigitalDNA data={digitalDNA} />
                  </Card>
                  <Card variant="elevated" className="p-6">
                    <p className="text-xs text-signal-fgSubtle uppercase tracking-wide mb-3">Momentum</p>
                    <div className="space-y-4">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <p className="text-xs text-signal-fgMuted">Current Momentum</p>
                          <p className={cn('font-display text-3xl font-bold', momentum.current >= 0 ? 'text-signal-accent' : 'text-signal-danger')}>
                            {momentum.current >= 0 ? '+' : ''}{momentum.current}%
                          </p>
                        </div>
                        <Badge variant={momentum.current >= 0 ? 'success' : 'danger'} size="sm">
                          vs last: {momentum.previous >= 0 ? '+' : ''}{momentum.previous}%
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-signal-bg border border-signal-border rounded-lg">
                          <p className="text-xs text-signal-fgSubtle">Strongest Growth</p>
                          <p className="font-medium text-signal-fg text-sm mt-0.5">{momentum.strongestGrowthArea.category}</p>
                          <p className="text-xs text-signal-accent font-mono">{momentum.strongestGrowthArea.growth >= 0 ? '+' : ''}{momentum.strongestGrowthArea.growth}%</p>
                        </div>
                        <div className="p-3 bg-signal-bg border border-signal-border rounded-lg">
                          <p className="text-xs text-signal-fgSubtle">Most Consistent</p>
                          <p className="font-medium text-signal-fg text-sm mt-0.5">{momentum.mostConsistentActivity.category}</p>
                          <p className="text-xs text-signal-fgMuted font-mono">{momentum.mostConsistentActivity.consistency}% of days</p>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-signal-border">
                        <p className="text-xs text-signal-fgSubtle mb-2">90-Day Projection</p>
                        <div className="h-24 bg-signal-bg border border-signal-border rounded-lg flex items-center justify-center overflow-hidden">
                          {renderProjectionSparkline()}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              <div className="space-y-6">
                <Card variant="elevated" className="p-6">
                  <p className="text-xs text-signal-fgSubtle uppercase tracking-wide mb-4">Signal Score</p>
                  <div className="grid grid-cols-2 gap-4">
                    <MetricCard label="Activity" value={signalScore.activity} suffix="%" />
                    <MetricCard label="Consistency" value={signalScore.consistency} suffix="%" />
                    <MetricCard label="Exploration" value={signalScore.exploration} suffix="%" />
                    <MetricCard
                      label="Momentum"
                      value={momentum.current >= 0 ? `+${momentum.current}` : String(momentum.current)}
                      suffix="%"
                      icon={momentum.current >= 0
                        ? <TrendingUp className="w-4 h-4 text-signal-accent" />
                        : <TrendingDown className="w-4 h-4 text-signal-danger" />
                      }
                    />
                  </div>
                  <div className="mt-6 pt-6 border-t border-signal-border">
                    <p className="font-display text-4xl font-bold text-signal-accent text-center">{signalScore.overall}</p>
                    <p className="text-center text-sm text-signal-fgMuted mt-1">Overall Signal Score</p>
                  </div>
                </Card>

                <Card variant="elevated" className="p-6">
                  <p className="text-xs text-signal-fgSubtle uppercase tracking-wide mb-4">Quick Stats</p>
                  <div className="space-y-3">
                    {[
                      { label: 'Total Activities', value: filteredActivities?.length || 0 },
                      { label: 'Active Days', value: new Set((filteredActivities || []).map((a: Activity) => a.date)).size },
                      { label: 'Total Hours', value: formatDuration((filteredActivities || []).reduce((s: number, a: Activity) => s + (a.duration || 0), 0)) },
                      { label: 'Categories', value: new Set((filteredActivities || []).map((a: Activity) => a.category)).size },
                      { label: 'Avg Session', value: formatDuration(Math.round((filteredActivities || []).reduce((s: number, a: Activity) => s + (a.duration || 0), 0) / Math.max(1, filteredActivities?.length || 1))) },
                      { label: 'Avg Impact', value: Math.round((filteredActivities || []).reduce((s: number, a: Activity) => s + (a.impactScore || 0), 0) / Math.max(1, filteredActivities?.length || 1)) },
                    ].map(stat => (
                      <div key={stat.label} className="flex items-center justify-between py-2 border-b border-signal-border/50 last:border-0">
                        <span className="text-sm text-signal-fgMuted">{stat.label}</span>
                        <span className="font-mono font-semibold text-signal-fg">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </motion.div>
        );
      case 'activity':
        return (
          <motion.div
            key="activity"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="text-sm font-medium text-signal-fgMuted">Filter Heatmap</h3>
              <div className="flex items-center gap-2 flex-wrap">
                {availableHeatmapCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedHeatmapCategory(cat)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                      selectedHeatmapCategory === cat
                        ? 'bg-signal-accent/10 border border-signal-accent/30 text-signal-accent'
                        : 'bg-signal-bgElevated border border-signal-border text-signal-fgMuted hover:border-signal-borderHover hover:text-signal-fg'
                    )}
                    style={{ borderColor: cat !== 'all' && selectedHeatmapCategory === cat ? categoryColors[cat as Category] : undefined }}
                  >
                    {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <Card variant="elevated" className="p-6">
              <Heatmap
                data={heatmapData}
                selectedCategory={selectedHeatmapCategory !== 'all' ? selectedHeatmapCategory : undefined}
              />
            </Card>

            <Card variant="elevated" className="p-6">
              <PeakHours data={peakHours} />
            </Card>
          </motion.div>
        );
      case 'interests':
        return (
          <motion.div
            key="interests"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card variant="elevated" className="p-6 h-full">
                  <InterestConstellation
                    interests={interests}
                  />
                </Card>
              </div>
              <div className="space-y-4">
                <Card variant="elevated" className="p-4">
                  <h4 className="font-semibold text-signal-fg mb-3">Interest Breakdown</h4>
                  <div className="space-y-3">
                    {interests?.slice(0, 10).map((interest: Interest) => (
                      <div key={interest.id} className="group">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: categoryColors[interest.category as keyof typeof categoryColors] }} />
                            <span className="text-sm font-medium text-signal-fg truncate">{interest.name}</span>
                          </div>
                          <span className="font-mono text-signal-accent text-sm flex-shrink-0 ml-2">{interest.strength}%</span>
                        </div>
                        <div className="h-1.5 bg-signal-bg rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${interest.strength}%`,
                              backgroundColor: categoryColors[interest.category as keyof typeof categoryColors],
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-1 text-xs text-signal-fgSubtle">
                          <span>{interest.activityCount} activities · {interest.projectCount} projects</span>
                          <span className={cn('font-medium', interest.growth >= 0 ? 'text-signal-accent' : 'text-signal-danger')}>
                            {interest.growth >= 0 ? '+' : ''}{interest.growth}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card variant="elevated" className="p-4">
                  <h4 className="font-semibold text-signal-fg mb-3">Interest Relationships</h4>
                  <div className="space-y-2">
                    {(interests || []).flatMap((i: Interest) => (i.relatedInterests || []).slice(0, 2).map((r: string) => ({ source: i.name, target: r }))).slice(0, 8).map((rel: { source: string; target: string }, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-signal-fgMuted">
                        <span className="w-1.5 h-1.5 rounded-full bg-signal-accent flex-shrink-0" />
                        <span className="font-medium text-signal-fg truncate">{rel.source}</span>
                        <span className="text-signal-fgSubtle flex-shrink-0">→</span>
                        <span className="font-medium text-signal-fg truncate">{rel.target}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </motion.div>
        );
      case 'skills':
        return (
          <motion.div
            key="skills"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <Card variant="elevated" className="p-6">
              <SkillEvolution
                skills={skills || []}
                selectedSkills={selectedSkills}
                onSkillToggle={(skillId) => {
                  setSelectedSkills(prev => prev.includes(skillId) ? prev.filter(s => s !== skillId) : [...prev, skillId]);
                }}
              />
            </Card>

            <Card variant="elevated" className="p-6">
              <h4 className="font-semibold text-signal-fg mb-4">Current Skill Levels</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(skills || []).map((skill: Skill) => (
                  <div
                    key={skill.id}
                    className={cn(
                      'p-4 rounded-lg border transition-all',
                      selectedSkills.length === 0 || selectedSkills.includes(skill.id)
                        ? 'bg-signal-accent/5 border-signal-accent/30'
                        : 'bg-signal-bg border-signal-border opacity-60'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: categoryColors[skill.category as keyof typeof categoryColors] }} />
                      <span className="text-sm font-medium text-signal-fg truncate">{skill.name}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-3xl font-bold text-signal-fg tabular-nums">{Math.round(skill.level)}</span>
                      <span className="text-xs text-signal-fgMuted">/100</span>
                    </div>
                    <div className="h-1.5 bg-signal-bg rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${skill.level}%`,
                          backgroundColor: categoryColors[skill.category as keyof typeof categoryColors],
                        }}
                      />
                    </div>
                    <p className="text-xs text-signal-fgMuted mt-2 capitalize">{skill.category.replace('-', '/')}</p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        );
      case 'timeline':
        return (
          <motion.div
            key="timeline"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="text-sm font-medium text-signal-fgMuted">Filter by Category</h3>
              <div className="flex items-center gap-2 flex-wrap">
                {availableTimelineCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedTimelineCategory(cat)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                      selectedTimelineCategory === cat
                        ? 'bg-signal-accent/10 border border-signal-accent/30 text-signal-accent'
                        : 'bg-signal-bgElevated border border-signal-border text-signal-fgMuted hover:border-signal-borderHover hover:text-signal-fg'
                    )}
                    style={{ borderColor: cat !== 'all' && selectedTimelineCategory === cat ? categoryColors[cat as Category] : undefined }}
                  >
                    {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <Card variant="elevated" className="p-0 overflow-hidden">
              <Timeline
                events={data.timelineEvents || []}
                selectedCategory={selectedTimelineCategory !== 'all' ? selectedTimelineCategory : undefined}
              />
            </Card>
          </motion.div>
        );
      case 'identity':
        return (
          <motion.div
            key="identity"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div>
                <h3 className="font-display text-2xl font-bold text-signal-fg">Digital Identity Card</h3>
                <p className="text-signal-fgMuted mt-1 text-sm">Shareable profile card with your digital fingerprint</p>
              </div>
              <Button variant="secondary" onClick={handleExportCard}>
                <Download className="w-4 h-4 mr-2" />
                Export as PNG
              </Button>
            </div>

            <IdentityCard
              ref={identityCardRef}
              archetype={archetype}
              signalScore={signalScore}
              digitalDNA={digitalDNA}
              momentum={momentum}
              peakHours={peakHours}
              username="medhashree"
            />

            <Card variant="elevated" className="p-6">
              <h4 className="font-semibold text-signal-fg mb-4">Digital DNA Breakdown</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {Object.entries(digitalDNA as unknown as Record<string, number>).map(([key, value]) => (
                  <div key={key} className="text-center p-4 bg-signal-bg border border-signal-border rounded-lg">
                    <p className="text-xs text-signal-fgSubtle uppercase tracking-wide mb-1">{key.charAt(0).toUpperCase() + key.slice(1)}</p>
                    <p className="font-display text-2xl font-bold text-signal-fg tabular-nums">{value}%</p>
                    <div className="h-1.5 bg-signal-bgElevated rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${value}%`,
                          backgroundColor: categoryColors[key as keyof typeof categoryColors] || '#00D4AA',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        );
      default:
        return null;
    }
  };

  // Build search results for the Search component
  const searchData = searchResults
    ? {
        activities: searchResults.activities?.map(a => ({ id: a.id, title: a.title, category: a.category, date: a.date })) || [],
        skills: searchResults.skills?.map(s => ({ id: s.id, name: s.name, category: s.category, level: Math.round(s.level) })) || [],
        timeline: searchResults.timeline?.map(t => ({ id: t.id, title: t.title, category: t.category, date: t.date, description: t.description })) || [],
        interests: searchResults.interests?.map(i => ({ id: i.id, name: i.name, category: i.category, strength: i.strength })) || [],
      }
    : {
        activities: (data.activities || []).slice(0, 8).map(a => ({ id: a.id, title: a.title, category: a.category, date: a.date })),
        skills: (data.skills || []).slice(0, 8).map(s => ({ id: s.id, name: s.name, category: s.category, level: Math.round(s.level) })),
        timeline: (data.timelineEvents || []).slice(0, 8).map(t => ({ id: t.id, title: t.title, category: t.category, date: t.date, description: t.description })),
        interests: (data.interests || []).slice(0, 8).map(i => ({ id: i.id, name: i.name, category: i.category, strength: i.strength })),
      };

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={onTabChange}
      sidebarCollapsed={sidebarCollapsed}
      onToggleSidebar={onToggleSidebar}
      filters={filters}
      onFilterChange={onFilterChange}
      onSearchOpen={onSearchOpen}
      onSearchClose={onSearchClose}
      searchQuery={filters.searchQuery}
      onSearchQueryChange={onSearchQueryChange}
      onSignOut={onSignOut}
    >
      <div className="pt-4 pb-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-signal-fg">{tabConfigs[activeTab].title}</h1>
          <p className="text-signal-fgMuted text-sm mt-1">{tabConfigs[activeTab].description}</p>
        </div>

        <AnimatePresence mode="wait">
          {renderTabContent()}
        </AnimatePresence>
      </div>

      <Search
        isOpen={searchOpen}
        onClose={onSearchClose}
        onResultClick={handleSearchResultClick}
        results={searchData}
        query={filters.searchQuery}
        onQueryChange={onSearchQueryChange}
      />
    </DashboardLayout>
  );
}