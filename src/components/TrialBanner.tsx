import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { api } from '@/lib/api';
import { AlertTriangle, Clock } from 'lucide-react';

interface TrialStatus {
  isTrialing: boolean;
  trialExpired: boolean;
  daysLeft: number;
  trialEndsAt: string | null;
  planTier: string;
}

export function TrialBanner() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<TrialStatus | null>(null);

  useEffect(() => {
    api.get('/api/data/trial-status').then(setStatus).catch(() => {});
  }, []);

  if (!status || !status.isTrialing) return null;

  if (status.trialExpired) {
    return (
      <div className="mx-3 mb-2 rounded-lg border border-red-200 bg-red-50 p-3">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <span className="text-xs font-semibold text-red-800">{t('trialExpired') || 'Trial Expired'}</span>
        </div>
        <p className="text-[11px] text-red-600 leading-relaxed">
          {t('trialExpiredDesc') || 'Your free trial has ended. Subscribe to continue uploading documents.'}
        </p>
        <a href="#pricing" className="mt-2 block w-full rounded-md bg-red-600 px-3 py-1.5 text-center text-xs font-medium text-white hover:bg-red-700 transition-colors">
          {t('subscribe') || 'Subscribe'}
        </a>
      </div>
    );
  }

  const urgencyColor = status.daysLeft <= 3 ? 'text-red-600' : status.daysLeft <= 7 ? 'text-amber-600' : 'text-blue-600';
  const bgColor = status.daysLeft <= 3 ? 'bg-red-50 border-red-200' : status.daysLeft <= 7 ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200';

  return (
    <div className={`mx-3 mb-2 rounded-lg border p-3 ${bgColor}`}>
      <div className="flex items-center gap-2 mb-1">
        <Clock className={`h-4 w-4 ${urgencyColor}`} />
        <span className={`text-xs font-semibold ${urgencyColor}`}>
          {t('trialDaysLeft') || 'Free Trial'}: {status.daysLeft} {t('days') || 'days'}
        </span>
      </div>
      <p className="text-[11px] text-neutral-600 leading-relaxed">
        {t('trialDesc') || 'Starter plan features. Upgrade anytime for more storage and users.'}
      </p>
    </div>
  );
}
