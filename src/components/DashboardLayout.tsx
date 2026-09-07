import { ReactNode, useState } from 'react';
import { cn } from '../utils/helpers';
import { Sidebar } from './Sidebar';
import { FilterBar } from './FilterBar';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Search, Filter, Menu, X, Bell, Settings, User, ChevronDown } from 'lucide-react';
import { NavItem, Category, DateRange } from '../types';

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
  onSearchClose,
  searchQuery,
  onSearchQueryChange,
}: DashboardLayoutProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <div className="min-h-screen bg-signal-bg">
      <Sidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={onToggleSidebar}
      />

      <div
        className={cn(
          'transition-all duration-300 min-h-screen',
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        <header className="sticky top-0 z-30 h-16 bg-signal-bg/80 backdrop-blur-sm border-b border-signal-border flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={onToggleSidebar}
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </Button>

            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-signal-fgSubtle" />
              <Input
                type="text"
                placeholder="Search... (press /)"
                value={searchQuery}
                onChange={e => onSearchQueryChange(e.target.value)}
                onFocus={onSearchOpen}
                className="w-64 pl-10 pr-10 bg-signal-bgElevated border-signal-border"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-signal-bg border border-signal-border rounded text-[10px] text-signal-fgSubtle font-mono">/</kbd>
            </div>
          </div>

          <div className="flex items-center gap-2">
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

            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-signal-danger rounded-full" />
            </Button>

            <div className="relative">
              <Button variant="ghost" size="sm" onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-signal-accent/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-signal-accent" />
                </div>
                <span className="hidden sm:block font-medium text-signal-fg">medhashree</span>
                <ChevronDown className="w-4 h-4 text-signal-fgMuted" />
              </Button>

              {showProfileMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 card-elevated py-2 z-50 animate-in">
                    <button className="w-full px-4 py-2 text-left text-sm text-signal-fg hover:bg-signal-bgElevated flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm text-signal-fg hover:bg-signal-bgElevated flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Profile
                    </button>
                    <hr className="my-2 border-signal-border" />
                    <button className="w-full px-4 py-2 text-left text-sm text-signal-danger hover:bg-signal-bgElevated flex items-center gap-2">
                      <X className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="p-6 lg:p-8" role="main">
          {children}
        </main>
      </div>
    </div>
  );
}