import { useState } from 'react';
import {
  FileStack,
  Search,
  Shield,
  Sparkles,
  Zap,
  FileText,
  Lock,
  Globe,
  Check,
  ArrowRight,
  Layers,
  Eye,
  Workflow,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { plans } from '@/lib/billing';
import { useTranslation } from '@/lib/i18n';

interface LandingPageProps {
  onSignIn: () => void;
  onSignUp: () => void;
}

export function LandingPage({ onSignIn, onSignUp }: LandingPageProps) {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const { t, locale, setLocale } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-neutral-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <img src="/sadi-logo.png" alt="SADI PRO" className="h-9 w-auto object-contain" />
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">{t('documentation')}</a>
            <a href="#pricing" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">{t('billing')}</a>
            <a href="#security" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">{t('security')}</a>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center rounded-full border border-neutral-200 bg-white p-0.5">
              {(['en','fr','ar'] as const).map((l) => (
                <button key={l} onClick={() => setLocale(l)} className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${locale===l ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:text-neutral-900'}`}>{l.toUpperCase()}</button>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={onSignIn}>{t('signIn')}</Button>
            <Button size="sm" onClick={onSignUp}>{t('signUp')}</Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-50/50 via-white to-white" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary-600" />
              <span className="text-xs font-medium text-primary-700">{t('aiInsights')} {t('documents')}</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl leading-tight">
              {t('dashboard')}
              <span className="block text-primary-600">{t('aiInsights')}.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600 leading-relaxed">
              {t('documents')} {t('collections')} {t('searchPage')} {t('compliance')} {t('team')} {t('analytics')}.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" onClick={onSignUp} icon={<ArrowRight className="h-5 w-5" />}>
                {t('signUp')}
              </Button>
              <Button size="lg" variant="outline" onClick={onSignIn}>{t('signIn')}</Button>
            </div>
            <p className="mt-4 text-xs text-neutral-400">{t('noDocuments')}</p>
          </div>

          {/* Hero visual */}
          <div className="mx-auto mt-16 max-w-5xl">
            <div className="rounded-2xl border border-neutral-200 bg-white shadow-elevated overflow-hidden">
              <div className="flex h-10 items-center gap-2 border-b border-neutral-100 bg-neutral-50 px-4">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-neutral-300" />
                  <div className="h-3 w-3 rounded-full bg-neutral-300" />
                  <div className="h-3 w-3 rounded-full bg-neutral-300" />
                </div>
                <div className="ml-4 flex items-center gap-1.5 text-xs text-neutral-400">
                  <FileStack className="h-3.5 w-3.5" /> {t('appName')} {t('documents')}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                <div className="border-r border-neutral-100 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="h-4 w-4 text-primary-600" />
                    <span className="text-xs font-semibold text-neutral-900">{t('documents')}</span>
                  </div>
                  <div className="space-y-2">
                    {['Service Agreement', 'Q2 Financial Report', 'Employment Contract', 'Invoice #0312'].map((t2, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg border border-neutral-100 px-3 py-2">
                        <div className="h-6 w-6 rounded bg-primary-50 flex items-center justify-center">
                          <FileText className="h-3 w-3 text-primary-600" />
                        </div>
                        <span className="text-xs text-neutral-600 truncate">{t2}</span>
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-success-500" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-5 bg-neutral-50/50">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="h-4 w-4 text-accent-600" />
                    <span className="text-xs font-semibold text-neutral-900">{t('aiInsights')}</span>
                  </div>
                  <div className="rounded-lg border border-primary-100 bg-white p-3">
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      {t('aiInsights')} {t('documents')} {t('expiringSoon')}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-neutral-100">
                        <div className="h-full w-[94%] rounded-full bg-success-500" />
                      </div>
                      <span className="text-[10px] font-medium text-success-600">94%</span>
                    </div>
                  </div>
                </div>
                <div className="border-l border-neutral-100 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Search className="h-4 w-4 text-accent-600" />
                    <span className="text-xs font-semibold text-neutral-900">{t('searchPage')}</span>
                  </div>
                  <div className="rounded-lg border border-neutral-200 px-3 py-2 text-xs text-neutral-400">
                    {t('search')}
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {['Service Agreement', 'Vendor NDA'].map((t2, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-1.5">
                        <Search className="h-3 w-3 text-neutral-400" />
                        <span className="text-xs text-neutral-600">{t2}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-neutral-100 bg-neutral-50">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:px-8">
          {[
            { value: '100K+', label: t('totalDocuments') },
            { value: '99.9%', label: t('aiInsights') },
            { value: '<500ms', label: t('search') },
            { value: '3', label: t('language') },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl font-bold text-neutral-900">{s.value}</p>
              <p className="mt-1 text-sm text-neutral-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-14">
          <h2 className="text-3xl font-bold text-neutral-900">{t('documentation')}</h2>
          <p className="mt-4 text-lg text-neutral-600">
            {t('documents')} {t('collections')} {t('compliance')}.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Sparkles, title: t('aiInsights'), desc: t('aiInsights') },
            { icon: Search, title: t('searchPage'), desc: t('search') },
            { icon: Eye, title: t('aiInsights'), desc: t('aiInsights') },
            { icon: Shield, title: t('recordsManagement'), desc: t('recordsManagement') },
            { icon: Lock, title: t('security'), desc: t('security') },
            { icon: Workflow, title: t('workflows'), desc: t('workflows') },
            { icon: Layers, title: t('versions'), desc: t('versions') },
            { icon: BarChart3, title: t('analytics'), desc: t('analytics') },
            { icon: Globe, title: t('language'), desc: t('language') },
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="group rounded-xl border border-neutral-200 bg-white p-6 transition-all duration-200 hover:border-primary-200 hover:shadow-elevated">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition-colors group-hover:bg-primary-600 group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-neutral-900">{f.title}</h3>
                <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Security */}
      <section id="security" className="bg-neutral-900 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-800 px-4 py-1.5">
                <Shield className="h-3.5 w-3.5 text-success-400" />
                <span className="text-xs font-medium text-success-400">{t('security')}</span>
              </div>
              <h2 className="text-3xl font-bold text-white">{t('security')} {t('compliance')}</h2>
              <p className="mt-4 text-lg text-neutral-400 leading-relaxed">
                {t('security')} {t('compliance')} {t('documents')}.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  t('security'),
                  t('security'),
                  t('team'),
                  t('activity'),
                  t('legalHolds'),
                  t('security'),
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-success-500/20">
                      <Check className="h-3 w-3 text-success-400" />
                    </div>
                    <span className="text-sm text-neutral-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-neutral-700 bg-neutral-800 p-6">
              <div className="space-y-3">
                {[
                  { icon: Lock, label: t('security'), status: 'AES-256', color: 'text-success-400' },
                  { icon: Zap, label: t('security'), status: 'TLS 1.3', color: 'text-success-400' },
                  { icon: Shield, label: t('security'), status: t('success'), color: 'text-success-400' },
                  { icon: FileText, label: t('activity'), status: t('success'), color: 'text-success-400' },
                  { icon: Eye, label: t('aiInsights'), status: t('success'), color: 'text-success-400' },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-center gap-3 rounded-lg border border-neutral-700 bg-neutral-900/50 px-4 py-3">
                      <Icon className="h-4 w-4 text-neutral-400" />
                      <span className="text-sm text-neutral-300">{item.label}</span>
                      <span className={`ml-auto text-xs font-medium ${item.color}`}>{item.status}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <h2 className="text-3xl font-bold text-neutral-900">{t('billing')}</h2>
          <p className="mt-4 text-lg text-neutral-600">{t('billing')} {t('currentPlan')}.</p>
          <div className="mt-8 inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 p-1">
            <button
              onClick={() => setBilling('monthly')}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${billing === 'monthly' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500'}`}
            >
              {t('monthly')}
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${billing === 'annual' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500'}`}
            >
              {t('annual')} <span className="text-success-600">-17%</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.tier}
              className={`relative rounded-2xl border bg-white p-6 transition-all duration-200 hover:shadow-elevated ${
                plan.popular ? 'border-primary-500 ring-1 ring-primary-500' : 'border-neutral-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary-600 px-3 py-1 text-xs font-semibold text-white">
                  {t('success')}
                </div>
              )}
              <h3 className="text-lg font-bold text-neutral-900">{plan.name}</h3>
              <div className="mt-4">
                {plan.tier === 'enterprise' ? (
                  <p className="text-3xl font-bold text-neutral-900">{t('currentPlan')}</p>
                ) : (
                  <>
                    <span className="text-2xl font-bold text-neutral-900">
                      {new Intl.NumberFormat('fr-DZ').format(billing === 'annual' ? plan.annualPrice : plan.monthlyPrice)} DZD
                    </span>
                    <span className="text-sm text-neutral-500">/mois HT</span>
                    <span className="ml-1 inline-flex rounded-full border border-primary-100 bg-primary-50 px-1.5 py-0.5 text-[10px] font-semibold text-primary-700">DZD</span>
                  </>
                )}
                {plan.tier !== 'enterprise' && (
                  <p className="mt-1 text-[11px] text-neutral-400">{t('billing')}</p>
                )}
              </div>
              <ul className="mt-6 space-y-3">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-success-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-neutral-600">{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="mt-8 w-full"
                variant={plan.popular ? 'primary' : 'outline'}
                onClick={onSignUp}
              >
                {plan.tier === 'enterprise' ? t('view') : t('signUp')}
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-neutral-100 bg-neutral-50">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-neutral-900">{t('dashboard')}</h2>
          <p className="mt-4 text-lg text-neutral-600">
            {t('appName')} {t('documents')} {t('aiInsights')}.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" onClick={onSignUp} icon={<ArrowRight className="h-5 w-5" />}>
              {t('signUp')}
            </Button>
            <Button size="lg" variant="outline" onClick={onSignIn}>{t('signIn')}</Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <img src="/sadi-logo.png" alt="SADI PRO" className="h-8 w-auto object-contain opacity-90" />
            <nav className="flex items-center gap-6 text-xs text-neutral-500">
              <a href="#" className="hover:text-neutral-900 transition-colors">{t('security')}</a>
              <a href="#" className="hover:text-neutral-900 transition-colors">{t('compliance')}</a>
              <a href="mailto:support@sadi.pro" className="hover:text-neutral-900 transition-colors">{t('email')}</a>
            </nav>
          </div>
          <p className="mt-4 text-center text-xs text-neutral-400 sm:text-left">{t('appName')} {t('aiInsights')} · © 2026 {t('appName')}</p>
        </div>
      </footer>
    </div>
  );
}
