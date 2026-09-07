import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '../components/DashboardLayout';
import { MetricCard } from '../components/MetricCard';
import { Heatmap } from '../charts/Heatmap';
import { PeakHours } from '../charts/PeakHours';
import { InterestConstellation } from '../charts/InterestConstellation';
import { SkillEvolution } from '../charts/SkillEvolution';
import { DigitalDNA } from '../charts/DigitalDNA';
import { Timeline } from '../components/Timeline';
import { IdentityCard } from '../components/IdentityCard';
import { Search } from '../components/Search';
import { FilterBar } from '../components/FilterBar';
import { Sidebar } from '../components/Sidebar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { formatDuration, formatMonthYear, getRelativeTime } from '../utils/helpers';
import { categoryColors } from '../analytics';
import { Filter, ChevronDown, Menu, X, Download, Settings, Bell, User, Sun, Moon, Search as SearchIcon } from 'lucide-react';
import { NavItem, Category, DateRange, Activity, TimelineEvent, Interest, Skill } from '../types';
import { cn } from '../utils/helpers';

const tabConfigs: Record<NavItem, { title: string; description: string }> = {
  overview: { title: 'Overview', description: 'Your digital signal at a glance' },
  activity: { title: 'Activity', description: 'Heatmap, peak hours, and patterns' },
  interests: { title: 'Interests', description: 'Constellation and interest breakdown' },
  skills: { title: 'Skills', description: 'Skill evolution and progression' },
  timeline: { title: 'Timeline', description: 'Milestones and achievements' },
  identity: { title: 'Identity', description: 'Digital identity card and DNA' },
};

