import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api } from '@/lib/api';
import type { User, Organization, RoleKey } from '@/types';

interface AuthContextValue {
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName: string, orgName: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  refreshOrganization: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ROLE_PERMISSIONS: Record<RoleKey, string[]> = {
  owner: [
    'document.read', 'document.create', 'document.update', 'document.delete',
    'document.download', 'document.share', 'document.approve', 'document.archive', 'document.restore',
    'org.manage', 'billing.manage', 'team.manage', 'settings.manage', 'audit.read', 'compliance.manage',
  ],
  admin: [
    'document.read', 'document.create', 'document.update', 'document.delete',
    'document.download', 'document.share', 'document.approve', 'document.archive', 'document.restore',
    'org.manage', 'billing.read', 'team.manage', 'settings.manage', 'audit.read', 'compliance.manage',
  ],
  manager: [
    'document.read', 'document.create', 'document.update', 'document.download',
    'document.share', 'document.approve', 'document.archive', 'team.read',
  ],
  editor: ['document.read', 'document.create', 'document.update', 'document.download'],
  reviewer: ['document.read', 'document.approve', 'document.download'],
  viewer: ['document.read', 'document.download'],
  auditor: ['document.read', 'audit.read', 'compliance.read'],
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const data = await api.get('/api/auth/me');
      if (data.id) {
        setUser({
          id: data.id,
          email: data.email,
          name: data.fullName || data.email,
          avatarColor: data.avatarColor || '#2563eb',
          role: data.role as RoleKey,
          departmentId: data.departmentId,
          organizationId: data.organizationId,
        });
      }
      if (data.organization) {
        setOrganization(data.organization as Organization);
      }
    } catch {
      localStorage.removeItem('sadi_token');
      setUser(null);
      setOrganization(null);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('sadi_token');
    if (token) {
      loadProfile().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const data = await api.post('/api/auth/login', { email, password });
      if (data.token) localStorage.setItem('sadi_token', data.token);
      await loadProfile();
      return {};
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Login failed' };
    }
  }, [loadProfile]);

  const signUp = useCallback(async (email: string, password: string, fullName: string, orgName: string) => {
    try {
      const data = await api.post('/api/auth/signup', { email, password, fullName, orgName });
      if (data.token) localStorage.setItem('sadi_token', data.token);
      await loadProfile();
      return {};
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Signup failed' };
    }
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    localStorage.removeItem('sadi_token');
    setUser(null);
    setOrganization(null);
  }, []);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    const perms = ROLE_PERMISSIONS[user.role] || [];
    return perms.includes(permission);
  }, [user]);

  const refreshOrganization = useCallback(async () => {
    if (!user?.organizationId) return;
    try {
      const data = await api.get('/api/auth/me');
      if (data.organization) setOrganization(data.organization as Organization);
    } catch {
      // ignore
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        isAuthenticated: !!user,
        isLoading,
        signUp,
        signIn,
        signOut,
        hasPermission,
        refreshOrganization,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export const isDemoMode = false;
