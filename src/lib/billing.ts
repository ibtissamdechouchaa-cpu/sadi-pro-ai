import type { PlanConfig, PlanTier } from '@/types';

export const plans: PlanConfig[] = [
  {
    tier: 'starter',
    name: 'Starter',
    monthlyPrice: 29,
    annualPrice: 24,
    maxUsers: 5,
    maxStorageGB: 25,
    maxDocuments: 5000,
    features: [
      '5 users',
      '25 GB storage',
      '5,000 documents',
      'AI search',
      'OCR',
      'Basic analytics',
    ],
  },
  {
    tier: 'business',
    name: 'Business',
    monthlyPrice: 79,
    annualPrice: 67,
    maxUsers: 15,
    maxStorageGB: 100,
    maxDocuments: 25000,
    features: [
      '15 users',
      '100 GB storage',
      '25,000 documents',
      'Advanced AI & RAG',
      'Workflows',
      'Audit logs',
      'Advanced permissions',
    ],
    popular: true,
  },
  {
    tier: 'professional',
    name: 'Professional',
    monthlyPrice: 199,
    annualPrice: 169,
    maxUsers: 50,
    maxStorageGB: 500,
    maxDocuments: 100000,
    features: [
      '50 users',
      '500 GB storage',
      '100,000 documents',
      'Advanced compliance',
      'Priority processing',
      'API access',
      'Advanced analytics',
    ],
  },
  {
    tier: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 0,
    annualPrice: 0,
    maxUsers: null,
    maxStorageGB: 0,
    maxDocuments: 0,
    features: [
      'Unlimited users',
      'Custom storage',
      'SSO & SCIM',
      'Dedicated infrastructure',
      'Custom retention policies',
      'SLA',
      'Priority support',
      'Custom integrations',
    ],
  },
];

export function getPlanByTier(tier: PlanTier): PlanConfig {
  return plans.find((p) => p.tier === tier) || plans[0];
}

export function getUpgradePath(currentTier: PlanTier): PlanConfig | null {
  const order: PlanTier[] = ['starter', 'business', 'professional', 'enterprise'];
  const currentIndex = order.indexOf(currentTier);
  if (currentIndex < order.length - 1) {
    return getPlanByTier(order[currentIndex + 1]);
  }
  return null;
}

export function calculateAnnualSavings(tier: PlanTier): number {
  const plan = getPlanByTier(tier);
  if (plan.monthlyPrice === 0) return 0;
  return (plan.monthlyPrice - plan.annualPrice) * 12;
}

export interface UsageCheck {
  withinLimits: boolean;
  warnings: string[];
  blocks: string[];
  usagePercent: {
    storage: number;
    documents: number;
    users: number;
    aiTokens: number;
    ocrPages: number;
  };
}

export function checkUsageLimits(
  usage: { storageUsedGB: number; documentCount: number; userCount: number; aiTokensUsed: number; ocrPagesUsed: number },
  plan: PlanConfig
): UsageCheck {
  const warnings: string[] = [];
  const blocks: string[] = [];

  const storagePercent = plan.maxStorageGB > 0 ? (usage.storageUsedGB / plan.maxStorageGB) * 100 : 0;
  const docPercent = plan.maxDocuments > 0 ? (usage.documentCount / plan.maxDocuments) * 100 : 0;
  const userPercent = plan.maxUsers ? (usage.userCount / plan.maxUsers) * 100 : 0;

  if (storagePercent >= 90) warnings.push(`Storage usage at ${Math.round(storagePercent)}%`);
  if (storagePercent >= 100) blocks.push('Storage limit reached');
  if (docPercent >= 90) warnings.push(`Document usage at ${Math.round(docPercent)}%`);
  if (docPercent >= 100) blocks.push('Document limit reached');
  if (userPercent >= 90) warnings.push(`User usage at ${Math.round(userPercent)}%`);
  if (userPercent >= 100) blocks.push('User limit reached');

  return {
    withinLimits: blocks.length === 0,
    warnings,
    blocks,
    usagePercent: {
      storage: Math.round(storagePercent),
      documents: Math.round(docPercent),
      users: Math.round(userPercent),
      aiTokens: 0,
      ocrPages: 0,
    },
  };
}
