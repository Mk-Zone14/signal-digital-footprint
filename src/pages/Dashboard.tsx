import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '../components/DashboardLayout';
import { OverviewPage } from './OverviewPage';
import { ActivitiesPage } from './ActivitiesPage';
import { PatternsPage } from './PatternsPage';
import { TopicsPage } from './TopicsPage';
import { ProfilePage } from './ProfilePage';
import { SourcesPage } from './SourcesPage';
import { Search } from '../components/Search';
import {
  NavItem,
  Category,
  DateRange,
  Activity,
  Interest,
  Skill,
  DemoData,
  FilterState,
  SearchResult,
  V2Analytics,
  Connection,
  ManualActivityInput,
} from '../types';

const tabConfigs: Record<NavItem, { title: string; description: string }> = {
  overview: {
    title: 'Overview',
    description: 'What am I doing, and what changed?',
  },
  activities: {
    title: 'Activities',
    description: 'What exactly did I do? Ground-truth activity history',
  },
  patterns: {
    title: 'Patterns',
    description: 'What patterns exist across time? Hourly, weekday, and consistency metrics',
  },
  topics: {
    title: 'Topics',
    description: 'What do I keep returning to, growing into, or leaving behind?',
  },
  profile: {
    title: 'Profile',
    description: 'What does my activity history look like as a concise, shareable record?',
  },
  sources: {
    title: 'Sources',
    description: 'Manage how activities enter Signal',
  },
};

const EMPTY_ACTIVITIES: Activity[] = [];

