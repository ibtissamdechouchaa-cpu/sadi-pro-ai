import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useStore } from '@/store/StoreContext';
import { timeAgo, cn } from '@/lib/utils';

export function NotificationsPage() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useStore();
  const unread = notifications.filter((n) => !n.read);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Notifications</h1>
          <p className="mt-1 text-sm text-neutral-500">{unread.length} unread · {notifications.length} total</p>
        </div>
        {unread.length > 0 && (
          <Button variant="outline" size="sm" icon={<CheckCheck className="h-4 w-4" />} onClick={markAllNotificationsRead}>
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <EmptyState icon={<Bell className="h-8 w-8" />} title="No notifications" description="You're all caught up. Notifications about document activity, approvals and system alerts will appear here." />
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>Recent</CardTitle></CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-neutral-50">
              {notifications.map((n) => (
                <div key={n.id} className={cn('flex items-start gap-3 px-5 py-4', !n.read && 'bg-primary-50/30')}>
                  <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', !n.read ? 'bg-primary-500' : 'bg-transparent')} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900">{n.title}</p>
                    <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-neutral-400 mt-1">{timeAgo(n.timestamp)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!n.read && (
                      <Button variant="ghost" size="sm" onClick={() => markNotificationRead(n.id)}>Mark read</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
