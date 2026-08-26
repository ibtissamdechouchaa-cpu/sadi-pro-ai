import type { Context } from "hono";
import { prisma } from "./prisma.js";

// Re-export single source of truth from src/lib/permissions.ts — do NOT duplicate MATRIX
export { hasPermission, requirePermission, ROLE_ORDER } from "../../src/lib/permissions.js";
import { hasPermission } from "../../src/lib/permissions.js";

export type RoleKey = "owner" | "admin" | "manager" | "editor" | "reviewer" | "viewer" | "auditor";

export async function getRole(userId: string): Promise<RoleKey> {
  const profile = await prisma.profile.findUnique({ where: { id: userId } });
  return (profile?.role as RoleKey) ?? "viewer";
}

export async function requirePermissionFor(userId: string, perm: string): Promise<void> {
  const role = await getRole(userId);
  if (!hasPermission(role, perm)) {
    const err = new Error(`Forbidden: missing ${perm}`) as Error & { status?: number };
    (err as unknown as { status: number }).status = 403;
    throw err;
  }
}

/**
 * Hono helper: checks c.get('userId') role against perm.
 * Returns a 403 Response if forbidden (caller should `return` it), or null if allowed.
 * Usage: `const forbidden = await assertPermission(c, 'document.create'); if (forbidden) return forbidden;`
 * Also supports boolean check pattern via truthiness.
 */
export async function assertPermission(c: Context, perm: string): Promise<Response | null> {
  const userId = c.get("userId" as never) as string | undefined;
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const role = await getRole(userId);
  if (!hasPermission(role, perm)) {
    return c.json({ error: `Forbidden: missing ${perm}` }, 403);
  }
  return null;
}
