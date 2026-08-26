import { useState, useRef, useEffect } from 'react';
import { Bell, Search, Menu, ChevronDown, LogOut, User as UserIcon, Settings } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { useStore } from '@/store/StoreContext';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { roleConfig, cn, timeAgo } from '@/lib/utils';

interface TopbarProps {
  onToggleSidebar: () => void;
  onNavigate: (page: 'search' | 'settings') => void;
}

export function Topbar({ onToggleSidebar, onNavigate }: TopbarProps) {
  const { t } = useTranslation();
  const { currentUser, notifications, markNotificationRead, markAllNotificationsRead } = useStore();
  const { signOut } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Cmd+K → search
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onNavigate('search');
      }
      if (e.key === 'Escape') { setNotifOpen(false); setProfileOpen(false); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onNavigate]);

  const notifColor = (type: string) =>
    type === 'success' ? 'text-success-600' : type === 'warning' ? 'text-warning-600' : type === 'error' ? 'text-error-600' : 'text-primary-600';

  return (
    <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 gap-4">
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={onToggleSidebar}
          aria-label={t('view')}
          className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors focus-ring"
        >
          <Menu className="h-5 w-5" />
        </button>
        <button
          onClick={() => onNavigate('search')}
          className="hidden md:flex items-center gap-2.5 h-9 w-72 rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-400 hover:border-neutral-300 hover:bg-white transition-colors focus-ring"
        >
          <Search className="h-4 w-4" />
          <span>{t('search')}</span>
          <kbd className="ml-auto rounded border border-neutral-200 bg-white px-1.5 py-0.5 text-[10px] font-mono text-neutral-400">⌘K</kbd>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors focus-ring"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-error-500 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-neutral-200 bg-white shadow-elevated animate-slide-up z-50">
              <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
                <span className="text-sm font-semibold text-neutral-900">{t('notifications')}</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-xs font-medium text-primary-600 hover:text-primary-700"
                  >
                    {t('view')}
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-sm text-neutral-400">{t('notifications')}</div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={cn(
                        'flex w-full items-start gap-3 border-b border-neutral-50 px-4 py-3 text-left hover:bg-neutral-50 transition-colors',
                        !n.read && 'bg-primary-50/30'
                      )}
                    >
                      <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', !n.read ? 'bg-primary-500' : 'bg-transparent')} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900">{n.title}</p>
                        <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{n.message}</p>
                        <p className={cn('text-[10px] mt-1', notifColor(n.type))}>{timeAgo(n.timestamp)}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-neutral-100 transition-colors focus-ring"
          >
            <Avatar name={currentUser.name} color={currentUser.avatarColor} size="sm" />
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-xs font-semibold text-neutral-900 leading-none">{currentUser.name}</span>
              <span className="text-[10px] text-neutral-400 mt-0.5">{roleConfig[currentUser.role].label}</span>
            </div>
            <ChevronDown className="h-4 w-4 text-neutral-400" />
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-neutral-200 bg-white shadow-elevated animate-slide-up z-50">
              <div className="border-b border-neutral-100 px-4 py-3">
                <p className="text-sm font-semibold text-neutral-900">{currentUser.name}</p>
                <p className="text-xs text-neutral-400">{currentUser.email}</p>
              </div>
              <div className="py-1.5">
                <button onClick={() => { onNavigate('settings'); setProfileOpen(false); }} className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors">
                  <UserIcon className="h-4 w-4" /> {t('view')}
                </button>
                <button
                  onClick={() => { onNavigate('settings'); setProfileOpen(false); }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors"
                >
                  <Settings className="h-4 w-4" /> {t('settings')}
                </button>
              </div>
              <div className="border-t border-neutral-100 py-1.5">
                <button
                  onClick={signOut}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-error-600 hover:bg-error-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" /> {t('signOut')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
