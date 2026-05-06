import { useState, useEffect, useCallback } from "react";
import { ref, onValue, push, set, update, remove, query, orderByChild, limitToLast } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  icon: string | null;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasNewNotification, setHasNewNotification] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Realtime listener on Firebase
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const notifRef = ref(db, `users/${user.uid}/notifications`);
    const notifQuery = query(notifRef, orderByChild("created_at"), limitToLast(50));

    const unsubscribe = onValue(notifQuery, (snapshot) => {
      const items: Notification[] = [];
      snapshot.forEach((child) => {
        items.push({ id: child.key!, ...child.val() });
      });
      // Reverse for newest-first
      items.reverse();

      // Check if new notifications arrived
      if (!loading && items.length > notifications.length) {
        setHasNewNotification(true);
        setTimeout(() => setHasNewNotification(false), 2000);
      }

      setNotifications(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const markAsRead = useCallback(
    async (id: string) => {
      if (!user) return;
      await update(ref(db, `users/${user.uid}/notifications/${id}`), { is_read: true });
    },
    [user]
  );

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    const updates: Record<string, boolean> = {};
    notifications.filter((n) => !n.is_read).forEach((n) => {
      updates[`users/${user.uid}/notifications/${n.id}/is_read`] = true;
    });
    if (Object.keys(updates).length > 0) {
      const { update: fbUpdate } = await import("firebase/database");
      await fbUpdate(ref(db), updates);
    }
  }, [user, notifications]);

  const removeNotification = useCallback(
    async (id: string) => {
      if (!user) return;
      await remove(ref(db, `users/${user.uid}/notifications/${id}`));
    },
    [user]
  );

  const clearAll = useCallback(async () => {
    if (!user) return;
    await remove(ref(db, `users/${user.uid}/notifications`));
  }, [user]);

  const createNotification = useCallback(
    async (data: {
      title: string;
      message: string;
      type: string;
      priority?: string;
      icon?: string;
      action_url?: string;
    }) => {
      if (!user) return;
      const notifRef = push(ref(db, `users/${user.uid}/notifications`));
      await set(notifRef, {
        title: data.title,
        message: data.message,
        type: data.type,
        priority: data.priority || "low",
        icon: data.icon || null,
        is_read: false,
        action_url: data.action_url || null,
        created_at: new Date().toISOString(),
      });
    },
    [user]
  );

  return {
    notifications,
    unreadCount,
    loading,
    hasNewNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    removeNotification,
    createNotification,
  };
}
