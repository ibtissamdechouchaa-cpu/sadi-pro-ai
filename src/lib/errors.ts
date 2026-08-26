import { api } from '@/lib/api';

export class AppError extends Error {
  code: string;
  statusCode: number;
  context: Record<string, unknown>;

  constructor(
    message: string,
    options: {
      code?: string;
      statusCode?: number;
      context?: Record<string, unknown>;
      cause?: unknown;
    } = {}
  ) {
    super(message);
    this.name = 'AppError';
    this.code = options.code ?? 'UNKNOWN_ERROR';
    this.statusCode = options.statusCode ?? 500;
    this.context = options.context ?? {};
  }
}

export function handleError(err: unknown): { message: string; code: string } {
  if (err instanceof AppError) {
    return { message: err.message, code: err.code };
  }
  if (err instanceof Response) {
    return { message: `Request failed with status ${err.status}`, code: `HTTP_${err.status}` };
  }
  if (err instanceof TypeError) {
    return { message: err.message || 'Network error', code: 'NETWORK_ERROR' };
  }
  if (err instanceof Error) {
    return { message: err.message, code: 'UNKNOWN_ERROR' };
  }
  return { message: 'An unexpected error occurred', code: 'UNKNOWN_ERROR' };
}

export async function logError(
  err: unknown,
  context: Record<string, unknown> = {}
): Promise<void> {
  const { message, code } = handleError(err);
  try {
    await api.post('/api/data/audit-logs', {
      action: 'error',
      resourceType: 'system',
      metadata: {
        errorCode: code,
        errorMessage: message,
        stack: err instanceof Error ? err.stack : undefined,
        ...context,
      },
    });
  } catch {
    console.error('[logError] Failed to persist error to audit log:', message);
  }
}

export async function withErrorBoundary<T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    await logError(err);
    return fallback;
  }
}
