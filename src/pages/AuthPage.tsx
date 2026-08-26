import { useState } from 'react';
import { FileStack, Mail, Lock, User, ArrowRight, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth, isDemoMode } from '@/lib/auth';
import { validateEmail, validatePassword } from '@/lib/utils';

interface AuthPageProps {
  mode: 'signin' | 'signup';
  onToggleMode: () => void;
  onSuccess: () => void;
  onBack: () => void;
}

export function AuthPage({ mode, onToggleMode, onSuccess, onBack }: AuthPageProps) {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    if (mode === 'signup') {
      if (!validateEmail(email)) {
        setError('Please enter a valid email address.');
        return;
      }
      const pwCheck = validatePassword(password);
      if (!pwCheck.valid) {
        setError(pwCheck.errors[0]);
        return;
      }
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (!orgName.trim()) {
        setError('Please enter your organization name.');
        return;
      }
    }

    setLoading(true);

    try {
      let result: { error?: string };
      if (mode === 'signup') {
        result = await signUp(email, password, name, orgName);
      } else {
        result = await signIn(email, password);
      }

      if (result.error) {
        setError(result.error);
      } else {
        onSuccess();
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signIn('demo@sadi.pro', 'demo1234');
      if (result.error) {
        setError(result.error);
      } else {
        onSuccess();
      }
    } catch {
      setError('Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-neutral-900 p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-primary-900/30" />
        <div className="relative">
          <img src="/sadi-logo.png" alt="SADI PRO — Smart Archive Document Intelligent" className="h-16 w-auto object-contain drop-shadow-lg" />
        </div>
        <div className="relative">
          <h2 className="text-3xl font-bold leading-tight">
            Your organization's<br />intelligent memory.
          </h2>
          <p className="mt-4 text-neutral-400 leading-relaxed max-w-md">
            Upload thousands of files. SADI PRO understands, organizes, protects,
            searches, and governs your organizational knowledge.
          </p>
          <div className="mt-8 space-y-3">
            {['AI classification & metadata extraction', 'Hybrid search with RAG & citations', 'Records management with retention & legal hold', 'Multi-tenant security with full audit trail'].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-success-500/20">
                  <Check className="h-3 w-3 text-success-400" />
                </div>
                <span className="text-sm text-neutral-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-xs text-neutral-500">
          ISO 15489 Ready · GDPR-Aware Architecture · SOC2-Ready
        </div>
      </div>

      {/* Right panel */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-white p-6">
        <div className="w-full max-w-md">
          <button onClick={onBack} className="mb-8 text-sm text-neutral-500 hover:text-neutral-900 transition-colors flex items-center gap-1.5">
            <ArrowRight className="h-4 w-4 rotate-180" /> Back to home
          </button>

          <h1 className="text-2xl font-bold text-neutral-900">
            {mode === 'signup' ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            {mode === 'signup'
              ? 'Start your 14-day free trial. No credit card required.'
              : 'Sign in to your SADI PRO workspace.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Amira Benali"
                      className="w-full h-11 rounded-lg border border-neutral-200 pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Organization Name</label>
                  <div className="relative">
                    <FileStack className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <input
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="Acme Corp"
                      className="w-full h-11 rounded-lg border border-neutral-200 pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full h-11 rounded-lg border border-neutral-200 pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  aria-invalid={!!error}
                  className="w-full h-11 rounded-lg border border-neutral-200 pl-10 pr-10 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none transition-colors"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {mode === 'signup' && password && (
                <div className="mt-2 flex gap-1">
                  {[8, 12, 16, 20].map((len, i) => {
                    const checks = [/[A-Z]/, /[a-z]/, /[0-9]/, /.{8,}/];
                    const score = checks.filter(r => r.test(password)).length + (password.length >= 12 ? 1 : 0);
                    const filled = i < Math.min(score, 4);
                    return <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${filled ? (score >= 4 ? 'bg-success-500' : score >= 3 ? 'bg-warning-500' : 'bg-error-400') : 'bg-neutral-200'}`} />;
                  })}
                </div>
              )}
            </div>

            {error && (
              <div role="alert" className="rounded-lg bg-error-50 border border-error-200 px-4 py-2.5 text-sm text-error-700 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" isLoading={loading}>
              {mode === 'signup' ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          {isDemoMode && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-neutral-400">or</span>
                </div>
              </div>
              <Button variant="outline" size="lg" className="w-full" onClick={handleDemoLogin} disabled={loading}>
                Enter Demo Mode
              </Button>
              <p className="mt-3 text-center text-xs text-neutral-400">
                Explore the platform with sample data. No account needed.
              </p>
            </>
          )}

          <p className="mt-6 text-center text-sm text-neutral-500">
            {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button onClick={onToggleMode} className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
              {mode === 'signup' ? 'Sign in' : 'Start free trial'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
