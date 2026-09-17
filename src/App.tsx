import { useState, useCallback, useMemo, type ComponentProps } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Landing } from './pages/Landing';
import { ImportPage } from './pages/ImportPage';
import { Dashboard } from './pages/Dashboard';
import { DashboardErrorBoundary } from './components/DashboardErrorBoundary';
import { useSignalData, useFilters, useAnalytics, useKeyboardShortcut } from './hooks';
import { NavItem } from './types';

type AppState = 'landing' | 'import' | 'dashboard';

type AnalyticsDashboardProps = Omit<
  ComponentProps<typeof Dashboard>,
  'analytics' | 'searchResults'
> & { referenceDate: Date };

function AnalyticsDashboard({ data, filters, referenceDate, ...dashboardProps }: AnalyticsDashboardProps) {
  const analytics = useAnalytics(data, filters, referenceDate);

  return (
    <Dashboard
      {...dashboardProps}
      data={data}
      filters={filters}
      analytics={analytics}
      searchResults={analytics.searchResults}
    />
  );
}

function App() {
  const {
    data,
    isLoading,
    referenceDate,
    loadDemoData,
    loadCustomData,
  } = useSignalData();

  const {
    filters,
    updateDateRange,
    toggleCategory,
    setCategories,
    setSearchQuery,
  } = useFilters();

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

  const handleRecoverWithDemo = useCallback(() => {
    loadDemoData();
    setActiveTab('overview');
    setSearchOpen(false);
    setSearchQuery('');
    setCategories([]);
    updateDateRange('all');
    setAppState('dashboard');
  }, [loadDemoData, setSearchQuery, setCategories, updateDateRange]);

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
                onLoadCustom={(customData: unknown) => {
                  const result = loadCustomData(customData);
                  if (result.ok) setAppState('dashboard');
                  return result;
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
              <DashboardErrorBoundary
                onLoadDemo={handleRecoverWithDemo}
                onReturnToImport={() => setAppState('import')}
              >
                <AnalyticsDashboard
                  data={data}
                  filters={filters}
                  referenceDate={referenceDate}
                  onFilterChange={handleFilterChange}
                  searchOpen={searchOpen}
                  onSearchOpen={handleSearchOpen}
                  onSearchClose={handleSearchClose}
                  onSearchQueryChange={handleSearchQueryChange}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  sidebarCollapsed={sidebarCollapsed}
                  onToggleSidebar={() => setSidebarCollapsed(prev => !prev)}
                  onSignOut={handleSignOut}
                  isLoading={isLoading}
                />
              </DashboardErrorBoundary>
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
