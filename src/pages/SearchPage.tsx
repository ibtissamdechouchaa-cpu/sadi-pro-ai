import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search,
  Sparkles,
  FileText,
  ArrowRight,
  Quote,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { TypewriterText } from '@/components/TypewriterText';
import { ReasoningTrace } from '@/components/ReasoningTrace';
import type { ReasoningStep } from '@/types';
import { useAuth } from '@/lib/auth';
import { useStore } from '@/store/StoreContext';
import { useTranslation } from '@/lib/i18n';
import {
  searchDocuments,
  saveSearchSuggestion,
  getSearchSuggestions,
  mapSearchResultToDocument,
} from '@/lib/search';
import { typeConfig, formatDate, cn } from '@/lib/utils';
import type { Document } from '@/types';

interface SearchPageProps {
  onOpenDocument: (doc: Document) => void;
}

interface SearchResultRow {
  id: string;
  title: string;
  type: string;
  fileType: string;
  classification: string;
  status: string;
  tags: string[];
  uploadedAt: string;
  rank: number;
  snippet: string;
}

const defaultSuggestions = [
  'Show contracts expiring within 60 days',
  'Find all invoices from TechCorp in 2026',
  'What documents need review?',
  'Show HR documents in French',
];

function highlightSnippet(snippet: string, query: string): { __html: string } {
  if (!query.trim()) return { __html: snippet };
  const words = query
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (words.length === 0) return { __html: snippet };
  const regex = new RegExp(`(${words.join('|')})`, 'gi');
  return { __html: snippet.replace(regex, '<mark class="bg-primary-100 text-primary-800 rounded px-0.5 font-medium">$1</mark>') };
}

