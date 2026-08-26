export const CURRENCY = 'DZD' as const;
export const DZD_PER_USD = 135;

// 135 DZD/USD (Banque d'Algérie band Aug 2026) — retail prices absorb TVA 19% + SATIM fees + .90 psychological pricing
export function formatDZD(amount: number): string {
  // fr-DZ locale with Narrow no-break space + DZD suffix; fallback to explicit "DZD"
  try {
    return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${new Intl.NumberFormat('fr-DZ').format(amount)} DZD`;
  }
}

export function formatDZDCompact(n: number): string {
  return formatDZD(n);
}

export function parseDZD(s: string): number {
  const digits = s.replace(/[^\d]/g, '');
  return Number(digits) || 0;
}
