import { FileText, Cpu, Search, Shield, Users, Database, Sparkles, Lock, Archive,Workflow, Info } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const sections = [
  {
    icon: FileText,
    title: 'Document Lifecycle',
    body: 'Upload → Virus scan → Validation → SHA-256 hash → Dedup → OCR → Text extraction → Metadata → Classification → Chunking → Embedding → Indexing → AI Analysis → Ready. Each file runs asynchronously; failed stages can be retried individually.',
  },
  {
    icon: Cpu,
    title: 'Processing Pipeline',
    body: 'Click any stage pill in Processing Center to filter jobs. "Ready" means fully searchable; "Queued" docs without jobs land in the Upload stage so counts always reflect reality.',
  },
  {
    icon: Search,
    title: 'Smart Search',
    body: 'Hybrid full-text (PostgreSQL tsvector) + tag/title ILIKE fallback. Snippets via ts_headline (<mark> highlighted). AI Answer uses Gemini (vision-aware for images) with citations; every answer shows its ReasoningTrace.',
  },
  {
    icon: Sparkles,
    title: 'AI Insights & Vision',
    body: 'Whole-file extraction via @doc-preview/core (DOCX/XLSX/PDF) or raw UTF-8; images via Gemini inlineData. Stored as insight on the document; re-run from AI Insights → Ask AI about this file.',
  },
  {
    icon: Database,
    title: 'Preview',
    body: 'Images → <img>, PDFs → <iframe>, Office → @cyntler/react-doc-viewer (lazy OfficeViewer), text → <pre>. Docs without a file show a synthesized text preview so every doc is viewable.',
  },
  {
    icon: Shield,
    title: 'Security & Hash',
    body: 'Client SHA-256 via Web Crypto (security.ts) — 64 hex chars, shown truncated with Copy + verified badge. Deletion is soft (pending_disposal) and blocked under legal hold; Trash can restore.',
  },
  {
    icon: Archive,
    title: 'Compliance',
    body: 'Records tab: all docs. Retention Policies: create/edit/delete with auto-apply (sets expiresAt); Frameworks: live readiness from real coverage (audit trail, retention, legal hold); Legal Hold: place/release per document.',
  },
  {
    icon: Users,
    title: 'Team & Permissions',
    body: 'Roles govern invite/remove and access. Removal disables the account (isActive) and refreshes membership.',
  },
  {
    icon: Workflow,
    title: 'Collections & Workflows',
    body: 'Collections group documents; AI suggestions match by type/tags/title with a Recent Documents fallback. Workflows are create/toggle/delete with real API persistence.',
  },
  {
    icon: Lock,
    title: 'Billing (Algeria)',
    body: 'Prices in DZD (135 DZD/USD, HT, TVA 19% incluse). Checkout via SATIM: CIB / Edahabia (Edahabia/Gold) through SATIM redirect with HMAC stub — configure SATIM_GATEWAY_URL, SATIM_MERCHANT_ID in .env.',
  },
];

export function DocumentationPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
          <Info className="h-6 w-6 text-primary-600" /> Documentation
        </h1>
        <p className="mt-1 text-sm text-neutral-500">How SADI PRO works — architecture, pipelines, and operational guides.</p>
      </div>

      <Card className="border-primary-100 bg-primary-50/30">
        <CardBody>
          <p className="text-sm font-medium text-neutral-900">By Aymen Rouagha — SADI PRO</p>
          <p className="text-xs text-neutral-500 mt-1">Crafted as an enterprise-grade DMS. Smart Archive Document Intelligent. Stack: React · Hono · Prisma · PostgreSQL · Gemini/OpenAI.</p>
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
        <CardHeader><CardTitle>Operational notes</CardTitle></CardHeader>
        <CardBody className="space-y-2 text-sm text-neutral-600">
          <p><Badge variant="neutral">API</Badge> Base <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs">/api</code> — health at <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs">/api/health</code> (DB liveness <code>SELECT 1</code>).</p>
          <p><Badge variant="neutral">Auth</Badge> JWT (Bearer), bcrypt 12, soft-deactivate on delete.</p>
          <p><Badge variant="neutral">Env</Badge> <code>DATABASE_URL</code>, <code>JWT_SECRET</code>, <code>GEMINI_API_KEY</code> / <code>OPENAI_API_KEY</code>, <code>SATIM_GATEWAY_URL</code>, <code>CORS_ORIGIN</code>.</p>
          <p className="text-xs text-neutral-400">Tip: hover the <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px]">i</span> icons across Compliance, Billing, and Security sections for inline explanations.</p>
        </CardBody>
      </Card>
    </div>
  );
}
