import { api } from '@/lib/api';
import type { NotificationItem } from '@/types';

export async function fetchNotifications(
  orgId: string,
  userId: string
): Promise<NotificationItem[]> {
  const data = await api.get(
    `/api/data/notifications?orgId=${orgId}&userId=${userId}`
  );
  return (data.notifications ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (n: any): NotificationItem => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      timestamp: n.createdAt,
      read: n.read,
    })
  );
}

export async function markAsRead(notificationId: string): Promise<void> {
  await api.patch(`/api/data/notifications/${notificationId}/read`, {});
}

export async function markAllAsRead(
  orgId: string,
  userId: string
): Promise<void> {
  await api.patch('/api/data/notifications/read-all', { orgId, userId });
}

export async function createNotification(
  orgId: string,
  userId: string,
  params: { type: string; title: string; message: string }
): Promise<void> {
  await api.post('/api/data/notifications', {
    organizationId: orgId,
    userId,
    type: params.type,
    title: params.title,
    message: params.message,
  });
}

export function getUnreadCount(notifications: NotificationItem[]): number {
  return notifications.filter((n) => !n.read).length;
}
