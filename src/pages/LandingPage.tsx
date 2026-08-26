import { useState } from 'react';
import {
  FileStack,
  Search,
  Shield,
  Sparkles,
  Zap,
  FileText,
  Lock,
  Globe,
  Check,
  ArrowRight,
  Layers,
  Eye,
  Workflow,
  BarChart3,
  Upload,
  Brain,
  Database,
  MessageSquare,
  Tag,
  FolderTree,
  Clock,
  AlertTriangle,
  Users,
  Scale,
  DollarSign,
  Building2,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { plans } from '@/lib/billing';
import { useTranslation } from '@/lib/i18n';

interface LandingPageProps {
  onSignIn: () => void;
  onSignUp: () => void;
}

export function LandingPage({ onSignIn, onSignUp }: LandingPageProps) {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { t, locale, setLocale } = useTranslation();

  const faqs = [
    { q: t('faqArabic'), a: t('faqArabicAnswer') },
    { q: t('faqFormats'), a: t('faqFormatsAnswer') },
    { q: t('faqSearch'), a: t('faqSearchAnswer') },
    { q: t('faqPermissions'), a: t('faqPermissionsAnswer') },
    { q: t('faqSecurity'), a: t('faqSecurityAnswer') },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* ─── 1. Navbar ─── */}
      <nav className="sticky top-0 z-40 border-b border-neutral-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img src="/sadi-logo.png" alt="SADI PRO" className="h-9 w-auto object-contain" />
            <span className="text-sm font-bold text-neutral-900 hidden sm:block">SADI PRO AI</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#solution" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">{t('solution')}</a>
            <a href="#features" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">{t('features')}</a>
            <a href="#how-it-works" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">{t('howItWorks')}</a>
            <a href="#security" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">{t('security')}</a>
            <a href="#pricing" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">{t('billing')}</a>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center rounded-full border border-neutral-200 bg-white p-0.5">
              {(['en','fr','ar'] as const).map((l) => (
                <button key={l} onClick={() => setLocale(l)} className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${locale===l ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:text-neutral-900'}`}>{l.toUpperCase()}</button>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={onSignIn}>{t('signIn')}</Button>
            <Button size="sm" onClick={onSignUp}>{t('signUp')}</Button>
          </div>
        </div>
      </nav>

      {/* ─── 2. Hero ─── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50/50 via-white to-white">
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl leading-tight">
              {t('heroTitle')}
              <span className="block text-primary-600 mt-2">{t('heroSubtitle')}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600 leading-relaxed">
              {t('heroDesc')}
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" onClick={onSignUp} icon={<ArrowRight className="h-5 w-5" />}>
                {t('startFree')}
              </Button>
              <Button size="lg" variant="outline" onClick={onSignIn}>{t('seeHowItWorks')}</Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {['OCR', 'AI Classification', 'Smart Search', 'RAG', 'Workflow', 'Audit'].map((tag) => (
                <span key={tag} className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-600">{tag}</span>
              ))}
            </div>
          </div>

          {/* Hero visual — Dashboard mock */}
          <div className="mx-auto mt-16 max-w-5xl">
            <div className="rounded-2xl border border-neutral-200 bg-white shadow-elevated overflow-hidden">
              <div className="flex h-10 items-center gap-2 border-b border-neutral-100 bg-neutral-50 px-4">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-amber-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <span className="ml-3 text-xs font-medium text-neutral-500">SADI PRO AI — {t('dashboard')}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-0 border-b border-neutral-100">
                {[
                  { value: '128,492', label: t('totalDocuments'), color: 'text-primary-600' },
                  { value: '1,284', label: t('needsReview'), color: 'text-amber-600' },
                  { value: '247', label: t('expiringSoon'), color: 'text-red-500' },
                  { value: '99.9%', label: t('aiInsights'), color: 'text-success-600' },
                ].map((s, i) => (
                  <div key={i} className="p-5 border-r border-neutral-100 last:border-r-0">
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-neutral-500 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                <div className="border-r border-neutral-100 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-4 w-4 text-primary-600" />
                    <span className="text-xs font-semibold text-neutral-900">{t('documents')}</span>
                  </div>
                  <div className="space-y-2">
                    {['عقد 서비스', 'تقرير مالي Q2', 'عقد عمل', 'فاتورة #0312'].map((name, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg border border-neutral-100 px-3 py-2">
                        <FileText className="h-3 w-3 text-primary-400" />
                        <span className="text-xs text-neutral-600 truncate">{name}</span>
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-success-500" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-5 bg-neutral-50/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-accent-600" />
                    <span className="text-xs font-semibold text-neutral-900">{t('aiInsights')}</span>
                  </div>
                  <div className="rounded-lg border border-primary-100 bg-white p-3">
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      {t('heroAiInsight')}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-neutral-100">
                        <div className="h-full w-[94%] rounded-full bg-success-500" />
                      </div>
                      <span className="text-[10px] font-medium text-success-600">94%</span>
                    </div>
                  </div>
                </div>
                <div className="border-l border-neutral-100 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Search className="h-4 w-4 text-accent-600" />
                    <span className="text-xs font-semibold text-neutral-900">{t('searchPage')}</span>
                  </div>
                  <div className="rounded-lg border border-neutral-200 px-3 py-2 text-xs text-neutral-400">
                    {t('search')}...
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {['عقد.getService', 'اتفاقية.الموردين'].map((r, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-1.5">
                        <Search className="h-3 w-3 text-neutral-400" />
                        <span className="text-xs text-neutral-600">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. Trust / Value ─── */}
      <section className="border-y border-neutral-100 bg-neutral-50">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
          {[
            { value: '100K+', label: t('archivedDocs') },
            { value: 'AI Powered', label: t('autoClassify') },
            { value: '3', label: t('languages') },
            { value: '24/7', label: t('secureAccess') },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl font-bold text-neutral-900">{s.value}</p>
              <p className="mt-1 text-sm text-neutral-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 4. Problem ─── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-14">
          <h2 className="text-3xl font-bold text-neutral-900">{t('problemTitle')}</h2>
          <p className="mt-4 text-lg text-neutral-600">{t('problemDesc')}</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
          {[
            { icon: FolderTree, text: t('problem1') },
            { icon: Search, text: t('problem2') },
            { icon: Clock, text: t('problem3') },
            { icon: FileText, text: t('problem4') },
            { icon: Copy, text: t('problem5') },
            { icon: AlertTriangle, text: t('problem6') },
            { icon: Lock, text: t('problem7') },
          ].map((p, i) => {
            const Icon = p.icon;
            return (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50/50 p-4">
                <Icon className="h-5 w-5 text-red-500 shrink-0" />
                <span className="text-sm text-neutral-700">{p.text}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-12 text-center">
          <p className="text-xl font-semibold text-primary-600">{t('problemSolution')}</p>
        </div>
      </section>

      {/* ─── 5. How It Works ─── */}
      <section id="how-it-works" className="bg-neutral-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-14">
            <h2 className="text-3xl font-bold text-neutral-900">{t('howItWorksTitle')}</h2>
            <p className="mt-4 text-lg text-neutral-600">{t('howItWorksDesc')}</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-5 max-w-5xl mx-auto">
            {[
              { step: '01', icon: Upload, title: t('step1Title'), desc: t('step1Desc') },
              { step: '02', icon: Brain, title: t('step2Title'), desc: t('step2Desc') },
              { step: '03', icon: Database, title: t('step3Title'), desc: t('step3Desc') },
              { step: '04', icon: FolderTree, title: t('step4Title'), desc: t('step4Desc') },
              { step: '05', icon: Search, title: t('step5Title'), desc: t('step5Desc') },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-white font-bold text-lg">
                    {s.step}
                  </div>
                  <Icon className="mx-auto h-6 w-6 text-primary-600 mb-2" />
                  <h3 className="text-sm font-bold text-neutral-900">{s.title}</h3>
                  <p className="mt-1 text-xs text-neutral-600 leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── 6. AI Document Intelligence ─── */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-14">
          <h2 className="text-3xl font-bold text-neutral-900">{t('aiTitle')}</h2>
          <p className="mt-4 text-lg text-neutral-600">{t('aiDesc')}</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Brain, title: t('aiFeature1'), desc: t('aiFeature1Desc') },
            { icon: FileText, title: t('aiFeature2'), desc: t('aiFeature2Desc') },
            { icon: Database, title: t('aiFeature3'), desc: t('aiFeature3Desc') },
            { icon: Search, title: t('aiFeature4'), desc: t('aiFeature4Desc') },
            { icon: MessageSquare, title: t('aiFeature5'), desc: t('aiFeature5Desc') },
            { icon: Tag, title: t('aiFeature6'), desc: t('aiFeature6Desc') },
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="group rounded-xl border border-neutral-200 bg-white p-6 transition-all duration-200 hover:border-primary-200 hover:shadow-elevated">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition-colors group-hover:bg-primary-600 group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-neutral-900">{f.title}</h3>
                <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── 7. AI Search Demo ─── */}
      <section className="bg-primary-50/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900">{t('searchDemoTitle')}</h2>
            <p className="mt-4 text-lg text-neutral-600">{t('searchDemoDesc')}</p>
          </div>
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl border border-neutral-200 bg-white shadow-elevated overflow-hidden">
              <div className="border-b border-neutral-100 p-4">
                <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                  <Search className="h-5 w-5 text-neutral-400" />
                  <span className="text-sm text-neutral-500">{t('searchDemoQuery')}</span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-4 w-4 text-primary-600" />
                  <span className="text-sm font-semibold text-neutral-900">SADI AI</span>
                </div>
                <p className="text-sm text-neutral-600 mb-4">{t('searchDemoResult')}</p>
                <div className="space-y-3">
                  {[
                    { name: 'Contract #1024', date: '15 سبتمبر 2026', amount: '1,450,000 DZD' },
                    { name: 'Contract #1182', date: '03 أكتوبر 2026', amount: '2,100,000 DZD' },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg border border-neutral-100 p-3">
                      <FileText className="h-4 w-4 text-primary-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-neutral-900">{r.name}</p>
                        <p className="text-xs text-neutral-500">{t('expires')}: {r.date}</p>
                      </div>
                      <span className="text-sm font-semibold text-neutral-900">{r.amount}</span>
                    </div>
                  ))}
                </div>
                <Button className="mt-4 w-full" variant="outline" size="sm">{t('viewResults')}</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 8. Intelligent Archive ─── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl font-bold text-neutral-900">{t('archiveTitle')}</h2>
            <p className="mt-4 text-lg text-neutral-600 leading-relaxed">{t('archiveDesc')}</p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {[t('versionControl'), t('metadata'), t('smartTags'), t('retention'), t('permissions'), t('fullTextSearch')].map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success-500 shrink-0" />
                  <span className="text-sm text-neutral-700">{f}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="space-y-3">
              {[
                { category: t('legal'), items: [t('contracts'), t('agreements'), t('legalDocs')] },
                { category: t('finance'), items: [t('invoices'), t('reports'), t('payments')] },
                { category: t('hr'), items: [t('employees'), t('empContracts'), t('certificates')] },
              ].map((cat, i) => (
                <div key={i} className="rounded-lg border border-neutral-100 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <FolderTree className="h-4 w-4 text-primary-500" />
                    <span className="text-sm font-semibold text-neutral-900">{cat.category}</span>
                  </div>
                  <div className="ml-6 space-y-1">
                    {cat.items.map((item, j) => (
                      <div key={j} className="flex items-center gap-2 text-xs text-neutral-600">
                        <FileText className="h-3 w-3 text-neutral-400" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 9. Workflow ─── */}
      <section className="bg-neutral-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-14">
            <h2 className="text-3xl font-bold text-neutral-900">{t('workflowTitle')}</h2>
            <p className="mt-4 text-lg text-neutral-600">{t('workflowDesc')}</p>
          </div>
          <div className="mx-auto max-w-3xl">
            <div className="space-y-4">
              {[
                { icon: Upload, label: t('wfUpload'), color: 'bg-blue-100 text-blue-600' },
                { icon: Brain, label: t('wfClassify'), color: 'bg-purple-100 text-purple-600' },
                { icon: Eye, label: t('wfReview'), color: 'bg-amber-100 text-amber-600' },
                { icon: Check, label: t('wfApproval'), color: 'bg-green-100 text-green-600' },
                { icon: FolderTree, label: t('wfArchive'), color: 'bg-primary-100 text-primary-600' },
                { icon: AlertTriangle, label: t('wfAlert'), color: 'bg-red-100 text-red-600' },
                { icon: RefreshCw, label: t('wfRenewal'), color: 'bg-teal-100 text-teal-600' },
              ].map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={i} className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${step.color} shrink-0`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 rounded-lg border border-neutral-200 bg-white px-4 py-3">
                      <span className="text-sm font-medium text-neutral-900">{step.label}</span>
                    </div>
                    {i < 6 && <ArrowRight className="h-4 w-4 text-neutral-300 shrink-0" />}
                  </div>
                );
              })}
            </div>
            <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800">{t('workflowExample')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 10. Security ─── */}
      <section id="security" className="bg-neutral-900 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-800 px-4 py-1.5">
                <Shield className="h-3.5 w-3.5 text-success-400" />
                <span className="text-xs font-medium text-success-400">{t('security')}</span>
              </div>
              <h2 className="text-3xl font-bold text-white">{t('securityTitle')}</h2>
              <p className="mt-4 text-lg text-neutral-400 leading-relaxed">{t('securityDesc')}</p>
              <div className="mt-8 grid grid-cols-2 gap-3">
                {[
                  t('encryption'), t('rbac'), t('permissions'), t('mfa'),
                  t('auditLogs'), t('versionControl'), t('secureStorage'), t('backupRecovery'),
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success-400 shrink-0" />
                    <span className="text-sm text-neutral-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-neutral-700 bg-neutral-800 p-6">
              <div className="space-y-3">
                {[
                  { icon: Lock, label: t('encryption'), status: 'AES-256' },
                  { icon: Zap, label: t('tls'), status: 'TLS 1.3' },
                  { icon: Shield, label: t('rbac'), status: t('active') },
                  { icon: FileText, label: t('auditLogs'), status: t('active') },
                  { icon: Eye, label: t('monitoring'), status: t('active') },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-center gap-3 rounded-lg border border-neutral-700 bg-neutral-900/50 px-4 py-3">
                      <Icon className="h-4 w-4 text-neutral-400" />
                      <span className="text-sm text-neutral-300">{item.label}</span>
                      <span className="ml-auto text-xs font-medium text-success-400">{item.status}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 11. Use Cases ─── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-14">
          <h2 className="text-3xl font-bold text-neutral-900">{t('useCasesTitle')}</h2>
          <p className="mt-4 text-lg text-neutral-600">{t('useCasesDesc')}</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Scale, title: t('useCase1'), desc: t('useCase1Desc') },
            { icon: DollarSign, title: t('useCase2'), desc: t('useCase2Desc') },
            { icon: Users, title: t('useCase3'), desc: t('useCase3Desc') },
            { icon: Building2, title: t('useCase4'), desc: t('useCase4Desc') },
            { icon: ShoppingCart, title: t('useCase5'), desc: t('useCase5Desc') },
          ].map((uc, i) => {
            const Icon = uc.icon;
            return (
              <div key={i} className="rounded-xl border border-neutral-200 bg-white p-6 transition-all duration-200 hover:border-primary-200 hover:shadow-elevated">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-neutral-900">{uc.title}</h3>
                <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{uc.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── 12. Pricing ─── */}
      <section id="pricing" className="bg-neutral-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900">{t('billing')}</h2>
            <p className="mt-4 text-lg text-neutral-600">{t('pricingDesc')}</p>
            <div className="mt-8 inline-flex items-center rounded-full border border-neutral-200 bg-white p-1">
              <button
                onClick={() => setBilling('monthly')}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${billing === 'monthly' ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-500'}`}
              >
                {t('monthly')}
              </button>
              <button
                onClick={() => setBilling('annual')}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${billing === 'annual' ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-500'}`}
              >
                {t('annual')} <span className="text-success-600">-17%</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <div
                key={plan.tier}
                className={`relative rounded-2xl border bg-white p-6 transition-all duration-200 hover:shadow-elevated ${
                  plan.popular ? 'border-primary-500 ring-1 ring-primary-500' : 'border-neutral-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary-600 px-3 py-1 text-xs font-semibold text-white">
                    {t('popular')}
                  </div>
                )}
                <h3 className="text-lg font-bold text-neutral-900">{plan.name}</h3>
                <p className="mt-1 text-xs text-neutral-500">{plan.tier === 'starter' ? t('planStarterDesc') : plan.tier === 'business' ? t('planBusinessDesc') : plan.tier === 'professional' ? t('planProDesc') : t('planEnterpriseDesc')}</p>
                <div className="mt-4">
                  {plan.tier === 'enterprise' ? (
                    <p className="text-3xl font-bold text-neutral-900">{t('custom')}</p>
                  ) : (
                    <>
                      <span className="text-2xl font-bold text-neutral-900">
                        {new Intl.NumberFormat('fr-DZ').format(billing === 'annual' ? plan.annualPrice : plan.monthlyPrice)} DZD
                      </span>
                      <span className="text-sm text-neutral-500">/ {t('monthHT')}</span>
                    </>
                  )}
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-success-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-neutral-600">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-8 w-full"
                  variant={plan.popular ? 'primary' : 'outline'}
                  onClick={onSignUp}
                >
                  {plan.tier === 'enterprise' ? t('contactUs') : t('startFree')}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 13. FAQ ─── */}
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-neutral-900">{t('faqTitle')}</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <span className="text-sm font-medium text-neutral-900">{faq.q}</span>
                {openFaq === i ? <ChevronUp className="h-4 w-4 text-neutral-400" /> : <ChevronDown className="h-4 w-4 text-neutral-400" />}
              </button>
              {openFaq === i && (
                <div className="border-t border-neutral-100 px-5 py-4">
                  <p className="text-sm text-neutral-600 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─── 14. Final CTA ─── */}
      <section className="bg-neutral-900 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">{t('ctaTitle')}</h2>
          <p className="mt-4 text-lg text-neutral-400">{t('ctaDesc')}</p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" onClick={onSignUp} icon={<ArrowRight className="h-5 w-5" />}>
              {t('startFree')}
            </Button>
            <Button size="lg" variant="outline" className="border-neutral-600 text-neutral-300 hover:bg-neutral-800" onClick={onSignIn}>
              {t('contactUs')}
            </Button>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-neutral-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <img src="/sadi-logo.png" alt="SADI PRO" className="h-8 w-auto object-contain opacity-90" />
            <nav className="flex items-center gap-6 text-xs text-neutral-500">
              <a href="#security" className="hover:text-neutral-900 transition-colors">{t('security')}</a>
              <a href="#pricing" className="hover:text-neutral-900 transition-colors">{t('billing')}</a>
              <a href="mailto:support@sadi.pro" className="hover:text-neutral-900 transition-colors">{t('email')}</a>
            </nav>
          </div>
          <p className="mt-4 text-center text-xs text-neutral-400">SADI PRO AI — Intelligent Document Archiving System · © 2026</p>
        </div>
      </footer>
    </div>
  );
}

function Copy(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
    </svg>
  );
}

function RefreshCw(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>
    </svg>
  );
}
