import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Scale,
  FileText,
  Download,
  Eye,
  Trash2,
  Clock,
  Filter,
  ChevronDown,
  ExternalLink,
  Check,
  AlertTriangle,
  BookOpen,
  Shield,
} from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/lib/toast';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import { cn, formatDate } from '@/lib/utils';

type SearchMode = 'quick' | 'deep' | 'related' | 'retention';

const DOMAIN_OPTIONS = [
  { value: 'ALL', labelAr: 'جميع المجالات', labelFr: 'Tous les domaines', labelEn: 'All Domains' },
  { value: 'ARCHIVES', labelAr: 'الأرشيف', labelFr: 'Archives', labelEn: 'Archives' },
  { value: 'DOCUMENT_MANAGEMENT', labelAr: 'إدارة الوثائق', labelFr: 'Gestion documentaire', labelEn: 'Document Management' },
  { value: 'PERSONAL_DATA', labelAr: 'البيانات الشخصية', labelFr: 'Données personnelles', labelEn: 'Personal Data' },
  { value: 'CYBERSECURITY', labelAr: 'الأمن السيبراني', labelFr: 'Cybersécurité', labelEn: 'Cybersecurity' },
  { value: 'E_SIGNATURE', labelAr: 'التوقيع الإلكتروني', labelFr: 'Signature électronique', labelEn: 'E-Signature' },
  { value: 'E_COMMERCE', labelAr: 'التجارة الإلكترونية', labelFr: 'Commerce électronique', labelEn: 'E-Commerce' },
  { value: 'CULTURAL_HERITAGE', labelAr: 'التراث الثقافي', labelFr: 'Patrimoine culturel', labelEn: 'Cultural Heritage' },
  { value: 'OTHER', labelAr: 'أخرى', labelFr: 'Autre', labelEn: 'Other' },
];

