import { useState, useMemo } from 'react';
import {
  Cpu,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
} from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { useStore } from '@/store/StoreContext';
import { useTranslation } from '@/lib/i18n';
import { statusConfig, timeAgo, cn } from '@/lib/utils';
import type { Document } from '@/types';

interface ProcessingPageProps {
  onOpenDocument?: (doc: Document) => void;
}

const PIPELINE = [
  'Upload',
  'Virus Scan',
  'Validation',
  'Hash',
  'Dedup',
  'OCR',
  'Text Extraction',
  'Metadata',
  'Classification',
  'Chunking',
  'Embedding',
  'Indexing',
  'AI Analysis',
  'Ready',
] as const;

type PipelineStage = typeof PIPELINE[number];

const STAGE_MAP: Record<string, PipelineStage> = {
  uploading: 'Upload',
  queued: 'Upload',
  scanning: 'Virus Scan',
  validating: 'Validation',
  hashing: 'Hash',
  dedup: 'Dedup',
  ocr: 'OCR',
  extracting: 'Text Extraction',
  metadata: 'Metadata',
  classifying: 'Classification',
  chunking: 'Chunking',
  embedding: 'Embedding',
  indexing: 'Indexing',
  analyzing: 'AI Analysis',
  processing: 'AI Analysis',
  completed: 'Ready',
  ready: 'Ready',
  failed: 'Ready',
};

function stageOf(job: { stage: string }): PipelineStage {
  return STAGE_MAP[job.stage] || 'Ready';
}

