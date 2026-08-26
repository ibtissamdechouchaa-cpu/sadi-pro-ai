import { useState } from 'react';
import {
  Plus,
  Shield,
  Mail,
  MoreVertical,
  Check,
  X,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { useStore } from '@/store/StoreContext';
import { roleConfig, cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import type { RoleKey } from '@/types';

const permissions = [
  { key: 'document.read', label: 'Read documents' },
  { key: 'document.create', label: 'Upload documents' },
  { key: 'document.update', label: 'Edit documents' },
  { key: 'document.delete', label: 'Delete documents' },
  { key: 'document.download', label: 'Download documents' },
  { key: 'document.share', label: 'Share documents' },
  { key: 'document.approve', label: 'Approve documents' },
  { key: 'document.archive', label: 'Archive documents' },
  { key: 'document.restore', label: 'Restore documents' },
  { key: 'compliance.view', label: 'View compliance' },
  { key: 'compliance.manage', label: 'Manage compliance' },
  { key: 'team.manage', label: 'Manage team' },
  { key: 'billing.manage', label: 'Manage billing' },
];

const rolePermissions: Record<RoleKey, string[]> = {
  owner: permissions.map((p) => p.key),
  admin: permissions.filter((p) => !p.key.includes('billing.manage')).map((p) => p.key),
  manager: ['document.read', 'document.create', 'document.update', 'document.download', 'document.share', 'document.approve', 'document.archive', 'compliance.view'],
  editor: ['document.read', 'document.create', 'document.update', 'document.download'],
  reviewer: ['document.read', 'document.approve', 'document.download'],
  viewer: ['document.read', 'document.download'],
  auditor: ['document.read', 'compliance.view'],
};

export function TeamPage() {
  const { users, departments, refreshData } = useStore();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<RoleKey>('viewer');
  const [showPerms, setShowPerms] = useState<RoleKey | null>(null);
  const [roleDropdownForUser, setRoleDropdownForUser] = useState<string | null>(null);
  const [showCustomRoleModal, setShowCustomRoleModal] = useState(false);
  const [customRoleUserId, setCustomRoleUserId] = useState<string | null>(null);
  const [customRoleSelection, setCustomRoleSelection] = useState<RoleKey>('viewer');

  const inviteRoles: RoleKey[] = ['admin', 'manager', 'editor', 'reviewer', 'viewer', 'auditor'];

  const handleSendInvite = async () => {
    if (!email.trim()) return;
    try {
      await api.post('/api/data/users', { email: email.trim(), role, organizationId: currentUser?.organizationId });
      setEmail('');
      setRole('viewer');
      setShowInvite(false);
      await refreshData();
    } catch (e: any) {
      toast('error', e.message || 'Failed to send invite');
    }
  };

  const handleChangeUserRole = async (userId: string, newRole: RoleKey) => {
    try {
      await api.patch(`/api/data/users/${userId}`, { role: newRole });
      await refreshData();
      setRoleDropdownForUser(null);
    } catch (e: any) {
      toast('error', e.message || 'Failed to update role');
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to remove this team member?')) return;
    try {
      await api.patch(`/api/data/users/${userId}`, { isActive: false });
      await refreshData();
      toast('success', 'Member removed.');
    } catch (e: any) {
      toast('error', e.message || 'Failed to remove user');
    }
  };

  const handleCustomRoleSubmit = async () => {
    if (!customRoleUserId) return;
    try {
      await api.patch(`/api/data/users/${customRoleUserId}`, { role: customRoleSelection });
      await refreshData();
      setShowCustomRoleModal(false);
      setCustomRoleUserId(null);
    } catch (e: any) {
      toast('error', e.message || 'Failed to update role');
    }
  };

  const openCustomRoleModal = (userId: string, currentRole: RoleKey) => {
    setCustomRoleUserId(userId);
    setCustomRoleSelection(currentRole);
    setShowCustomRoleModal(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Team & Roles</h1>
          <p className="mt-1 text-sm text-neutral-500">{users.length} members across {departments.length} departments.</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowInvite(true)}>
          Invite Member
        </Button>
      </div>

      {/* Members */}
      <Card>
        <CardHeader><CardTitle>Members</CardTitle></CardHeader>
        <CardBody className="p-0">
          <div className="divide-y divide-neutral-50">
            {users.map((user) => {
              const dept = departments.find((d) => d.id === user.departmentId);
              const isRoleDropdownOpen = roleDropdownForUser === user.id;
              return (
                <div key={user.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-neutral-50 transition-colors">
                  <Avatar name={user.name} color={user.avatarColor} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-neutral-900">{user.name}</p>
                      {user.role === 'owner' && <Shield className="h-3.5 w-3.5 text-primary-500" />}
                    </div>
                    <p className="text-xs text-neutral-400">{user.email}</p>
                  </div>
                  {dept && (
                    <span className="hidden sm:inline text-xs text-neutral-500">{dept.name}</span>
                  )}
                  <div className="relative">
                    <button
                      onClick={() => setRoleDropdownForUser(isRoleDropdownOpen ? null : user.id)}
                      className={cn(
                        'flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium transition-colors cursor-pointer',
                        roleConfig[user.role].color,
                        'hover:opacity-80'
                      )}
                    >
                      {roleConfig[user.role].label}
                      {user.role !== 'owner' && <ChevronDown className="h-3 w-3" />}
                    </button>
                    {isRoleDropdownOpen && user.role !== 'owner' && (
                      <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
                        {inviteRoles.map((r) => (
                          <button
                            key={r}
                            onClick={() => handleChangeUserRole(user.id, r)}
                            className={cn(
                              'flex w-full items-center gap-2 px-3 py-1.5 text-sm text-left transition-colors hover:bg-neutral-50',
                              user.role === r && 'bg-primary-50 text-primary-700'
                            )}
                          >
                            <span className={cn('h-2 w-2 rounded-full', roleConfig[r].color)} />
                            {roleConfig[r].label}
                            {user.role === r && <Check className="ml-auto h-3.5 w-3.5" />}
                          </button>
                        ))}
                        <div className="border-t border-neutral-100 mt-1 pt-1">
                          <button
                            onClick={() => { setRoleDropdownForUser(null); openCustomRoleModal(user.id, user.role); }}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors"
                          >
                            Custom Role...
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setShowPerms(user.role)}
                    className="rounded p-1 text-neutral-300 hover:bg-neutral-100 hover:text-neutral-600"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {user.role !== 'owner' && user.id !== currentUser?.id && (
                    <button
                      onClick={() => handleRemoveUser(user.id)}
                      className="rounded p-1 text-neutral-300 hover:bg-red-50 hover:text-red-500"
                      title="Remove member"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Roles & Permissions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Roles & Permissions</CardTitle>
            <Button variant="outline" size="sm" onClick={() => { openCustomRoleModal(users[0]?.id || '', users[0]?.role || 'viewer'); }}>Custom Role</Button>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500">Role</th>
                  {permissions.map((p) => (
                    <th key={p.key} className="px-3 py-3 text-center text-xs font-semibold text-neutral-500" title={p.label}>
                      <span className="hidden lg:inline">{p.label}</span>
                      <span className="lg:hidden inline-block w-6 truncate">{p.key.split('.')[1]}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {(Object.keys(roleConfig) as RoleKey[]).map((roleKey) => {
                  const perms = rolePermissions[roleKey];
                  return (
                    <tr key={roleKey} className="hover:bg-neutral-50">
                      <td className="px-5 py-3">
                        <Badge variant="neutral" className={roleConfig[roleKey].color}>
                          {roleConfig[roleKey].label}
                        </Badge>
                      </td>
                      {permissions.map((p) => (
                        <td key={p.key} className="px-3 py-3 text-center">
                          {perms.includes(p.key) ? (
                            <Check className="mx-auto h-4 w-4 text-success-500" />
                          ) : (
                            <X className="mx-auto h-4 w-4 text-neutral-200" />
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <Modal
        open={showInvite}
        onClose={() => setShowInvite(false)}
        title="Invite Team Member"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowInvite(false)}>Cancel</Button>
            <Button onClick={handleSendInvite} disabled={!email.trim()}>Send Invite</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full h-10 rounded-lg border border-neutral-200 pl-10 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none transition-colors"
                autoFocus
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Role</label>
            <div className="grid grid-cols-2 gap-2">
              {inviteRoles.map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={cn(
                    'flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors',
                    role === r ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                  )}
                >
                  {roleConfig[r].label}
                  {role === r && <Check className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={showPerms !== null}
        onClose={() => setShowPerms(null)}
        title={showPerms ? `${roleConfig[showPerms].label} Permissions` : ''}
        size="md"
        footer={
          <Button variant="outline" onClick={() => setShowPerms(null)}>Close</Button>
        }
      >
        <div className="space-y-2">
          {permissions.map((p) => (
            <div key={p.key} className="flex items-center justify-between rounded-lg border border-neutral-100 px-3 py-2">
              <span className="text-sm text-neutral-600">{p.label}</span>
              {showPerms && rolePermissions[showPerms].includes(p.key) ? (
                <Check className="h-4 w-4 text-success-500" />
              ) : (
                <X className="h-4 w-4 text-neutral-200" />
              )}
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        open={showCustomRoleModal}
        onClose={() => { setShowCustomRoleModal(false); setCustomRoleUserId(null); }}
        title="Assign Custom Role"
        footer={
          <>
            <Button variant="outline" onClick={() => { setShowCustomRoleModal(false); setCustomRoleUserId(null); }}>Cancel</Button>
            <Button onClick={handleCustomRoleSubmit}>Save Role</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">Select a role to assign to this team member:</p>
          <div className="space-y-2">
            {inviteRoles.map((r) => (
              <button
                key={r}
                onClick={() => setCustomRoleSelection(r)}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors',
                  customRoleSelection === r
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={cn('h-2 w-2 rounded-full', roleConfig[r].color)} />
                  {roleConfig[r].label}
                </div>
                {customRoleSelection === r && <Check className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
          <div className="rounded-lg border border-neutral-100 p-3">
            <p className="text-xs font-medium text-neutral-500 mb-2">Permissions for {roleConfig[customRoleSelection].label}:</p>
            <div className="flex flex-wrap gap-1">
              {(rolePermissions[customRoleSelection] || []).map((pk) => (
                <span key={pk} className="inline-block rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                  {permissions.find((p) => p.key === pk)?.label || pk}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