export function LegalResearchPage() {
  const { t, locale } = useTranslation();
  const { toast } = useToast();

  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('quick');
  const [domain, setDomain] = useState('ALL');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [importing, setImporting] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [domainDropdownOpen, setDomainDropdownOpen] = useState(false);

  const langLabel = (opt: { labelAr: string; labelFr: string; labelEn: string }) =>
    locale === 'ar' ? opt.labelAr : locale === 'fr' ? opt.labelFr : opt.labelEn;

  const loadStats = useCallback(async () => {
    try {
      const data = await api.get('/api/compliance/legal-research/stats');
      setStats(data);
    } catch {}
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const data = await api.get('/api/compliance/legal-research/history');
      if (data.history) setHistory(data.history);
    } catch {}
  }, []);

  useEffect(() => {
    loadStats();
    loadHistory();
  }, [loadStats, loadHistory]);

  const doSearch = useCallback(async () => {
    if (!query.trim()) {
      toast('warning', locale === 'ar' ? 'الرجاء إدخال كلمة للبحث' : locale === 'fr' ? 'Veuillez entrer un terme de recherche' : 'Please enter a search term');
      return;
    }
    setLoading(true);
    setSelectedResult(null);
    try {
      const data = await api.post('/api/compliance/legal-research', { query: query.trim(), mode: searchMode, domain: domain === 'ALL' ? undefined : domain });
      setResults(data.results || []);
      if (data.results && data.results.length === 0) {
        toast('info', locale === 'ar' ? 'لم يتم العثور على نتائج' : locale === 'fr' ? 'Aucun résultat trouvé' : 'No results found');
      }
      await api.post('/api/compliance/legal-research/history', { query: query.trim(), mode: searchMode, domain, resultCount: data.results?.length || 0 }).catch(() => {});
      loadHistory();
    } catch (e: unknown) {
      toast('error', e instanceof Error ? e.message : t('error'));
    }
    setLoading(false);
  }, [query, searchMode, domain, toast, locale, t, loadHistory]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') doSearch();
  };

  const importToKB = useCallback(async (ref: any) => {
    setImporting(ref.id);
    try {
      await api.post('/api/compliance/legal-research/import', { referenceId: ref.id });
      toast('success', locale === 'ar' ? 'تمت الاستيراد إلى قاعدة المعرفة' : locale === 'fr' ? 'Importé dans la base de connaissances' : 'Imported to Knowledge Base');
      loadStats();
    } catch (e: unknown) {
      toast('error', e instanceof Error ? e.message : t('error'));
    }
    setImporting(null);
  }, [toast, locale, t, loadStats]);

  const ignoreResult = (id: string) => {
    setResults((prev) => prev.filter((r) => r.id !== id));
    if (selectedResult?.id === id) setSelectedResult(null);
  };

  const searchModes = [
    { key: 'quick' as const, labelAr: 'بحث سريع', labelFr: 'Recherche rapide', labelEn: 'Quick Search' },
    { key: 'deep' as const, labelAr: 'بحث عميق', labelFr: 'Recherche approfondie', labelEn: 'Deep Research' },
    { key: 'related' as const, labelAr: 'بحث ذات صلة', labelFr: 'Trouver lié', labelEn: 'Find Related' },
    { key: 'retention' as const, labelAr: 'قواعد الاحتفاظ', labelFr: 'Règles de rétention', labelEn: 'Find Retention Rules' },
  ];

  const getRelevanceColor = (score: number): string => {
    if (score >= 90) return 'text-success-700 bg-success-50';
    if (score >= 70) return 'text-primary-700 bg-primary-50';
    if (score >= 50) return 'text-warning-700 bg-warning-50';
    return 'text-neutral-600 bg-neutral-100';
  };

  const getRefTypeBadge = (type: string) => {
    switch (type) {
      case 'law':
        return { variant: 'primary' as const, labelAr: 'قانون', labelFr: 'Loi', labelEn: 'Law' };
      case 'circular':
        return { variant: 'warning' as const, labelAr: 'منشور', labelFr: 'Circulaire', labelEn: 'Circular' };
      case 'standard':
        return { variant: 'success' as const, labelAr: 'معيار', labelFr: 'Norme', labelEn: 'Standard' };
      default:
        return { variant: 'neutral' as const, labelAr: 'مرجع', labelFr: 'Référence', labelEn: 'Reference' };
    }
  };

  const renderHeader = () => (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
          <Scale className="h-5 w-5 text-primary-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-neutral-900">
            {locale === 'ar' ? 'البحث القانوني الذكي' : locale === 'fr' ? 'Recherche juridique IA' : 'AI Legal Research'}
          </h1>
          <p className="text-sm text-neutral-500">
            {locale === 'ar'
              ? 'ابحث في القوانين والمناشير والمعايير الجزائرية المرتبطة بالأرشيف وإدارة الوثائق'
              : locale === 'fr'
                ? 'Recherchez les lois, circulaires et normes algériennes liées à l\'archivage et à la gestion documentaire'
                : 'Search Algerian laws, circulars and standards related to archiving and document management'}
          </p>
        </div>
      </div>
    </div>
  );

  const renderSearchSection = () => (
    <Card>
      <CardBody>
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute top-1/2 start-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                locale === 'ar'
                  ? 'مثال: حماية البيانات الشخصية، آجال الاحتفاظ، التوثيق الإلكتروني...'
                  : locale === 'fr'
                    ? 'Ex: protection des données personnelles, délais de rétention, signature électronique...'
                    : 'Ex: personal data protection, retention periods, e-signature...'
              }
              className="h-11 w-full rounded-xl border border-neutral-200 bg-white pe-4 ps-10 text-sm text-neutral-900 placeholder-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-wrap gap-1.5">
              {searchModes.map((mode) => (
                <button
                  key={mode.key}
                  onClick={() => setSearchMode(mode.key)}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                    searchMode === mode.key
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  )}
                >
                  {langLabel(mode)}
                </button>
              ))}
            </div>

            <div className="relative">
              <button
                onClick={() => setDomainDropdownOpen(!domainDropdownOpen)}
                className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                <Filter className="h-3.5 w-3.5 text-neutral-400" />
                {langLabel(DOMAIN_OPTIONS.find((d) => d.value === domain) || DOMAIN_OPTIONS[0])}
                <ChevronDown className={cn('h-3.5 w-3.5 text-neutral-400 transition-transform', domainDropdownOpen && 'rotate-180')} />
              </button>
              {domainDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDomainDropdownOpen(false)} />
                  <div className="absolute top-full mt-1 z-20 w-56 rounded-xl border border-neutral-200 bg-white shadow-elevated py-1">
                    {DOMAIN_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setDomain(opt.value); setDomainDropdownOpen(false); }}
                        className={cn(
                          'flex w-full items-center gap-2 px-3 py-2 text-xs text-left transition-colors',
                          domain === opt.value ? 'bg-primary-50 text-primary-700' : 'text-neutral-700 hover:bg-neutral-50'
                        )}
                      >
                        {domain === opt.value && <Check className="h-3.5 w-3.5 text-primary-600" />}
                        <span className={domain === opt.value ? '' : 'ps-5.5'}>{langLabel(opt)}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <Button
              onClick={doSearch}
              isLoading={loading}
              icon={<Search className="h-4 w-4" />}
              className="sm:ms-auto"
            >
              {t('search')}
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );

  const renderResultsSection = () => {
    if (!loading && results.length === 0) {
      return (
        <Card>
          <EmptyState
            icon={<Scale className="h-8 w-8" />}
            title={locale === 'ar' ? 'ابدأ البحث القانوني' : locale === 'fr' ? 'Commencer la recherche juridique' : 'Start Legal Research'}
            description={
              locale === 'ar'
                ? 'أدخل كلمة مفتاحية أو عبارة للبحث في القوانين والمناشير والمعايير'
                : locale === 'fr'
                  ? 'Entrez un mot-clé ou une phrase pour rechercher dans les lois, circulaires et normes'
                  : 'Enter a keyword or phrase to search through laws, circulars and standards'
            }
          />
        </Card>
      );
    }

    if (loading) {
      return (
        <Card>
          <CardBody>
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
              <p className="mt-3 text-sm text-neutral-500">
                {locale === 'ar' ? 'جاري البحث...' : locale === 'fr' ? 'Recherche en cours...' : 'Searching...'}
              </p>
            </div>
          </CardBody>
        </Card>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            {results.length} {locale === 'ar' ? 'نتيجة' : locale === 'fr' ? 'résultats' : 'results'}
          </p>
        </div>
        {results.map((ref) => {
          const refTypeBadge = getRefTypeBadge(ref.referenceType);
          const title = locale === 'ar' && ref.titleAr ? ref.titleAr : locale === 'fr' && ref.titleFr ? ref.titleFr : ref.title;
          return (
            <Card
              key={ref.id}
              hover
              className={cn('cursor-pointer transition-all', selectedResult?.id === ref.id && 'border-primary-300 ring-1 ring-primary-200')}
              onClick={() => setSelectedResult(ref)}
            >
              <CardBody>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={refTypeBadge.variant}>
                        {langLabel(refTypeBadge)}
                      </Badge>
                      <Badge variant={ref.status === 'ACTIVE' ? 'success' : 'warning'} dot>
                        {ref.status === 'ACTIVE'
                          ? (locale === 'ar' ? 'نشط' : locale === 'fr' ? 'Actif' : 'Active')
                          : (locale === 'ar' ? 'غير موثق' : locale === 'fr' ? 'Non vérifié' : 'Unverified')}
                      </Badge>
                      {ref.domain && (
                        <Badge variant="neutral">
                          {langLabel(DOMAIN_OPTIONS.find((d) => d.value === ref.domain) || DOMAIN_OPTIONS[DOMAIN_OPTIONS.length - 1])}
                        </Badge>
                      )}
                    </div>

                    <h3 className="mt-2 text-sm font-semibold text-neutral-900 leading-snug">{title}</h3>

                    {ref.referenceNumber && (
                      <p className="mt-1 text-xs text-neutral-500">{ref.referenceNumber}</p>
                    )}

                    {ref.description && (
                      <p className="mt-1.5 text-xs text-neutral-500 leading-relaxed line-clamp-2">{ref.description}</p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-400">
                      {ref.source && (
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {ref.source}
                        </span>
                      )}
                      {ref.jurisdiction && (
                        <span className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          {ref.jurisdiction}
                        </span>
                      )}
                      {ref.articleCount != null && (
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {ref.articleCount} {locale === 'ar' ? 'مادة' : locale === 'fr' ? 'articles' : 'articles'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {ref.relevanceScore != null && (
                      <div className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', getRelevanceColor(ref.relevanceScore))}>
                        {ref.relevanceScore}%
                      </div>
                    )}
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Eye className="h-3.5 w-3.5" />}
                        onClick={(e) => { e.stopPropagation(); setSelectedResult(ref); }}
                      >
                        {t('view')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Download className="h-3.5 w-3.5" />}
                        onClick={(e) => { e.stopPropagation(); importToKB(ref); }}
                        isLoading={importing === ref.id}
                      >
                        {locale === 'ar' ? 'استيراد' : locale === 'fr' ? 'Importer' : 'Import'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 className="h-3.5 w-3.5" />}
                        onClick={(e) => { e.stopPropagation(); ignoreResult(ref.id); }}
                      >
                        {locale === 'ar' ? 'تجاهل' : locale === 'fr' ? 'Ignorer' : 'Ignore'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderDetailPanel = () => {
    if (!selectedResult) return null;
    const ref = selectedResult;
    const title = locale === 'ar' && ref.titleAr ? ref.titleAr : locale === 'fr' && ref.titleFr ? ref.titleFr : ref.title;
    const refTypeBadge = getRefTypeBadge(ref.referenceType);

    return (
      <Modal
        open={!!selectedResult}
        onClose={() => setSelectedResult(null)}
        title={title}
        size="lg"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setSelectedResult(null)}>
              {t('close')}
            </Button>
            <Button
              icon={<Download className="h-4 w-4" />}
              onClick={() => importToKB(ref)}
              isLoading={importing === ref.id}
            >
              {locale === 'ar' ? 'استيراد إلى قاعدة المعرفة' : locale === 'fr' ? 'Importer dans la base' : 'Import to Knowledge Base'}
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <Badge variant={refTypeBadge.variant}>
              {langLabel(refTypeBadge)}
            </Badge>
            <Badge variant={ref.status === 'ACTIVE' ? 'success' : 'warning'} dot>
              {ref.status === 'ACTIVE'
                ? (locale === 'ar' ? 'نشط' : locale === 'fr' ? 'Actif' : 'Active')
                : (locale === 'ar' ? 'غير موثق' : locale === 'fr' ? 'Non vérifié' : 'Unverified')}
            </Badge>
            {ref.domain && (
              <Badge variant="neutral">
                {langLabel(DOMAIN_OPTIONS.find((d) => d.value === ref.domain) || DOMAIN_OPTIONS[DOMAIN_OPTIONS.length - 1])}
              </Badge>
            )}
            {ref.relevanceScore != null && (
              <Badge variant="info">
                {locale === 'ar' ? 'الصلة' : locale === 'fr' ? 'Pertinence' : 'Relevance'}: {ref.relevanceScore}%
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-neutral-500">
                {locale === 'ar' ? 'رقم المرجع' : locale === 'fr' ? 'Numéro de référence' : 'Reference Number'}
              </p>
              <p className="text-sm text-neutral-900 mt-1">{ref.referenceNumber || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500">
                {locale === 'ar' ? 'المصدر' : locale === 'fr' ? 'Source' : 'Source'}
              </p>
              <p className="text-sm text-neutral-900 mt-1">{ref.source || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500">
                {locale === 'ar' ? 'الاختصاص القضائي' : locale === 'fr' ? 'Juridiction' : 'Jurisdiction'}
              </p>
              <p className="text-sm text-neutral-900 mt-1">{ref.jurisdiction || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500">
                {locale === 'ar' ? 'عدد المواد' : locale === 'fr' ? 'Nombre d\'articles' : 'Number of Articles'}
              </p>
              <p className="text-sm text-neutral-900 mt-1">{ref.articleCount ?? '—'}</p>
            </div>
            {ref.publicationDate && (
              <div>
                <p className="text-xs font-medium text-neutral-500">
                  {locale === 'ar' ? 'تاريخ النشر' : locale === 'fr' ? 'Date de publication' : 'Publication Date'}
                </p>
                <p className="text-sm text-neutral-900 mt-1">{formatDate(ref.publicationDate)}</p>
              </div>
            )}
            {ref.lastAmendment && (
              <div>
                <p className="text-xs font-medium text-neutral-500">
                  {locale === 'ar' ? 'آخر تعديل' : locale === 'fr' ? 'Dernière amendment' : 'Last Amendment'}
                </p>
                <p className="text-sm text-neutral-900 mt-1">{formatDate(ref.lastAmendment)}</p>
              </div>
            )}
          </div>

          {ref.description && (
            <div>
              <p className="text-xs font-medium text-neutral-500 mb-1">
                {locale === 'ar' ? 'الوصف' : locale === 'fr' ? 'Description' : 'Description'}
              </p>
              <p className="text-sm text-neutral-700 leading-relaxed">{ref.description}</p>
            </div>
          )}

          {ref.articles && ref.articles.length > 0 && (
            <div>
              <p className="text-xs font-medium text-neutral-500 mb-2">
                {locale === 'ar' ? 'المواد' : locale === 'fr' ? 'Articles' : 'Articles'}
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {ref.articles.map((article: any, idx: number) => (
                  <div key={idx} className="rounded-lg border border-neutral-200 p-3">
                    <p className="text-xs font-semibold text-neutral-900">
                      {locale === 'ar' ? 'المادة' : locale === 'fr' ? 'Article' : 'Article'} {article.number || idx + 1}
                      {article.title && ` — ${article.title}`}
                    </p>
                    {article.content && (
                      <p className="mt-1 text-xs text-neutral-600 leading-relaxed line-clamp-3">{article.content}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {ref.relatedTexts && ref.relatedTexts.length > 0 && (
            <div>
              <p className="text-xs font-medium text-neutral-500 mb-2">
                {locale === 'ar' ? 'النصوص ذات الصلة' : locale === 'fr' ? 'Textes associés' : 'Related Texts'}
              </p>
              <div className="space-y-1.5">
                {ref.relatedTexts.map((related: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-primary-600 hover:text-primary-700 cursor-pointer">
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    <span className="truncate">{related.title || related.referenceNumber || `—`}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ref.retentionRules && (
            <div className="rounded-lg bg-neutral-50 p-4">
              <p className="text-xs font-medium text-neutral-500 mb-2">
                {locale === 'ar' ? 'قواعد الاحتفاظ' : locale === 'fr' ? 'Règles de rétention' : 'Retention Rules'}
              </p>
              <div className="flex flex-wrap gap-2">
                {ref.retentionRules.minYears != null && (
                  <Badge variant="info">
                    {locale === 'ar' ? 'الحد الأدنى' : locale === 'fr' ? 'Minimum' : 'Min'}: {ref.retentionRules.minYears} {locale === 'ar' ? 'سنوات' : locale === 'fr' ? 'ans' : 'years'}
                  </Badge>
                )}
                {ref.retentionRules.maxYears != null && (
                  <Badge variant="info">
                    {locale === 'ar' ? 'الحد الأقصى' : locale === 'fr' ? 'Maximum' : 'Max'}: {ref.retentionRules.maxYears} {locale === 'ar' ? 'سنوات' : locale === 'fr' ? 'ans' : 'years'}
                  </Badge>
                )}
                {ref.retentionRules.documentTypes?.slice(0, 5).map((dt: string) => (
                  <Badge key={dt} variant="neutral">{dt}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    );
  };

  const renderStatsSidebar = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === 'ar' ? 'الإحصائيات' : locale === 'fr' ? 'Statistiques' : 'Statistics'}
          </CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500">
              {locale === 'ar' ? 'إجمالي المراجع في القاعدة' : locale === 'fr' ? 'Total références dans la base' : 'Total references in KB'}
            </span>
            <span className="text-lg font-bold text-neutral-900">{stats?.totalInKB ?? 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500">
              {locale === 'ar' ? 'موثقة' : locale === 'fr' ? 'Vérifiées' : 'Verified'}
            </span>
            <span className="text-sm font-semibold text-success-700">{stats?.verified ?? 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500">
              {locale === 'ar' ? 'غير موثقة' : locale === 'fr' ? 'Non vérifiées' : 'Unverified'}
            </span>
            <span className="text-sm font-semibold text-warning-700">{stats?.unverified ?? 0}</span>
          </div>
        </CardBody>
      </Card>

      {stats?.recentSearches != null && (
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-neutral-700">
                {locale === 'ar' ? 'عمليات البحث الأخيرة' : locale === 'fr' ? 'Recherches récentes' : 'Recent Searches'}
              </span>
              <span className="text-lg font-bold text-neutral-900">{stats.recentSearches}</span>
            </div>
          </CardBody>
        </Card>
      )}

      {stats?.domainDistribution && stats.domainDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {locale === 'ar' ? 'التوزيع حسب المجال' : locale === 'fr' ? 'Distribution par domaine' : 'Domain Distribution'}
            </CardTitle>
          </CardHeader>
          <CardBody className="space-y-2.5">
            {stats.domainDistribution.map((item: { domain: string; count: number }) => {
              const domainOpt = DOMAIN_OPTIONS.find((d) => d.value === item.domain);
              const maxCount = Math.max(...stats.domainDistribution.map((d: { count: number }) => d.count), 1);
              const pct = Math.round((item.count / maxCount) * 100);
              return (
                <div key={item.domain}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-neutral-600">{domainOpt ? langLabel(domainOpt) : item.domain}</span>
                    <span className="text-xs font-medium text-neutral-900">{item.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                    <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>
      )}
    </div>
  );

  const renderHistory = () => (
    <Card>
      <button
        onClick={() => setHistoryOpen(!historyOpen)}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-neutral-50 transition-colors rounded-xl"
      >
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-neutral-400" />
          <span className="text-sm font-semibold text-neutral-900">
            {locale === 'ar' ? 'سجل البحث' : locale === 'fr' ? 'Historique de recherche' : 'Search History'}
          </span>
          <Badge variant="neutral">{history.length}</Badge>
        </div>
        <ChevronDown className={cn('h-4 w-4 text-neutral-400 transition-transform', historyOpen && 'rotate-180')} />
      </button>
      {historyOpen && (
        <div className="border-t border-neutral-100">
          {history.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-neutral-400">
              {locale === 'ar' ? 'لا يوجد سجل بحث بعد' : locale === 'fr' ? 'Aucun historique de recherche' : 'No search history yet'}
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto divide-y divide-neutral-50">
              {history.map((item: any, idx: number) => (
                <button
                  key={idx}
                  className="flex w-full items-center gap-3 px-5 py-2.5 text-left hover:bg-neutral-50 transition-colors"
                  onClick={() => {
                    setQuery(item.query);
                    if (item.mode) setSearchMode(item.mode);
                    if (item.domain) setDomain(item.domain);
                  }}
                >
                  <Search className="h-3.5 w-3.5 text-neutral-300 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-neutral-700 truncate">{item.query}</p>
                    <p className="text-[11px] text-neutral-400">
                      {item.createdAt ? formatDate(item.createdAt) : ''}
                      {item.resultCount != null ? ` · ${item.resultCount} ${locale === 'ar' ? 'نتيجة' : locale === 'fr' ? 'résultats' : 'results'}` : ''}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );

  return (
    <div className="space-y-5">
      {renderHeader()}
      {renderSearchSection()}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          {renderResultsSection()}
          {renderHistory()}
        </div>
        <div>{renderStatsSidebar()}</div>
      </div>

      {renderDetailPanel()}
    </div>
  );
}
