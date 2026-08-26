import { useState, type ReactNode } from 'react';
import { Sidebar, type PageKey } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';

interface AppShellProps {
  current: PageKey;
  onNavigate: (page: PageKey) => void;
  children: ReactNode;
  onHome?: () => void;
}

export function AppShell({ current, onNavigate, children, onHome }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('sadi_sidebar_collapsed') === '1'; } catch { return false; }
  });
  const toggle = () => {
    setCollapsed(v => {
      const nv = !v;
      try { localStorage.setItem('sadi_sidebar_collapsed', nv ? '1' : '0'); } catch {}
      return nv;
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      <Sidebar
        current={current}
        onNavigate={onNavigate}
        collapsed={collapsed}
        onToggle={toggle}
        onHome={onHome}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          onToggleSidebar={toggle}
          onNavigate={(page) => onNavigate(page as PageKey)}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
