import { useState, useCallback, useMemo, useEffect, useRef, type ComponentProps, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Landing } from './pages/Landing';
import { ImportPage } from './pages/ImportPage';
import { Dashboard } from './pages/Dashboard';
import { AuthPage } from './pages/AuthPage';
import { Button } from './components/ui/Button';
import { DashboardErrorBoundary } from './components/DashboardErrorBoundary';
import { useSignalData, useFilters, useAnalytics, useKeyboardShortcut } from './hooks';
import { useAuth } from './hooks/useAuth';
import { useAccountData } from './hooks/useAccountData';
import { SupabaseAuthService } from './platform/auth';
import { createAccountRepositories } from './platform/createAccountRepositories';
import { getSupabaseBrowserClient, isSupabaseConfigured } from './platform/supabase/browserClient';
import { validateImportedData, type ImportValidationResult } from './data/importData';
import type { ManualActivityInput, NavItem } from './types';

type AppState = 'landing' | 'import' | 'auth' | 'dashboard';
type DataMode = 'demo' | 'local' | 'account' | null;
const ACCOUNT_REFERENCE_DATE = new Date();

type AnalyticsDashboardProps = Omit<ComponentProps<typeof Dashboard>, 'analytics' | 'searchResults'> & { referenceDate: Date };

function AnalyticsDashboard({ data, filters, referenceDate, ...dashboardProps }: AnalyticsDashboardProps) {
  const analytics = useAnalytics(data, filters, referenceDate);
  return <Dashboard {...dashboardProps} data={data} filters={filters} analytics={analytics} searchResults={analytics.searchResults} />;
}

