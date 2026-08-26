import { useEffect, useRef } from 'react';
import { api } from '@/lib/api';

export function useRealtimeNotifications(
  userId: string,
  onNew: (n: Record<string, unknown>) => void,
) {
  const callbackRef = useRef(onNew);
  callbackRef.current = onNew;

  useEffect(() => {
    if (!userId) return;

    const poll = async () => {
      try {
        const data = await api.get(`/api/data/notifications?userId=${userId}`);
        const notifications = data.notifications || data || [];
        if (Array.isArray(notifications)) {
          notifications.forEach((n: Record<string, unknown>) => {
            if (!n.read) callbackRef.current(n);
          });
        }
      } catch {
        // silently ignore poll errors
      }
    };

    poll();
    const interval = setInterval(poll, 30_000);
    return () => clearInterval(interval);
  }, [userId]);
}

export function useRealtimeDocuments(
  orgId: string,
  onChange: () => void,
) {
  const callbackRef = useRef(onChange);
  callbackRef.current = onChange;

  useEffect(() => {
    if (!orgId) return;

    const poll = async () => {
      try {
        await api.get(`/api/data/documents?orgId=${orgId}`);
        callbackRef.current();
      } catch {
        // silently ignore poll errors
      }
    };

    poll();
    const interval = setInterval(poll, 30_000);
    return () => clearInterval(interval);
  }, [orgId]);
}

export function useRealtimeActivity(
  orgId: string,
  onNew: (a: Record<string, unknown>) => void,
) {
  const callbackRef = useRef(onNew);
  callbackRef.current = onNew;

  useEffect(() => {
    if (!orgId) return;

    let lastSeen: string | null = null;

    const poll = async () => {
      try {
        const data = await api.get(`/api/data/activity?orgId=${orgId}`);
        const activities = data.activity || data || [];
        if (Array.isArray(activities)) {
          const newItems = lastSeen
            ? activities.filter((a: Record<string, unknown>) => (a.timestamp as string) > lastSeen!)
            : [];
          lastSeen = activities[0]?.timestamp as string || null;
          newItems.forEach((a: Record<string, unknown>) => callbackRef.current(a));
        }
      } catch {
        // silently ignore poll errors
      }
    };

    poll();
    const interval = setInterval(poll, 30_000);
    return () => clearInterval(interval);
  }, [orgId]);
}
