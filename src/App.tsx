import { useState, useCallback, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/auth';
import { StoreProvider, useStore } from '@/store/StoreContext';
import { ToastProvider } from '@/lib/toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useRealtimeNotifications, useRealtimeDocuments, useRealtimeActivity } from '@/lib/useRealtime';
import { AppShell } from '@/components/layout/AppShell';
import { type PageKey } from '@/components/layout/Sidebar';
import { LandingPage } from '@/pages/LandingPage';
import { AuthPage } from '@/pages/AuthPage';
import type { Document } from '@/types';

const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const DocumentsPage = lazy(() => import('@/pages/DocumentsPage').then(m => ({ default: m.DocumentsPage })));
const DocumentDetailPage = lazy(() => import('@/pages/DocumentDetailPage').then(m => ({ default: m.DocumentDetailPage })));
const SearchPage = lazy(() => import('@/pages/SearchPage').then(m => ({ default: m.SearchPage })));
const ProcessingPage = lazy(() => import('@/pages/ProcessingPage').then(m => ({ default: m.ProcessingPage })));
const CollectionsPage = lazy(() => import('@/pages/CollectionsPage').then(m => ({ default: m.CollectionsPage })));
const CompliancePage = lazy(() => import('@/pages/CompliancePage').then(m => ({ default: m.CompliancePage })));
const TeamPage = lazy(() => import('@/pages/TeamPage').then(m => ({ default: m.TeamPage })));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const TrashPage = lazy(() => import('@/pages/TrashPage').then(m => ({ default: m.TrashPage })));
const ActivityPage = lazy(() => import('@/pages/ActivityPage').then(m => ({ default: m.ActivityPage })));
const WorkflowsPage = lazy(() => import('@/pages/WorkflowsPage').then(m => ({ default: m.WorkflowsPage })));

function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
    </div>
  );
}

function AppRoutes() {
  const { isAuthenticated, isLoading, user, signOut } = useAuth();
  const { refreshData } = useStore();
  const [page, setPage] = useState<PageKey>('dashboard');
  const [openDoc, setOpenDoc] = useState<Document | null>(null);

  const handleRealtimeNotification = useCallback(() => {
    refreshData();
  }, [refreshData]);

  const handleRealtimeChange = useCallback(() => {
    refreshData();
  }, [refreshData]);

  useRealtimeNotifications(user?.id || '', handleRealtimeNotification);
  useRealtimeDocuments(user?.organizationId || '', handleRealtimeChange);
  useRealtimeActivity(user?.organizationId || '', handleRealtimeChange);

  const handleNavigate = (p: PageKey) => {
    setOpenDoc(null);
    setPage(p);
  };

  const handleOpenDocument = (doc: Document) => {
    setOpenDoc(doc);
    setPage('documents');
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          <p className="text-sm text-neutral-500">Loading SADI PRO...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const renderPage = () => {
    if (openDoc) {
      return <DocumentDetailPage document={openDoc} onBack={() => setOpenDoc(null)} onOpenDocument={handleOpenDocument} />;
    }
    switch (page) {
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} onOpenDocument={handleOpenDocument} />;
      case 'documents':
        return <DocumentsPage onOpenDocument={handleOpenDocument} />;
      case 'collections':
        return <CollectionsPage onOpenDocument={handleOpenDocument} />;
      case 'search':
        return <SearchPage onOpenDocument={handleOpenDocument} />;
      case 'processing':
        return <ProcessingPage onOpenDocument={handleOpenDocument} />;
      case 'compliance':
        return <CompliancePage onOpenDocument={handleOpenDocument} />;
      case 'team':
        return <TeamPage />;
      case 'analytics':
        return <AnalyticsPage onNavigate={handleNavigate} />;
      case 'notifications':
        return <NotificationsPage />;
      case 'activity':
        return <ActivityPage />;
      case 'trash':
        return <TrashPage />;
      case 'workflows':
        return <WorkflowsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage onNavigate={handleNavigate} onOpenDocument={handleOpenDocument} />;
    }
  };

  return (
    <Routes>
      <Route path="/" element={
        <AppShell current={page} onNavigate={handleNavigate} onHome={handleSignOut}>
          <Suspense fallback={<PageLoader />}>
            {renderPage()}
          </Suspense>
        </AppShell>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function RootApp() {
  const [authView, setAuthView] = useState<'landing' | 'signin' | 'signup'>('landing');
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          <p className="text-sm text-neutral-500">Loading SADI PRO...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <AppRoutes />;
  }

  if (authView === 'signin' || authView === 'signup') {
    return (
      <AuthPage
        mode={authView}
        onToggleMode={() => setAuthView(authView === 'signin' ? 'signup' : 'signin')}
        onSuccess={() => {}}
        onBack={() => setAuthView('landing')}
      />
    );
  }

  return (
    <LandingPage
      onSignIn={() => setAuthView('signin')}
      onSignUp={() => setAuthView('signup')}
    />
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <StoreProvider>
              <RootApp />
            </StoreProvider>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