export function ProcessingPage({ onOpenDocument }: ProcessingPageProps) {
  const { t } = useTranslation();
  const { jobs, documents, retryJob, cancelJob } = useStore();
  const [activeStage, setActiveStage] = useState<PipelineStage | null>(null);

  const stageCounts = useMemo(() => {
    const m: Record<PipelineStage, number> = Object.fromEntries(PIPELINE.map((s) => [s, 0])) as Record<PipelineStage, number>;
    for (const j of jobs) m[stageOf(j)]++;
    // Documents queued without a job still count toward Upload
    const jobsDocs = new Set(jobs.map((j) => j.documentId).filter(Boolean));
    for (const d of documents) {
      if (d.status === 'queued' && !jobsDocs.has(d.id)) m['Upload']++;
      if (d.status === 'completed' && jobs.length === 0) m['Ready']++;
    }
    return m;
  }, [jobs, documents]);

  const totalPipelineDocs = useMemo(() => Object.values(stageCounts).reduce((a, b) => a + b, 0), [stageCounts]);

  const filteredJobs = activeStage ? jobs.filter((j) => stageOf(j) === activeStage) : jobs;

  const queued = jobs.filter((j) => j.stage === 'queued');
  const processing = jobs.filter((j) => !['queued', 'completed', 'failed'].includes(j.stage));
  const completed = jobs.filter((j) => j.stage === 'completed');
  const failed = jobs.filter((j) => j.stage === 'failed');

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{t('processing')}</h1>
          <p className="mt-1 text-sm text-neutral-500">{t('processingQueue')} {t('documents')}</p>
        </div>
        {activeStage && (
          <Button variant="outline" size="sm" onClick={() => setActiveStage(null)}>
            {t('close')} {t('filter')} — {activeStage} ({filteredJobs.length})
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatBox icon={<Clock className="h-4 w-4" />} label={t('processingQueue')} value={queued.length} color="bg-neutral-100 text-neutral-600" />
        <StatBox icon={<Cpu className="h-4 w-4" />} label={t('processing')} value={processing.length} color="bg-accent-50 text-accent-600" />
        <StatBox icon={<CheckCircle2 className="h-4 w-4" />} label={t('success')} value={completed.length} color="bg-success-50 text-success-600" />
        <StatBox icon={<AlertCircle className="h-4 w-4" />} label={t('error')} value={failed.length} color="bg-error-50 text-error-600" />
      </div>

      {/* Processing Pipeline — live, clickable */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('processing')} {t('processingQueue')}</CardTitle>
            <span className="text-xs text-neutral-400">{totalPipelineDocs} {t('documents')} {t('processingQueue')}</span>
          </div>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {PIPELINE.map((stage, i) => {
              const count = stageCounts[stage];
              const isActive = activeStage === stage;
              const hasDocs = count > 0;
              return (
                <div key={stage} className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveStage(isActive ? null : stage)}
                    className={cn(
                      'rounded-lg px-2.5 py-1.5 font-medium text-xs border transition-colors flex items-center gap-1.5',
                      isActive
                        ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                        : hasDocs
                          ? 'bg-primary-50 text-primary-700 border-primary-200 hover:bg-primary-100'
                          : 'bg-neutral-100 text-neutral-600 border-neutral-200 hover:bg-neutral-200',
                    )}
                    title={`${count} ${t('documents')} ${stage}`}
                  >
                    {stage}
                    <span className={cn(
                      'inline-flex items-center justify-center min-w-5 h-5 rounded-full text-[10px] font-bold px-1',
                      isActive ? 'bg-white text-primary-600' : hasDocs ? 'bg-primary-600 text-white' : 'bg-neutral-300 text-neutral-600'
                    )}>
                      {count}
                    </span>
                  </button>
                  {i < PIPELINE.length - 1 && <span className="text-neutral-300">→</span>}
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-neutral-400">
            {t('processing')} {t('processingQueue')} {t('documents')}
            {activeStage && <span className="text-primary-600 font-medium"> {t('filter')} {activeStage}.</span>}
          </p>
        </CardBody>
      </Card>

      {/* Job list */}
      {jobs.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Cpu className="h-8 w-8" />}
            title={t('processing')}
            description={t('processingQueue')}
          />
        </Card>
      ) : filteredJobs.length === 0 && activeStage ? (
        <Card>
          <EmptyState icon={<FileText className="h-8 w-8" />} title={t('noDocuments')} description={t('noDocuments')} />
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('processingQueue')} {activeStage ? `— ${activeStage}` : ''}</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-neutral-50">
              {filteredJobs.map((job) => {
                const linkedDoc = documents.find((d) => d.id === job.documentId);
                return (
                <div key={job.id} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => linkedDoc && onOpenDocument?.(linkedDoc)}
                      disabled={!linkedDoc}
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 ${linkedDoc ? 'hover:bg-primary-50 cursor-pointer' : ''}`}
                      title={linkedDoc ? t('view') : undefined}
                    >
                      <FileText className={`h-4 w-4 ${linkedDoc ? 'text-primary-500' : 'text-neutral-500'}`} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {linkedDoc ? (
                          <button onClick={() => onOpenDocument?.(linkedDoc)} className="text-sm font-medium text-neutral-900 truncate hover:text-primary-600 text-left">{job.documentName}</button>
                        ) : (
                          <p className="text-sm font-medium text-neutral-900 truncate">{job.documentName}</p>
                        )}
                        <Badge variant="neutral" className={statusConfig[job.stage]?.color || 'bg-neutral-100 text-neutral-600'} dot>
                          {statusConfig[job.stage]?.label || job.stage}
                        </Badge>
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">{t('uploadedAt')} {timeAgo(job.startedAt)}</p>

                      {job.stage !== 'queued' && job.stage !== 'failed' && (
                        <div className="mt-2.5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-neutral-400">{job.progress}%</span>
                          </div>
                          <ProgressBar
                            value={job.progress}
                            color={job.stage === 'completed' ? 'success' : 'accent'}
                            size="sm"
                          />
                        </div>
                      )}

                      {job.error && (
                        <div className="mt-2 flex items-start gap-2 rounded-lg bg-error-50 px-3 py-2">
                          <AlertCircle className="h-3.5 w-3.5 text-error-600 shrink-0 mt-0.5" />
                          <p className="text-xs text-error-700">{job.error}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {job.stage === 'failed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<RefreshCw className="h-3.5 w-3.5" />}
                          onClick={() => retryJob(job.id)}
                        >
                          {t('confirm')}
                        </Button>
                      )}
                      {(job.stage === 'queued' || job.stage === 'processing' || job.stage === 'extracting' || job.stage === 'indexing') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<X className="h-3.5 w-3.5" />}
                          onClick={() => cancelJob(job.id)}
                        >
                          {t('cancel')}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );})}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function StatBox({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <Card>
      <CardBody className="flex items-center gap-3">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', color)}>
          {icon}
        </div>
        <div>
          <p className="text-xl font-bold text-neutral-900">{value}</p>
          <p className="text-xs text-neutral-500">{label}</p>
        </div>
      </CardBody>
    </Card>
  );
}
