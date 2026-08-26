import { useState } from 'react';
import {
  Settings as SettingsIcon,
  CreditCard,
  Building2,
  Bell,
  Lock,
  Globe,
  Check,
  Download,
  Receipt,
} from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useStore } from '@/store/StoreContext';
import { useAuth } from '@/lib/auth';
import { plans } from '@/lib/billing';
import { type Locale } from '@/lib/i18n';
import { useTranslation } from '@/lib/i18n';
import { percentage, cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast';
import type { PlanTier } from '@/types';

type SettingsTab = 'organization' | 'billing' | 'notifications' | 'security' | 'language';

export function SettingsPage() {
  const { t, locale, setLocale } = useTranslation();
  const { usage, departments } = useStore();
  const { user, organization, refreshOrganization } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<SettingsTab>('organization');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const [orgName, setOrgName] = useState(organization?.name || '');
  const [orgIndustry, setOrgIndustry] = useState(organization?.industry || '');
  const [orgCountry, setOrgCountry] = useState(organization?.country || '');
  const [orgTimezone, setOrgTimezone] = useState(organization?.timezone || 'Europe/Paris (GMT+1)');
  const [savingOrg, setSavingOrg] = useState(false);

  const savedNotifications = (organization?.settings as Record<string, unknown>)?.notifications as Record<string, boolean> | undefined;
  const [notifications, setNotifications] = useState({
    documentProcessed: savedNotifications?.documentProcessed ?? true,
    processingFailed: savedNotifications?.processingFailed ?? true,
    documentExpiring: savedNotifications?.documentExpiring ?? true,
    approvalRequested: savedNotifications?.approvalRequested ?? true,
    retentionEvent: savedNotifications?.retentionEvent ?? false,
    subscriptionWarning: savedNotifications?.subscriptionWarning ?? true,
    securityEvent: savedNotifications?.securityEvent ?? true,
  });

  const savedDateFormat = (organization?.settings as Record<string, unknown>)?.dateFormat as string | undefined;
  const [dateFormat, setDateFormat] = useState(savedDateFormat || 'DD/MM/YYYY');

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [generatedApiKey, setGeneratedApiKey] = useState('');
  const [confirm, setConfirm] = useState<{open:boolean; message:string; onConfirm:()=>void}>({open:false,message:'',onConfirm:()=>{}});

  const tabs: { key: SettingsTab; label: string; icon: typeof SettingsIcon }[] = [
    { key: 'organization', label: t('organization'), icon: Building2 },
    { key: 'billing', label: t('billing'), icon: CreditCard },
    { key: 'notifications', label: t('notifications'), icon: Bell },
    { key: 'security', label: t('security'), icon: Lock },
    { key: 'language', label: t('language'), icon: Globe },
  ];

  const currentPlan = plans.find((p) => p.tier === (organization?.planTier || 'business')) || plans[0];
  const savedApiKey = ((organization?.settings as Record<string, unknown>)?.apiKey as string) || '';

  const handleSaveOrg = async () => {
    setSavingOrg(true);
    try {
      await api.patch('/api/data/organization', {
        name: orgName,
        industry: orgIndustry,
        country: orgCountry,
        timezone: orgTimezone,
      });
      await refreshOrganization();
      toast('success', t('success'));
    } catch {
      toast('error', t('error'));
    } finally {
      setSavingOrg(false);
    }
  };

  const handleNotificationChange = async (key: string, value: boolean) => {
    const updated = { ...notifications, [key]: value };
    setNotifications(updated);
    try {
      await api.patch('/api/data/organization', {
        settings: {
          ...(organization?.settings || {}),
          notifications: updated,
        },
      });
      await refreshOrganization();
    } catch {
      toast('error', t('error'));
    }
  };

  const handleTimezoneChange = async (tz: string) => {
    setOrgTimezone(tz);
    try {
      await api.patch('/api/data/organization', {
        settings: {
          ...(organization?.settings || {}),
          timezone: tz,
        },
        timezone: tz,
      });
      await refreshOrganization();
    } catch {
      toast('error', t('error'));
    }
  };

  const handleDateFormatChange = async (df: string) => {
    setDateFormat(df);
    try {
      await api.patch('/api/data/organization', {
        settings: {
          ...(organization?.settings || {}),
          dateFormat: df,
        },
      });
      await refreshOrganization();
    } catch {
      toast('error', t('error'));
    }
  };

  const handlePlanSelect = async (tier: PlanTier) => {
    try {
      await api.patch('/api/data/organization', { planTier: tier });
      await refreshOrganization();
      setShowPlanModal(false);
      toast('success', `${t('currentPlan')} ${plans.find(p => p.tier === tier)?.name}.`);
    } catch {
      toast('error', t('error'));
    }
  };

  const handleGenerateApiKey = async () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const key = 'sadi_sk_' + Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    setGeneratedApiKey(key);
    try {
      await api.patch('/api/data/organization', {
        settings: {
          ...(organization?.settings || {}),
          apiKey: key,
        },
      });
      await refreshOrganization();
      toast('success', t('success'));
    } catch {
      toast('error', t('error'));
    }
  };

  const handleExportOrgData = async () => {
    try {
      const data = await api.get('/api/data/organization');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `organization-${organization?.slug || 'data'}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast('success', t('success'));
    } catch {
      toast('error', t('error'));
    }
  };

  const handleExportUserData = async () => {
    try {
      const data = await api.get('/api/auth/me');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-${user?.email || 'data'}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast('success', t('success'));
    } catch {
      toast('error', t('error'));
    }
  };

  const handleRequestDeletion = async () => {
    setConfirm({
      open: true,
      message: `${t('delete')} ${t('organization')}?`,
      onConfirm: async () => {
        try {
          await api.patch(`/api/data/users/${user?.id}`, { isActive: false });
          toast('success', t('success'));
          setTimeout(() => {
            localStorage.removeItem('sadi_token');
            window.location.href = '/';
          }, 2000);
        } catch {
          toast('error', t('error'));
        }
      },
    });
  };

  const handleDownloadInvoice = (inv: { id: string; date: string; amount: string; status: string }) => {
    const invoiceText = [
      '=====================================',
      `               ${t('billing')}`,
      '=====================================',
      '',
      `Invoice ID:    ${inv.id}`,
      `Date:          ${inv.date}`,
      `Amount:        ${inv.amount}`,
      `Status:        ${inv.status}`,
      '',
      `Organization:  ${organization?.name || 'N/A'}`,
      `Plan:          ${currentPlan.name}`,
      '',
      '-------------------------------------',
      t('success'),
      t('appName'),
      '=====================================',
    ].join('\n');
    const blob = new Blob([invoiceText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${inv.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const invoices = [
    { id: 'DZ-INV-2026-08', date: '1 août 2026', amount: '11 900 DZD', status: 'Paid' },
    { id: 'DZ-INV-2026-07', date: '1 juil. 2026', amount: '11 900 DZD', status: 'Paid' },
    { id: 'DZ-INV-2026-06', date: '1 juin 2026', amount: '11 900 DZD', status: 'Paid' },
  ];

  return (
    <div className="space-y-5">
      <ConfirmDialog open={confirm.open} title={t('confirm')} message={confirm.message} confirmLabel={t('delete')} onConfirm={()=>{confirm.onConfirm(); setConfirm({...confirm,open:false})}} onCancel={()=>setConfirm({...confirm,open:false})} />
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">{t('settings')}</h1>
        <p className="mt-1 text-sm text-neutral-500">{t('organization')} {t('billing')} {t('security')} {t('language')}.</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar */}
        <div className="lg:w-56 shrink-0">
          <div className="flex lg:flex-col gap-1 overflow-x-auto">
            {tabs.map((tItem) => {
              const Icon = tItem.icon;
              return (
                <button
                  key={tItem.key}
                  onClick={() => setTab(tItem.key)}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap',
                    tab === tItem.key ? 'bg-primary-50 text-primary-700' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tItem.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {tab === 'organization' && (
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle>{t('organization')}</CardTitle></CardHeader>
                <CardBody className="space-y-4">
                  <EditableField label={t('organizationName')} value={orgName} onChange={setOrgName} />
                  <Field label={t('organization')} value={organization?.slug || ''} />
                  <EditableField label={t('organization')} value={orgCountry} onChange={setOrgCountry} />
                  <EditableField label={t('organization')} value={orgIndustry} onChange={setOrgIndustry} />
                  <div className="pt-2">
                    <Button variant="outline" size="sm" onClick={handleSaveOrg} disabled={savingOrg}>
                      {savingOrg ? t('loading') : t('save')}
                    </Button>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader><CardTitle>{t('department')}</CardTitle></CardHeader>
                <CardBody className="space-y-2">
                  {departments.length === 0 ? (
                    <p className="text-sm text-neutral-500">{t('noDocuments')}</p>
                  ) : (
                    departments.map((dept) => (
                      <div key={dept.id} className="flex items-center justify-between rounded-lg border border-neutral-100 px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: dept.color }} />
                          <span className="text-sm font-medium text-neutral-900">{dept.name}</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => toast('info', `${t('department')}: ${dept.name}`)}>{t('view')}</Button>
                      </div>
                    ))
                  )}
                </CardBody>
              </Card>
            </div>
          )}

          {tab === 'billing' && (
            <div className="space-y-4">
              {/* Current Plan */}
              <Card>
                <CardHeader><CardTitle>{t('currentPlan')}</CardTitle></CardHeader>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-neutral-900">{currentPlan.name}</h3>
                        <Badge variant="success" dot>{t('success')}</Badge>
                      </div>
                      <p className="text-sm text-neutral-500 mt-1">
                        {new Intl.NumberFormat('fr-DZ').format(billingCycle === 'annual' ? currentPlan.annualPrice : currentPlan.monthlyPrice)} DZD/mois HT — {t('currentPlan')}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowPlanModal(true)}>{t('upgrade')}</Button>
                  </div>
                </CardBody>
              </Card>

              {/* Usage */}
              <Card>
                <CardHeader><CardTitle>{t('storageUsed')}</CardTitle></CardHeader>
                <CardBody className="space-y-4">
                  <UsageRow label={t('storageUsed')} used={`${usage.storageUsedGB} GB`} limit={`${usage.storageLimitGB} GB`} pct={percentage(usage.storageUsedGB, usage.storageLimitGB)} />
                  <UsageRow label={t('documents')} used={usage.documentCount.toString()} limit={usage.documentLimit.toLocaleString()} pct={percentage(usage.documentCount, usage.documentLimit)} />
                  <UsageRow label={t('team')} used={usage.userCount.toString()} limit={usage.userLimit.toString()} pct={percentage(usage.userCount, usage.userLimit)} />
                  <UsageRow label={t('aiInsights')} used={usage.aiTokensUsed.toLocaleString()} limit={usage.aiTokensLimit.toLocaleString()} pct={percentage(usage.aiTokensUsed, usage.aiTokensLimit)} />
                  <UsageRow label={t('aiInsights')} used={usage.ocrPagesUsed.toLocaleString()} limit={usage.ocrPagesLimit.toLocaleString()} pct={percentage(usage.ocrPagesUsed, usage.ocrPagesLimit)} />
                </CardBody>
              </Card>

              {/* Plans */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{t('currentPlan')}</CardTitle>
                    <div className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 p-0.5">
                      <button onClick={() => setBillingCycle('monthly')} className={cn('rounded-full px-3 py-1 text-xs font-medium transition-colors', billingCycle === 'monthly' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500')}>{t('monthly')}</button>
                      <button onClick={() => setBillingCycle('annual')} className={cn('rounded-full px-3 py-1 text-xs font-medium transition-colors', billingCycle === 'annual' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500')}>{t('annual')}</button>
                    </div>
                  </div>
                </CardHeader>
                <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {plans.map((plan) => (
                    <div
                      key={plan.tier}
                      className={cn(
                        'rounded-xl border p-4',
                        plan.tier === currentPlan.tier ? 'border-primary-500 ring-1 ring-primary-500' : 'border-neutral-200',
                        plan.tier === 'enterprise' && 'border-neutral-300 bg-neutral-50'
                      )}
                    >
                      <h4 className="text-sm font-bold text-neutral-900">{plan.name}</h4>
                      <p className="mt-2 text-2xl font-bold text-neutral-900">
                        {plan.tier === 'enterprise' ? t('currentPlan') : `${new Intl.NumberFormat('fr-DZ').format(billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice)} DZD`}
                        {plan.tier !== 'enterprise' && <span className="text-xs font-normal text-neutral-400">/mois HT</span>}
                      </p>
                      {plan.tier !== 'enterprise' && <p className="text-[11px] text-neutral-400">{t('billing')}</p>}
                      <ul className="mt-3 space-y-1.5">
                        {plan.features.slice(0, 3).map((f) => (
                          <li key={f} className="flex items-start gap-1.5">
                            <Check className="h-3.5 w-3.5 text-success-500 shrink-0 mt-0.5" />
                            <span className="text-xs text-neutral-600">{f}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        variant={plan.tier === currentPlan.tier ? 'outline' : 'primary'}
                        size="sm"
                        className="mt-4 w-full"
                        disabled={plan.tier === currentPlan.tier}
                        onClick={() => {
                          if (plan.tier === 'enterprise') {
                            toast('info', t('currentPlan'));
                          } else if (plan.tier !== currentPlan.tier) {
                            handlePlanSelect(plan.tier);
                          }
                        }}
                      >
                        {plan.tier === currentPlan.tier ? t('currentPlan') : plan.tier === 'enterprise' ? t('view') : t('upgrade')}
                      </Button>
                    </div>
                  ))}
                </CardBody>
              </Card>

              {/* Invoices */}
              <Card>
                <CardHeader><CardTitle>{t('billing')}</CardTitle></CardHeader>
                <CardBody className="p-0">
                  <div className="divide-y divide-neutral-50">
                    {invoices.map((inv) => (
                      <div key={inv.id} className="flex items-center gap-3 px-5 py-3">
                        <Receipt className="h-4 w-4 text-neutral-400" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-neutral-900">{inv.id}</p>
                          <p className="text-xs text-neutral-400">{inv.date}</p>
                        </div>
                        <span className="text-sm font-medium text-neutral-900">{inv.amount}</span>
                        <Badge variant="success">{inv.status}</Badge>
                        <button
                          className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                          onClick={() => handleDownloadInvoice(inv)}
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            </div>
          )}

          {tab === 'notifications' && (
            <Card>
              <CardHeader><CardTitle>{t('notifications')}</CardTitle></CardHeader>
              <CardBody className="space-y-3">
                {[
                  { key: 'documentProcessed', label: t('documents'), desc: t('processing') },
                  { key: 'processingFailed', label: t('error'), desc: t('processing') },
                  { key: 'documentExpiring', label: t('expiringSoon'), desc: t('expiringSoon') },
                  { key: 'approvalRequested', label: t('needsReview'), desc: t('needsReview') },
                  { key: 'retentionEvent', label: t('retentionPolicies'), desc: t('retentionPolicies') },
                  { key: 'subscriptionWarning', label: t('billing'), desc: t('billing') },
                  { key: 'securityEvent', label: t('security'), desc: t('security') },
                ].map((n) => (
                  <div key={n.key} className="flex items-center justify-between rounded-lg border border-neutral-100 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{n.label}</p>
                      <p className="text-xs text-neutral-500">{n.desc}</p>
                    </div>
                    <Toggle
                      defaultOn={notifications[n.key as keyof typeof notifications]}
                      onChange={(val) => handleNotificationChange(n.key, val)}
                    />
                  </div>
                ))}
              </CardBody>
            </Card>
          )}

          {tab === 'security' && (
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle>{t('security')}</CardTitle></CardHeader>
                <CardBody className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border border-neutral-100 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{t('security')}</p>
                      <p className="text-xs text-neutral-500">{t('security')}</p>
                    </div>
                    <Toggle defaultOn={false} onChange={() => toast('info', t('security'))} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-neutral-100 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{t('security')}</p>
                      <p className="text-xs text-neutral-500">{t('security')}</p>
                    </div>
                    <span className="text-sm text-neutral-600">30 {t('days')}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-neutral-100 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{t('password')}</p>
                      <p className="text-xs text-neutral-500">{t('password')}</p>
                    </div>
                    <Badge variant="success" dot>{t('success')}</Badge>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader><CardTitle>{t('security')}</CardTitle></CardHeader>
                <CardBody>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-neutral-500">{t('security')}</p>
                    <Button variant="outline" size="sm" onClick={handleGenerateApiKey}>{t('save')}</Button>
                  </div>
                  <div className="rounded-lg border border-neutral-100 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-mono font-medium text-neutral-900">
                          {generatedApiKey
                            ? generatedApiKey.slice(0, 14) + '••••••••' + generatedApiKey.slice(-4)
                            : savedApiKey
                              ? savedApiKey.slice(0, 14) + '••••••••' + savedApiKey.slice(-4)
                              : 'sadi_sk_••••••••••••••••'}
                        </p>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {generatedApiKey ? t('success') : t('noDocuments')}
                        </p>
                      </div>
                      <Badge variant="success" dot>{t('success')}</Badge>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader><CardTitle>{t('security')}</CardTitle></CardHeader>
                <CardBody className="space-y-2">
                  <Button variant="outline" size="sm" icon={<Download className="h-3.5 w-3.5" />} onClick={handleExportOrgData}>{t('export')} {t('organization')}</Button>
                  <Button variant="outline" size="sm" icon={<Download className="h-3.5 w-3.5" />} onClick={handleExportUserData}>{t('export')} {t('documents')}</Button>
                  <Button variant="danger" size="sm" onClick={handleRequestDeletion}>{t('delete')} {t('documents')}</Button>
                </CardBody>
              </Card>
            </div>
          )}

          {tab === 'language' && (
            <Card>
              <CardHeader><CardTitle>{t('language')}</CardTitle></CardHeader>
              <CardBody className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t('language')}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { code: 'en' as Locale, label: 'English' },
                      { code: 'fr' as Locale, label: 'Francais' },
                      { code: 'ar' as Locale, label: 'Arabic' },
                    ]).map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setLocale(lang.code)}
                        className={cn(
                          'flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors',
                          locale === lang.code ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                        )}
                      >
                        {lang.label}
                        {locale === lang.code && <Check className="h-3.5 w-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t('language')}</label>
                  <select
                    className="w-full h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    value={orgTimezone}
                    onChange={(e) => handleTimezoneChange(e.target.value)}
                  >
                    <option>Africa/Algiers (GMT+1)</option>
                    <option>Europe/Paris (GMT+1)</option>
                    <option>Europe/London (GMT+0)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t('language')}</label>
                  <select
                    className="w-full h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    value={dateFormat}
                    onChange={(e) => handleDateFormatChange(e.target.value)}
                  >
                    <option>MM/DD/YYYY</option>
                    <option>DD/MM/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </div>
                <p className="text-xs text-neutral-400">
                  {t('language')} {t('language')}
                </p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">{t('currentPlan')}</h2>
            <div className="space-y-3">
              {plans.map((plan) => (
                <div
                  key={plan.tier}
                  className={cn(
                    'flex items-center justify-between rounded-lg border p-4',
                    plan.tier === currentPlan.tier ? 'border-primary-500 bg-primary-50' : 'border-neutral-200'
                  )}
                >
                  <div>
                    <p className="text-sm font-bold text-neutral-900">{plan.name}</p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {plan.tier === 'enterprise' ? t('currentPlan') : `${new Intl.NumberFormat('fr-DZ').format(billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice)} DZD/mois HT`}
                    </p>
                  </div>
                  <Button
                    variant={plan.tier === currentPlan.tier ? 'outline' : 'primary'}
                    size="sm"
                    disabled={plan.tier === currentPlan.tier}
                    onClick={() => {
                      if (plan.tier === 'enterprise') {
                        toast('info', t('currentPlan'));
                      } else if (plan.tier !== currentPlan.tier) {
                        handlePlanSelect(plan.tier);
                      }
                    }}
                  >
                    {plan.tier === currentPlan.tier ? t('currentPlan') : plan.tier === 'enterprise' ? t('view') : t('upgrade')}
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowPlanModal(false)}>{t('close')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-500 mb-1.5">{label}</label>
      <input
        type="text"
        defaultValue={value}
        readOnly
        className="w-full h-10 rounded-lg border border-neutral-200 px-3 text-sm text-neutral-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none transition-colors"
      />
    </div>
  );
}

function EditableField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-500 mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 rounded-lg border border-neutral-200 px-3 text-sm text-neutral-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none transition-colors"
      />
    </div>
  );
}

function UsageRow({ label, used, limit, pct }: { label: string; used: string; limit: string; pct: number }) {
  const color = pct >= 90 ? 'error' : pct >= 70 ? 'warning' : 'primary';
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-neutral-600">{label}</span>
        <span className="text-xs text-neutral-400">{used} / {limit}</span>
      </div>
      <ProgressBar value={pct} color={color} size="sm" />
    </div>
  );
}

function Toggle({ defaultOn, onChange }: { defaultOn: boolean; onChange?: (val: boolean) => void }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      onClick={() => {
        const next = !on;
        setOn(next);
        onChange?.(next);
      }}
      className={cn(
        'relative h-6 w-11 rounded-full transition-colors',
        on ? 'bg-primary-600' : 'bg-neutral-200'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
          on ? 'translate-x-5' : 'translate-x-0.5'
        )}
      />
    </button>
  );
}
