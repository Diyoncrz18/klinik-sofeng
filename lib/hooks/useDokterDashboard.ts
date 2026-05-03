"use client";

/**
 * useDokterDashboard
 * ──────────────────
 * Fetch appointments milik dokter login lalu turunkan beberapa metrik
 * yang dipakai di Dashboard dokter:
 *
 *   • todayCount         → appointment dengan tanggal == hari ini
 *   • activeQueueCount   → status 'menunggu' atau 'sedang_ditangani'
 *   • weekPatientCount   → pasien_id unik di rentang Senin–Minggu minggu ini
 *
 * Hook ini single-source-of-truth untuk dashboard dokter; komponen markup
 * cukup membaca state-nya tanpa fetch sendiri.
 *
 * Catatan: backend `GET /api/appointments` ketika dipanggil oleh user
 * berperan dokter akan otomatis memfilter via RLS (`dokter_id = auth.uid()`).
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import { listAppointments } from "@/lib/appointments";
import type { Appointment } from "@/lib/types";

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

const ACTIVE_QUEUE_STATUS = new Set<Appointment["status"]>([
  "menunggu",
  "sedang_ditangani",
]);

const ACTIVE_STATUS = new Set<Appointment["status"]>([
  "terjadwal",
  "menunggu",
  "sedang_ditangani",
]);

function todayIsoLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Senin minggu ini (ISO YYYY-MM-DD) — dipakai sebagai batas bawah "minggu ini". */
function startOfWeekIso(): string {
  const d = new Date();
  const day = d.getDay(); // Minggu = 0, Senin = 1, ... Sabtu = 6
  const offset = day === 0 ? -6 : 1 - day; // shift agar Senin = 0
  d.setDate(d.getDate() + offset);
  d.setHours(0, 0, 0, 0);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

// ────────────────────────────────────────────────────────────────
// Public types
// ────────────────────────────────────────────────────────────────

export interface DokterDashboardStats {
  todayCount: number;
  activeAppointmentCount: number;
  activeQueueCount: number;
  weekPatientCount: number;
}

export interface DokterDashboardData {
  stats: DokterDashboardStats;
  appointments: Appointment[];
  upcomingAppointments: Appointment[]; // janji aktif yang akan datang, sort terdekat dulu
  upcomingToday: Appointment[]; // sort by jam asc, max 5 (untuk panel kanan-kiri)
  loading: boolean;
  errorMsg: string | null;
  /** Refetch manual setelah aksi (mis. status appointment berubah). */
  refetch: () => void;
}

// ────────────────────────────────────────────────────────────────
// Hook
// ────────────────────────────────────────────────────────────────

const EMPTY_STATS: DokterDashboardStats = {
  todayCount: 0,
  activeAppointmentCount: 0,
  activeQueueCount: 0,
  weekPatientCount: 0,
};

export function useDokterDashboard(): DokterDashboardData {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchAll = useCallback(async (options: { silent?: boolean } = {}) => {
    if (!options.silent) setLoading(true);
    try {
      const items = await listAppointments();
      setAppointments(items);
      setErrorMsg(null);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Gagal memuat data dashboard.";
      setErrorMsg(msg);
    } finally {
      if (!options.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll();

    const intervalId = window.setInterval(() => {
      void fetchAll({ silent: true });
    }, 30_000);

    const refreshOnFocus = () => {
      void fetchAll({ silent: true });
    };
    window.addEventListener("focus", refreshOnFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshOnFocus);
    };
  }, [fetchAll]);

  const derived = useMemo(() => {
    const today = todayIsoLocal();
    const weekStart = startOfWeekIso();

    let todayCount = 0;
    let activeAppointmentCount = 0;
    let activeQueueCount = 0;
    const pasienWeek = new Set<string>();
    const todayList: Appointment[] = [];
    const upcomingAppointments: Appointment[] = [];

    for (const a of appointments) {
      const isActive = ACTIVE_STATUS.has(a.status);
      if (a.tanggal === today) {
        todayCount++;
        if (isActive) todayList.push(a);
      }
      if (isActive) activeAppointmentCount++;
      if (ACTIVE_QUEUE_STATUS.has(a.status)) {
        activeQueueCount++;
      }
      if (a.tanggal >= today && isActive) {
        upcomingAppointments.push(a);
      }
      if (a.tanggal >= weekStart) {
        pasienWeek.add(a.pasien_id);
      }
    }

    todayList.sort((a, b) => a.jam.localeCompare(b.jam));
    upcomingAppointments.sort((a, b) => {
      if (a.tanggal !== b.tanggal) return a.tanggal.localeCompare(b.tanggal);
      return a.jam.localeCompare(b.jam);
    });

    const stats: DokterDashboardStats = {
      todayCount,
      activeAppointmentCount,
      activeQueueCount,
      weekPatientCount: pasienWeek.size,
    };

    return {
      stats,
      upcomingAppointments: upcomingAppointments.slice(0, 5),
      upcomingToday: todayList.slice(0, 5),
    };
  }, [appointments]);

  return {
    stats: appointments.length === 0 && errorMsg ? EMPTY_STATS : derived.stats,
    appointments,
    upcomingAppointments: derived.upcomingAppointments,
    upcomingToday: derived.upcomingToday,
    loading,
    errorMsg,
    refetch: () => {
      void fetchAll();
    },
  };
}