function FullPageStatus({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return (
    <main className="min-h-screen bg-signal-bg flex items-center justify-center p-6" role="status">
      <div className="card max-w-md p-6 text-center">
        <h1 className="text-xl font-semibold text-signal-fg">{title}</h1>
        <p className="mt-2 text-sm text-signal-fgMuted">{detail}</p>
        {action && <div className="mt-5 flex justify-center gap-3">{action}</div>}
      </div>
    </main>
  );
}

function App() {
  const local = useSignalData();
  const { filters, updateDateRange, toggleCategory, setCategories, setSearchQuery } = useFilters();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const authService = useMemo(() => supabase ? new SupabaseAuthService(supabase) : null, [supabase]);
  const auth = useAuth(authService);
  const repositories = useMemo(
    () => supabase && auth.session ? createAccountRepositories(supabase, auth.session) : null,
    [supabase, auth.session],
  );
  const account = useAccountData(auth.session, repositories);

  const [appState, setAppState] = useState<AppState>('landing');
  const [dataMode, setDataMode] = useState<DataMode>(null);
  const [activeTab, setActiveTab] = useState<NavItem>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const restoredUserId = useRef<string | null>(null);

  useEffect(() => {
    if (auth.status === 'signed_in' && auth.session && restoredUserId.current !== auth.session.user.id) {
      restoredUserId.current = auth.session.user.id;
      setDataMode('account');
      setAppState('dashboard');
    } else if (auth.status === 'signed_out' && restoredUserId.current) {
      restoredUserId.current = null;
      setDataMode(null);
      setAppState('landing');
    }
  }, [auth.status, auth.session]);

  const resetView = useCallback(() => {
    setActiveTab('overview');
    setSearchOpen(false);
    setSearchQuery('');
    setCategories([]);
    updateDateRange('all');
  }, [setSearchQuery, setCategories, updateDateRange]);

  const enterDemo = useCallback(() => {
    local.loadDemoData();
    resetView();
    setDataMode('demo');
    setAppState('dashboard');
  }, [local, resetView]);

  const handleExitOrSignOut = useCallback(async () => {
    resetView();
    if (dataMode === 'account') {
      await auth.signOut();
      setDataMode(null);
      setAppState('landing');
    } else if (auth.session) {
      setDataMode('account');
      setAppState('dashboard');
    } else {
      setDataMode(null);
      setAppState('landing');
    }
  }, [auth, dataMode, resetView]);

  const loadImport = useCallback(async (payload: unknown): Promise<ImportValidationResult> => {
    setImportError(null);
    const result = validateImportedData(payload);
    if (!result.ok) return result;
    if (dataMode === 'account') {
      try {
        await account.persistImport(result.value.data.activities, 'json');
        setAppState('dashboard');
      } catch (cause) {
        setImportError(cause instanceof Error ? cause.message : 'Signal could not persist the import.');
      }
      return result;
    }
    const localResult = local.loadCustomData(payload);
    if (localResult.ok) {
      setDataMode('local');
      setAppState('dashboard');
    }
    return localResult;
  }, [account, dataMode, local]);

  const handleManual = useCallback(async (input: ManualActivityInput) => {
    if (dataMode !== 'account') throw new Error('Sign in to save a manual activity.');
    return account.createManualActivity(input);
  }, [account, dataMode]);

  const handleSearchClose = useCallback(() => { setSearchOpen(false); setSearchQuery(''); }, [setSearchQuery]);
  const handleFilterChange = useMemo(() => ({ updateDateRange, toggleCategory, setCategories, setSearchQuery }), [updateDateRange, toggleCategory, setCategories, setSearchQuery]);
  const handleSearchOpen = useCallback(() => setSearchOpen(true), []);
  useKeyboardShortcut('/', handleSearchOpen);

  if (auth.status === 'loading') {
    return <FullPageStatus title="Restoring your Signal session" detail="Checking for an existing account session…" />;
  }

  if (auth.status === 'error' && appState !== 'auth') {
    return (
      <FullPageStatus
        title="Signal could not restore your session"
        detail={auth.error ?? 'Authentication is temporarily unavailable.'}
        action={<><Button onClick={() => setAppState('auth')}>Try sign in</Button><Button variant="secondary" onClick={enterDemo}>Explore demo</Button></>}
      />
    );
  }

  if (dataMode === 'account' && account.status === 'error') {
    return (
      <FullPageStatus
        title="Your activity could not be loaded"
        detail={account.error ?? 'The account database is temporarily unavailable.'}
        action={<><Button onClick={() => void account.reload()}>Retry</Button><Button variant="secondary" onClick={() => void handleExitOrSignOut()}>Sign out</Button></>}
      />
    );
  }

  const activeData = dataMode === 'account' ? account.data : local.data;
  const activeLoading = dataMode === 'account' ? account.status === 'loading' : local.isLoading;
  const referenceDate = dataMode === 'account' ? ACCOUNT_REFERENCE_DATE : local.referenceDate;
  const displayName = dataMode === 'account' ? account.displayName : dataMode === 'local' ? 'Local data' : 'Signal Demo';

  const content = (() => {
    if (appState === 'auth') {
      return <AuthPage configured={isSupabaseConfigured} error={auth.error} magicLinkSentTo={auth.magicLinkSentTo} onSignIn={auth.signIn} onBack={() => setAppState('landing')} />;
    }
    if (appState === 'import') {
      return (
        <ImportPage
          onLoadDemo={enterDemo}
          onLoadCustom={loadImport}
          onBack={() => setAppState(dataMode === 'account' ? 'dashboard' : 'landing')}
          isLoading={false}
          error={importError}
        />
      );
    }
    if (appState === 'dashboard' && dataMode) {
      return (
        <DashboardErrorBoundary onLoadDemo={enterDemo} onReturnToImport={() => setAppState('import')}>
          <AnalyticsDashboard
            data={activeData}
            filters={filters}
            referenceDate={referenceDate}
            onFilterChange={handleFilterChange}
            searchOpen={searchOpen}
            onSearchOpen={handleSearchOpen}
            onSearchClose={handleSearchClose}
            onSearchQueryChange={setSearchQuery}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={() => setSidebarCollapsed(previous => !previous)}
            onSignOut={() => void handleExitOrSignOut()}
            isLoading={activeLoading}
            mode={dataMode === 'account' ? 'account' : 'demo'}
            displayName={displayName}
            connections={dataMode === 'account' ? account.connections : []}
            writeError={account.writeError}
            onCreateManual={handleManual}
            onOpenImport={() => setAppState('import')}
            onRequestSignIn={() => {
              if (auth.session) {
                setDataMode('account');
                setAppState('dashboard');
              } else {
                setAppState('auth');
              }
            }}
            accountSessionAvailable={Boolean(auth.session)}
          />
        </DashboardErrorBoundary>
      );
    }
    return <Landing onExploreDemo={enterDemo} onImportData={() => { setDataMode(null); setAppState('import'); }} onSignIn={() => setAppState('auth')} />;
  })();

  return <div className="min-h-screen bg-signal-bg"><AnimatePresence mode="wait"><motion.div key={appState} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{content}</motion.div></AnimatePresence></div>;
}

export default App;
