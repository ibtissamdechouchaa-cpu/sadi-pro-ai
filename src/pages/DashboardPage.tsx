import {
  FileText,
  Cpu,
  AlertCircle,
  CalendarClock,
  Sparkles,
  Activity,
  CheckCircle2,
  Upload,
  Download,
  Shield,
  Share2,
  Archive,
  LogIn,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';
import { useStore } from '@/store/StoreContext';
import { useAuth } from '@/lib/auth';
import { type PageKey } from '@/components/layout/Sidebar';
import {
  statusConfig,
  typeConfig,
  timeAgo,
  percentage,
  formatBytes,
} from '@/lib/utils';
import type { Document } from '@/types';

interface DashboardPageProps {
  onNavigate: (page: PageKey) => void;
  onOpenDocument: (doc: Document) => void;
}

const activityIcons: Record<string, typeof Upload> = {
  upload: Upload,
  download: Download,
  check: CheckCircle2,
  shield: Shield,
  share: Share2,
  archive: Archive,
  'log-in': LogIn,
  sparkles: Sparkles,
};

export function DashboardPage({ onNavigate, onOpenDocument }: DashboardPageProps) {
  const { documents, jobs, activity, usage, departments, isLoading } = useStore();
  const { user } = useAuth();

  const completedDocs = documents.filter((d) => d.status === 'completed');
  const processingDocs = documents.filter((d) => d.status !== 'completed' && d.status !== 'failed');
  const needsReview = documents.filter((d) => d.approvalState === 'pending_review');
  const expiringSoon = documents.filter(
    (d) => d.expiresAt && new Date(d.expiresAt).getTime() - Date.now() < 60 * 86400000
  );
  const onHold = documents.filter((d) => d.legalHold);
  const failedJobs = jobs.filter((j) => j.stage === 'failed');

  const storagePct = percentage(usage.storageUsedGB, usage.storageLimitGB);
  const docPct = percentage(usage.documentCount, usage.documentLimit);
  const userPct = percentage(usage.userCount, usage.userLimit);
  const aiPct = percentage(usage.aiTokensUsed, usage.aiTokensLimit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-500">Welcome back, {user?.name?.split(' ')[0] || 'User'}. Here's what needs your attention.</p>
        </div>
        <Button icon={<Upload className="h-4 w-4" />} onClick={() => onNavigate('documents')}>
          Upload Documents
        </Button>
      </div>

      {/* Alert banner */}
      {(failedJobs.length > 0 || needsReview.length > 0) && (
        <div role="alert" className="flex items-center gap-3 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3">
          <AlertCircle className="h-5 w-5 text-warning-600 shrink-0" />
          <div className="flex-1 text-sm text-warning-800">
            {failedJobs.length > 0 && <span><strong>{failedJobs.length}</strong> processing job{failedJobs.length > 1 ? 's' : ''} failed. </span>}
            {needsReview.length > 0 && <span><strong>{needsReview.length}</strong> document{needsReview.length > 1 ? 's' : ''} pending review.</span>}
          </div>
          <Button variant="outline" size="sm" onClick={() => onNavigate(failedJobs.length > 0 ? 'processing' : 'documents')}>
            {failedJobs.length > 0 ? `View ${failedJobs.length} failed` : `Review ${needsReview.length} docs`}
          </Button>
        </div>
      )}

      {/* Stats cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <Card key={i}><CardBody><Skeleton className="h-6 w-12" /><Skeleton className="h-3 w-20 mt-2" /></CardBody></Card>)}
        </div>
      ) : (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<FileText className="h-5 w-5" />}
          label="Total Documents"
          value={documents.length.toLocaleString()}
          sub={`${completedDocs.length} completed`}
          color="primary"
          onClick={() => onNavigate('documents')}
        />
        <StatCard
          icon={<Cpu className="h-5 w-5" />}
          label="Processing"
          value={processingDocs.length}
          sub={`${jobs.length} active jobs`}
          color="accent"
          onClick={() => onNavigate('processing')}
        />
        <StatCard
          icon={<AlertCircle className="h-5 w-5" />}
          label="Needs Review"
          value={needsReview.length}
          sub="Pending approval"
          color="warning"
          onClick={() => onNavigate('documents')}
        />
        <StatCard
          icon={<CalendarClock className="h-5 w-5" />}
          label="Expiring Soon"
          value={expiringSoon.length}
          sub="Within 60 days"
          color="error"
          onClick={() => onNavigate('documents')}
        />
      </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent documents */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Documents</CardTitle>
                <button
                  onClick={() => onNavigate('documents')}
                  className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
                >
                  View all <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <div className="divide-y divide-neutral-50">
                {documents.slice(0, 6).map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => onOpenDocument(doc)}
                    className="flex w-full items-center gap-3 px-5 py-3 hover:bg-neutral-50 transition-colors text-left"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                      <FileText className="h-4 w-4 text-neutral-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">{doc.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-neutral-400">{typeConfig[doc.type].label}</span>
                        <span className="text-xs text-neutral-300">·</span>
                        <span className="text-xs text-neutral-400">{formatBytes(doc.fileSize)}</span>
                        <span className="text-xs text-neutral-300">·</span>
                        <span className="text-xs text-neutral-400">{timeAgo(doc.uploadedAt)}</span>
                      </div>
                    </div>
                    <Badge variant="neutral" className={statusConfig[doc.status].color}>
                      <span className={`h-1.5 w-1.5 rounded-full ${statusConfig[doc.status].dot}`} />
                      {statusConfig[doc.status].label}
                    </Badge>
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* AI Insights */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary-600" />
                <CardTitle>AI Insights</CardTitle>
              </div>
            </CardHeader>
            <CardBody className="space-y-3">
              {onHold.length > 0 && (
                <InsightRow
                  icon={<Shield className="h-4 w-4 text-error-600" />}
                  text={`${onHold.length} document${onHold.length > 1 ? 's are' : ' is'} on Legal Hold and cannot be disposed.`}
                  action="View"
                  onClick={() => onNavigate('compliance')}
                />
              )}
              {expiringSoon.length > 0 && (
                <InsightRow
                  icon={<CalendarClock className="h-4 w-4 text-warning-600" />}
                  text={`${expiringSoon[0].title} expires in ${Math.ceil((new Date(expiringSoon[0].expiresAt!).getTime() - Date.now()) / 86400000)} days. Review renewal terms.`}
                  action="Review"
                  onClick={() => onOpenDocument(expiringSoon[0])}
                />
              )}
              <InsightRow
                icon={<TrendingUp className="h-4 w-4 text-success-600" />}
                text={`${completedDocs.length} document${completedDocs.length !== 1 ? 's' : ''} processed and classified. ${documents.length - completedDocs.length} still in pipeline.`}
                action="View"
                onClick={() => onNavigate('documents')}
              />
              {departments.length > 0 && (
                <InsightRow
                  icon={<Sparkles className="h-4 w-4 text-primary-600" />}
                  text={`${departments.length} department${departments.length !== 1 ? 's' : ''} configured. Organize documents by department for better search.`}
                  action="Manage"
                  onClick={() => onNavigate('team')}
                />
              )}
            </CardBody>
          </Card>

          {/* Departments */}
          <Card>
            <CardHeader>
              <CardTitle>Documents by Department</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              {departments.map((dept) => {
                const total = documents.length;
                const pct = total > 0 ? (dept.documentCount / total) * 100 : 0;
                return (
                  <div key={dept.id} className="flex items-center gap-3">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: dept.color }} />
                    <span className="text-sm text-neutral-600 w-32">{dept.name}</span>
                    <div className="flex-1">
                      <ProgressBar value={pct} color="primary" size="sm" />
                    </div>
                    <span className="text-xs text-neutral-400 w-10 text-right">{dept.documentCount}</span>
                  </div>
                );
              })}
            </CardBody>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Usage */}
          <Card>
            <CardHeader>
              <CardTitle>Usage</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="flex justify-center mb-6">
                <ProgressRing value={storagePct} label="Storage" size={130} />
              </div>
              <div className="space-y-4">
                <UsageRow label="Documents" used={usage.documentCount} limit={usage.documentLimit} pct={docPct} />
                <UsageRow label="Users" used={usage.userCount} limit={usage.userLimit} pct={userPct} />
                <UsageRow label="AI Tokens" used={usage.aiTokensUsed} limit={usage.aiTokensLimit} pct={aiPct} formatVal={(v) => v.toLocaleString()} />
              </div>
              <div className="mt-5 rounded-lg bg-neutral-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">Current Plan</span>
                  <Badge variant="default">Business</Badge>
                </div>
                <button
                  onClick={() => onNavigate('settings')}
                  className="mt-2 w-full text-xs font-medium text-primary-600 hover:text-primary-700"
                >
                  Manage subscription →
                </button>
              </div>
            </CardBody>
          </Card>

          {/* Activity feed */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-neutral-500" />
                <CardTitle>Recent Activity</CardTitle>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <div className="max-h-80 overflow-y-auto">
                {activity.length === 0 ? (
                  <EmptyState
                    icon={<Activity className="h-6 w-6" />}
                    title="No activity yet"
                    description="Actions will appear here as your team works."
                  />
                ) : (
                  <div className="divide-y divide-neutral-50">
                    {activity.slice(0, 8).map((event) => {
                      const Icon = activityIcons[event.icon] || Activity;
                      return (
                        <div key={event.id} className="flex items-start gap-3 px-5 py-3">
                          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                            <Icon className="h-3.5 w-3.5 text-neutral-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-neutral-600">
                              <span className="font-medium text-neutral-900">{event.user}</span>{' '}
                              <span className="text-neutral-400">{event.action.toLowerCase().replace(/_/g, ' ')}</span>{' '}
                              <span className="font-medium text-neutral-900">{event.resource}</span>
                            </p>
                            <p className="text-[10px] text-neutral-400 mt-0.5">{timeAgo(event.timestamp)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub: string;
  color: 'primary' | 'accent' | 'warning' | 'error';
  onClick: () => void;
}) {
  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    accent: 'bg-accent-50 text-accent-600',
    warning: 'bg-warning-50 text-warning-600',
    error: 'bg-error-50 text-error-600',
  };
  return (
    <button
      onClick={onClick}
      className="group rounded-xl border border-neutral-200 bg-white p-5 text-left shadow-card transition-all duration-200 hover:border-neutral-300 hover:shadow-elevated"
    >
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors[color]}`}>
          {icon}
        </div>
        <ChevronRight className="h-4 w-4 text-neutral-300 group-hover:text-neutral-400 transition-colors" />
      </div>
      <p className="mt-4 text-2xl font-bold text-neutral-900">{value}</p>
      <p className="text-sm font-medium text-neutral-600">{label}</p>
      <p className="text-xs text-neutral-400 mt-0.5">{sub}</p>
    </button>
  );
}

function InsightRow({
  icon,
  text,
  action,
  onClick,
}: {
  icon: React.ReactNode;
  text: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-neutral-100 p-3 hover:border-neutral-200 transition-colors">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <p className="flex-1 text-sm text-neutral-600 leading-relaxed">{text}</p>
      <button
        onClick={onClick}
        className="shrink-0 text-xs font-medium text-primary-600 hover:text-primary-700"
      >
        {action}
      </button>
    </div>
  );
}

function UsageRow({
  label,
  used,
  limit,
  pct,
  formatVal,
}: {
  label: string;
  used: number;
  limit: number;
  pct: number;
  formatVal?: (v: number) => string;
}) {
  const fmt = formatVal || ((v: number) => v.toString());
  const color = pct >= 90 ? 'error' : pct >= 70 ? 'warning' : 'primary';
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-neutral-600">{label}</span>
        <span className="text-xs text-neutral-400">{fmt(used)} / {fmt(limit)}</span>
      </div>
      <ProgressBar value={pct} color={color} size="sm" />
    </div>
  );
}
