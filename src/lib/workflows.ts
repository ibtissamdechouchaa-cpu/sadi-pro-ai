import { api } from '@/lib/api';

export async function fetchWorkflows(orgId: string) {
  try {
    const data = await api.get(`/api/data/workflows?orgId=${orgId}`);
    return data.workflows || data || [];
  } catch {
    return [];
  }
}

export async function createWorkflow(
  orgId: string,
  body: { name: string; description?: string; triggerType: string },
) {
  const data = await api.post('/api/data/workflows', {
    organizationId: orgId,
    ...body,
  });
  return data.workflow || data;
}

export async function updateWorkflow(id: string, body: Record<string, unknown>) {
  const data = await api.patch(`/api/data/workflows/${id}`, body);
  return data.workflow || data;
}

export async function deleteWorkflow(id: string) {
  await api.delete(`/api/data/workflows/${id}`);
}

export function evaluateWorkflow(
  workflow: Record<string, unknown>,
  document: Record<string, unknown>,
): boolean {
  const conditions = (workflow.conditions || []) as Record<string, unknown>[];

  if (!conditions.length) return true;

  const logic = (workflow.conditionLogic as string) || 'and';

  const results = conditions.map((cond) => {
    const field = cond.field as string;
    const operator = cond.operator as string;
    const value = cond.value;

    const docValue = getNestedValue(document, field);

    switch (operator) {
      case 'equals':
        return docValue === value;
      case 'not_equals':
        return docValue !== value;
      case 'contains':
        return String(docValue).toLowerCase().includes(String(value).toLowerCase());
      case 'not_contains':
        return !String(docValue).toLowerCase().includes(String(value).toLowerCase());
      case 'gt':
        return Number(docValue) > Number(value);
      case 'lt':
        return Number(docValue) < Number(value);
      case 'gte':
        return Number(docValue) >= Number(value);
      case 'lte':
        return Number(docValue) <= Number(value);
      case 'in':
        return Array.isArray(value) && value.includes(docValue);
      case 'not_in':
        return Array.isArray(value) && !value.includes(docValue);
      case 'is_empty':
        return docValue === null || docValue === undefined || docValue === '';
      case 'is_not_empty':
        return docValue !== null && docValue !== undefined && docValue !== '';
      default:
        return true;
    }
  });

  if (logic === 'or') {
    return results.some(Boolean);
  }
  return results.every(Boolean);
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}
