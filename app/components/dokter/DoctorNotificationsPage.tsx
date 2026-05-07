"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  CalendarPlus,
  CheckCircle2,
  ExternalLink,
  Inbox,
  Info,
  MailCheck,
  Megaphone,
  RefreshCw,
  Search,
  Wifi,
  WifiOff,
  type LucideIcon,
} from "lucide-react";

import type { DoctorNotificationsData } from "@/lib/hooks/useDoctorNotifications";
import type { NotifikasiItem, NotifikasiType } from "@/lib/types";

type NotificationFilter = "semua" | "belum-dibaca" | "booking" | "darurat" | "sistem";

interface NotificationMeta {
  label: string;
  Icon: LucideIcon;
  iconClassName: string;
  cardClassName: string;
  badgeClassName: string;
}

const NOTIFICATION_META: Record<NotifikasiType, NotificationMeta> = {
  pengingat: {
    label: "Pengingat",
    Icon: Bell,
    iconClassName: "bg-amber-50 border-amber-100 text-amber-700",
    cardClassName: "border-amber-100 bg-amber-50/35",
    badgeClassName: "bg-amber-50 text-amber-700 border-amber-100",
  },
  konfirmasi: {
    label: "Booking",
    Icon: CalendarPlus,
    iconClassName: "bg-blue-50 border-blue-100 text-blue-700",
    cardClassName: "border-blue-100 bg-blue-50/35",
    badgeClassName: "bg-blue-50 text-blue-700 border-blue-100",
  },
  pengumuman: {
    label: "Sistem",
    Icon: Megaphone,
    iconClassName: "bg-slate-50 border-slate-200 text-slate-600",
    cardClassName: "border-gray-100 bg-white",
    badgeClassName: "bg-gray-50 text-gray-600 border-gray-200",
  },
  darurat: {
    label: "Darurat",
    Icon: AlertTriangle,
    iconClassName: "bg-rose-50 border-rose-100 text-rose-700",
    cardClassName: "border-rose-100 bg-rose-50/45",
    badgeClassName: "bg-rose-50 text-rose-700 border-rose-100",
  },
  lainnya: {
    label: "Lainnya",
    Icon: Info,
    iconClassName: "bg-emerald-50 border-emerald-100 text-emerald-700",
    cardClassName: "border-gray-100 bg-white",
    badgeClassName: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
};

function formatRelativeTime(value: string): string {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  if (Number.isNaN(date.getTime())) return "-";
  if (diffMs < 60_000) return "Baru saja";

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes} menit lalu`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatSyncTime(value: string | null): string {
  if (!value) return "Belum sinkron";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Belum sinkron";
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function matchesFilter(notification: NotifikasiItem, filter: NotificationFilter): boolean {
  if (filter === "semua") return true;
  if (filter === "belum-dibaca") return notification.read_at === null;
  if (filter === "booking") {
    return notification.type === "konfirmasi" || notification.type === "pengingat";
  }
  if (filter === "darurat") return notification.type === "darurat";
  return notification.type === "pengumuman" || notification.type === "lainnya";
}

function isInternalPath(link: string): boolean {
  return link.startsWith("/") && !link.startsWith("//");
}

function NotificationSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      {[0, 1, 2].map((item) => (
        <div key={item} className="rounded-xl border border-gray-100 bg-white p-4">
          <div className="flex gap-4">
            <div className="h-11 w-11 rounded-xl bg-gray-100 animate-pulse" />
            <div className="min-w-0 flex-1 space-y-3 pt-1">
              <div className="h-3 w-44 rounded bg-gray-100 animate-pulse" />
              <div className="h-2.5 w-full max-w-xl rounded bg-gray-50 animate-pulse" />
              <div className="h-2.5 w-3/5 rounded bg-gray-50 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DoctorNotificationsPage({
  notificationsData,
}: {
  notificationsData: DoctorNotificationsData;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<NotificationFilter>("semua");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const items = notificationsData.items;

  const counts = useMemo(
    () => ({
      semua: items.length,
      "belum-dibaca": items.filter((item) => !item.read_at).length,
      booking: items.filter((item) => matchesFilter(item, "booking")).length,
      darurat: items.filter((item) => item.type === "darurat").length,
      sistem: items.filter((item) => matchesFilter(item, "sistem")).length,
    }),
    [items],
  );

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((item) => {
      if (!matchesFilter(item, filter)) return false;
      if (!normalizedQuery) return true;
      return [item.title, item.description ?? "", NOTIFICATION_META[item.type].label]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [filter, items, query]);

  const filters: Array<{
    key: NotificationFilter;
    label: string;
    count: number;
    Icon: LucideIcon;
  }> = [
    { key: "semua", label: "Semua", count: counts.semua, Icon: Inbox },
    { key: "belum-dibaca", label: "Belum Dibaca", count: counts["belum-dibaca"], Icon: Bell },
    { key: "booking", label: "Booking", count: counts.booking, Icon: CalendarPlus },
    { key: "darurat", label: "Darurat", count: counts.darurat, Icon: AlertTriangle },
    { key: "sistem", label: "Sistem", count: counts.sistem, Icon: Megaphone },
  ];

  async function markRead(notification: NotifikasiItem) {
    if (notification.read_at || pendingId) return;
    setPendingId(notification.id);
    try {
      await notificationsData.markRead(notification.id);
    } finally {
      setPendingId(null);
    }
  }

  async function markAllRead() {
    if (markingAll || notificationsData.unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await notificationsData.markAllRead();
    } finally {
      setMarkingAll(false);
    }
  }

  async function openNotification(notification: NotifikasiItem) {
    if (!notification.read_at) {
      await markRead(notification);
    }

    if (!notification.link) return;
    if (isInternalPath(notification.link)) {
      router.push(notification.link, { scroll: false });
      return;
    }

    window.open(notification.link, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex h-full min-h-0 flex-col" data-testid="doctor-notifications-page">
      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-700">
                  <Bell className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Pusat Notifikasi</h3>
                  <p className="text-xs font-medium text-gray-500">
                    {notificationsData.unreadCount} belum dibaca dari {items.length} notifikasi
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={[
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold",
                  notificationsData.realtimeConnected
                    ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                    : "border-amber-100 bg-amber-50 text-amber-700",
                ].join(" ")}
              >
                {notificationsData.realtimeConnected ? (
                  <Wifi className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {notificationsData.realtimeConnected ? "Realtime aktif" : "Sinkron berkala"}
              </span>
              <button
                type="button"
                onClick={() => notificationsData.refetch()}
                disabled={notificationsData.loading}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-wait disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-4 w-4 ${notificationsData.loading ? "animate-spin" : ""}`}
                  aria-hidden="true"
                />
                Refresh
              </button>
              <button
                type="button"
                onClick={markAllRead}
                disabled={markingAll || notificationsData.unreadCount === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-sm shadow-blue-600/20 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 disabled:shadow-none"
              >
                <MailCheck className="h-4 w-4" aria-hidden="true" />
                Tandai Dibaca
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-gray-500">Sinkron terakhir</p>
              <p className="mt-1 text-lg font-black text-gray-900">
                {formatSyncTime(notificationsData.lastSyncedAt)}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="min-h-0 rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
          <div className="relative mb-3">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari notifikasi..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm font-medium text-gray-700 outline-none transition-all placeholder:text-gray-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="space-y-1.5">
            {filters.map(({ key, label, count, Icon }) => {
              const active = filter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={[
                    "flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                    active
                      ? "border-blue-100 bg-blue-50 text-blue-800"
                      : "border-transparent text-gray-600 hover:border-gray-100 hover:bg-gray-50",
                  ].join(" ")}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    <span className="truncate text-sm font-bold">{label}</span>
                  </span>
                  <span
                    className={[
                      "rounded-full px-2 py-0.5 text-[11px] font-black",
                      active ? "bg-white text-blue-700" : "bg-gray-100 text-gray-500",
                    ].join(" ")}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="min-h-0 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div>
              <p className="text-sm font-black text-gray-900">
                {filteredItems.length} notifikasi
              </p>
              <p className="text-xs font-medium text-gray-400">
                Daftar pemberitahuan terbaru
              </p>
            </div>
            {counts.darurat > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                {counts.darurat} darurat
              </span>
            )}
          </div>

          <div className="h-full min-h-0 overflow-y-auto p-4 pb-16" style={{ scrollbarWidth: "thin" }}>
            {notificationsData.errorMsg ? (
              <div className="mb-3 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                {notificationsData.errorMsg}
              </div>
            ) : null}

            {notificationsData.loading && items.length === 0 ? (
              <NotificationSkeleton />
            ) : filteredItems.length === 0 ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 text-gray-400">
                  <Inbox className="h-6 w-6" aria-hidden="true" />
                </div>
                <p className="text-base font-black text-gray-800">Tidak ada notifikasi</p>
                <p className="mt-1 max-w-sm text-sm leading-relaxed text-gray-500">
                  Notifikasi appointment dan pembaruan klinik akan muncul otomatis di sini.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((notification) => {
                  const meta = NOTIFICATION_META[notification.type];
                  const Icon = meta.Icon;
                  const unread = notification.read_at === null;

                  return (
                    <article
                      key={notification.id}
                      className={[
                        "relative rounded-xl border p-4 transition-all",
                        unread ? meta.cardClassName : "border-gray-100 bg-white opacity-80",
                      ].join(" ")}
                    >
                      {unread && (
                        <span className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-blue-600" />
                      )}
                      <div className="flex gap-4">
                        <div
                          className={[
                            "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border",
                            meta.iconClassName,
                          ].join(" ")}
                        >
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div className="min-w-0 flex-1 pr-4">
                          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-sm font-black text-gray-900">
                                  {notification.title}
                                </h4>
                                <span
                                  className={[
                                    "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold",
                                    meta.badgeClassName,
                                  ].join(" ")}
                                >
                                  {meta.label}
                                </span>
                              </div>
                              <p className="mt-1 text-xs font-medium text-gray-500">
                                {formatRelativeTime(notification.created_at)}
                              </p>
                            </div>
                          </div>

                          <p className="mt-3 text-sm leading-relaxed text-gray-600">
                            {notification.description?.trim() || "Tidak ada deskripsi tambahan."}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {notification.link && (
                              <button
                                type="button"
                                onClick={() => void openNotification(notification)}
                                disabled={pendingId === notification.id}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-wait disabled:opacity-60"
                              >
                                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                                Buka
                              </button>
                            )}
                            {unread && (
                              <button
                                type="button"
                                onClick={() => void markRead(notification)}
                                disabled={pendingId === notification.id}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-gray-700 disabled:cursor-wait disabled:bg-gray-300"
                              >
                                <MailCheck className="h-3.5 w-3.5" aria-hidden="true" />
                                {pendingId === notification.id ? "Memproses" : "Tandai Dibaca"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