export function SearchPage({ onOpenDocument }: SearchPageProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { documents } = useStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [answerReasoning, setAnswerReasoning] = useState<ReasoningStep[] | undefined>(undefined);
  const [answerReasoningSummary, setAnswerReasoningSummary] = useState<string | undefined>(undefined);
  const [sources, setSources] = useState<{ docId: string; title: string }[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>(defaultSuggestions);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const loadSuggestions = useCallback(async () => {
    if (!user?.organizationId || !user?.id) return;
    const recent = await getSearchSuggestions(user.organizationId, user.id, 5);
    if (recent.length > 0) {
      setSuggestions(recent);
    }
  }, [user]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  const performSearch = async (q: string) => {
    if (!q.trim() || !user?.organizationId) return;
    setSearching(true);
    setHasSearched(true);
    setResults([]);
    setAnswer(null);
    setAnswerReasoning(undefined);
    setAnswerReasoningSummary(undefined);
    setSources([]);

    const { results: serverResults } = await searchDocuments(user.organizationId, q);

    const rows: SearchResultRow[] = serverResults.map((r) => ({
      id: r.id,
      title: r.title,
      type: r.type,
      fileType: r.fileType,
      classification: r.classification,
      status: r.status,
      tags: r.tags,
      uploadedAt: r.uploadedAt,
      rank: r.rank || 0,
      snippet: r.snippet || '',
    }));

    setResults(rows);
    setSources(rows.slice(0, 3).map((r) => ({ docId: r.id, title: r.title })));

    try {
      const token = localStorage.getItem('sadi_token');
      const res = await fetch('/api/data/search/ai-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query: q }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnswer(data.answer);
        setAnswerReasoning(data.reasoning);
        setAnswerReasoningSummary(data.reasoningSummary);
      } else {
        setAnswer(rows.length > 0
          ? rows[0].snippet || `${t('search')} ${rows.length} ${t('documents')}`
          : t('noSearchResults'));
      }
    } catch {
      setAnswer(rows.length > 0
        ? rows[0].snippet || `${t('search')} ${rows.length} ${t('documents')}`
        : t('noSearchResults'));
    }

    setSearching(false);

    saveSearchSuggestion(user.organizationId, user.id, q);
    loadSuggestions();
  };

  const openDocument = (row: SearchResultRow) => {
    const real = documents.find((d) => d.id === row.id);
    const doc = real || mapSearchResultToDocument({
      id: row.id,
      title: row.title,
      type: row.type,
      fileType: row.fileType,
      classification: row.classification,
      status: row.status,
      tags: row.tags,
      uploadedAt: row.uploadedAt,
      rank: row.rank,
      snippet: row.snippet,
    });
    onOpenDocument(doc);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">{t('searchPage')}</h1>
        <p className="mt-1 text-sm text-neutral-500">{t('search')} {t('documents')}</p>
      </div>

      <div className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') performSearch(query); if (e.key === 'Escape') setQuery(''); }}
            placeholder={t('search')}
            className="w-full h-14 rounded-xl border border-neutral-200 bg-white pl-12 pr-32 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all shadow-card"
          />
          {query && !searching && (
            <button onClick={() => setQuery('')} aria-label={t('close')} className="absolute right-28 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600">
              <X className="h-4 w-4" />
            </button>
          )}
          <Button
            className="absolute right-3 top-1/2 -translate-y-1/2"
            size="md"
            onClick={() => performSearch(query)}
            disabled={searching || !query.trim()}
            isLoading={searching}
            icon={!searching ? <ArrowRight className="h-4 w-4" /> : undefined}
          >
            {searching ? t('loading') : t('search')}
          </Button>
        </div>
      </div>

      {!hasSearched && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">{t('search')}</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => { setQuery(s); performSearch(s); }}
                className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-600 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5 text-primary-500" />
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {answer !== null && (
        <Card className="border-primary-200 bg-primary-50/30 animate-slide-up">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <CardTitle>{t('aiInsights')}</CardTitle>
            </div>
          </CardHeader>
          <CardBody>
            <ReasoningTrace steps={answerReasoning} summary={answerReasoningSummary} />
            <p className="text-sm text-neutral-700 leading-relaxed mt-3"><TypewriterText text={answer} /></p>
            {sources.length > 0 && (
              <div className="mt-4 pt-4 border-t border-primary-100">
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">{t('documents')}</p>
                <div className="space-y-1.5">
                  {sources.map((src, i) => {
                    const row = results.find((r) => r.id === src.docId);
                    return (
                      <button
                        key={i}
                        onClick={() => row && openDocument(row)}
                        className="flex items-center gap-2 text-sm text-primary-700 hover:text-primary-800"
                      >
                        <Quote className="h-3.5 w-3.5 text-primary-400" />
                        <span className="font-medium">{src.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {hasSearched && !searching && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-500">
              {results.length} {t('search')} {t('documents')}
            </p>
          </div>

          {results.length === 0 ? (
            <Card>
              <EmptyState
                icon={<Search className="h-8 w-8" />}
                title={t('noSearchResults')}
                description={t('noSearchResults')}
              />
            </Card>
          ) : (
            results.map((result) => {
              const docType = result.type as keyof typeof typeConfig;
              const config = typeConfig[docType] || { label: result.type };
              return (
                <Card key={result.id} hover>
                  <button
                    onClick={() => openDocument(result)}
                    className="w-full text-left"
                  >
                    <CardBody>
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                          <FileText className="h-5 w-5 text-neutral-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-neutral-900">{result.title}</h3>
                            <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium bg-primary-50 text-primary-700">
                              {result.rank > 0.8 ? t('success') : result.rank > 0.5 ? t('view') : t('loading')} {t('search')}
                            </span>
                          </div>
                          <p
                            className="mt-1.5 text-sm text-neutral-600 leading-relaxed"
                            dangerouslySetInnerHTML={highlightSnippet(result.snippet, query)}
                          />
                          <div className="mt-2 flex items-center gap-2">
                            <Badge variant="neutral">{config.label}</Badge>
                            {result.tags.length > 0 && (
                              <>
                                <span className="text-xs text-neutral-400">·</span>
                                <span className="text-xs text-neutral-400">{result.tags.slice(0, 3).join(', ')}</span>
                              </>
                            )}
                            <span className="text-xs text-neutral-400">·</span>
                            <span className="text-xs text-neutral-400">{formatDate(result.uploadedAt)}</span>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-neutral-300 shrink-0 mt-1" />
                      </div>
                    </CardBody>
                  </button>
                </Card>
              );
            })
          )}
        </div>
      )}

      {searching && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardBody>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg skeleton" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 skeleton" />
                    <div className="h-3 w-full skeleton" />
                    <div className="h-3 w-2/3 skeleton" />
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
