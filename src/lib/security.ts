const ENTITY_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

const ENTITY_REGEX = /[&<>"'/]/g;

export function sanitizeInput(input: string): string {
  return input.replace(ENTITY_REGEX, (char) => ENTITY_MAP[char] || char);
}

export function validateFileType(file: File, allowedTypes: string[]): boolean {
  if (allowedTypes.length === 0) return true;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const mimeMatch = allowedTypes.some((t) => {
    if (t.startsWith('.')) return ext === t.slice(1);
    if (t.endsWith('/*')) return file.type.startsWith(t.replace('/*', '/'));
    return file.type === t;
  });
  return mimeMatch;
}

export function validateFileSize(file: File, maxSizeBytes: number): boolean {
  return file.size <= maxSizeBytes;
}

export async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

const ROLE_HIERARCHY: Record<string, number> = {
  owner: 6,
  admin: 5,
  manager: 4,
  editor: 3,
  reviewer: 2,
  viewer: 1,
  auditor: 2,
};

export function checkPermission(userRole: string, requiredRole: string): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 0;
  return userLevel >= requiredLevel;
}
