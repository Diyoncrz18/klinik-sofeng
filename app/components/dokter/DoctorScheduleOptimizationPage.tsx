"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Plus,
  RefreshCw,
  Sparkles,
  Stethoscope,
  Users,
} from "lucide-react";

import { appointmentTitle } from "@/lib/appointment-display";
import { createMyJadwalDokter, getMyJadwalDokter } from "@/lib/dokter";
import { formatJamRange, formatStatusLabel, formatTanggalIndo } from "@/lib/format";
import type { DokterDashboardData } from "@/lib/hooks/useDokterDashboard";
import type { Appointment, JadwalDokter } from "@/lib/types";

interface DoctorScheduleOptimizationPageProps {
  dashboardData?: DokterDashboardData;
}

interface ScheduleFormState {
  hari: number;
  jamMulai: string;
  jamSelesai: string;
  kuota: number;
}

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const DAY_SHORT = ["MIN", "SEN", "SEL", "RAB", "KAM", "JUM", "SAB"];
const ACTIVE_STATUSES = new Set(["terjadwal", "menunggu", "sedang_ditangani"]);
const EMPTY_APPOINTMENTS: Appointment[] = [];
const DEFAULT_FORM: ScheduleFormState = {
  hari: new Date().getDay(),
  jamMulai: "09:00",
  jamSelesai: "12:00",
  kuota: 8,
};

function todayIsoLocal(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

function formatMonthLabel(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(parseLocalDate(value));
}

function normalizeTime(value: string | null | undefined): string {
  return value ? value.slice(0, 5) : "--:--";
}

function timeToMinutes(value: string): number {
  const [hour = "0", minute = "0"] = normalizeTime(value).split(":");
  return Number(hour) * 60 + Number(minute);
}

function estimatedDurationMinutes(appointment: Appointment): number {
  switch (appointment.jenis) {
    case "darurat":
      return 45;
    case "tindakan":
      return 60;
    case "kontrol":
      return 30;
    case "pemeriksaan":
      return 30;
    case "konsultasi":
    default:
      return 30;
  }
}

function patientName(appointment: Appointment): string {
  return appointment.pasien?.profile.full_name ?? "Pasien";
}

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "PS"
  );
}

function sortSchedules(items: JadwalDokter[]): JadwalDokter[] {
  return [...items].sort((a, b) => {
    if (a.hari !== b.hari) return a.hari - b.hari;
    return a.jam_mulai.localeCompare(b.jam_mulai);
  });
}

function sortAppointments(items: Appointment[]): Appointment[] {
  return [...items].sort((a, b) => {
    if (a.tanggal !== b.tanggal) return a.tanggal.localeCompare(b.tanggal);
    return a.jam.localeCompare(b.jam);
  });
}

function appointmentDateMap(appointments: Appointment[]) {
  const dates = new Map<string, number>();
  for (const appointment of appointments) {
    dates.set(appointment.tanggal, (dates.get(appointment.tanggal) ?? 0) + 1);
  }
  return dates;
}

