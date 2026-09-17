import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { FilterBar } from './FilterBar';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Search, Menu, Settings, User, ChevronDown, LogOut } from 'lucide-react';
import { NavItem, Category, DateRange } from '../types';
import { useMediaQuery } from '../hooks';

interface DashboardLayoutProps {
  children: ReactNode;
  activeTab: NavItem;
  onTabChange: (tab: NavItem) => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  filters: {
    dateRange: DateRange;
    categories: Category[];
    searchQuery: string;
  };
  onFilterChange: {
    updateDateRange: (range: DateRange) => void;
    toggleCategory: (category: Category) => void;
    setCategories: (categories: Category[]) => void;
    setSearchQuery: (query: string) => void;
  };
  onSearchOpen: () => void;
  onSearchClose: () => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSignOut: () => void;
  displayName: string;
  mode: 'demo' | 'account';
}

export function DashboardLayout({
  children,
  activeTab,
  onTabChange,
  sidebarCollapsed,
  onToggleSidebar,
  filters,
  onFilterChange,
  onSearchOpen,
  searchQuery,
  onSearchQueryChange,
  onSignOut,
  displayName,
  mode,
}: DashboardLayoutProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 1023px)');

  const sidebarWidth = isMobile ? 0 : (sidebarCollapsed ? 64 : 256);

  return (
    <div className="min-h-screen bg-signal-bg">
      {/* Desktop sidebar */}
      {!isMobile && (
        <Sidebar
          activeTab={activeTab}
          onTabChange={onTabChange}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={onToggleSidebar}
          displayName={displayName}
          mode={mode}
        />
      )}

      {/* Mobile sidebar overlay */}
      {isMobile && mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64">
            <Sidebar
              activeTab={activeTab}
              onTabChange={(tab) => {
                onTabChange(tab);
                setMobileMenuOpen(false);
              }}
              isCollapsed={false}
              onToggleCollapse={() => setMobileMenuOpen(false)}
              displayName={displayName}
              mode={mode}
            />
          </div>
        </>
      )}

      <div
        className="transition-all duration-300 min-h-screen"
        style={{ marginLeft: `${sidebarWidth}px` }}
      >
        <header className="sticky top-0 z-30 min-h-[4rem] py-2 bg-signal-bg/80 backdrop-blur-sm border-b border-signal-border flex items-center justify-between px-4 sm:px-6 gap-4">
          <div className="flex items-center gap-3">
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </Button>
            )}

            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-signal-fgSubtle" />
              <Input
                type="text"
                placeholder="Search... (press /)"
                value={searchQuery}
                onChange={e => onSearchQueryChange(e.target.value)}
                onFocus={onSearchOpen}
                className="w-64 pl-10 pr-10 bg-signal-bgElevated border-signal-border"
                aria-label="Search activities"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-signal-bg border border-signal-border rounded text-[10px] text-signal-fgSubtle font-mono">/</kbd>
            </div>

            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSearchOpen}
                aria-label="Open search"
                className="sm:hidden"
              >
                <Search className="w-5 h-5" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <FilterBar
                dateRange={filters.dateRange}
                onDateRangeChange={onFilterChange.updateDateRange}
                selectedCategories={filters.categories}
                onCategoryToggle={onFilterChange.toggleCategory}
                onClearAll={() => {
                  onFilterChange.setCategories([]);
                  onFilterChange.setSearchQuery('');
                }}
                hasActiveFilters={filters.categories.length > 0 || filters.searchQuery.length > 0}
              />
            </div>

            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2"
                aria-label="Profile menu"
                aria-expanded={showProfileMenu}
              >
                <div className="w-8 h-8 rounded-full bg-signal-accent/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-signal-accent" />
                </div>
                <span className="hidden sm:block font-medium text-signal-fg text-sm">{displayName}</span>
                <ChevronDown className="w-4 h-4 text-signal-fgMuted hidden sm:block" />
              </Button>

              {showProfileMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} aria-hidden="true" />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-signal-bgElevated border border-signal-border rounded-xl shadow-elevated py-2 z-50" role="menu">
                    <button
                      className="w-full px-4 py-2.5 text-left text-sm text-signal-fg hover:bg-signal-bg flex items-center gap-3 transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                      role="menuitem"
                    >
                      <Settings className="w-4 h-4 text-signal-fgMuted" />
                      Settings
                    </button>
                    <button
                      className="w-full px-4 py-2.5 text-left text-sm text-signal-fg hover:bg-signal-bg flex items-center gap-3 transition-colors"
                      onClick={() => {
                        setShowProfileMenu(false);
                        onTabChange('profile');
                      }}
                      role="menuitem"
                    >
                      <User className="w-4 h-4 text-signal-fgMuted" />
                      Profile
                    </button>
                    <hr className="my-2 border-signal-border" />
                    <button
                      className="w-full px-4 py-2.5 text-left text-sm text-signal-danger hover:bg-signal-bg flex items-center gap-3 transition-colors"
                      onClick={() => {
                        setShowProfileMenu(false);
                        onSignOut();
                      }}
                      role="menuitem"
                    >
                      <LogOut className="w-4 h-4" />
                      {mode === 'account' ? 'Sign out' : 'Exit demo'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Mobile filter bar */}
        {isMobile && (filters.categories.length > 0 || filters.searchQuery.length > 0) && (
          <div className="px-4 py-2 border-b border-signal-border bg-signal-bg/50">
            <FilterBar
              dateRange={filters.dateRange}
              onDateRangeChange={onFilterChange.updateDateRange}
              selectedCategories={filters.categories}
              onCategoryToggle={onFilterChange.toggleCategory}
              onClearAll={() => {
                onFilterChange.setCategories([]);
                onFilterChange.setSearchQuery('');
              }}
              hasActiveFilters={true}
              compact
            />
          </div>
        )}

        <main className="p-4 sm:p-6 lg:p-8" role="main">
          {children}
        </main>
      </div>
    </div>
  );
}
