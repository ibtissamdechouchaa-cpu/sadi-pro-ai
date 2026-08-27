import type { RoleKey } from '@/types';

export const ROLE_ORDER: RoleKey[] = ['viewer','auditor','reviewer','editor','manager','admin','owner'];

const MATRIX: Record<RoleKey, string[]> = {
  viewer:   ['document.read','document.download','compliance.view','team.view'],
  auditor:  ['document.read','compliance.view','audit.view','team.view'],
  reviewer: ['document.read','document.approve','document.download','compliance.view','team.view'],
  editor:   ['document.read','document.create','document.update','document.download','document.share','compliance.view','team.view'],
  manager:  ['document.read','document.create','document.update','document.download','document.share','document.approve','document.archive','compliance.view','team.view'],
  admin:    ['document.read','document.create','document.update','document.delete','document.download','document.share','document.approve','document.archive','document.restore','compliance.view','compliance.manage','team.manage','billing.manage','audit.view','team.view'],
  owner:    ['document.read','document.create','document.update','document.delete','document.download','document.share','document.approve','document.archive','document.restore','compliance.view','compliance.manage','team.manage','billing.manage','audit.view','org.manage','team.view'],
};

export function hasPermission(role: RoleKey, perm: string): boolean {
  return (MATRIX[role] || []).includes(perm);
}
export function requirePermission(role: RoleKey, perm: string): void {
  if (!hasPermission(role, perm)) throw new Error(`Forbidden: missing ${perm}`);
}
export function permissionsFor(role: RoleKey): string[] { return MATRIX[role] || []; }
