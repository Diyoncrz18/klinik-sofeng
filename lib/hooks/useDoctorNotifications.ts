"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  listNotifikasi,
  markAllNotifikasiRead,
  markNotifikasiRead,
  subscribeNotifikasiStream,
} from "@/lib/notifikasi";
import type { NotifikasiItem } from "@/lib/types";

export interface DoctorNotificationsData {
  items: NotifikasiItem[];
  unreadCount: number;
  loading: boolean;
  errorMsg: string | null;
  realtimeConnected: boolean;
  lastSyncedAt: string | null;
  refetch: () => void;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export function useDoctorNotifications(): DoctorNotificationsData {
  const [items, setItems] = useState<NotifikasiItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (options: { silent?: boolean } = {}) => {
    if (!options.silent) setLoading(true);
    try {
      const data = await listNotifikasi({ limit: 80 });
      setItems(data.items);
      setUnreadCount(data.unreadCount);
      setLastSyncedAt(data.serverTime);
      setErrorMsg(null);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Gagal memuat notifikasi.");
    } finally {
      if (!options.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    let unsubscribeStream: (() => void) | null = null;

    void fetchNotifications().then(() => {
      if (!alive) return;
      unsubscribeStream = subscribeNotifikasiStream({
        onSnapshot(payload) {
          setItems(payload.items);
          setUnreadCount(payload.unreadCount);
          setLastSyncedAt(payload.serverTime);
          setRealtimeConnected(true);
          setErrorMsg(null);
        },
        onStatus(status) {
          if (status === "SUBSCRIBED") {
            setRealtimeConnected(true);
          }
        },
        onError(error) {
          setRealtimeConnected(false);
          setErrorMsg(error.message);
        },
      });
    });

    const intervalId = window.setInterval(() => {
      void fetchNotifications({ silent: true });
    }, 15_000);

    const refreshOnFocus = () => {
      void fetchNotifications({ silent: true });
    };

    window.addEventListener("focus", refreshOnFocus);
    return () => {
      alive = false;
      unsubscribeStream?.();
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshOnFocus);
    };
  }, [fetchNotifications]);

  const markRead = useCallback(async (id: string) => {
    const updated = await markNotifikasiRead(id);
    setItems((current) => {
      let wasUnread = false;
      const next = current.map((item) => {
        if (item.id !== id) return item;
        wasUnread = item.read_at === null;
        return updated;
      });

      if (wasUnread) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }

      return next;
    });
  }, []);

  const markAllRead = useCallback(async () => {
    const { readAt } = await markAllNotifikasiRead();
    setItems((current) =>
      current.map((item) => (item.read_at ? item : { ...item, read_at: readAt })),
    );
    setUnreadCount(0);
  }, []);

  return useMemo(
    () => ({
      items,
      unreadCount,
      loading,
      errorMsg,
      realtimeConnected,
      lastSyncedAt,
      refetch: () => {
        void fetchNotifications();
      },
      markRead,
      markAllRead,
    }),
    [
      errorMsg,
      fetchNotifications,
      items,
      lastSyncedAt,
      loading,
      markAllRead,
      markRead,
      realtimeConnected,
      unreadCount,
    ],
  );
}
