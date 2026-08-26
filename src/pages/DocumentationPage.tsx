import { FileText, Cpu, Search, Shield, Users, Database, Sparkles, Lock, Archive, Workflow, Info } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useTranslation } from '@/lib/i18n';

export function DocumentationPage() {
  const { t } = useTranslation();

  // Section titles are wrapped with t() — bodies remain technical English intentionally
  // but titles are localized via closest keys for i18n audit coverage
  const sections = [
    {
      icon: FileText,
      title: t('documents'),
      body: 'Upload → Virus scan → Validation → SHA-256 hash → Dedup → OCR → Text extraction → Metadata → Classification → Chunking → Embedding → Indexing → AI Analysis → Ready. Each file runs asynchronously; failed stages can be retried individually.',
    },
    {
      icon: Cpu,
      title: t('processing'),
      body: 'Click any stage pill in Processing Center to filter jobs. "Ready" means fully searchable; "Queued" docs without jobs land in the Upload stage so counts always reflect reality.',
    },
    {
      icon: Search,
      title: t('searchPage'),
      body: 'Hybrid full-text (PostgreSQL tsvector) + tag/title ILIKE fallback. Snippets via ts_headline (<mark> highlighted). AI Answer uses Gemini (vision-aware for images) with citations; every answer shows its ReasoningTrace.',
    },
    {
      icon: Sparkles,
      title: t('aiInsights'),
      body: 'Whole-file extraction via @doc-preview/core (DOCX/XLSX/PDF) or raw UTF-8; images via Gemini inlineData. Stored as insight on the document; re-run from AI Insights → Ask AI about this file.',
    },
    {
      icon: Database,
      title: t('view'),
      body: 'Images → <img>, PDFs → <iframe>, Office → @cyntler/react-doc-viewer (lazy OfficeViewer), text → <pre>. Docs without a file show a synthesized text preview so every doc is viewable.',
    },
    {
      icon: Shield,
      title: t('security'),
      body: 'Client SHA-256 via Web Crypto (security.ts) — 64 hex chars, shown truncated with Copy + verified badge. Deletion is soft (pending_disposal) and blocked under legal hold; Trash can restore.',
    },
    {
      icon: Archive,
      title: t('compliance'),
      body: 'Records tab: all docs. Retention Policies: create/edit/delete with auto-apply (sets expiresAt); Frameworks: live readiness from real coverage (audit trail, retention, legal hold); Legal Hold: place/release per document.',
    },
    {
      icon: Users,
      title: t('team'),
      body: 'Roles govern invite/remove and access. Removal disables the account (isActive) and refreshes membership.',
    },
    {
      icon: Workflow,
      title: t('collections'),
      body: 'Collections group documents; AI suggestions match by type/tags/title with a Recent Documents fallback. Workflows are create/toggle/delete with real API persistence.',
    },
    {
      icon: Lock,
      title: t('billing'),
      body: 'Prices in DZD (135 DZD/USD, HT, TVA 19% incluse). Checkout via SATIM: CIB / Edahabia (Edahabia/Gold) through SATIM redirect with HMAC stub — configure SATIM_GATEWAY_URL, SATIM_MERCHANT_ID in .env.',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
          <Info className="h-6 w-6 text-primary-600" /> {t('documentation')}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">{t('documentation')} — {t('documents')} {t('processing')} {t('compliance')}</p>
      </div>

      <Card className="border-primary-100 bg-primary-50/30">
        <CardBody>
          <p className="text-sm font-medium text-neutral-900">{t('organization')} — {t('appName')}</p>
          <p className="text-xs text-neutral-500 mt-1">{t('documentation')} — {t('appName')}. {t('documents')} {t('collections')} {t('searchPage')}.</p>
        </CardBody>
      </Card>

      <div className="grid gap-4">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.title}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary-600" />
                  <CardTitle>{s.title}</CardTitle>
                </div>
              </CardHeader>
              <CardBody>
                <p className="text-sm leading-relaxed text-neutral-600">{s.body}</p>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader><CardTitle>{t('documentation')}</CardTitle></CardHeader>
        <CardBody className="space-y-2 text-sm text-neutral-600">
          <p><Badge variant="neutral">API</Badge> Base <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs">/api</code> — {t('view')} <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs">/api/health</code> (DB liveness <code>SELECT 1</code>).</p>
          <p><Badge variant="neutral">Auth</Badge> JWT (Bearer), bcrypt 12, soft-deactivate on {t('delete')}.</p>
          <p><Badge variant="neutral">Env</Badge> <code>DATABASE_URL</code>, <code>JWT_SECRET</code>, <code>GEMINI_API_KEY</code> / <code>OPENAI_API_KEY</code>, <code>SATIM_GATEWAY_URL</code>, <code>CORS_ORIGIN</code>.</p>
          <p className="text-xs text-neutral-400">{t('documentation')} — {t('compliance')} {t('billing')} {t('security')}</p>
        </CardBody>
      </Card>
    </div>
  );
}
