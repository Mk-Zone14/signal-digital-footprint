import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Landing } from './pages/Landing';
import { ImportPage } from './pages/ImportPage';
import { Dashboard } from './pages/Dashboard';
import { useSignalData, useFilters, useAnalytics, useKeyboardShortcut } from './hooks';
import { DemoData, NavItem } from './types';

type AppState = 'landing' | 'import' | 'dashboard';

function App() {
  const {
    data,
    isLoading,
    isCustomData,
    loadDemoData,
    loadCustomData,
    exportData,
  } = useSignalData();

  const {
    filters,
    updateDateRange,
    toggleCategory,
    setCategories,
    setSearchQuery,
  } = useFilters();

  const analytics = useAnalytics(data, filters);

  const [appState, setAppState] = useState<AppState>('landing');
  const [activeTab, setActiveTab] = useState<NavItem>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleSearchOpen = useCallback(() => {
    setSearchOpen(true);
  }, []);

  const handleSearchClose = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery('');
  }, [setSearchQuery]);

  const handleSearchQueryChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, [setSearchQuery]);

  const handleSignOut = useCallback(() => {
    setAppState('landing');
    setActiveTab('overview');
    setSearchOpen(false);
    setSearchQuery('');
    setCategories([]);
  }, [setSearchQuery, setCategories]);

  const handleFilterChange = useMemo(() => ({
    updateDateRange,
    toggleCategory,
    setCategories,
    setSearchQuery,
  }), [updateDateRange, toggleCategory, setCategories, setSearchQuery]);

  // Keyboard shortcut: "/" opens search
  useKeyboardShortcut('/', handleSearchOpen);

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
                onLoadCustom={(customData: DemoData) => {
                  loadCustomData(customData);
                  setAppState('dashboard');
                }}
                onBack={() => setAppState('landing')}
                isLoading={isLoading}
                error={null}
              />
            </motion.div>
          </AnimatePresence>
        );

      case 'dashboard':
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
                searchOpen={searchOpen}
                onSearchOpen={handleSearchOpen}
                onSearchClose={handleSearchClose}
                onSearchQueryChange={handleSearchQueryChange}
                searchResults={analytics.searchResults}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                sidebarCollapsed={sidebarCollapsed}
                onToggleSidebar={() => setSidebarCollapsed(prev => !prev)}
                onSignOut={handleSignOut}
                isLoading={isLoading}
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