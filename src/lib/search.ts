import { api } from '@/lib/api';
import type { Document } from '@/types';

interface SearchResult {
  id: string;
  title: string;
  type: string;
  fileType: string;
  classification: string;
  status: string;
  tags: string[];
  uploadedBy: string;
  uploadedAt: string;
  rank: number;
  snippet: string;
}

export async function searchDocuments(
  orgId: string,
  query: string,
  limit = 20,
  offset = 0
): Promise<{ results: SearchResult[]; error?: string }> {
  if (!query.trim()) return { results: [] };

  try {
    const data = await api.get(`/api/data/documents/search?q=${encodeURIComponent(query)}&orgId=${orgId}&limit=${limit}&offset=${offset}`);
    return { results: data.results || [] };
  } catch (err) {
    console.warn('Search failed:', err);
    return { results: [], error: err instanceof Error ? err.message : 'Search failed' };
  }
}

export async function saveSearchSuggestion(
  orgId: string,
  userId: string,
  query: string
): Promise<void> {
  if (!query.trim()) return;

  try {
    await api.post('/api/data/search-suggestions', { orgId, userId, query: query.trim() });
  } catch (err) {
    console.warn('Failed to save search suggestion:', err);
  }
}

export async function getSearchSuggestions(
  orgId: string,
  userId: string,
  limit = 5
): Promise<string[]> {
  try {
    const data = await api.get(`/api/data/search-suggestions?orgId=${orgId}&userId=${userId}&limit=${limit}`);
    const suggestions = (data.suggestions || []) as { query: string }[];
    return [...new Set(suggestions.map((s) => s.query))];
  } catch {
    return [];
  }
}

export function mapSearchResultToDocument(result: SearchResult): Document {
  return {
    id: result.id,
    title: result.title,
    type: result.type as Document['type'],
    typeConfidence: 0,
    language: 'unknown',
    departmentId: null,
    classification: result.classification as Document['classification'],
    archiveState: 'active',
    approvalState: 'draft',
    status: result.status as Document['status'],
    fileSize: 0,
    fileType: result.fileType,
    uploadedBy: result.uploadedBy || 'Unknown',
    uploadedAt: result.uploadedAt,
    modifiedAt: result.uploadedAt,
    tags: result.tags || [],
    version: 1,
    versions: [],
    hash: '',
    pageCount: 0,
    ocrCompleted: false,
    embeddingCompleted: false,
    insight: null,
    relatedDocIds: [],
    retentionYears: null,
    expiresAt: null,
    legalHold: false,
    sharedWith: [],
    metadata: { searchRank: result.rank, searchSnippet: result.snippet },
  };
}