export interface DashboardAnalytics {
  visibleActivities?: Activity[];
  /** @deprecated Temporary alias while callers migrate to visibleActivities. */
  filteredActivities?: Activity[];
  v2Analytics?: V2Analytics;
  searchResults: {
    activities: Activity[];
    skills: Skill[];
    timeline: Array<{ id: string; title: string; category: string; date: string; description: string }>;
    interests: Interest[];
  } | null;
  // Deprecated V1 compatibility fields
  signalScore?: any;
  archetype?: any;
  peakHours?: any;
  interests?: any;
  digitalDNA?: any;
  momentum?: any;
  skills?: any;
  heatmapData?: any;
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
  mode: 'demo' | 'account';
  displayName: string;
  connections: Connection[];
  writeError?: string | null;
  onCreateManual: (input: ManualActivityInput) => Promise<unknown>;
  onOpenImport: () => void;
  onRequestSignIn: () => void;
  accountSessionAvailable?: boolean;
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
  mode,
  displayName,
  connections,
  writeError,
  onCreateManual,
  onOpenImport,
  onRequestSignIn,
  accountSessionAvailable,
}: DashboardProps) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  // Normalize activeTab if legacy string passed in
  const normalizedTab: NavItem = useMemo(() => {
    switch (activeTab as string) {
      case 'activity':
      case 'timeline':
        return 'activities';
      case 'interests':
        return 'topics';
      case 'skills':
        return 'patterns';
      case 'identity':
        return 'profile';
      case 'overview':
      case 'activities':
      case 'patterns':
      case 'topics':
      case 'profile':
      case 'sources':
        return activeTab;
      default:
        return 'overview';
    }
  }, [activeTab]);

  const visibleActivities = analytics.visibleActivities ?? analytics.filteredActivities ?? EMPTY_ACTIVITIES;
  const { v2Analytics } = analytics;

  // Fallback safe analytics if not initialized
  const safeV2Analytics: V2Analytics = useMemo(() => {
    if (v2Analytics) return v2Analytics;
    return {
      totalActivities: visibleActivities.length,
      referenceDate: '',
      comparisonWindowDays: 30,
      activeDays: 0,
      dateRange: { start: null, end: null, startStr: '', endStr: '', totalDays: 0 },
      topTopics: [],
      topicIndex: [],
      categoryDistribution: [],
      activityChange: { currentCount: 0, previousCount: 0, absoluteChange: 0, percentChange: null, status: 'no activity' },
      topicTrends: [],
      peakHours: [],
      observedTimestampCount: 0,
      weekdayDistribution: [],
      consistencyStats: { activeDays: 0, totalDaysInRange: 0, activeDayRatio: 0, longestActiveDayStreak: 0, currentActiveDayStreak: 0, activeWeeks: 0, totalWeeks: 0 },
      activityGaps: [],
      topicCooccurrence: [],
    };
  }, [v2Analytics, visibleActivities]);

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
          <p className="text-signal-fgMuted text-sm">Loading activity data...</p>
        </div>
      </div>
    );
  }

  const handleSearchResultClick = (result: SearchResult) => {
    if (result.type === 'activity') {
      onTabChange('activities');
    }
    onSearchClose();
  };

  const handleSelectTopic = (topic: string | null) => {
    setSelectedTopic(topic);
    if (topic && normalizedTab !== 'topics') {
      onTabChange('topics');
    }
  };

  const currentTabConfig = tabConfigs[normalizedTab] || tabConfigs.overview;

  const renderTabContent = () => {
    switch (normalizedTab) {
      case 'overview':
        return (
          <OverviewPage
            activities={visibleActivities}
            v2Analytics={safeV2Analytics}
            onNavigateTab={onTabChange}
            onSelectTopic={handleSelectTopic}
          />
        );

      case 'activities':
        return (
          <ActivitiesPage
            activities={visibleActivities}
            allActivities={data.activities}
            selectedCategory={filters.categories.length === 1 ? filters.categories[0] : 'all'}
            onCategorySelect={cat => {
              if (cat === 'all') {
                onFilterChange.setCategories([]);
              } else {
                onFilterChange.setCategories([cat]);
              }
            }}
            selectedTopic={selectedTopic}
            onTopicSelect={setSelectedTopic}
            dateRange={filters.dateRange}
            onDateRangeChange={onFilterChange.updateDateRange}
          />
        );

      case 'patterns':
        return (
          <PatternsPage
            activities={visibleActivities}
            v2Analytics={safeV2Analytics}
            onSelectTopic={handleSelectTopic}
          />
        );

      case 'topics':
        return (
          <TopicsPage
            activities={visibleActivities}
            v2Analytics={safeV2Analytics}
            selectedTopic={selectedTopic}
            onSelectTopic={setSelectedTopic}
          />
        );

      case 'profile':
        return (
          <ProfilePage
            activities={visibleActivities}
            v2Analytics={safeV2Analytics}
            username={displayName}
          />
        );

      case 'sources':
        return (
          <SourcesPage
            mode={mode}
            connections={connections}
            writeError={writeError}
            onCreateManual={onCreateManual}
            onOpenImport={onOpenImport}
            onRequestSignIn={onRequestSignIn}
            accountSessionAvailable={accountSessionAvailable}
          />
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout
      activeTab={normalizedTab}
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
      displayName={displayName}
      mode={mode}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-2 border-b border-signal-border/40">
          <div>
            <h1 className="font-display text-2xl font-bold text-signal-fg tracking-tight">
              {currentTabConfig.title}
            </h1>
            <p className="text-xs text-signal-fgMuted mt-0.5">
              {currentTabConfig.description}
            </p>
          </div>
          {safeV2Analytics.referenceDate && (
            <p className="text-[11px] text-signal-fgSubtle font-mono">
              Analytics as of {safeV2Analytics.referenceDate}
            </p>
          )}
        </div>

        {/* Tab Page Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={normalizedTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Global Search Modal */}
      <Search
        isOpen={searchOpen}
        onClose={onSearchClose}
        onResultClick={handleSearchResultClick}
        results={searchResults}
        query={filters.searchQuery}
        onQueryChange={onSearchQueryChange}
      />
    </DashboardLayout>
  );
}
