import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { TrialBanner } from '@/components/TrialBanner';
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
  Sparkles,
  Bell,
  Trash2,
  Activity,
  Workflow,
  BookOpen,
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
  | 'documentation'
  | 'settings';

interface SidebarProps {
  current: PageKey;
  onNavigate: (page: PageKey) => void;
  collapsed: boolean;
  onToggle: () => void;
  onHome?: () => void;
}

const navItemsConfig: { key: PageKey; labelKey: string; fallback: string; icon: typeof LayoutDashboard }[] = [
  { key: 'dashboard', labelKey: 'dashboard', fallback: 'Dashboard', icon: LayoutDashboard },
  { key: 'documents', labelKey: 'documents', fallback: 'Documents', icon: FileText },
  { key: 'collections', labelKey: 'collections', fallback: 'Collections', icon: FolderOpen },
  { key: 'search', labelKey: 'searchPage', fallback: 'Smart Search', icon: Search },
  { key: 'processing', labelKey: 'processing', fallback: 'Processing', icon: Cpu },
  { key: 'workflows', labelKey: 'workflows', fallback: 'Workflows', icon: Workflow },
  { key: 'compliance', labelKey: 'compliance', fallback: 'Compliance', icon: Shield },
  { key: 'team', labelKey: 'team', fallback: 'Team & Roles', icon: Users },
  { key: 'analytics', labelKey: 'analytics', fallback: 'Analytics', icon: BarChart3 },
  { key: 'notifications', labelKey: 'notifications', fallback: 'Notifications', icon: Bell },
  { key: 'activity', labelKey: 'activity', fallback: 'Activity Log', icon: Activity },
  { key: 'trash', labelKey: 'trash', fallback: 'Trash', icon: Trash2 },
  { key: 'settings', labelKey: 'settings', fallback: 'Settings', icon: Settings },
];

export function Sidebar({ current, onNavigate, collapsed, onHome }: SidebarProps) {
  const { t } = useTranslation();
  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-neutral-200 bg-white transition-all duration-200',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="flex h-16 items-center gap-2.5 border-b border-neutral-100 px-3">
        <button onClick={onHome} className="shrink-0 rounded-xl overflow-hidden hover:opacity-90 transition-opacity" title="SADI PRO — Home">
          <img src="/sadi-logo.png" alt="SADI PRO" className={collapsed ? 'h-9 w-9 object-contain' : 'h-10 w-auto max-w-[150px] object-contain'} />
        </button>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-neutral-900 leading-none">SADI PRO</span>
            <span className="text-[10px] text-neutral-400 mt-0.5 leading-none">Smart Archive</span>
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
          {navItemsConfig.map((item) => {
            const Icon = item.icon;
            const active = current === item.key;
            const label = (t(item.labelKey as never) as string) || item.fallback;
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
                  title={collapsed ? label : undefined}
                >
                  <Icon className={cn('h-4.5 w-4.5 shrink-0', active && 'text-primary-600')} />
                  {!collapsed && <span>{label}</span>}
                  {active && !collapsed && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-500" />}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {!collapsed && (
        <div className="border-t border-neutral-100 p-3">
          <TrialBanner />
          <div className="rounded-xl bg-gradient-to-br from-primary-50 to-accent-50 p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary-600" />
              <span className="text-xs font-semibold text-neutral-900">{t('aiAssistant')}</span>
            </div>
            <p className="text-[11px] text-neutral-600 leading-relaxed mb-3">
              {t('askAboutDocs')}
            </p>
            <button
              onClick={() => onNavigate('search')}
              className="w-full rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-100 transition-colors focus-ring border border-primary-200"
            >
              {t('askSadi')}
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
