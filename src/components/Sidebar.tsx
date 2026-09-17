import { cn } from '../utils/helpers';
import { NavItem } from '../types';
import { Button } from './ui/Button';
import { LayoutDashboard, ListOrdered, Clock, Hash, User, ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarProps {
  activeTab: NavItem;
  onTabChange: (tab: NavItem) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

const navItems: { id: NavItem; label: string; icon: React.ReactNode; shortcut: string }[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" />, shortcut: '⌘1' },
  { id: 'activities', label: 'Activities', icon: <ListOrdered className="w-5 h-5" />, shortcut: '⌘2' },
  { id: 'patterns', label: 'Patterns', icon: <Clock className="w-5 h-5" />, shortcut: '⌘3' },
  { id: 'topics', label: 'Topics', icon: <Hash className="w-5 h-5" />, shortcut: '⌘4' },
  { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" />, shortcut: '⌘5' },
];

export function Sidebar({ activeTab, onTabChange, isCollapsed = false, onToggleCollapse, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-full bg-signal-bg border-r border-signal-border transition-all duration-300 flex flex-col',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-signal-border">
        {!isCollapsed && (
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
        )}
        {isCollapsed && (
          <div className="w-8 h-8 rounded-lg bg-signal-accent/20 flex items-center justify-center mx-auto">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-signal-accent">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className={cn('flex-shrink-0', isCollapsed ? 'mx-auto' : '')}
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </Button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" role="navigation" aria-label="Main navigation">
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-accent focus-visible:ring-offset-2 focus-visible:ring-offset-signal-bg',
                isActive
                  ? 'bg-signal-accent/10 text-signal-accent border border-signal-accent/20'
                  : 'text-signal-fgMuted hover:text-signal-fg hover:bg-signal-bgElevated'
              )}
              style={{ minWidth: isCollapsed ? '40px' : 'auto' }}
            >
              <span className="flex-shrink-0" aria-hidden="true">{item.icon}</span>
              {!isCollapsed && (
                <>
                  <span className="font-medium">{item.label}</span>
                  <span className="ml-auto text-[10px] text-signal-fgSubtle font-mono">{item.shortcut}</span>
                </>
              )}
            </button>
          );
        })}
      </nav>

      {!isCollapsed && (
        <div className="p-4 border-t border-signal-border">
          <div className="flex items-center gap-3 p-2 bg-signal-bgElevated border border-signal-border rounded-lg">
            <div className="w-8 h-8 rounded-lg bg-signal-accent/20 flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-signal-accent">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-signal-fg truncate">medhashree</p>
              <p className="text-[10px] text-signal-fgSubtle font-mono">Activity Record</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}