export function Dashboard({
  data,
  analytics,
  filters,
  onFilterChange,
  onSearchOpen,
  onSearchClose,
  onSearchQueryChange,
  searchResults,
  activeTab,
  onTabChange,
  sidebarCollapsed,
  onToggleSidebar,
}: {
  data: any;
  analytics: any;
  filters: any;
  onFilterChange: any;
  onSearchOpen: () => void;
  onSearchClose: () => void;
  onSearchQueryChange: (query: string) => void;
  searchResults: any;
  activeTab: NavItem;
  onTabChange: (tab: NavItem) => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}) {
  const [selectedHeatmapCategory, setSelectedHeatmapCategory] = useState<Category | 'all'>('all');
  const [selectedTimelineCategory, setSelectedTimelineCategory] = useState<Category | 'all'>('all');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const { signalScore, archetype, peakHours, digitalDNA, momentum, interests, skills, heatmapData, filteredActivities } = analytics;

  const renderTabContent = useCallback(() => {
    switch (activeTab) {
      case 'overview':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card variant="elevated" className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className="text-xs text-signal-fgSubtle uppercase tracking-widest font-medium mb-2">YOUR DIGITAL SIGNAL</p>
                      <h2 className="font-display text-3xl font-bold text-signal-fg mb-2">{archetype.name}</h2>
                      <p className="text-signal-fgMuted max-w-xl">{archetype.description}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="accent" size="md" className="font-mono text-lg px-4 py-2">
                        {archetype.confidence}% Confidence
                      </Badge>
                      <div className="flex flex-wrap gap-1 mt-3 justify-end">
{archetype.primaryTraits.map((trait: string) => (
                            <Badge key={trait} variant="muted" size="sm">{trait}</Badge>
                          ))}
                      </div>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-signal-border">
                    <p className="text-xs text-signal-fgSubtle uppercase tracking-wide mb-4">Primary Traits</p>
                    <div className="flex flex-wrap gap-2">
                      {archetype.primaryTraits.map((trait: string) => (
                        <Badge key={trait} variant="accent" size="sm" dot dotColor="#00D4AA">{trait}</Badge>
                      ))}
                    </div>
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
                          vs last month: {momentum.previous >= 0 ? '+' : ''}{momentum.previous}%
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-signal-bg border border-signal-border rounded-lg">
                          <p className="text-xs text-signal-fgSubtle">Strongest Growth</p>
                          <p className="font-medium text-signal-fg">{momentum.strongestGrowthArea.category}</p>
                          <p className="text-xs text-signal-accent font-mono">{momentum.strongestGrowthArea.growth >= 0 ? '+' : ''}{momentum.strongestGrowthArea.growth}%</p>
                        </div>
                        <div className="p-3 bg-signal-bg border border-signal-border rounded-lg">
                          <p className="text-xs text-signal-fgSubtle">Most Consistent</p>
                          <p className="font-medium text-signal-fg">{momentum.mostConsistentActivity.category}</p>
                          <p className="text-xs text-signal-fgMuted font-mono">{momentum.mostConsistentActivity.consistency}% of days</p>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-signal-border">
                        <p className="text-xs text-signal-fgSubtle mb-2">90-Day Projection (Estimate)</p>
                        <div className="h-24 bg-signal-bg border border-signal-border rounded-lg flex items-center justify-center">
                          <span className="text-signal-fgSubtle text-sm">[ Projected trajectory chart ]</span>
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
                    <MetricCard label="Activity" value={signalScore.activity} suffix="%" icon={<div className="w-5 h-5 bg-signal-accent/20 rounded-lg flex items-center justify-center"><span className="text-signal-accent text-[10px]">⚡</span></div>} />
                    <MetricCard label="Consistency" value={signalScore.consistency} suffix="%" icon={<div className="w-5 h-5 bg-signal-accent/20 rounded-lg flex items-center justify-center"><span className="text-signal-accent text-[10px]">📅</span></div>} />
                    <MetricCard label="Exploration" value={signalScore.exploration} suffix="%" icon={<div className="w-5 h-5 bg-signal-accent/20 rounded-lg flex items-center justify-center"><span className="text-signal-accent text-[10px]">🔭</span></div>} />
                    <MetricCard label="Momentum" value={momentum.current >= 0 ? `+${momentum.current}` : momentum.current} suffix="%" icon={<div className="w-5 h-5 bg-signal-accent/20 rounded-lg flex items-center justify-center"><span className="text-signal-accent text-[10px]">📈</span></div>} />
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
                      { label: 'Total Activities', value: filteredActivities.length },
                      { label: 'Active Days', value: new Set(filteredActivities.map((a: Activity) => a.date)).size },
                      { label: 'Total Hours', value: formatDuration(filteredActivities.reduce((s: number, a: Activity) => s + a.duration, 0)) },
                      { label: 'Categories', value: new Set(filteredActivities.map((a: Activity) => a.category)).size },
                      { label: 'Avg Session', value: formatDuration(Math.round(filteredActivities.reduce((s: number, a: Activity) => s + a.duration, 0) / Math.max(1, filteredActivities.length))) },
                      { label: 'Avg Impact', value: Math.round(filteredActivities.reduce((s: number, a: Activity) => s + a.impactScore, 0) / Math.max(1, filteredActivities.length)) },
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-signal-fgMuted">Filter Heatmap</h3>
              <div className="flex items-center gap-2">
                {['all', 'coding', 'ai-ml', 'finance', 'filmmaking', 'reading', 'learning', 'social', 'projects'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedHeatmapCategory(cat as any)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                      selectedHeatmapCategory === cat
                        ? 'bg-signal-accent/10 border border-signal-accent/30 text-signal-accent'
                        : 'bg-signal-bgElevated border border-signal-border text-signal-fgMuted hover:border-signal-borderHover hover:text-signal-fg'
                    )}
                    style={{ borderColor: cat !== 'all' ? categoryColors[cat as Category] : undefined }}
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
                onDayClick={(date, dayData) => {
                  console.log('Day clicked:', date, dayData);
                }}
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
                    selectedInterest={analytics.selectedInterest}
                    onInterestClick={(interest) => {
                      console.log('Interest clicked:', interest);
                    }}
                  />
                </Card>
              </div>
              <div className="space-y-4">
                <Card variant="elevated" className="p-4">
                  <h4 className="font-semibold text-signal-fg mb-3">Interest Breakdown</h4>
                  <div className="space-y-3">
                    {interests.slice(0, 10).map((interest: Interest) => (
                      <div key={interest.id} className="group">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: categoryColors[interest.category as keyof typeof categoryColors] }} />
                            <span className="text-sm font-medium text-signal-fg truncate max-w-[150px]">{interest.name}</span>
                            <Badge variant="muted" size="sm">{interest.category}</Badge>
                          </div>
                          <span className="font-mono text-signal-accent text-sm">{interest.strength}%</span>
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
                            {interest.growth >= 0 ? '+' : ''}{interest.growth}% growth
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card variant="elevated" className="p-4">
                  <h4 className="font-semibold text-signal-fg mb-3">Interest Relationships</h4>
                  <div className="space-y-2">
                    {interests.flatMap((i: Interest) => i.relatedInterests.slice(0, 2).map((r: string) => ({ source: i.name, target: r }))).slice(0, 8).map((rel: { source: string; target: string }, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-signal-fgMuted">
                        <span className="w-1.5 h-1.5 rounded-full bg-signal-accent" />
                        <span className="font-medium text-signal-fg">{rel.source}</span>
                        <span className="text-signal-fgSubtle">→</span>
                        <span className="font-medium text-signal-fg">{rel.target}</span>
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <Card variant="elevated" className="p-6">
              <SkillEvolution
                skills={skills}
                selectedSkills={selectedSkills}
                onSkillToggle={(skillId) => {
                  setSelectedSkills(prev => prev.includes(skillId) ? prev.filter(s => s !== skillId) : [...prev, skillId]);
                }}
              />
            </Card>

            <Card variant="elevated" className="p-6">
              <h4 className="font-semibold text-signal-fg mb-4">Current Skill Levels</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {skills.map((skill: Skill) => (
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
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: categoryColors[skill.category as keyof typeof categoryColors] }} />
                      <span className="text-sm font-medium text-signal-fg truncate">{skill.name}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-3xl font-bold text-signal-fg">{skill.level}</span>
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
                    <p className="text-xs text-signal-fgMuted mt-2">{skill.category}</p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        );
      case 'timeline':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="text-sm font-medium text-signal-fgMuted">Filter by Category</h3>
              <div className="flex items-center gap-2 flex-wrap">
                {['all', 'coding', 'ai-ml', 'finance', 'filmmaking', 'reading', 'learning', 'social', 'projects'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedTimelineCategory(cat as any)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                      selectedTimelineCategory === cat
                        ? 'bg-signal-accent/10 border border-signal-accent/30 text-signal-accent'
                        : 'bg-signal-bgElevated border border-signal-border text-signal-fgMuted hover:border-signal-borderHover hover:text-signal-fg'
                    )}
                    style={{ borderColor: cat !== 'all' ? categoryColors[cat as Category] : undefined }}
                  >
                    {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <Card variant="elevated" className="p-0 overflow-hidden">
              <Timeline
                events={data.timelineEvents}
                selectedCategory={selectedTimelineCategory !== 'all' ? selectedTimelineCategory : undefined}
                onEventClick={(event) => console.log('Event clicked:', event)}
              />
            </Card>
          </motion.div>
        );
      case 'identity':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display text-2xl font-bold text-signal-fg">Digital Identity Card</h3>
                <p className="text-signal-fgMuted mt-1">Shareable profile card with your digital fingerprint</p>
              </div>
              <Button variant="secondary" onClick={() => console.log('Export card')}>
                <Download className="w-4 h-4 mr-2" />
                Export as PNG
              </Button>
            </div>

            <IdentityCard
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
                {Object.entries(digitalDNA as Record<string, number>).map(([key, value]) => (
                  <div key={key} className="text-center p-4 bg-signal-bg border border-signal-border rounded-lg">
                    <p className="text-xs text-signal-fgSubtle uppercase tracking-wide mb-1">{key.charAt(0).toUpperCase() + key.slice(1)}</p>
                    <p className="font-display text-3xl font-bold text-signal-fg">{value}%</p>
                    <div className="h-2 bg-signal-bg rounded-full overflow-hidden mt-2">
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
  }, [activeTab, analytics, data, filteredActivities, signalScore, archetype, peakHours, digitalDNA, momentum, interests, skills, heatmapData, selectedHeatmapCategory, selectedTimelineCategory, selectedSkills]);

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
        isOpen={!!searchResults}
        onClose={onSearchClose}
        onResultClick={(result) => console.log('Search result:', result)}
        results={{
          activities: data.activities.slice(0, 10).map((a: Activity) => ({ id: a.id, title: a.title, category: a.category, date: a.date })),
          skills: data.skills.slice(0, 10).map((s: Skill) => ({ id: s.id, name: s.name, category: s.category, level: s.level })),
          timeline: data.timelineEvents.slice(0, 10).map((t: TimelineEvent) => ({ id: t.id, title: t.title, category: t.category, date: t.date, description: t.description })),
          interests: data.interests.slice(0, 10).map((i: Interest) => ({ id: i.id, name: i.name, category: i.category, strength: i.strength })),
        }}
        query={filters.searchQuery}
        onQueryChange={onSearchQueryChange}
      />
    </DashboardLayout>
  );
}