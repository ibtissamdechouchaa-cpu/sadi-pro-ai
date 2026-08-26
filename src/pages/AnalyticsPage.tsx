import {
  FileText,
  TrendingUp,
  Cpu,
  HardDrive,
  Users,
  Activity,
  Sparkles,
} from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { useStore } from '@/store/StoreContext';
import { typeConfig, percentage, cn } from '@/lib/utils';
import type { PageKey } from '@/components/layout/Sidebar';

interface AnalyticsPageProps {
  onNavigate?: (page: PageKey) => void;
}

export function AnalyticsPage({ onNavigate }: AnalyticsPageProps) {
  const { documents, departments, usage, activity } = useStore();

  const docsByType = Object.entries(
    documents.reduce((acc, doc) => {
      acc[doc.type] = (acc[doc.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]);

  const docsByDept = departments.map((dept) => ({
    name: dept.name,
    color: dept.color,
    count: documents.filter((d) => d.departmentId === dept.id).length,
  }));

  const docsByStatus = Object.entries(
    documents.reduce((acc, doc) => {
      acc[doc.status] = (acc[doc.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  );

  const docsByLanguage = Object.entries(
    documents.reduce((acc, doc) => {
      acc[doc.language] = (acc[doc.language] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  );

  const totalActivity = activity.length;
  const activityByAction = Object.entries(
    activity.reduce((acc, event) => {
      acc[event.action] = (acc[event.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const maxTypeCount = Math.max(...docsByType.map(([, count]) => count), 1);
  const maxDeptCount = Math.max(...docsByDept.map((d) => d.count), 1);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Analytics</h1>
        <p className="mt-1 text-sm text-neutral-500">Insights into document distribution, processing performance, and usage trends.</p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<FileText className="h-5 w-5" />} label="Total Documents" value={documents.length} color="bg-primary-50 text-primary-600" />
        <StatCard icon={<Cpu className="h-5 w-5" />} label="AI Tokens Used" value={usage.aiTokensUsed.toLocaleString()} sub={`${percentage(usage.aiTokensUsed, usage.aiTokensLimit)}% of limit`} color="bg-accent-50 text-accent-600" />
        <StatCard icon={<HardDrive className="h-5 w-5" />} label="Storage Used" value={`${usage.storageUsedGB} GB`} sub={`of ${usage.storageLimitGB} GB`} color="bg-success-50 text-success-600" />
        <StatCard icon={<Activity className="h-5 w-5" />} label="Total Actions" value={totalActivity} sub="Last 30 days" color="bg-warning-50 text-warning-600" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Documents by Type */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-neutral-500" />
              <CardTitle>Documents by Type</CardTitle>
            </div>
          </CardHeader>
          <CardBody className="space-y-3">
            {docsByType.length === 0 ? (
              <p className="text-sm text-neutral-400 text-center py-4">No documents yet</p>
            ) : docsByType.map(([type, count]) => (
              <button key={type} onClick={() => onNavigate?.('documents')} className="flex w-full items-center gap-3 rounded-lg px-2 py-1 -mx-2 hover:bg-neutral-50 transition-colors text-left">
                <span className="text-sm text-neutral-600 w-28 truncate">{typeConfig[type as keyof typeof typeConfig]?.label || type}</span>
                <div className="flex-1">
                  <ProgressBar value={(count / maxTypeCount) * 100} color="primary" size="sm" />
                </div>
                <span className="text-xs font-medium text-neutral-500 w-8 text-right">{count}</span>
              </button>
            ))}
          </CardBody>
        </Card>

        {/* Documents by Department */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-neutral-500" />
              <CardTitle>Documents by Department</CardTitle>
            </div>
          </CardHeader>
          <CardBody className="space-y-3">
            {docsByDept.map((dept) => (
              <div key={dept.name} className="flex items-center gap-3">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: dept.color }} />
                <span className="text-sm text-neutral-600 w-32 truncate">{dept.name}</span>
                <div className="flex-1">
                  <ProgressBar value={(dept.count / maxDeptCount) * 100} color="accent" size="sm" />
                </div>
                <span className="text-xs font-medium text-neutral-500 w-8 text-right">{dept.count}</span>
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Documents by Status */}
        <Card>
          <CardHeader><CardTitle>Processing Status</CardTitle></CardHeader>
          <CardBody>
            <div className="flex flex-wrap gap-3">
              {docsByStatus.map(([status, count]) => (
                <div key={status} className="flex items-center gap-2 rounded-lg border border-neutral-100 px-3 py-2">
                  <span className="text-sm font-semibold text-neutral-900">{count}</span>
                  <span className="text-xs text-neutral-500 capitalize">{status.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Language distribution */}
        <Card>
          <CardHeader><CardTitle>Language Distribution</CardTitle></CardHeader>
          <CardBody>
            <div className="flex items-center justify-around">
              {docsByLanguage.map(([lang, count]) => (
                <div key={lang} className="text-center">
                  <ProgressRing
                    value={percentage(count, documents.length)}
                    size={90}
                    strokeWidth={6}
                    label={lang.toUpperCase()}
                  />
                  <p className="text-xs text-neutral-500 mt-2">{count} docs</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Activity breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-neutral-500" />
              <CardTitle>Activity Breakdown</CardTitle>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {activityByAction.map(([action, count]) => (
                <div key={action} className="rounded-lg border border-neutral-100 p-3 text-center">
                  <p className="text-2xl font-bold text-neutral-900">{count}</p>
                  <p className="text-xs text-neutral-500 mt-1 capitalize">{action.toLowerCase().replace(/_/g, ' ')}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* AI Usage */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary-600" />
              <CardTitle>AI Usage</CardTitle>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-neutral-600">AI Tokens</span>
                  <span className="text-xs text-neutral-400">{percentage(usage.aiTokensUsed, usage.aiTokensLimit)}%</span>
                </div>
                <ProgressBar value={percentage(usage.aiTokensUsed, usage.aiTokensLimit)} color="primary" />
                <p className="text-xs text-neutral-400 mt-1">{usage.aiTokensUsed.toLocaleString()} / {usage.aiTokensLimit.toLocaleString()}</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-neutral-600">OCR Pages</span>
                  <span className="text-xs text-neutral-400">{percentage(usage.ocrPagesUsed, usage.ocrPagesLimit)}%</span>
                </div>
                <ProgressBar value={percentage(usage.ocrPagesUsed, usage.ocrPagesLimit)} color="accent" />
                <p className="text-xs text-neutral-400 mt-1">{usage.ocrPagesUsed.toLocaleString()} / {usage.ocrPagesLimit.toLocaleString()}</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-neutral-600">Storage</span>
                  <span className="text-xs text-neutral-400">{percentage(usage.storageUsedGB, usage.storageLimitGB)}%</span>
                </div>
                <ProgressBar value={percentage(usage.storageUsedGB, usage.storageLimitGB)} color="success" />
                <p className="text-xs text-neutral-400 mt-1">{usage.storageUsedGB} GB / {usage.storageLimitGB} GB</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', color)}>
            {icon}
          </div>
          {sub && <Badge variant="neutral">{sub}</Badge>}
        </div>
        <p className="mt-4 text-2xl font-bold text-neutral-900">{value}</p>
        <p className="text-sm text-neutral-500">{label}</p>
      </CardBody>
    </Card>
  );
}
