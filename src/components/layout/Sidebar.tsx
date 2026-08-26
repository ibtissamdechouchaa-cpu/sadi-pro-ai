import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Search,
  Cpu,
  Shield,
  Users,
  Settings,
  BarChart3,
  FileStack,
  Sparkles,
  Bell,
  Trash2,
  Activity,
  Workflow,
} from 'lucide-react';

export type PageKey =
  | 'dashboard'
  | 'documents'
  | 'collections'
  | 'search'
  | 'processing'
  | 'workflows'
  | 'compliance'
  | 'team'
  | 'analytics'
  | 'notifications'
  | 'activity'
  | 'trash'
  | 'settings';

interface SidebarProps {
  current: PageKey;
  onNavigate: (page: PageKey) => void;
  collapsed: boolean;
  onToggle: () => void;
  onHome?: () => void;
}

const navItems: { key: PageKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'documents', label: 'Documents', icon: FileText },
  { key: 'collections', label: 'Collections', icon: FolderOpen },
  { key: 'search', label: 'Smart Search', icon: Search },
  { key: 'processing', label: 'Processing', icon: Cpu },
  { key: 'workflows', label: 'Workflows', icon: Workflow },
  { key: 'compliance', label: 'Compliance', icon: Shield },
  { key: 'team', label: 'Team & Roles', icon: Users },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'activity', label: 'Activity Log', icon: Activity },
  { key: 'trash', label: 'Trash', icon: Trash2 },
  { key: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ current, onNavigate, collapsed, onHome }: SidebarProps) {
  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-neutral-200 bg-white transition-all duration-200',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="flex h-16 items-center gap-2.5 border-b border-neutral-100 px-4">
        <button
          onClick={onHome}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm hover:bg-primary-700 transition-colors"
        >
          <FileStack className="h-5 w-5" />
        </button>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-bold text-neutral-900 leading-none">SADI PRO</span>
            <span className="text-[10px] text-neutral-400 mt-1">Document Intelligence</span>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {!collapsed && (
          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            Workspace
          </p>
        )}
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = current === item.key;
            return (
              <li key={item.key}>
                <button
                  onClick={() => onNavigate(item.key)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-ring',
                    active
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900',
                    collapsed && 'justify-center'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={cn('h-4.5 w-4.5 shrink-0', active && 'text-primary-600')} />
                  {!collapsed && <span>{item.label}</span>}
                  {active && !collapsed && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-500" />}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {!collapsed && (
        <div className="border-t border-neutral-100 p-3">
          <div className="rounded-xl bg-gradient-to-br from-primary-50 to-accent-50 p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary-600" />
              <span className="text-xs font-semibold text-neutral-900">AI Assistant</span>
            </div>
            <p className="text-[11px] text-neutral-600 leading-relaxed mb-3">
              Ask questions about your documents in natural language.
            </p>
            <button
              onClick={() => onNavigate('search')}
              className="w-full rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-100 transition-colors focus-ring border border-primary-200"
            >
              Ask SADI AI
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
