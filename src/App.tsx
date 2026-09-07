import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Landing } from './pages/Landing';
import { ImportPage } from './pages/ImportPage';
import { Dashboard } from './pages/Dashboard';
import { useSignalData } from './hooks';
import { useFilters } from './hooks';
import { useAnalytics } from './hooks';
import { useKeyboardShortcuts } from './hooks';
import { DemoData, NavItem, Activity, Skill, TimelineEvent, Interest } from './types';
import { cn } from './utils/helpers';

type AppState = 'landing' | 'import' | 'dashboard';

function App() {
  const {
    data,
    isLoading,
    error,
    hasLoadedData,
    loadDemoData,
    loadCustomData,
    clearData,
  } = useSignalData();

  const {
    filters,
    updateDateRange,
    toggleCategory,
    setCategories,
    setSearchQuery,
    clearFilters,
  } = useFilters();

  const analytics = useAnalytics(data, filters);

  const [appState, setAppState] = useState<AppState>('landing');
  const [activeTab, setActiveTab] = useState<NavItem>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQueryState] = useState('');

  const handleSearchOpen = useCallback(() => {
    setSearchOpen(true);
    setSearchQueryState(filters.searchQuery);
  }, [filters.searchQuery]);

  const handleSearchClose = useCallback(() => {
    setSearchOpen(false);
    setSearchQueryState('');
  }, []);

  const handleSearchQueryChange = useCallback((query: string) => {
    setSearchQueryState(query);
    setSearchQuery(query);
  }, [setSearchQuery]);

  const handleFilterChange = useMemo(() => ({
    updateDateRange,
    toggleCategory,
    setCategories,
    setSearchQuery,
    clearFilters,
  }), [updateDateRange, toggleCategory, setCategories, setSearchQuery, clearFilters]);

  useKeyboardShortcuts({
    openSearch: handleSearchOpen,
    closeSearch: handleSearchClose,
    closeModals: handleSearchClose,
    goToOverview: () => setActiveTab('overview'),
    goToActivity: () => setActiveTab('activity'),
    goToInterests: () => setActiveTab('interests'),
    goToSkills: () => setActiveTab('skills'),
    goToTimeline: () => setActiveTab('timeline'),
    goToIdentity: () => setActiveTab('identity'),
  });

  const renderContent = () => {
    switch (appState) {
      case 'landing':
        return (
          <AnimatePresence mode="wait">
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Landing
                onExploreDemo={() => {
                  loadDemoData();
                  setAppState('dashboard');
                }}
                onImportData={() => setAppState('import')}
              />
            </motion.div>
          </AnimatePresence>
        );

      case 'import':
        return (
          <AnimatePresence mode="wait">
            <motion.div
              key="import"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ImportPage
                onLoadDemo={() => {
                  loadDemoData();
                  setAppState('dashboard');
                }}
                onLoadCustom={(file) => {
                  loadCustomData(file);
                  setAppState('dashboard');
                }}
                isLoading={isLoading}
                error={error}
              />
            </motion.div>
          </AnimatePresence>
        );

      case 'dashboard':
        if (!hasLoadedData) {
          return (
            <AnimatePresence mode="wait">
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-h-screen flex items-center justify-center px-6"
              >
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-signal-accent/10 flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-signal-accent">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <h1 className="font-display text-3xl font-bold text-signal-fg mb-2">Your signal is quiet.</h1>
                  <p className="text-signal-fgMuted mb-6">No data loaded yet. Start by exploring the demo or importing your own data.</p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                      onClick={() => {
                        loadDemoData();
                        setAppState('dashboard');
                      }}
                      className="btn-primary px-6 py-3"
                    >
                      Load Demo Data
                    </button>
                    <button
                      onClick={() => setAppState('import')}
                      className="btn-secondary px-6 py-3"
                    >
                      Import Data
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          );
        }

        return (
          <AnimatePresence mode="wait">
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Dashboard
                data={data}
                analytics={analytics}
                filters={filters}
                onFilterChange={handleFilterChange}
                onSearchOpen={handleSearchOpen}
                onSearchClose={handleSearchClose}
                onSearchQueryChange={handleSearchQueryChange}
                searchResults={analytics.searchResults}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                sidebarCollapsed={sidebarCollapsed}
                onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
              />
            </motion.div>
          </AnimatePresence>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-signal-bg">
      {renderContent()}
    </div>
  );
}

export default App;