export default function DoctorScheduleOptimizationPage({
  dashboardData,
}: DoctorScheduleOptimizationPageProps) {
  const [selectedDate, setSelectedDate] = useState(todayIsoLocal);
  const [schedules, setSchedules] = useState<JadwalDokter[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<ScheduleFormState>(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const appointments = dashboardData?.appointments ?? EMPTY_APPOINTMENTS;
  const selectedDay = parseLocalDate(selectedDate).getDay();
  const selectedAppointments = useMemo(
    () =>
      sortAppointments(
        appointments.filter(
          (appointment) =>
            appointment.tanggal === selectedDate && ACTIVE_STATUSES.has(appointment.status),
        ),
      ),
    [appointments, selectedDate],
  );
  const selectedAllAppointments = useMemo(
    () => sortAppointments(appointments.filter((appointment) => appointment.tanggal === selectedDate)),
    [appointments, selectedDate],
  );

  async function loadSchedules() {
    setScheduleLoading(true);
    try {
      const data = await getMyJadwalDokter();
      setSchedules(sortSchedules(data));
      setScheduleError(null);
    } catch (error) {
      setScheduleError(error instanceof Error ? error.message : "Gagal memuat jadwal praktik.");
    } finally {
      setScheduleLoading(false);
    }
  }

  useEffect(() => {
    void loadSchedules();
  }, []);

  const activeSchedules = useMemo(
    () => schedules.filter((schedule) => schedule.is_active),
    [schedules],
  );
  const daySchedules = useMemo(
    () => activeSchedules.filter((schedule) => schedule.hari === selectedDay),
    [activeSchedules, selectedDay],
  );
  const dayCapacity = daySchedules.reduce((sum, schedule) => sum + schedule.kuota, 0);
  const utilization = dayCapacity > 0 ? Math.round((selectedAppointments.length / dayCapacity) * 100) : 0;
  const totalWeeklyCapacity = activeSchedules.reduce((sum, schedule) => sum + schedule.kuota, 0);
  const activeAppointmentCount = appointments.filter((appointment) =>
    ACTIVE_STATUSES.has(appointment.status),
  ).length;

  const appointmentsByDate = useMemo(() => appointmentDateMap(appointments), [appointments]);
  const calendarDays = useMemo(() => {
    const current = parseLocalDate(selectedDate);
    const year = current.getFullYear();
    const month = current.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const leading = firstDay.getDay();
    const cells: Array<{ key: string; iso?: string; label: string; muted: boolean; count: number }> = [];

    for (let i = 0; i < leading; i += 1) {
      cells.push({ key: `empty-${i}`, label: "", muted: true, count: 0 });
    }

    for (let day = 1; day <= lastDay.getDate(); day += 1) {
      const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      cells.push({
        key: iso,
        iso,
        label: String(day),
        muted: false,
        count: appointmentsByDate.get(iso) ?? 0,
      });
    }

    return cells;
  }, [appointmentsByDate, selectedDate]);

  const recommendations = useMemo(() => {
    const items: Array<{
      title: string;
      body: string;
      tone: "indigo" | "amber" | "emerald" | "rose";
    }> = [];

    if (daySchedules.length === 0) {
      items.push({
        title: "Jam Praktik Belum Ada",
        body: `${DAYS[selectedDay]} belum punya jam praktik aktif. Tambahkan blok praktik agar appointment bisa dihitung kapasitasnya.`,
        tone: "amber",
      });
    }

    if (dayCapacity > 0 && utilization >= 85) {
      items.push({
        title: "Kapasitas Hampir Penuh",
        body: `${selectedAppointments.length} dari ${dayCapacity} kuota aktif sudah terisi. Pertimbangkan buka blok tambahan atau pindahkan kontrol ringan.`,
        tone: "rose",
      });
    } else if (dayCapacity > 0 && utilization < 45) {
      items.push({
        title: "Kapasitas Masih Longgar",
        body: `Utilisasi baru ${utilization}%. Slot ini cocok untuk follow-up singkat atau pasien kontrol.`,
        tone: "emerald",
      });
    }

    const sorted = selectedAppointments;
    for (let index = 0; index < sorted.length - 1; index += 1) {
      const current = sorted[index];
      const next = sorted[index + 1];
      if (!current || !next) continue;
      const endCurrent = timeToMinutes(current.jam) + estimatedDurationMinutes(current);
      const startNext = timeToMinutes(next.jam);
      const gap = startNext - endCurrent;
      if (gap >= 30) {
        items.push({
          title: "Slot Kosong Terdeteksi",
          body: `Ada jeda ${gap} menit antara ${patientName(current)} dan ${patientName(next)}. Slot ini bisa dipakai untuk konsultasi cepat.`,
          tone: "indigo",
        });
        break;
      }
    }

    const typeCounts = new Map<string, number>();
    for (const appointment of selectedAppointments) {
      const title = appointmentTitle(appointment);
      typeCounts.set(title, (typeCounts.get(title) ?? 0) + 1);
    }
    const clustered = Array.from(typeCounts.entries()).find(([, count]) => count >= 2);
    if (clustered) {
      items.push({
        title: "Kelompokkan Tindakan",
        body: `${clustered[1]} appointment "${clustered[0]}" berada di tanggal ini. Persiapan alat bisa dibuat dalam satu batch.`,
        tone: "emerald",
      });
    }

    if (items.length === 0) {
      items.push({
        title: "Jadwal Terkendali",
        body: "Belum ada konflik atau gap besar pada tanggal ini. Pantau perubahan status pasien secara berkala.",
        tone: "indigo",
      });
    }

    return items.slice(0, 3);
  }, [dayCapacity, daySchedules.length, selectedAppointments, selectedDay, utilization]);

  async function handleCreateSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setScheduleSuccess(null);
    try {
      const created = await createMyJadwalDokter({
        hari: form.hari,
        jamMulai: form.jamMulai,
        jamSelesai: form.jamSelesai,
        kuota: form.kuota,
        isActive: true,
      });
      setSchedules((current) => sortSchedules([...current, created]));
      setScheduleError(null);
      setScheduleSuccess(`Jadwal ${DAYS[form.hari]} berhasil ditambahkan.`);
    } catch (error) {
      setScheduleError(error instanceof Error ? error.message : "Gagal menambahkan jadwal praktik.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="flex min-h-[calc(100vh-112px)] flex-col gap-5" data-testid="doctor-schedule-optimization-page">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          {
            label: "Slot Praktik",
            value: activeSchedules.length,
            sub: `${totalWeeklyCapacity} kuota/minggu`,
            icon: CalendarDays,
            tone: "text-indigo-700 bg-indigo-50 border-indigo-100",
          },
          {
            label: "Appointment Aktif",
            value: activeAppointmentCount,
            sub: "Dari data booking real",
            icon: Users,
            tone: "text-blue-700 bg-blue-50 border-blue-100",
          },
          {
            label: "Kuota Tanggal Ini",
            value: dayCapacity,
            sub: `${utilization}% terpakai`,
            icon: Clock3,
            tone: "text-emerald-700 bg-emerald-50 border-emerald-100",
          },
          {
            label: "Kunjungan Tanggal Ini",
            value: selectedAllAppointments.length,
            sub: formatTanggalIndo(selectedDate),
            icon: Stethoscope,
            tone: "text-rose-700 bg-rose-50 border-rose-100",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`rounded-xl border bg-white p-4 shadow-sm ${stat.tone}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-500">{stat.label}</p>
                  <p className="mt-1 text-2xl font-black">{dashboardData?.loading || scheduleLoading ? "-" : stat.value}</p>
                  <p className="mt-0.5 truncate text-[11px] font-medium text-gray-400">{stat.sub}</p>
                </div>
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/80 shadow-sm">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid flex-1 grid-cols-1 gap-5 overflow-hidden xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="flex min-h-[520px] flex-col gap-4 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-black text-gray-900">{formatMonthLabel(selectedDate)}</h3>
              <button
                type="button"
                onClick={() => void loadSchedules()}
                disabled={scheduleLoading}
                title="Muat ulang jadwal praktik"
                className="rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-wait disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${scheduleLoading ? "animate-spin" : ""}`} aria-hidden="true" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {DAY_SHORT.map((day) => (
                <span key={day} className="pb-2 text-[10px] font-black text-gray-400">
                  {day}
                </span>
              ))}
              {calendarDays.map((day) => (
                <button
                  key={day.key}
                  type="button"
                  disabled={!day.iso}
                  onClick={() => day.iso && setSelectedDate(day.iso)}
                  className={`relative rounded-lg py-2 text-sm font-bold transition-colors ${
                    day.iso === selectedDate
                      ? "bg-indigo-600 text-white shadow-sm"
                      : day.muted
                        ? "cursor-default text-transparent"
                        : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {day.label}
                  {day.count > 0 && (
                    <span
                      className={`absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full ${
                        day.iso === selectedDate ? "bg-white" : "bg-indigo-400"
                      }`}
                      aria-hidden="true"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white shadow-sm">
            <div className="flex items-center justify-between border-b border-indigo-100/60 p-4">
              <h4 className="flex items-center gap-2 text-sm font-black text-indigo-900">
                <Sparkles className="h-4 w-4 text-indigo-500" aria-hidden="true" />
                Insight Scheduler
              </h4>
              <span className="h-2 w-2 rounded-full bg-indigo-500" aria-hidden="true" />
            </div>
            <div className="space-y-3 p-4">
              {recommendations.map((item) => {
                const toneClass = {
                  indigo: "border-indigo-100 text-indigo-700 bg-white",
                  amber: "border-amber-100 text-amber-700 bg-white",
                  emerald: "border-emerald-100 text-emerald-700 bg-white",
                  rose: "border-rose-100 text-rose-700 bg-white",
                }[item.tone];
                return (
                  <article key={item.title} className={`rounded-lg border p-3 shadow-sm ${toneClass}`}>
                    <p className="text-xs font-black text-gray-900">{item.title}</p>
                    <p className="mt-1 text-[11px] font-medium leading-relaxed text-gray-500">{item.body}</p>
                  </article>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleCreateSchedule} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-black text-gray-900">Tambah Jam Praktik</h4>
                <p className="text-xs text-gray-400">Tersimpan ke tabel jadwal_dokter.</p>
              </div>
              <Plus className="h-5 w-5 text-indigo-500" aria-hidden="true" />
            </div>
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-gray-400">Hari</span>
                <select
                  value={form.hari}
                  onChange={(event) => setForm((current) => ({ ...current, hari: Number(event.target.value) }))}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-semibold text-gray-700 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                >
                  {DAYS.map((day, index) => (
                    <option key={day} value={index}>
                      {day}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-gray-400">Mulai</span>
                  <input
                    type="time"
                    value={form.jamMulai}
                    onChange={(event) => setForm((current) => ({ ...current, jamMulai: event.target.value }))}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-semibold text-gray-700 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-gray-400">Selesai</span>
                  <input
                    type="time"
                    value={form.jamSelesai}
                    onChange={(event) => setForm((current) => ({ ...current, jamSelesai: event.target.value }))}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-semibold text-gray-700 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                  />
                </label>
              </div>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-gray-400">Kuota</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={form.kuota}
                  onChange={(event) => setForm((current) => ({ ...current, kuota: Number(event.target.value) }))}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-semibold text-gray-700 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                />
              </label>
            </div>
            {scheduleError && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                {scheduleError}
              </div>
            )}
            {scheduleSuccess && (
              <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                {scheduleSuccess}
              </div>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-wait disabled:bg-gray-300"
            >
              {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
              Simpan Jam Praktik
            </button>
          </form>
        </aside>

        <section className="flex min-h-[620px] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-100 bg-gray-50/60 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-black text-gray-900">Jadwal {DAYS[selectedDay]}</h2>
              <p className="text-sm text-gray-500">{formatTanggalIndo(selectedDate)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
              />
              <span className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-black text-indigo-700">
                {utilization}% Utilisasi
              </span>
            </div>
          </div>

          <div className="border-b border-gray-100 px-5 py-4">
            <p className="mb-3 text-xs font-black uppercase tracking-wider text-gray-400">Jam praktik rutin</p>
            {scheduleLoading ? (
              <div className="h-10 w-full animate-pulse rounded-lg bg-gray-100" />
            ) : daySchedules.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {daySchedules.map((schedule) => (
                  <span
                    key={schedule.id}
                    className="inline-flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-black text-indigo-700"
                  >
                    <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                    {normalizeTime(schedule.jam_mulai)} - {normalizeTime(schedule.jam_selesai)}
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-indigo-500">
                      {schedule.kuota} kuota
                    </span>
                  </span>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                Belum ada jam praktik aktif untuk {DAYS[selectedDay]}.
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: "thin" }}>
            {dashboardData?.errorMsg && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {dashboardData.errorMsg}
              </div>
            )}
            {dashboardData?.loading ? (
              <div className="space-y-4">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="h-24 animate-pulse rounded-xl bg-gray-100" />
                ))}
              </div>
            ) : selectedAllAppointments.length === 0 ? (
              <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                <div>
                  <CalendarDays className="mx-auto mb-3 h-9 w-9 text-gray-300" aria-hidden="true" />
                  <p className="text-sm font-black text-gray-700">Belum ada appointment pada tanggal ini.</p>
                  <p className="mt-1 text-xs text-gray-400">Jadwal akan terisi otomatis dari booking pasien yang masuk.</p>
                </div>
              </div>
            ) : (
              <div className="relative space-y-5">
                <div className="absolute bottom-0 left-[4.8rem] top-0 hidden w-0.5 bg-gray-100 sm:block" aria-hidden="true" />
                {selectedAllAppointments.map((appointment) => {
                  const name = patientName(appointment);
                  const duration = estimatedDurationMinutes(appointment);
                  const isActive = ACTIVE_STATUSES.has(appointment.status);
                  const isEmergency = appointment.jenis === "darurat";
                  return (
                    <article key={appointment.id} className="relative flex flex-col gap-4 sm:flex-row">
                      <div className="hidden w-16 flex-shrink-0 pr-4 pt-1 text-right text-sm font-black text-gray-500 sm:block">
                        {normalizeTime(appointment.jam)}
                      </div>
                      <div
                        className={`absolute left-[4.45rem] top-2 z-10 hidden h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm sm:block ${
                          isEmergency ? "bg-rose-500" : isActive ? "bg-indigo-500" : "bg-gray-300"
                        }`}
                        aria-hidden="true"
                      />
                      <div
                        className={`flex-1 rounded-xl border p-4 transition-shadow hover:shadow-md ${
                          isActive
                            ? "border-indigo-100 bg-white"
                            : "border-gray-200 bg-gray-50 opacity-80"
                        }`}
                      >
                        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded px-2 py-0.5 text-[10px] font-black ${
                                  isEmergency
                                    ? "bg-rose-50 text-rose-700"
                                    : isActive
                                      ? "bg-indigo-50 text-indigo-700"
                                      : "bg-gray-200 text-gray-600"
                                }`}
                              >
                                {formatStatusLabel(appointment.status)}
                              </span>
                              <span className="text-xs font-bold text-gray-500">{appointmentTitle(appointment)}</span>
                            </div>
                            <h4 className="truncate text-base font-black text-gray-900">{name}</h4>
                            <p className="mt-1 text-xs leading-relaxed text-gray-500">
                              {appointment.keluhan?.trim() || "Pasien belum menambahkan keluhan."}
                            </p>
                          </div>
                          <p className="flex-shrink-0 text-xs font-black text-gray-400">
                            {formatJamRange(appointment.jam, duration)}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
                          <span className="inline-flex items-center gap-1.5 rounded bg-gray-50 px-2 py-1 text-[10px] font-bold text-gray-500">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[9px] text-indigo-700">
                              {initials(name)}
                            </span>
                            Pasien
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">
                            <Clock3 className="h-3 w-3" aria-hidden="true" />
                            Estimasi {duration} menit
                          </span>
                          {isEmergency && (
                            <span className="inline-flex items-center gap-1.5 rounded bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700">
                              <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                              Prioritas darurat
                            </span>
                          )}
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
    </section>
  );
}
