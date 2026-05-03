"use client";

import { QRCodeSVG } from "qrcode.react";
import { useMemo, useState, type CSSProperties, type MouseEvent } from "react";

import type { DoctorDesignPageId } from "./doctorDesignRouting";
import type { DokterDashboardData } from "@/lib/hooks/useDokterDashboard";
import {
  appointmentTitle,
  shortAppointmentId,
} from "@/lib/appointment-display";
import { formatJamRange, formatStatusLabel, formatTanggalIndo } from "@/lib/format";
import type { Appointment, AppointmentStatus } from "@/lib/types";
import type { QueueRegistration } from "@/lib/queue-registration";

const REGISTRATION_FORM_PATH = "/pendaftaran";
const REGISTRATION_QR_URL = `${(
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
).replace(/\/$/, "")}${REGISTRATION_FORM_PATH}`;

interface DoctorDashboardMarkupProps {
  activePage: DoctorDesignPageId;
  mainContentStyle: CSSProperties;
  pageInfo: {
    title: string;
    subtitle: string;
  };
  todayLabel: string;
  onDashboardClick: (event: MouseEvent<HTMLElement>) => void;
  /**
   * Data dashboard (stats + upcoming hari ini). Optional supaya komponen
   * tetap kompatibel mundur dengan caller lama yang belum pass data.
   */
  dashboardData?: DokterDashboardData;
  queueRegistrations?: QueueRegistration[];
}

// ── Helpers presentational khusus dashboard dokter ──────────────────────

function queueInitials(registration: QueueRegistration): string {
  return (
    registration.nama
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "PB"
  );
}

function formatQueueTime(value?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function pasienInitials(appt: Appointment): string {
  const name = appt.pasien?.profile.full_name?.trim();
  if (!name) return "??";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "??";
}

function pasienFullName(appt: Appointment): string {
  return appt.pasien?.profile.full_name ?? "Pasien";
}

function formatJamShort(hhmmss: string): string {
  // 09:30:00 → 09:30
  return hhmmss.slice(0, 5);
}

function jenisLabel(appt: Appointment): string {
  return appointmentTitle(appt);
}

function statusBadge(appt: Appointment): { label: string; className: string } {
  switch (appt.status) {
    case "menunggu":
      return {
        label: "Menunggu",
        className: "text-amber-600 bg-amber-50",
      };
    case "sedang_ditangani":
      return {
        label: "Berlangsung",
        className: "text-primary-700 bg-primary-50",
      };
    case "selesai":
      return {
        label: "Selesai",
        className: "text-emerald-600 bg-emerald-50",
      };
    case "dibatalkan":
      return {
        label: "Dibatalkan",
        className: "text-gray-500 bg-gray-100",
      };
    case "tidak_hadir":
      return {
        label: "Tidak Hadir",
        className: "text-gray-500 bg-gray-100",
      };
    case "terjadwal":
    default:
      return appt.jenis === "darurat"
        ? { label: "Emergency", className: "text-red-600 bg-red-50" }
        : { label: "Confirmed", className: "text-emerald-600 bg-emerald-50" };
  }
}

const AVATAR_PALETTE = [
  "bg-primary-100 text-primary-700",
  "bg-primary-50 text-primary-700",
  "bg-rose-100 text-rose-600",
  "bg-primary-200 text-primary-800",
  "bg-amber-100 text-amber-700",
];

function avatarClassFor(index: number): string {
  return AVATAR_PALETTE[index % AVATAR_PALETTE.length] ?? AVATAR_PALETTE[0]!;
}

const ACTIVE_APPOINTMENT_STATUSES = new Set<AppointmentStatus>([
  "terjadwal",
  "menunggu",
  "sedang_ditangani",
]);
const EMPTY_APPOINTMENTS: Appointment[] = [];
const SHOW_LEGACY_APPOINTMENT_MOCKUP = false;

type DoctorAppointmentFilter = "aktif" | "selesai" | "dibatalkan";

function todayIsoLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isAppointmentInFilter(
  appt: Appointment,
  filter: DoctorAppointmentFilter,
): boolean {
  if (filter === "aktif") return ACTIVE_APPOINTMENT_STATUSES.has(appt.status);
  if (filter === "selesai") return appt.status === "selesai";
  return appt.status === "dibatalkan" || appt.status === "tidak_hadir";
}

function sortAppointmentsForDoctor(a: Appointment, b: Appointment): number {
  const today = todayIsoLocal();
  const aUpcoming = a.tanggal >= today && ACTIVE_APPOINTMENT_STATUSES.has(a.status);
  const bUpcoming = b.tanggal >= today && ACTIVE_APPOINTMENT_STATUSES.has(b.status);
  if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
  if (a.tanggal !== b.tanggal) {
    return aUpcoming
      ? a.tanggal.localeCompare(b.tanggal)
      : b.tanggal.localeCompare(a.tanggal);
  }
  return a.jam.localeCompare(b.jam);
}

function AppointmentManagementPage({
  dashboardData,
}: {
  dashboardData?: DokterDashboardData;
}) {
  const appointments = dashboardData?.appointments ?? EMPTY_APPOINTMENTS;
  const loading = dashboardData?.loading ?? false;
  const errorMsg = dashboardData?.errorMsg ?? null;
  const refetch = dashboardData?.refetch;
  const [filter, setFilter] = useState<DoctorAppointmentFilter>("aktif");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredAppointments = useMemo(() => {
    const q = query.trim().toLowerCase();
    return appointments
      .filter((appt) => isAppointmentInFilter(appt, filter))
      .filter((appt) => {
        if (!q) return true;
        return [
          pasienFullName(appt),
          appointmentTitle(appt),
          appt.keluhan ?? "",
          appt.id,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .sort(sortAppointmentsForDoctor);
  }, [appointments, filter, query]);

  const selectedAppointment =
    filteredAppointments.find((appt) => appt.id === selectedId) ??
    filteredAppointments[0] ??
    null;

  const filterCounts = useMemo(() => {
    return {
      aktif: appointments.filter((appt) => isAppointmentInFilter(appt, "aktif")).length,
      selesai: appointments.filter((appt) => isAppointmentInFilter(appt, "selesai")).length,
      dibatalkan: appointments.filter((appt) => isAppointmentInFilter(appt, "dibatalkan")).length,
    };
  }, [appointments]);

  const filters: Array<{ key: DoctorAppointmentFilter; label: string; count: number }> = [
    { key: "aktif", label: "Aktif", count: filterCounts.aktif },
    { key: "selesai", label: "Selesai", count: filterCounts.selesai },
    { key: "dibatalkan", label: "Batal", count: filterCounts.dibatalkan },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full" data-testid="doctor-appointment-page">
      <div className="w-full lg:w-1/3 xl:w-1/4 flex flex-col gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Appointment Dokter</h3>
            <div className="flex items-center gap-2">
              <span className="bg-primary-50 text-primary-700 text-xs font-medium px-2 py-1 rounded-md">
                {filterCounts.aktif} Aktif
              </span>
              <button
                type="button"
                onClick={() => refetch?.()}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-wait disabled:opacity-60"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 12a9 9 0 0 1-9 9 9.8 9.8 0 0 1-6.74-2.74L3 16" />
                  <path d="M3 21v-5h5" />
                  <path d="M3 12a9 9 0 0 1 9-9 9.8 9.8 0 0 1 6.74 2.74L21 8" />
                  <path d="M16 8h5V3" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2">
              <path d="m21 21-4.34-4.34" />
              <circle cx={11} cy={11} r={8} />
            </svg>
            <input
              type="search"
              placeholder="Cari nama pasien..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
            />
          </div>
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {filters.map((item) => {
              const active = filter === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={[
                    "flex-shrink-0 text-[11px] font-medium px-3 py-1.5 rounded-full border transition-colors",
                    active
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/30"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100",
                  ].join(" ")}
                >
                  {item.label} <span className="font-bold">{item.count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden lg:h-[calc(100vh-250px)] min-h-[300px]" data-testid="doctor-appointment-list">
          <div className="flex-1 overflow-y-auto p-2 space-y-1" style={{ scrollbarWidth: "thin" }}>
            {errorMsg ? (
              <div className="m-2 rounded-lg border border-red-100 bg-red-50 px-3 py-3 text-sm font-medium text-red-700">
                {errorMsg}
              </div>
            ) : loading && appointments.length === 0 ? (
              [0, 1, 2, 3].map((item) => (
                <div key={item} className="p-3 flex items-start gap-3" aria-busy="true">
                  <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3 w-28 bg-gray-100 rounded animate-pulse" />
                    <div className="h-2 w-20 bg-gray-50 rounded animate-pulse" />
                  </div>
                </div>
              ))
            ) : filteredAppointments.length === 0 ? (
              <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center px-6">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M8 2v4" />
                    <path d="M16 2v4" />
                    <rect width="18" height="18" x="3" y="4" rx="2" />
                    <path d="M3 10h18" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-700">Belum ada appointment</p>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Janji dari pasien akan muncul di sini setelah memilih dokter ini.
                </p>
              </div>
            ) : (
              filteredAppointments.map((appt, idx) => {
                const active = selectedAppointment?.id === appt.id;
                const badge = statusBadge(appt);
                return (
                  <button
                    key={appt.id}
                    data-appointment-id={appt.id}
                    type="button"
                    onClick={() => setSelectedId(appt.id)}
                    className={[
                      "w-full text-left p-3 rounded-lg transition-all flex items-start gap-3 border",
                      active
                        ? "bg-primary-50 ring-1 ring-primary-200/50 shadow-sm border-primary-100"
                        : "hover:bg-gray-50 border-transparent",
                    ].join(" ")}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-white ${avatarClassFor(idx)}`}>
                      <span className="text-sm font-bold">{pasienInitials(appt)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {pasienFullName(appt)}
                        </p>
                        <p className="text-[10px] font-medium text-emerald-600">
                          {formatJamShort(appt.jam)}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {appointmentTitle(appt)}
                      </p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded border ${badge.className}`}>
                          {badge.label}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-2/3 xl:w-3/4">
        {selectedAppointment ? (
          <AppointmentDetailPanel appointment={selectedAppointment} />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-full min-h-[480px] flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-700 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M8 2v4" />
                <path d="M16 2v4" />
                <rect width="18" height="18" x="3" y="4" rx="2" />
                <path d="M3 10h18" />
                <path d="m9 16 2 2 4-4" />
              </svg>
            </div>
            <p className="text-base font-bold text-gray-800">Tidak ada janji yang dipilih</p>
            <p className="text-sm text-gray-400 mt-1">Pilih appointment dari daftar untuk melihat detail pasien.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AppointmentDetailPanel({ appointment }: { appointment: Appointment }) {
  const badge = statusBadge(appointment);
  const keluhan = appointment.keluhan?.trim() || "Pasien belum menambahkan catatan keluhan.";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col relative pb-6 h-full overflow-hidden">
      <div className="h-28 bg-gradient-to-r from-blue-600 to-blue-400 relative flex-shrink-0">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "16px 16px" }} />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/10 to-transparent" />
      </div>
      <div className="px-6 pb-8 pt-0 flex-1 flex flex-col">
        <div className="flex flex-col md:flex-row gap-5 items-start relative -top-10 mb-[-1.5rem]">
          <div className="w-24 h-24 rounded-2xl bg-white p-1.5 shadow-md flex-shrink-0">
            <div className="w-full h-full rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center border border-blue-50/50">
              <span className="text-3xl font-bold text-blue-800">{pasienInitials(appointment)}</span>
            </div>
          </div>
          <div className="flex-1 pt-12 md:pt-14 w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                  {pasienFullName(appointment)}
                </h2>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border flex items-center gap-1.5 h-fit ${badge.className}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {badge.label}
                </span>
              </div>
              <p className="text-sm text-gray-500 font-medium">
                ID Appointment: <span className="text-gray-700">{shortAppointmentId(appointment.id)}</span>
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button data-page-id="edit-info" className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
                Edit Info
              </button>
              <button data-page-id="pemeriksaan" className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-blue-500/30">
                Mulai Pemeriksaan
              </button>
            </div>
          </div>
        </div>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-100 to-transparent my-6" />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="space-y-6">
            <section>
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                Informasi Kunjungan
              </h4>
              <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100 space-y-4">
                <DoctorInfoRow
                  label="Jadwal Pemeriksaan"
                  value={formatTanggalIndo(appointment.tanggal)}
                  caption={formatJamRange(appointment.jam)}
                />
                <div className="h-px w-full bg-gray-100" />
                <DoctorInfoRow
                  label="Jenis Layanan"
                  value={appointmentTitle(appointment)}
                  caption={formatStatusLabel(appointment.status)}
                />
                <div className="h-px w-full bg-gray-100" />
                <DoctorInfoRow
                  label="Lokasi / Ruangan"
                  value="Klinik Gigi"
                  caption="Ruang pelayanan menyesuaikan jadwal klinik"
                />
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section>
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                Keluhan Pasien
              </h4>
              <div className="bg-white text-gray-700 text-sm leading-relaxed border border-gray-200 rounded-xl p-4 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
                <p className="italic text-gray-600">&quot;{keluhan}&quot;</p>
              </div>
            </section>

            <section>
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Rencana Tindakan
              </h4>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-50 text-gray-700 text-xs font-semibold border border-gray-200">
                  {appointmentTitle(appointment)}
                </span>
                {appointment.jenis === "darurat" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-xs font-semibold border border-red-100">
                    Prioritas Darurat
                  </span>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function DoctorInfoRow({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-white shadow-sm border border-gray-100 flex items-center justify-center flex-shrink-0 text-primary-600">
        <svg xmlns="http://www.w3.org/2000/svg" width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-gray-800">{value}</p>
        <p className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded mt-1 inline-block">
          {caption}
        </p>
      </div>
    </div>
  );
}

export default function DoctorDashboardMarkup({
  activePage,
  mainContentStyle,
  pageInfo,
  todayLabel,
  onDashboardClick,
  dashboardData,
  queueRegistrations = [],
}: DoctorDashboardMarkupProps) {
  const pageClass = (pageId: string, extra = "") => [
    "page-content",
    activePage === pageId ? "block" : "hidden",
    extra.trim(),
  ].filter(Boolean).join(" ");

  const stats = dashboardData?.stats;
  const upcomingAppointments = dashboardData?.upcomingAppointments ?? [];
  const loadingDashboard = dashboardData?.loading ?? false;
  const errorDashboard = dashboardData?.errorMsg ?? null;
  const activeQueueRegistration =
    queueRegistrations.find((registration) => registration.status === "dipanggil") ?? null;
  const waitingQueueRegistrations = queueRegistrations.filter(
    (registration) => registration.status === "menunggu",
  );
  const nextQueueRegistration = waitingQueueRegistrations[0] ?? null;
  const completedQueueCount = queueRegistrations.filter(
    (registration) => registration.status === "selesai",
  ).length;
  const waitingQueueCount = waitingQueueRegistrations.length;
  const activeQueueTime = formatQueueTime(
    activeQueueRegistration?.calledAt ?? activeQueueRegistration?.createdAt,
  );

  // Helper untuk render angka stat: '—' kalau loading & belum punya data,
  // angka aktual kalau sudah ada.
  const fmtStat = (n: number | undefined): string => {
    if (loadingDashboard && stats === undefined) return "—";
    return String(n ?? 0);
  };

  return (
    <>
      {/* ==================== MAIN CONTENT ==================== */}
    <main id="main-content" className="min-h-screen" style={mainContentStyle} onClick={onDashboardClick}>
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-200/60 h-16 flex items-center px-6">
        {/* Mobile Menu Button */}
        <button id="mobile-menu-btn" className="lg:hidden mr-4 p-2 rounded-lg hover:bg-primary-50 text-gray-600 transition-colors" data-action="toggle-sidebar">
          <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="menu" aria-hidden="true" className="lucide lucide-menu w-5 h-5"><path d="M4 5h16" /><path d="M4 12h16" /><path d="M4 19h16" /></svg>
        </button>
        <div className="flex-1">
          <h2 id="page-title" className="text-lg font-semibold text-gray-800">{pageInfo.title}</h2>
          <p id="page-subtitle" className="text-xs text-gray-400">{pageInfo.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Global Search */}
          <div className="relative hidden md:block group z-50">
            <div className="flex items-center bg-white/70 border border-primary-100/70 rounded-lg px-3 py-2 w-64 focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:bg-white transition-all shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="search" aria-hidden="true" className="lucide lucide-search w-4 h-4 text-gray-400 mr-2"><path d="m21 21-4.34-4.34" /><circle cx={11} cy={11} r={8} /></svg>
              <input
                type="text"
                placeholder="Cari pasien — segera tersedia"
                disabled
                aria-disabled="true"
                title="Pencarian rekam medis akan aktif setelah modul EHR diimplementasikan."
                className="bg-transparent text-sm text-gray-500 outline-none w-full placeholder:text-gray-300 cursor-not-allowed"
              />
            </div>
          </div>
          {/* Notification Bell */}
          <button data-page-id="notifikasi" className="relative p-2.5 rounded-lg bg-gray-50 hover:bg-rose-50 text-gray-500 hover:text-rose-600 border border-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500/30 tooltip" title="Notifikasi Sistem">
            <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="bell" aria-hidden="true" className="lucide lucide-bell w-5 h-5"><path d="M10.268 21a2 2 0 0 0 3.464 0" /><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" /></svg>
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
          </button>
          {/* Simple Date Display */}
          <div className="hidden sm:flex items-center gap-2.5 text-sm text-gray-800 font-bold tracking-wide">
            <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="calendar-days" aria-hidden="true" className="lucide lucide-calendar-days w-4 h-4 text-emerald-500"><path d="M8 2v4" /><path d="M16 2v4" /><rect width={18} height={18} x={3} y={4} rx={2} /><path d="M3 10h18" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" /><path d="M16 18h.01" /></svg>
            <span id="today-date">{todayLabel}</span>
          </div>
        </div>
      </header>
      {/* Page Content Area */}
      <div className="p-6" id="content-area">
        {/* Dashboard Content (default) */}
        <div id="page-dashboard" className={pageClass("dashboard", "")}>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Card 1 */}
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="calendar-check" aria-hidden="true" className="lucide lucide-calendar-check w-5 h-5 text-primary-600"><path d="M8 2v4" /><path d="M16 2v4" /><rect width={18} height={18} x={3} y={4} rx={2} /><path d="M3 10h18" /><path d="m9 16 2 2 4-4" /></svg>
                </div>
                <span className="text-xs text-emerald-500 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">+8%</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{fmtStat(stats?.todayCount)}</p>
              <p className="text-xs text-gray-400 mt-1">Appointment Hari Ini</p>
            </div>
            {/* Card 2 */}
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="users" aria-hidden="true" className="lucide lucide-users w-5 h-5 text-primary-600"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><path d="M16 3.128a4 4 0 0 1 0 7.744" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><circle cx={9} cy={7} r={4} /></svg>
                </div>
                <span className="text-xs text-primary-700 font-medium bg-primary-50 px-2 py-0.5 rounded-full">Real-time</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{fmtStat(stats?.activeAppointmentCount)}</p>
              <p className="text-xs text-gray-400 mt-1">Appointment Aktif</p>
            </div>
            {/* Card 3 */}
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="check-circle" aria-hidden="true" className="lucide lucide-check-circle w-5 h-5 text-primary-700"><path d="M21.801 10A10 10 0 1 1 17 3.335" /><path d="m9 11 3 3L22 4" /></svg>
                </div>
                <span className="text-xs text-primary-700 font-medium bg-primary-50 px-2 py-0.5 rounded-full">92%</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{fmtStat(stats?.weekPatientCount)}</p>
              <p className="text-xs text-gray-400 mt-1">Pasien Minggu Ini</p>
            </div>
          </div>
          {/* Two Column Layout */}
          <div className="grid grid-cols-1 gap-6">
            {/* Upcoming Appointments */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 text-sm">Appointment Berikutnya</h3>
                <a href="#appointment" className="text-xs text-primary-600 hover:text-primary-700 font-medium" data-page-id="appointment">Lihat Semua →</a>
              </div>
              <div className="divide-y divide-gray-50">
                {errorDashboard ? (
                  <div className="px-5 py-6 text-sm text-red-600 bg-red-50/40">
                    ⚠ {errorDashboard}
                  </div>
                ) : loadingDashboard && upcomingAppointments.length === 0 ? (
                  <>
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="flex items-center px-5 py-3.5"
                        aria-busy="true"
                      >
                        <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
                        <div className="ml-3 flex-1 min-w-0 space-y-2">
                          <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
                          <div className="h-2 w-24 bg-gray-50 rounded animate-pulse" />
                        </div>
                        <div className="text-right ml-4 space-y-2">
                          <div className="h-3 w-10 bg-gray-100 rounded animate-pulse ml-auto" />
                          <div className="h-3 w-14 bg-gray-50 rounded animate-pulse ml-auto" />
                        </div>
                      </div>
                    ))}
                  </>
                ) : upcomingAppointments.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <p className="text-sm text-gray-500 font-medium mb-1">
                      Belum ada appointment aktif
                    </p>
                    <p className="text-xs text-gray-400">
                      Janji pasien yang memilih akun dokter ini akan muncul otomatis.
                    </p>
                  </div>
                ) : (
                  upcomingAppointments.map((appt, idx) => {
                    const badge = statusBadge(appt);
                    return (
                      <div
                        key={appt.id}
                        className="flex items-center px-5 py-3.5 hover:bg-gray-50/50 transition-colors"
                      >
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${avatarClassFor(idx)}`}
                        >
                          <span className="text-xs font-bold">
                            {pasienInitials(appt)}
                          </span>
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {pasienFullName(appt)}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {jenisLabel(appt)}
                            {appt.jenis === "darurat" && (
                              <>
                                {" — "}
                                <span className="text-red-500 font-medium">
                                  Darurat
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm font-medium text-gray-700">
                            {formatJamShort(appt.jam)}
                          </p>
                          <p className="text-[10px] text-gray-400 mb-1">
                            {formatTanggalIndo(appt.tanggal)}
                          </p>
                          <span
                            className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Other Pages (hidden by default) */}
        <div id="page-appointment" className={pageClass("appointment", " h-full")}>
          <AppointmentManagementPage dashboardData={dashboardData} />
          {SHOW_LEGACY_APPOINTMENT_MOCKUP && (
          <div className="flex flex-col lg:flex-row gap-6 h-full">
            {/* Bagian Kiri: List Appointment (Side Panel) */}
            <div className="w-full lg:w-1/3 xl:w-1/4 flex flex-col gap-4">
              {/* Header List */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">Antrian Hari Ini</h3>
                  <span className="bg-primary-50 text-primary-700 text-xs font-medium px-2 py-1 rounded-md">8 Pasien</span>
                </div>
                <div className="relative">
                  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="search" aria-hidden="true" className="lucide lucide-search w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"><path d="m21 21-4.34-4.34" /><circle cx={11} cy={11} r={8} /></svg>
                  <input type="text" placeholder="Cari nama pasien..." className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all" />
                </div>
                {/* Filter Chips */}
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1" style={{scrollbarWidth: 'none'}}>
                  <button className="flex-shrink-0 text-[11px] font-medium px-3 py-1.5 rounded-full bg-blue-600 text-white shadow-sm shadow-blue-600/30">Semua</button>
                  <button className="flex-shrink-0 text-[11px] font-medium px-3 py-1.5 rounded-full bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors">Menunggu</button>
                  <button className="flex-shrink-0 text-[11px] font-medium px-3 py-1.5 rounded-full bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors">Selesai</button>
                </div>
              </div>
              {/* List Pasien */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden lg:h-[calc(100vh-250px)] min-h-[300px]">
                <div className="flex-1 overflow-y-auto p-2 space-y-1" style={{scrollbarWidth: 'thin'}}>
                  {/* Active Item */}
                  <button className="w-full text-left p-3 rounded-lg bg-primary-50 ring-1 ring-primary-200/50 shadow-sm transition-all flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-200 flex items-center justify-center flex-shrink-0 ring-2 ring-white">
                      <span className="text-primary-800 text-sm font-bold">AS</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <p className="text-sm font-semibold text-gray-900 truncate">Ahmad Surya</p>
                        <p className="text-[10px] font-medium text-emerald-600">09:00</p>
                      </div>
                      <p className="text-xs text-gray-500 truncate">Pembersihan Karang...</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <span className="text-[9px] font-medium px-1.5 py-0.5 bg-white text-gray-600 rounded border border-gray-200 shadow-sm">Menunggu</span>
                      </div>
                    </div>
                  </button>
                  {/* Inactive Item */}
                  <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-all flex items-start gap-3 border border-transparent">
                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-rose-700 text-sm font-bold">DN</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <p className="text-sm font-medium text-gray-800 truncate">Dewi Nurhaliza</p>
                        <p className="text-[10px] text-gray-500">09:30</p>
                      </div>
                      <p className="text-xs text-gray-400 truncate">Cabut Gigi</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-red-50 text-red-600 rounded border border-red-100">Darurat</span>
                      </div>
                    </div>
                  </button>
                  {/* Inactive Item */}
                  <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-all flex items-start gap-3 border border-transparent">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-emerald-700 text-sm font-bold">BP</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <p className="text-sm font-medium text-gray-800 truncate">Bambang Pamungkas</p>
                        <p className="text-[10px] text-gray-500">10:15</p>
                      </div>
                      <p className="text-xs text-gray-400 truncate">Senyum Estetik (Veneer)</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <span className="text-[9px] font-medium px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded border border-gray-200">Belum
                          Hadir</span>
                      </div>
                    </div>
                  </button>
                  {/* Inactive Item */}
                  <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-all flex items-start gap-3 border border-transparent">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-700 text-sm font-bold">LK</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <p className="text-sm font-medium text-gray-800 truncate">Lina Kusuma</p>
                        <p className="text-[10px] text-gray-500">11:00</p>
                      </div>
                      <p className="text-xs text-gray-400 truncate">Tambal Gigi Anak</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <span className="text-[9px] font-medium px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded border border-gray-200">Belum
                          Hadir</span>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
            {/* Bagian Kanan: Halaman Detail Appointment */}
            <div className="w-full lg:w-2/3 xl:w-3/4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col relative pb-6 h-full">
                {/* Cover Header */}
                <div className="h-28 bg-gradient-to-r from-blue-600 to-blue-400 relative flex-shrink-0">
                  <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px'}}>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/10 to-transparent" />
                </div>
                {/* Profile Box Absolute Overlap */}
                <div className="px-6 pb-8 pt-0 flex-1 flex flex-col">
                  <div className="flex flex-col md:flex-row gap-5 items-start relative -top-10 mb-[-1.5rem]">
                    {/* Avatar */}
                    <div className="w-24 h-24 rounded-2xl bg-white p-1.5 shadow-md flex-shrink-0">
                      <div className="w-full h-full rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center border border-blue-50/50">
                        <span className="text-3xl font-bold text-blue-800">AS</span>
                      </div>
                    </div>
                    {/* Name & Basic Info */}
                    <div className="flex-1 pt-12 md:pt-14 w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Ahmad Surya</h2>
                          <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md border border-emerald-100 flex items-center gap-1.5 h-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Menunggu
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="file-digit" aria-hidden="true" className="lucide lucide-file-digit w-3.5 h-3.5"><path d="M4 12V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2" /><path d="M14 2v5a1 1 0 0 0 1 1h5" /><path d="M10 16h2v6" /><path d="M10 22h4" /><rect x={2} y={16} width={4} height={6} rx={2} /></svg>
                          Rekam Medis: <span className="text-gray-700">#RM-2023-0891</span>
                        </p>
                      </div>
                      {/* Action Buttons */}
                      <div className="flex gap-2 flex-shrink-0">
                        <button data-page-id="edit-info" className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="edit-3" aria-hidden="true" className="lucide lucide-edit-3 w-4 h-4"><path d="M13 21h8" /><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /></svg>
                          Edit Info
                        </button>
                        <button data-page-id="pemeriksaan" className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-blue-500/30">
                          <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="stethoscope" aria-hidden="true" className="lucide lucide-stethoscope w-4 h-4 text-white/90"><path d="M11 2v2" /><path d="M5 2v2" /><path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1" /><path d="M8 15a6 6 0 0 0 12 0v-3" /><circle cx={20} cy={10} r={2} /></svg>
                          Mulai Pemeriksaan
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Divider */}
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-100 to-transparent my-6" />
                  {/* Content Grid (Detail Information) */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* Kolom Kiri: Informasi Kunjungan & Pasien */}
                    <div className="space-y-6">
                      {/* Detail Waktu & Tempat */}
                      <div>
                        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="info" aria-hidden="true" className="lucide lucide-info w-3.5 h-3.5"><circle cx={12} cy={12} r={10} /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg> Informasi Kunjungan
                        </h4>
                        <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100 space-y-4">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-white shadow-sm border border-gray-100 flex items-center justify-center flex-shrink-0 text-primary-600">
                              <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="calendar" aria-hidden="true" className="lucide lucide-calendar w-4 h-4"><path d="M8 2v4" /><path d="M16 2v4" /><rect width={18} height={18} x={3} y={4} rx={2} /><path d="M3 10h18" /></svg>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-0.5">Jadwal Pemeriksaan</p>
                              <p className="text-sm font-semibold text-gray-800">Senin, 12 Agustus 2026</p>
                              <p className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded mt-1 inline-block">
                                09:00 - 09:45 WIB</p>
                            </div>
                          </div>
                          <div className="h-px w-full bg-gray-100" />
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-white shadow-sm border border-gray-100 flex items-center justify-center flex-shrink-0 text-primary-600">
                              <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="door-open" aria-hidden="true" className="lucide lucide-door-open w-4 h-4"><path d="M11 20H2" /><path d="M11 4.562v16.157a1 1 0 0 0 1.242.97L19 20V5.562a2 2 0 0 0-1.515-1.94l-4-1A2 2 0 0 0 11 4.561z" /><path d="M11 4H8a2 2 0 0 0-2 2v14" /><path d="M14 12h.01" /><path d="M22 20h-3" /></svg>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-0.5">Lokasi / Ruangan</p>
                              <p className="text-sm font-semibold text-gray-800">Poli Gigi Umum 1</p>
                              <p className="text-xs text-gray-500 mt-1">Lantai 2, Klinik Pusat</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Biodata Singkat */}
                      <div>
                        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="user" aria-hidden="true" className="lucide lucide-user w-3.5 h-3.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx={12} cy={7} r={4} /></svg> Data Pasien
                        </h4>
                        <div className="grid grid-cols-2 gap-y-5 gap-x-4 bg-white rounded-xl p-4 border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
                          <div>
                            <p className="text-[10px] text-gray-500 mb-1 uppercase font-semibold">Usia / Gender</p>
                            <p className="text-sm font-semibold text-gray-800">32 Tahun, Laki-laki</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 mb-1 uppercase font-semibold">Gol. Darah</p>
                            <p className="text-sm font-bold text-red-500 flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="droplet" aria-hidden="true" className="lucide lucide-droplet w-3.5 h-3.5 fill-red-100"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" /></svg> O+
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 mb-1 uppercase font-semibold">No. Telepon / WA</p>
                            <p className="text-sm font-semibold text-gray-800">0812-3456-7890</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 mb-1 uppercase font-semibold">Tipe Pembayaran</p>
                            <p className="text-[13px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded inline-flex items-center gap-1.5">
                              <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="shield-check" aria-hidden="true" className="lucide lucide-shield-check w-3.5 h-3.5"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg> Asuransi Swasta
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Kolom Kanan: Keluhan & Riwayat */}
                    <div className="space-y-6">
                      {/* Alert Peringatan Medis */}
                      <div className="bg-rose-50 border-l-4 border-l-rose-500 border-t border-r border-b border-rose-100 rounded-r-xl p-3 flex gap-3 shadow-sm shadow-rose-100/50">
                        <div className="mt-0.5 text-rose-600">
                          <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="shield-alert" aria-hidden="true" className="lucide lucide-shield-alert w-5 h-5"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-rose-800 uppercase tracking-wide">Peringatan Medis</p>
                          <p className="text-sm text-rose-700 mt-1 font-medium leading-snug">Pasien memiliki rekam alergi
                            terhadap antibiotik Golongan Penicillin (Amoxicillin).</p>
                        </div>
                      </div>
                      {/* Keluhan */}
                      <div>
                        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex justify-between items-center">
                          <span className="flex items-center gap-1.5"><svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="message-square" aria-hidden="true" className="lucide lucide-message-square w-3.5 h-3.5"><path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" /></svg>
                            Keluhan &amp; Anamnesis Awal</span>
                          <button className="text-primary-600 hover:text-primary-700 font-semibold normal-case text-xs flex items-center gap-1">Riwayat
                            <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="arrow-right" aria-hidden="true" className="lucide lucide-arrow-right w-3 h-3"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg></button>
                        </h4>
                        <div className="bg-white text-gray-700 text-sm leading-relaxed border border-gray-200 rounded-xl p-4 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] relative">
                          <div className="absolute -left-2 -top-2 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center border border-white">
                            <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="quote" aria-hidden="true" className="lucide lucide-quote w-3 h-3 text-primary-600 fill-primary-600"><path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z" /><path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z" /></svg>
                          </div>
                          <p className="italic text-gray-600">&quot;Saya ingin melakukan pembersihan karang gigi rutin tahunan.
                            Namun, ada sedikit rasa ngilu di gigi graham kiri bawah jika minum air dingin sejak 2 minggu
                            lalu. Kadang ngilunya menetap sekitar 1 menit.&quot;</p>
                        </div>
                      </div>
                      {/* Layanan Dipesan */}
                      <div>
                        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="stethoscope" aria-hidden="true" className="lucide lucide-stethoscope w-3.5 h-3.5"><path d="M11 2v2" /><path d="M5 2v2" /><path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1" /><path d="M8 15a6 6 0 0 0 12 0v-3" /><circle cx={20} cy={10} r={2} /></svg> Rencana Tindakan
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-50 text-gray-700 text-xs font-semibold border border-gray-200 hover:bg-primary-50 hover:border-primary-200 transition-colors cursor-default">
                            <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="sparkles" aria-hidden="true" className="lucide lucide-sparkles w-3.5 h-3.5 text-primary-500"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" /><path d="M20 2v4" /><path d="M22 4h-4" /><circle cx={4} cy={20} r={2} /></svg>
                            Scaling (Pembersihan Karang)
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-50 text-gray-700 text-xs font-semibold border border-gray-200 hover:bg-primary-50 hover:border-primary-200 transition-colors cursor-default">
                            <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="activity" aria-hidden="true" className="lucide lucide-activity w-3.5 h-3.5 text-blue-500"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" /></svg>
                            Konsultasi Sensitivitas Gigi
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
        {/* PAGE PEMERIKSAAN MEDIS */}
        <div id="page-pemeriksaan" className={pageClass("pemeriksaan", " h-full overflow-y-auto")} style={{scrollbarWidth: 'thin'}}>
          {/* Sticky top bar */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 mb-5 sticky top-0 z-20 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <button type="button" data-page-id="appointment" aria-label="Kembali ke appointment" className="size-9 border border-gray-200 rounded-lg text-gray-500 hover:text-teal-700 hover:bg-teal-50 hover:border-teal-200 transition-colors flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
              </button>
              <div className="h-6 w-px bg-gray-200 flex-shrink-0" />
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-9 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-black text-sm flex-shrink-0">AS</div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black text-gray-900 leading-tight">Ahmad Surya</h3>
                    <span className="font-mono text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">RM-2023-0891</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" width={8} height={8} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                      Alergi Penicillin
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">Poli Gigi Umum · 09:00 WIB · 04 Mei 2026</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                Sedang diperiksa
              </div>
              <button type="button" data-action="finish-session" className="inline-flex items-center gap-2 rounded-lg border border-teal-600 bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-teal-600/25 transition-colors hover:bg-teal-700">
                <svg xmlns="http://www.w3.org/2000/svg" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx={12} cy={12} r={10}/><path d="m9 12 2 2 4-4"/></svg>
                Selesaikan Sesi
              </button>
            </div>
          </div>

          <div className="max-w-6xl mx-auto pb-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* Left sidebar: Patient context */}
              <div className="lg:col-span-1 space-y-4">
                {/* Patient profile */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Konteks Pasien</p>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="size-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-black flex-shrink-0">AS</div>
                    <div>
                      <p className="font-bold text-gray-900">Ahmad Surya</p>
                      <p className="text-xs text-gray-500 mt-0.5">Laki-laki · 32 Tahun · O+</p>
                    </div>
                  </div>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-semibold text-gray-400">Keluhan Awal</span>
                      <span className="text-xs font-semibold text-gray-800 text-right max-w-[55%]">Ngilu gigi kiri bawah</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-semibold text-gray-400">Rencana Awal</span>
                      <span className="text-xs font-semibold text-gray-800 text-right max-w-[55%]">Scaling + eval gigi 36</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-semibold text-gray-400">No. Telepon</span>
                      <span className="text-xs font-semibold text-gray-800">0812-3456-7890</span>
                    </div>
                  </div>
                </div>

                {/* Allergy warning */}
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="text-rose-600 flex-shrink-0" aria-hidden><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                    <p className="text-[10px] font-black text-rose-700 uppercase tracking-wider">Peringatan Alergi</p>
                  </div>
                  <p className="text-sm font-bold text-rose-800">Penicillin / Amoxicillin</p>
                  <p className="text-[10px] text-rose-500 mt-1">Hindari semua antibiotik golongan Beta-lactam untuk pasien ini.</p>
                </div>

                {/* Appointment info */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Info Kunjungan</p>
                  <div className="space-y-2.5">
                    {[
                      { icon: <svg xmlns="http://www.w3.org/2000/svg" width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>, label: "Tanggal", value: "04 Mei 2026" },
                      { icon: <svg xmlns="http://www.w3.org/2000/svg" width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx={12} cy={12} r={10}/><polyline points="12 6 12 12 16 14"/></svg>, label: "Waktu", value: "09:00 – 09:30 WIB" },
                      { icon: <svg xmlns="http://www.w3.org/2000/svg" width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>, label: "Jenis", value: "Pemeriksaan Umum" },
                      { icon: <svg xmlns="http://www.w3.org/2000/svg" width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx={12} cy={7} r={4}/></svg>, label: "Dokter", value: "drg. Rina Pratiwi" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2.5">
                        <span className="text-gray-400 flex-shrink-0">{item.icon}</span>
                        <span className="text-xs text-gray-400 w-16 flex-shrink-0">{item.label}</span>
                        <span className="text-xs font-semibold text-gray-800">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Vital signs quick panel */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Tanda Vital (Opsional)</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: "vital-tekanan", label: "Tek. Darah", placeholder: "120/80", unit: "mmHg" },
                      { id: "vital-nadi", label: "Nadi", placeholder: "80", unit: "bpm" },
                      { id: "vital-suhu", label: "Suhu", placeholder: "36.5", unit: "°C" },
                      { id: "vital-saturasi", label: "SpO₂", placeholder: "98", unit: "%" },
                    ].map((v) => (
                      <div key={v.id}>
                        <label htmlFor={v.id} className="text-[10px] font-bold text-gray-400 block mb-1">{v.label}</label>
                        <div className="relative">
                          <input id={v.id} type="text" placeholder={v.placeholder} className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all font-semibold text-gray-700" />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-gray-300">{v.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Examination form */}
              <div className="lg:col-span-2">
                <form className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Form header */}
                  <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-white flex items-center gap-3">
                    <div className="size-9 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M11 2v2"/><path d="M5 2v2"/><path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1"/><path d="M8 15a6 6 0 0 0 12 0v-3"/><circle cx={20} cy={10} r={2}/></svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">Catatan Pemeriksaan</h4>
                      <p className="text-xs text-gray-400 mt-0.5">Isi informasi klinis untuk rekam medis kunjungan ini</p>
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    {/* Row: keluhan + area gigi */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label htmlFor="pemeriksaan-keluhan" className="block text-xs font-bold text-gray-600 mb-1.5">
                          Keluhan Utama <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          id="pemeriksaan-keluhan"
                          name="keluhan"
                          rows={3}
                          required
                          placeholder="Contoh: Ngilu saat minum dingin pada gigi geraham kiri bawah."
                          defaultValue="Ngilu di gigi geraham kiri bawah saat minum dingin sejak 2 minggu lalu."
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-700 transition-all focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="pemeriksaan-gigi" className="block text-xs font-bold text-gray-600 mb-1.5">
                          Area Gigi
                        </label>
                        <input
                          id="pemeriksaan-gigi"
                          name="areaGigi"
                          type="text"
                          placeholder="Contoh: Gigi 36"
                          defaultValue="Gigi 36"
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm font-semibold text-gray-700 transition-all focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        />
                        <label htmlFor="pemeriksaan-diagnosa" className="block text-xs font-bold text-gray-600 mt-3 mb-1.5">
                          Diagnosis <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="pemeriksaan-diagnosa"
                          name="diagnosa"
                          type="text"
                          required
                          placeholder="Contoh: Karies profunda"
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm font-semibold text-gray-700 transition-all focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        />
                      </div>
                    </div>

                    {/* Separator */}
                    <div className="border-t border-gray-100" />

                    {/* Temuan klinis */}
                    <div>
                      <label htmlFor="pemeriksaan-temuan" className="block text-xs font-bold text-gray-600 mb-1.5">
                        Temuan Klinis <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        id="pemeriksaan-temuan"
                        name="temuan"
                        rows={3}
                        required
                        placeholder="Contoh: Karies pada gigi 36, perkusi negatif, palpasi negatif, gingiva sekitar tenang."
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-700 transition-all focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none"
                      />
                    </div>

                    {/* Tindakan */}
                    <div>
                      <label htmlFor="pemeriksaan-tindakan" className="block text-xs font-bold text-gray-600 mb-1.5">
                        Tindakan &amp; Rencana <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        id="pemeriksaan-tindakan"
                        name="tindakan"
                        rows={3}
                        required
                        placeholder="Contoh: Scaling selesai. Observasi sensitivitas gigi 36, kontrol 2 minggu bila keluhan menetap."
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-700 transition-all focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none"
                      />
                    </div>

                    {/* Resep */}
                    <div>
                      <label htmlFor="pemeriksaan-resep" className="block text-xs font-bold text-gray-600 mb-1.5">
                        Resep / Catatan Tambahan
                        <span className="ml-2 text-[10px] font-normal text-gray-400 normal-case">(Opsional)</span>
                      </label>
                      <textarea
                        id="pemeriksaan-resep"
                        name="resep"
                        rows={2}
                        placeholder="Opsional: tulis nama obat, dosis, atau instruksi singkat."
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-700 transition-all focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none"
                      />
                    </div>

                    {/* Kontrol lanjutan toggle */}
                    <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                      <input id="perlu-kontrol" type="checkbox" className="size-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500/30 cursor-pointer" />
                      <label htmlFor="perlu-kontrol" className="text-sm font-semibold text-amber-800 cursor-pointer flex-1">
                        Pasien perlu jadwal kontrol ulang
                      </label>
                      <span className="text-[10px] font-bold text-amber-500 bg-white border border-amber-200 px-2 py-0.5 rounded-full">Follow-up</span>
                    </div>
                  </div>

                  {/* Form action bar */}
                  <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/60 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      data-page-id="appointment"
                      className="inline-flex justify-center rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      data-action="finish-session"
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 border border-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal-600/25 transition-colors hover:bg-teal-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/></svg>
                      Simpan &amp; Selesaikan
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        {/* PAGE EDIT INFO KUNJUNGAN */}
        <div id="page-edit-info" className={pageClass("edit-info", " h-full overflow-y-auto")} style={{scrollbarWidth: 'thin'}}>
          {/* Header Edit Info */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6 sticky top-0 z-20 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button data-page-id="appointment" className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors tooltip" title="Kembali ke Detail">
                <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="arrow-left" aria-hidden="true" className="lucide lucide-arrow-left w-5 h-5"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
              </button>
              <div className="h-8 w-px bg-gray-200" />
              <div>
                <h3 className="font-bold text-gray-900 leading-tight">Edit Data Kunjungan Pasien</h3>
                <p className="text-[11px] font-semibold text-gray-500">Ahmad Surya • #RM-2023-0891</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-5 py-2.5 bg-gray-100 border border-transparent text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors" data-page-id="appointment">
                Batal
              </button>
              <button className="px-5 py-2.5 bg-blue-600 border border-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/30 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="save" aria-hidden="true" className="lucide lucide-save w-4 h-4"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" /><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" /><path d="M7 3v4a1 1 0 0 0 1 1h7" /></svg> Simpan Perubahan
              </button>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 max-w-4xl mx-auto">
            <form className="space-y-8">
              {/* Section: Keluhan / Anamnesis Awal */}
              <div>
                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
                  Keluhan / Anamnesis Awal</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">Uraian Keluhan (Diisi oleh
                      Perawat/Frontdesk)</label>
                    <textarea rows={4} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors" defaultValue={"Saya ingin melakukan pembersihan karang gigi rutin tahunan. Namun, ada sedikit rasa ngilu di gigi graham kiri bawah jika minum air dingin sejak 2 minggu lalu. Kadang ngilunya menetap sekitar 1 menit."} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2">Durasi Keluhan</label>
                      <select className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:border-primary-500">
                        <option>&gt; 1 Bulan</option>
                        <option selected>1-4 Minggu</option>
                        <option>1-7 Hari</option>
                        <option>Akut (&lt; 24 Jam)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2">Tingkat Nyeri (Skala 1-10)</label>
                      <input type="number" min={0} max={10} defaultValue={4} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:border-primary-500" />
                    </div>
                  </div>
                </div>
              </div>
              {/* Section: Rencana Tindakan Dipilih */}
              <div>
                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
                  Rencana Tindakan Pasien</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">Kategori Pelayanan</label>
                    <div className="flex flex-wrap gap-3">
                      <label className="flex items-center gap-2 px-3 py-2 border border-primary-200 bg-primary-50 text-primary-700 rounded-lg font-medium text-sm cursor-pointer hover:bg-primary-100">
                        <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                        Scaling
                      </label>
                      <label className="flex items-center gap-2 px-3 py-2 border border-primary-200 bg-primary-50 text-primary-700 rounded-lg font-medium text-sm cursor-pointer hover:bg-primary-100">
                        <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                        Konsultasi Umum
                      </label>
                      <label className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-600 rounded-lg font-medium text-sm cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                        Pencabutan Gigi
                      </label>
                      <label className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-600 rounded-lg font-medium text-sm cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                        Tumpatan/Tambalan
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              {/* Section: Informasi Klinis Darurat Tambahan */}
              <div>
                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
                  Informasi Vital (Pre-Screening)</h4>
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-orange-800 mb-3"><svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="alert-triangle" aria-hidden="true" className="lucide lucide-alert-triangle w-4 h-4 inline mr-1"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg> Centang jika pasien memiliki profil kehati-hatian:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <label className="flex flex-col gap-1 p-2 bg-white rounded border border-orange-100 cursor-pointer hover:border-orange-300">
                      <span className="flex items-center gap-2"><input type="checkbox" className="rounded text-orange-500 focus:ring-orange-500" /> <span className="text-xs font-bold text-gray-700">Hipertensi</span></span>
                    </label>
                    <label className="flex flex-col gap-1 p-2 bg-white rounded border border-orange-100 cursor-pointer hover:border-orange-300">
                      <span className="flex items-center gap-2"><input type="checkbox" className="rounded text-orange-500 focus:ring-orange-500" /> <span className="text-xs font-bold text-gray-700">Diabetes</span></span>
                    </label>
                    <label className="flex flex-col gap-1 p-2 bg-white rounded border border-orange-100 cursor-pointer hover:border-orange-300">
                      <span className="flex items-center gap-2"><input type="checkbox" className="rounded text-orange-500 focus:ring-orange-500" /> <span className="text-xs font-bold text-gray-700">Alergi Obat</span></span>
                    </label>
                    <label className="flex flex-col gap-1 p-2 bg-white rounded border border-orange-100 cursor-pointer hover:border-orange-300">
                      <span className="flex items-center gap-2"><input type="checkbox" className="rounded text-orange-500 focus:ring-orange-500" /> <span className="text-xs font-bold text-gray-700">Pendarahan Aktif</span></span>
                    </label>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
        <div id="page-rekam-medis" className={pageClass("rekam-medis", " h-full")}>
          {/* ── Stat Summary Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            {[
              { label: "Total Pasien", value: "124", sub: "Terdaftar", color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-100", icon: <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx={9} cy={7} r={4}/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
              { label: "Aktif Bulan Ini", value: "38", sub: "Kunjungan", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", icon: <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/></svg> },
              { label: "Perlu Kontrol", value: "11", sub: "Follow-up", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", icon: <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/></svg> },
              { label: "Flag Alergi", value: "7", sub: "Perhatian Khusus", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100", icon: <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg> },
            ].map((stat) => (
              <div key={stat.label} className={`bg-white rounded-xl border ${stat.border} p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow`}>
                <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center flex-shrink-0 ${stat.color}`}>
                  {stat.icon}
                </div>
                <div className="min-w-0">
                  <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs font-semibold text-gray-500 truncate">{stat.label}</p>
                  <p className="text-[10px] text-gray-400">{stat.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Toolbar ── */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 mb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1 min-w-0">
              <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <path d="m21 21-4.34-4.34"/><circle cx={11} cy={11} r={8}/>
              </svg>
              <input
                type="text"
                placeholder="Cari nama pasien atau No. Rekam Medis…"
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all"
              />
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <select className="text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50 text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/30 cursor-pointer">
                <option>Semua Status</option>
                <option>Aktif</option>
                <option>Observasi</option>
                <option>Selesai / Arsip</option>
              </select>
              <button
                data-page-id="tambah-pasien"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg shadow-sm shadow-teal-600/30 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                Pasien Baru
              </button>
            </div>
          </div>

          {/* ── Table ── */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style={{ height: "calc(100vh - 340px)", minHeight: 320 }}>
            <div className="flex-1 overflow-auto" style={{ scrollbarWidth: "thin" }}>
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["No. RM", "Pasien", "Kunjungan Terakhir", "Diagnosa Terakhir", "Status", "Aksi"].map((h, i) => (
                      <th key={h} scope="col" className={`px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider ${i === 5 ? "text-center" : ""}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[
                    {
                      rm: "RM-2023-089",
                      initials: "KA",
                      name: "Kevin Andhika",
                      meta: "L · 28 Thn · O+",
                      allergy: null,
                      lastVisit: "12 Okt 2023",
                      doctor: "drg. Rina P.",
                      diagnosa: "Pulpitis Reversibel G.36",
                      note: "Tambalan lepas 2 hari lalu",
                      status: "Aktif",
                      statusClass: "text-teal-700 bg-teal-50 border-teal-200",
                      avatarClass: "bg-teal-100 text-teal-700",
                    },
                    {
                      rm: "RM-2023-021",
                      initials: "NA",
                      name: "Nur Aini",
                      meta: "P · 31 Thn · A+",
                      allergy: "Penicillin",
                      lastVisit: "05 Okt 2023",
                      doctor: "drg. Budi H.",
                      diagnosa: "Impaksi Molar 3",
                      note: "Rujuk Odontektomi",
                      status: "Observasi",
                      statusClass: "text-amber-700 bg-amber-50 border-amber-200",
                      avatarClass: "bg-amber-100 text-amber-700",
                    },
                    {
                      rm: "RM-2022-190",
                      initials: "ST",
                      name: "Sandy Tarigan",
                      meta: "P · 34 Thn · B-",
                      allergy: null,
                      lastVisit: "12 Sep 2022",
                      doctor: "drg. Rina P.",
                      diagnosa: "Acute Gingivitis",
                      note: "Scaling + Polishing selesai",
                      status: "Arsip",
                      statusClass: "text-gray-500 bg-gray-100 border-gray-200",
                      avatarClass: "bg-gray-200 text-gray-600",
                    },
                  ].map((row) => (
                    <tr key={row.rm} className="group hover:bg-teal-50/20 transition-colors cursor-pointer">
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">{row.rm}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full ${row.avatarClass} flex items-center justify-center text-xs font-black ring-2 ring-white flex-shrink-0`}>
                            {row.initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 text-sm">{row.name}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{row.meta}</p>
                            {row.allergy && (
                              <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200">
                                <svg xmlns="http://www.w3.org/2000/svg" width={8} height={8} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                                Alergi: {row.allergy}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-gray-800">{row.lastVisit}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{row.doctor}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-gray-800 max-w-[180px] truncate">{row.diagnosa}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5 max-w-[180px] truncate">{row.note}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${row.statusClass}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
                          {row.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            data-page-id="detail-rekam-medis"
                            title="Lihat Detail EHR"
                            className="p-2 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx={12} cy={12} r={3}/></svg>
                          </button>
                          <button
                            title="Cetak Rekam Medis"
                            className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x={6} y={14} width={12} height={8} rx={1}/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="border-t border-gray-100 bg-gray-50/60 px-5 py-3 flex items-center justify-between text-xs text-gray-500">
              <span>Menampilkan <strong className="text-gray-700">1–3</strong> dari <strong className="text-gray-700">124</strong> pasien</span>
              <div className="flex gap-1">
                {["←", "1", "2", "3", "→"].map((p, i) => (
                  <button
                    key={i}
                    className={`px-2.5 py-1 rounded-md border font-semibold transition-colors ${
                      p === "1"
                        ? "bg-teal-600 text-white border-teal-600"
                        : p === "←"
                  ? "bg-white text-gray-300 border-gray-200 cursor-not-allowed"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* PAGE DETAIL REKAM MEDIS */}
        <div id="page-detail-rekam-medis" className={pageClass("detail-rekam-medis", " h-full overflow-y-auto hide-scrollbar")}>
          {/* Sticky topbar */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-5 sticky top-0 z-20 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <button type="button" data-page-id="rekam-medis" aria-label="Kembali ke daftar rekam medis" className="size-9 border border-gray-200 rounded-lg text-gray-500 hover:text-teal-700 hover:bg-teal-50 hover:border-teal-200 transition-colors flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
              </button>
              <div className="h-6 w-px bg-gray-200 flex-shrink-0" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-black text-gray-900">Ahmad Surya</h3>
                  <span className="rounded-md border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700 font-mono">RM-2023-0891</span>
                  <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                    Alergi Penicillin
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-gray-400">Kunjungan terakhir: <strong className="text-gray-600">28 April 2026</strong> · drg. Rina Pratiwi</p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">
                <svg xmlns="http://www.w3.org/2000/svg" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x={6} y={14} width={12} height={8} rx={1}/></svg>
                Cetak
              </button>
              <button type="button" data-page-id="pemeriksaan" className="inline-flex items-center gap-2 rounded-lg border border-teal-600 bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700">
                <svg xmlns="http://www.w3.org/2000/svg" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M11 2v2"/><path d="M5 2v2"/><path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1"/><path d="M8 15a6 6 0 0 0 12 0v-3"/><circle cx={20} cy={10} r={2}/></svg>
                Pemeriksaan Baru
              </button>
            </div>
          </div>

          <div className="max-w-6xl mx-auto pb-8 space-y-5">
            {/* Top summary row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Profil Pasien</p>
                <div className="flex items-center gap-4">
                  <div className="size-14 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-black text-lg flex-shrink-0">AS</div>
                  <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div><span className="text-[10px] font-bold text-gray-400 block">Nama Lengkap</span><span className="font-bold text-gray-900">Ahmad Surya</span></div>
                    <div><span className="text-[10px] font-bold text-gray-400 block">Usia / Jenis Kelamin</span><span className="font-semibold text-gray-700">32 Thn / Laki-laki</span></div>
                    <div><span className="text-[10px] font-bold text-gray-400 block">Golongan Darah</span><span className="font-bold text-red-500">O+</span></div>
                    <div><span className="text-[10px] font-bold text-gray-400 block">No. Telepon</span><span className="font-semibold text-gray-700">0812-3456-7890</span></div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex-1">
                  <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">⚠ Perhatian Alergi</p>
                  <p className="text-sm font-bold text-rose-800 mt-1">Penicillin / Amoxicillin</p>
                  <p className="text-[10px] text-rose-500 mt-1">Hindari semua golongan Beta-lactam</p>
                </div>
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex-1">
                  <p className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">Status EHR</p>
                  <p className="text-sm font-bold text-teal-800 mt-1">Terkonfirmasi Dokter</p>
                  <p className="text-[10px] text-teal-500 mt-1">3 kunjungan tercatat</p>
                </div>
              </div>
            </div>

            {/* Last exam results */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h4 className="font-bold text-gray-900">Hasil Pemeriksaan Terakhir</h4>
                  <p className="text-xs text-gray-400 mt-0.5">Kunjungan 28 April 2026 · drg. Rina Pratiwi</p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-teal-200 bg-teal-50 text-[11px] font-bold text-teal-700">
                  <span className="w-2 h-2 rounded-full bg-teal-500" />
                  Terkonfirmasi
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {[
                  { label: "Keluhan Utama", value: "Ngilu di gigi geraham kiri bawah saat minum dingin sejak 2 minggu lalu." },
                  { label: "Area Gigi", value: "Gigi 36 (Molar kiri bawah)" },
                  { label: "Diagnosis", value: "Karies profunda dengan sensitivitas dingin" },
                  { label: "Temuan Klinis", value: "Karies pada oklusal gigi 36. Perkusi negatif, palpasi negatif, gingiva tenang." },
                  { label: "Tindakan & Rencana", value: "Scaling selesai. Edukasi kebersihan gigi. Observasi sensitivitas gigi 36, kontrol 2 minggu." },
                  { label: "Resep / Catatan", value: "Tidak ada resep antibiotik. Gunakan pasta gigi sensitif, hindari konsumsi dingin berlebihan." },
                ].map((row) => (
                  <div key={row.label} className="grid gap-1.5 py-3.5 sm:grid-cols-[200px_1fr]">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{row.label}</p>
                    <p className="text-sm leading-relaxed text-gray-800">{row.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Visit history + notes */}
            <div className="grid gap-5 lg:grid-cols-3">
              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <h4 className="font-bold text-gray-900">Riwayat Kunjungan</h4>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-500">3 kunjungan</span>
                </div>
                <div className="relative">
                  <div className="absolute left-[15px] top-3 bottom-3 w-px bg-gray-100" />
                  <div className="space-y-4">
                    {[
                      { title: "Pemeriksaan & Scaling", date: "28 April 2026", note: "Karies profunda gigi 36, observasi sensitivitas dingin.", active: true },
                      { title: "Kontrol Tambalan", date: "12 Oktober 2023", note: "Tambalan gigi 36 dievaluasi, tidak ada nyeri spontan.", active: false },
                      { title: "Scaling Rutin", date: "05 Januari 2022", note: "Pembersihan karang gigi rahang atas dan bawah.", active: false },
                    ].map((v) => (
                      <div key={v.date} className="flex gap-4 pl-1">
                        <div className={`size-[30px] rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10 ${v.active ? "border-teal-500 bg-teal-50" : "border-gray-200 bg-white"}`}>
                          <span className={`w-2 h-2 rounded-full ${v.active ? "bg-teal-500" : "bg-gray-300"}`} />
                        </div>
                        <div className={`flex-1 rounded-xl border p-4 ${v.active ? "border-teal-100 bg-teal-50/40" : "border-gray-100 bg-gray-50/40"}`}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                            <p className={`font-bold text-sm ${v.active ? "text-teal-900" : "text-gray-800"}`}>{v.title}</p>
                            <p className={`text-[11px] font-semibold ${v.active ? "text-teal-600" : "text-gray-400"}`}>{v.date}</p>
                          </div>
                          <p className={`text-xs leading-relaxed ${v.active ? "text-teal-700" : "text-gray-500"}`}>{v.note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <aside className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h4 className="font-bold text-gray-900 mb-4">Catatan Profesional</h4>
                <div className="space-y-3">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5">
                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1">Prioritas Kontrol</p>
                    <p className="text-xs text-amber-800 leading-relaxed">Evaluasi ulang gigi 36 bila ngilu menetap lebih dari 2 minggu.</p>
                  </div>
                  <div className="bg-rose-50 border border-rose-200 rounded-lg p-3.5">
                    <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider mb-1">Batas Resep</p>
                    <p className="text-xs text-rose-800 leading-relaxed">Hindari antibiotik golongan Penicillin — alergi terkonfirmasi.</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3.5">
                    <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-1">Asuransi</p>
                    <p className="text-xs font-bold text-blue-800">Asuransi Swasta</p>
                    <p className="text-[10px] text-blue-500 mt-0.5">Verifikasi sebelum tindakan lanjutan</p>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
        {/* PAGE OPTIMASI JADWAL */}
        <div id="page-jadwal" className={pageClass("jadwal", " h-full")}>
          <div className="flex flex-col lg:flex-row gap-6 h-full">
            {/* Bagian Kiri: Insight & Rekomendasi Jadwal */}
            <div className="w-full lg:w-1/3 xl:w-1/4 flex flex-col gap-4">
              {/* Mini Kalender */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 border-t-4 border-t-indigo-500">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800">Oktober 2023</h3>
                  <div className="flex gap-1">
                    <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"><svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="chevron-left" aria-hidden="true" className="lucide lucide-chevron-left w-4 h-4"><path d="m15 18-6-6 6-6" /></svg></button>
                    <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"><svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="chevron-right" aria-hidden="true" className="lucide lucide-chevron-right w-4 h-4"><path d="m9 18 6-6-6-6" /></svg></button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  <span className="text-[10px] font-bold text-gray-400 cursor-default">MIN</span>
                  <span className="text-[10px] font-bold text-gray-400 cursor-default">SEN</span>
                  <span className="text-[10px] font-bold text-gray-400 cursor-default">SEL</span>
                  <span className="text-[10px] font-bold text-gray-400 cursor-default">RAB</span>
                  <span className="text-[10px] font-bold text-gray-400 cursor-default">KAM</span>
                  <span className="text-[10px] font-bold text-gray-400 cursor-default">JUM</span>
                  <span className="text-[10px] font-bold text-gray-400 cursor-default">SAB</span>
                </div>
                <div className="grid grid-cols-7 gap-1 text-sm">
                  {/* Row 1 */}
                  <button className="p-1.5 text-gray-300 font-medium hover:bg-gray-50 rounded">1</button>
                  <button className="p-1.5 text-gray-600 font-medium hover:bg-gray-50 rounded">2</button>
                  <button className="p-1.5 text-gray-600 font-medium hover:bg-gray-50 rounded">3</button>
                  <button className="p-1.5 text-gray-600 font-medium hover:bg-gray-50 rounded">4</button>
                  <button className="p-1.5 text-gray-600 font-medium hover:bg-gray-50 rounded relative">5 <span className="absolute bottom-1 right-1 w-1 h-1 bg-rose-400 rounded-full" /></button>
                  <button className="p-1.5 text-gray-600 font-medium hover:bg-gray-50 rounded">6</button>
                  <button className="p-1.5 text-gray-600 font-medium hover:bg-gray-50 rounded relative">7 <span className="absolute bottom-1 right-1 w-1 h-1 bg-indigo-400 rounded-full" /></button>
                  {/* Row 2 */}
                  <button className="p-1.5 text-rose-500 font-medium hover:bg-rose-50 rounded">8</button>
                  <button className="p-1.5 text-gray-600 font-medium hover:bg-gray-50 rounded relative">9 <span className="absolute bottom-1 right-1 w-1 h-1 bg-indigo-400 rounded-full" /></button>
                  <button className="p-1.5 text-gray-600 font-medium hover:bg-gray-50 rounded">10</button>
                  <button className="p-1.5 text-gray-600 font-medium hover:bg-gray-50 rounded relative">11 <span className="absolute bottom-1 right-1 w-1 h-1 bg-indigo-400 rounded-full" /></button>
                  <button className="p-1.5 bg-indigo-600 text-white font-bold rounded shadow-sm shadow-indigo-600/30">12</button>
                  <button className="p-1.5 text-gray-600 font-medium hover:bg-gray-50 rounded">13</button>
                  <button className="p-1.5 text-gray-600 font-medium hover:bg-gray-50 rounded">14</button>
                </div>
              </div>
              {/* Smart Suggestions System */}
              <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl border border-indigo-100 shadow-sm flex flex-col flex-1">
                <div className="p-4 border-b border-indigo-100/50 flex items-center justify-between">
                  <h4 className="font-bold text-indigo-900 flex items-center gap-2 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="sparkles" aria-hidden="true" className="lucide lucide-sparkles w-4 h-4 text-indigo-500"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" /><path d="M20 2v4" /><path d="M22 4h-4" /><circle cx={4} cy={20} r={2} /></svg> AI Scheduler
                  </h4>
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                </div>
                <div className="p-4 space-y-3 overflow-y-auto">
                  <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400" />
                    <h5 className="text-xs font-bold text-gray-800 mb-1">Optimasi Slot Kosong</h5>
                    <p className="text-[10px] text-gray-500 leading-relaxed mb-2">Terdapat gap 45 menit pada <strong className="text-indigo-600">14:15 - 15:00</strong>. Anda bisa memajukan pasien <span className="italic">Ny. Santi</span>.</p>
                    <button className="w-full py-1.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded transition-colors bg-white border border-indigo-200">
                      Kirim Notif Maju Jadwal
                    </button>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-400" />
                    <h5 className="text-xs font-bold text-gray-800 mb-1">Rekomendasi Tindakan</h5>
                    <p className="text-[10px] text-gray-500 leading-relaxed">2 pasien dengan tindakan Scaling berada pada hari
                      yang sama. Mengelompokkan mempermudah persiapan alat.</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-rose-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-rose-400" />
                    <h5 className="text-xs font-bold text-gray-800 mb-1 text-rose-700">Peringatan Konflik</h5>
                    <p className="text-[10px] text-gray-500 leading-relaxed mb-2">Jadwal pukul <strong className="text-rose-600">10:30</strong> tumpang tindih dengan Rapat Manajemen Klinik.</p>
                    <button className="w-full py-1.5 text-[10px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded transition-colors bg-white border border-rose-200">
                      Otomatis Reschedule
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {/* Bagian Kanan: Timeline Harian */}
            <div className="w-full lg:w-2/3 xl:w-3/4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full overflow-hidden">
                {/* Timeline Header */}
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Jadwal Hari Ini</h2>
                    <p className="text-sm text-gray-500">Kamis, 12 Oktober 2023</p>
                  </div>
                  <div className="flex gap-2">
                    {/* Date & View Selector Dropdown */}
                    <div className="relative group z-30">
                      <button className="px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 font-semibold transition-colors flex items-center gap-2 group-focus-within:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="calendar" aria-hidden="true" className="lucide lucide-calendar w-4 h-4 text-indigo-500"><path d="M8 2v4" /><path d="M16 2v4" /><rect width={18} height={18} x={3} y={4} rx={2} /><path d="M3 10h18" /></svg>
                        <span className="text-xs hidden sm:block">Hari Ini</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="chevron-down" aria-hidden="true" className="lucide lucide-chevron-down w-3 h-3 text-gray-400 group-hover:rotate-180 transition-transform"><path d="m6 9 6 6 6-6" /></svg>
                      </button>
                      {/* Dropdown Panel */}
                      <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible focus-within:opacity-100 focus-within:visible transition-all duration-200 origin-top-right">
                        {/* Quick Select Date */}
                        <div className="mb-4">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Lompat
                            Ke Tanggal</label>
                          <div className="relative hover:border-indigo-300 transition-colors">
                            <input type="date" className="w-full text-sm bg-gray-50/80 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 text-gray-700 font-medium cursor-text shadow-sm transition-all" />
                          </div>
                        </div>
                        {/* Layout Mode */}
                        <div className="pt-3 border-t border-gray-100">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Mode
                            Tampilan</label>
                          <div className="space-y-1">
                            <button className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg transition-colors shadow-sm">
                              <div className="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="list" aria-hidden="true" className="lucide lucide-list w-3.5 h-3.5"><path d="M3 5h.01" /><path d="M3 12h.01" /><path d="M3 19h.01" /><path d="M8 5h13" /><path d="M8 12h13" /><path d="M8 19h13" /></svg> Harian
                                (Daily)</div>
                              <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="check" aria-hidden="true" className="lucide lucide-check w-3 h-3"><path d="M20 6 9 17l-5-5" /></svg>
                            </button>
                            <button className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                              <div className="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="layout-grid" aria-hidden="true" className="lucide lucide-layout-grid w-3.5 h-3.5"><rect width={7} height={7} x={3} y={3} rx={1} /><rect width={7} height={7} x={14} y={3} rx={1} /><rect width={7} height={7} x={14} y={14} rx={1} /><rect width={7} height={7} x={3} y={14} rx={1} /></svg>
                                Mingguan (Weekly)</div>
                            </button>
                            <button className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                              <div className="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="calendar-days" aria-hidden="true" className="lucide lucide-calendar-days w-3.5 h-3.5"><path d="M8 2v4" /><path d="M16 2v4" /><rect width={18} height={18} x={3} y={4} rx={2} /><path d="M3 10h18" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" /><path d="M16 18h.01" /></svg>
                                Bulanan (Monthly)</div>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button data-page-id="tambah-jadwal" className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/30 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="plus" aria-hidden="true" className="lucide lucide-plus w-4 h-4"><path d="M5 12h14" /><path d="M12 5v14" /></svg> Buat Jadwal Baru
                    </button>
                  </div>
                </div>
                {/* Timeline Content */}
                <div className="flex-1 overflow-y-auto p-6 relative" style={{scrollbarWidth: 'thin'}}>
                  {/* Garis vertikal timeline */}
                  <div className="absolute w-0.5 bg-gray-100 left-[5rem] top-6 bottom-6 hidden sm:block" />
                  <div className="space-y-6">
                    {/* Slot 08:00 (Selesai) */}
                    <div className="flex flex-col sm:flex-row gap-4 relative">
                      <div className="w-16 flex-shrink-0 text-right pr-4 pt-1 sm:block hidden text-gray-400 font-bold text-sm">
                        08:00</div>
                      <div className="absolute w-3 h-3 rounded-full bg-gray-300 border-2 border-white left-[4.65rem] top-2 hidden sm:block shadow-sm z-10">
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex-1 opacity-70 group hover:opacity-100 transition-opacity">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-[10px] font-bold bg-gray-200 text-gray-600 px-2 py-0.5 rounded mr-2">Selesai</span>
                            <span className="text-xs font-semibold text-gray-500">Konsultasi Awal</span>
                          </div>
                          <p className="text-xs font-bold text-gray-400">08:00 - 08:30 (30m)</p>
                        </div>
                        <h4 className="font-bold text-gray-800 text-base mb-1">Tn. Budi Santoso</h4>
                        <p className="text-xs text-gray-500">Pemeriksaan rutin dan keluhan ngilu ringan.</p>
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200/60">
                          <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                            <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-white text-[9px]">
                              RH</div> Asisten: Suster Rini
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Slot 09:00 (Aktif - In Progress) */}
                    <div className="flex flex-col sm:flex-row gap-4 relative">
                      <div className="w-16 flex-shrink-0 text-right pr-4 pt-1 sm:block hidden text-indigo-600 font-bold text-sm">
                        09:00</div>
                      <div className="absolute w-4 h-4 rounded-full bg-indigo-500 border-4 border-white left-[4.5rem] top-1.5 hidden sm:block shadow-sm z-10">
                      </div>
                      <div className="bg-white border-2 border-indigo-200 shadow-md shadow-indigo-100/50 rounded-xl p-4 flex-1 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded mr-2 animate-pulse">Sedang
                              Berlangsung</span>
                            <span className="text-xs text-indigo-600 font-semibold border border-indigo-100 px-2 py-0.5 rounded">Cabut
                              Gigi (Odontektomi)</span>
                          </div>
                          <p className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">09:00 - 10:30 (1h
                            30m)</p>
                        </div>
                        <h4 className="font-bold text-gray-900 text-lg mb-1 mt-1">Ny. Siti Aminah</h4>
                        <p className="text-xs text-gray-600 mb-3">Tindakan pencabutan gigi bungsu impaksi (M3 Kanan Bawah).
                        </p>
                        {/* Inline Action Bar */}
                        <div className="flex items-center gap-2 mt-2">
                          <button className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded border border-indigo-100 hover:bg-indigo-100 transition-colors">Buka
                            Rekam Medis</button>
                          <button className="px-3 py-1.5 bg-white text-gray-600 text-[10px] font-bold rounded border border-gray-200 hover:bg-gray-50 transition-colors px-2 py-1"><svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="edit-3" aria-hidden="true" className="lucide lucide-edit-3 w-3 h-3"><path d="M13 21h8" /><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /></svg></button>
                        </div>
                      </div>
                    </div>
                    {/* Slot 10:30 Konflik/Warning */}
                    <div className="flex flex-col sm:flex-row gap-4 relative mt-2 pt-2">
                      <div className="w-16 flex-shrink-0 text-right pr-4 pt-1 sm:block hidden text-rose-500 font-bold text-sm">
                        10:30</div>
                      <div className="absolute w-3 h-3 rounded-full bg-rose-500 border-2 border-white left-[4.65rem] top-4 hidden sm:block shadow-sm z-10">
                      </div>
                      <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-4 flex-1">
                        <div className="flex items-center gap-2 text-rose-700 mb-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="alert-octagon" aria-hidden="true" className="lucide lucide-alert-octagon w-4 h-4"><path d="M12 16h.01" /><path d="M12 8v4" /><path d="M15.312 2a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586l-4.688-4.688A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2z" /></svg>
                          <span className="text-xs font-bold uppercase tracking-wide">Peringatan Bentrok Jadwal</span>
                        </div>
                        <div className="flex justify-between mt-2">
                          <div>
                            <h4 className="font-semibold text-gray-800 text-sm">Rapat Manajemen (10:30 - 11:30)</h4>
                            <p className="text-xs text-gray-500">Berbenturan dengan janji Temu &quot;Anak Reza&quot;</p>
                          </div>
                          <button className="text-[10px] font-bold px-3 py-1 bg-white border border-rose-200 text-rose-600 rounded shadow-sm hover:bg-rose-50">Selesaikan
                            Konflik</button>
                        </div>
                      </div>
                    </div>
                    {/* Empty Slot Recommendation */}
                    <div className="flex flex-col sm:flex-row gap-4 relative mt-2">
                      <div className="w-16 flex-shrink-0 text-right pr-4 pt-3 sm:block hidden text-gray-400 font-medium text-xs">
                        11:30</div>
                      <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-3 flex-1 flex justify-center items-center group cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 transition-all">
                        <p className="text-xs font-semibold text-gray-500 group-hover:text-indigo-600 flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="plus-circle" aria-hidden="true" className="lucide lucide-plus-circle w-4 h-4 text-gray-400 group-hover:text-indigo-500"><circle cx={12} cy={12} r={10} /><path d="M8 12h8" /><path d="M12 8v8" /></svg>
                          Slot Kosong (45m). Klik untuk mengisi.
                        </p>
                      </div>
                    </div>
                    {/* Slot 13:00 (Akan Datang) */}
                    <div className="flex flex-col sm:flex-row gap-4 relative mt-2">
                      <div className="w-16 flex-shrink-0 text-right pr-4 pt-1 sm:block hidden text-gray-700 font-bold text-sm">
                        13:00</div>
                      <div className="absolute w-3 h-3 rounded-full bg-blue-400 border-2 border-white left-[4.65rem] top-2 hidden sm:block shadow-sm z-10 relative">
                        <span className="absolute w-3 h-3 rounded-full bg-blue-400 opacity-50 animate-ping" />
                      </div>
                      <div className="bg-white border border-gray-200 rounded-xl p-4 flex-1 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 mr-2">Akan
                              Datang</span>
                            <span className="text-xs font-semibold text-gray-500">Perawatan Akar Gigi</span>
                          </div>
                          <p className="text-xs font-bold text-gray-400">13:00 - 14:15 (1h 15m)</p>
                        </div>
                        <h4 className="font-bold text-gray-800 text-base mb-1">Nn. Clara Wijaya</h4>
                        <p className="text-xs text-gray-500">Kunjungan kedua perawatan saluran akar (Endodontik). Gigi 24.</p>
                        <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-yellow-50 text-yellow-700 text-[10px] font-semibold border border-yellow-200">
                            <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="clock" aria-hidden="true" className="lucide lucide-clock w-3 h-3"><circle cx={12} cy={12} r={10} /><path d="M12 6v6l4 2" /></svg> Pasien Mengonfirmasi Hadir
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Padding bawah */}
                    <div className="h-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* PAGE TAMBAH JADWAL BARU */}
        <div id="page-tambah-jadwal" className={pageClass("tambah-jadwal", " h-full overflow-y-auto")} style={{scrollbarWidth: 'thin', paddingBottom: '2rem'}}>
          {/* Top Action Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <button data-page-id="jadwal" className="px-4 py-2 bg-white border border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="arrow-left" aria-hidden="true" className="lucide lucide-arrow-left w-4 h-4"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg> Batal &amp; Kembali
            </button>
            <button data-action="show-jadwal-modal" className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-sm shadow-indigo-500/30 flex items-center justify-center gap-2 w-full sm:w-auto transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="check-circle" aria-hidden="true" className="lucide lucide-check-circle w-4 h-4"><path d="M21.801 10A10 10 0 1 1 17 3.335" /><path d="m9 11 3 3L22 4" /></svg> Konfirmasi &amp; Simpan Jadwal
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Kolom Utama */}
            <div className="lg:col-span-2 space-y-6">
              {/* Card: Pemilihan Pasien */}
              <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/30 border border-gray-100 p-6 sm:p-8 hover:shadow-2xl transition-all duration-300 relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100/50">
                    <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="users" aria-hidden="true" className="lucide lucide-users w-5 h-5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><path d="M16 3.128a4 4 0 0 1 0 7.744" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><circle cx={9} cy={7} r={4} /></svg>
                  </div>
                  <div>
                    <h4 className="text-base font-black text-gray-800 leading-tight">Identitas Pasien</h4>
                    <p className="text-[11px] text-gray-400 font-medium mt-0.5">Pilih pasien terdaftar atau dari basis data
                    </p>
                  </div>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Pencarian
                      Pasien (Nama / No. RM) <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="search" aria-hidden="true" className="lucide lucide-search w-4 h-4 text-indigo-400 absolute left-4 top-1/2 -translate-y-1/2"><path d="m21 21-4.34-4.34" /><circle cx={11} cy={11} r={8} /></svg>
                      <input type="text" className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-700 font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all shadow-sm" placeholder="Ketik untuk mencari..." />
                    </div>
                  </div>
                  {/* Rekomendasi Hasil Pencarian (Mock UI) */}
                  <div className="p-3 bg-indigo-50/50 border border-indigo-200 rounded-xl flex items-center justify-between cursor-pointer hover:bg-indigo-100 transition-colors shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 bg-white border border-indigo-200 text-indigo-700 font-bold text-xs rounded-full flex items-center justify-center shadow-sm">
                        AS</div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">Ahmad Surya (RM-2023091)</p>
                        <p className="text-[10px] font-semibold text-gray-500">Terakhir kunjungan: 1 minggu lalu</p>
                      </div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="check-circle-2" aria-hidden="true" className="lucide lucide-check-circle-2 w-5 h-5 text-indigo-600"><circle cx={12} cy={12} r={10} /><path d="m9 12 2 2 4-4" /></svg>
                  </div>
                </div>
              </div>
              {/* Card: Waktu & Poli */}
              <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/30 border border-gray-100 p-6 sm:p-8 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100/50">
                    <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="clock" aria-hidden="true" className="lucide lucide-clock w-5 h-5"><circle cx={12} cy={12} r={10} /><path d="M12 6v6l4 2" /></svg>
                  </div>
                  <div>
                    <h4 className="text-base font-black text-gray-800 leading-tight">Pengaturan Jadwal Layanan</h4>
                    <p className="text-[11px] text-gray-400 font-medium mt-0.5">Tentukan tanggal, slot waktu, dan dokter
                      penanggung jawab</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-5">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Tanggal
                      Rencana Kunjungan <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="calendar" aria-hidden="true" className="lucide lucide-calendar w-4 h-4 text-blue-500 absolute left-4 top-1/2 -translate-y-1/2"><path d="M8 2v4" /><path d="M16 2v4" /><rect width={18} height={18} x={3} y={4} rx={2} /><path d="M3 10h18" /></svg>
                      <input type="date" className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-700 font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all shadow-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Estimasi
                      Jam Kehadiran <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="clock-4" aria-hidden="true" className="lucide lucide-clock-4 w-4 h-4 text-blue-500 absolute left-4 top-1/2 -translate-y-1/2"><circle cx={12} cy={12} r={10} /><path d="M12 6v6l4 2" /></svg>
                      <input type="time" className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-700 font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all shadow-sm" />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Pilih
                      Poliklinik &amp; Dokter</label>
                    <div className="relative bg-gray-50/50 border border-gray-200 rounded-xl hover:border-blue-300 transition-colors shadow-sm">
                      <select className="w-full text-sm bg-transparent px-4 py-3 focus:outline-none appearance-none font-medium text-gray-700 cursor-pointer">
                        <option>Poli Gigi 1 - drg. Rina (Tersedia)</option>
                        <option>Poli Gigi Umum - drg. Hendra (Tersedia)</option>
                        <option>Poli Anak - dr. Sita (Penuh)</option>
                      </select>
                      <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="chevron-down" aria-hidden="true" className="lucide lucide-chevron-down w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"><path d="m6 9 6 6 6-6" /></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Kolom Kanan: Tipe Layanan & Ringkasan */}
            <div className="space-y-6">
              {/* Card: Keluhan Utama */}
              <div className="bg-gradient-to-br from-indigo-700 to-blue-800 rounded-2xl shadow-xl shadow-indigo-500/20 border border-indigo-600 p-6 sm:p-8 relative overflow-hidden text-white group">
                <div className="absolute -right-8 -top-8 text-white/5 opacity-50 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="stethoscope" aria-hidden="true" className="lucide lucide-stethoscope w-48 h-48"><path d="M11 2v2" /><path d="M5 2v2" /><path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1" /><path d="M8 15a6 6 0 0 0 12 0v-3" /><circle cx={20} cy={10} r={2} /></svg></div>
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white backdrop-blur-md border border-white/20 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="clipboard-list" aria-hidden="true" className="lucide lucide-clipboard-list w-5 h-5"><rect width={8} height={4} x={8} y={2} rx={1} ry={1} /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" /></svg>
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white leading-tight">Target Penanganan</h4>
                    <p className="text-[11px] text-indigo-100/80 font-medium mt-0.5">Tujuan medis kunjungan pasien</p>
                  </div>
                </div>
                <div className="space-y-5 relative z-10">
                  <div>
                    <label className="block text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-2 ml-1">Kategori
                      Booking</label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="cursor-pointer">
                        <input type="radio" name="kunjungan" className="peer hidden" defaultChecked />
                        <div className="text-center py-2.5 bg-black/20 border border-white/10 rounded-xl text-xs font-bold text-white peer-checked:bg-white peer-checked:text-indigo-700 peer-checked:shadow-lg hover:bg-white/30 transition-all">
                          Konsultasi Umum</div>
                      </label>
                      <label className="cursor-pointer">
                        <input type="radio" name="kunjungan" className="peer hidden" />
                        <div className="text-center py-2.5 bg-black/20 border border-white/10 rounded-xl text-xs font-bold text-white peer-checked:bg-white peer-checked:text-indigo-700 peer-checked:shadow-lg hover:bg-white/30 transition-all">
                          Tindakan Klinis</div>
                      </label>
                      <label className="cursor-pointer">
                        <input type="radio" name="kunjungan" className="peer hidden" />
                        <div className="text-center py-2.5 bg-black/20 border border-white/10 rounded-xl text-xs font-bold text-white peer-checked:bg-white peer-checked:text-indigo-700 peer-checked:shadow-lg hover:bg-white/30 transition-all">
                          Follow-Up</div>
                      </label>
                      <label className="cursor-pointer">
                        <input type="radio" name="kunjungan" className="peer hidden" />
                        <div className="text-center py-2.5 bg-black/20 border border-white/10 rounded-xl text-xs font-bold text-white peer-checked:bg-white peer-checked:text-indigo-700 peer-checked:shadow-lg hover:bg-white/30 transition-all">
                          Bypass Darurat</div>
                      </label>
                    </div>
                  </div>
                  <div className="pt-5 border-t border-white/10">
                    <label className="block text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-2 ml-1">Catatan
                      Staf / Deskripsi Keluhan</label>
                    <textarea rows={4} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors shadow-inner placeholder:text-indigo-100/50 resize-none" placeholder="Masukkan keluhan utama atau informasi penting persiapan..." defaultValue={""} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* PAGE MANAJEMEN ANTRIAN (Clean View) */}
        <div id="page-antrian" className={pageClass("antrian", " h-full flex flex-col")}>
          {/* Header Antrian */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="monitor-play" aria-hidden="true" className="lucide lucide-monitor-play w-5 h-5 text-blue-600"><path d="M15.033 9.44a.647.647 0 0 1 0 1.12l-4.065 2.352a.645.645 0 0 1-.968-.56V7.648a.645.645 0 0 1 .967-.56z" /><path d="M12 17v4" /><path d="M8 21h8" /><rect x={2} y={3} width={20} height={14} rx={2} /></svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Manajemen Antrian (Live)</h3>
                <p className="text-xs text-gray-500">Monitor antrian harian dengan tampilan bersih</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" data-action="show-qr-pendaftaran-modal" aria-haspopup="dialog" title="Tampilkan QR pendaftaran pasien" className="px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-semibold rounded-lg hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-colors flex items-center gap-2 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect width={18} height={18} x={3} y={3} rx={2} ry={2}/><rect width={3} height={3} x={7} y={7}/><rect width={3} height={3} x={14} y={7}/><rect width={3} height={3} x={7} y={14}/><path d="M14 14h.01"/><path d="M14 17h.01"/><path d="M17 14h.01"/><path d="M17 17h.01"/></svg> QR Pendaftaran
              </button>
              <button
                type="button"
                data-action="show-panggil-modal"
                data-queue-id={nextQueueRegistration?.id}
                data-queue-number={nextQueueRegistration?.queueNumber}
                data-patient-name={nextQueueRegistration?.nama}
                disabled={!nextQueueRegistration}
                className={`px-4 py-2 border text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-sm ${
                  nextQueueRegistration
                    ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700 shadow-blue-600/30"
                    : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="mic" aria-hidden="true" className="lucide lucide-mic w-4 h-4"><path d="M12 19v3" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><rect x={9} y={2} width={6} height={13} rx={3} /></svg> {nextQueueRegistration ? "Panggil Pasien" : "Belum Ada Antrian"}
              </button>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
            {/* Bagian Kiri: Sedang Dilayani (Now Serving) */}
            <div className="w-full lg:w-5/12 flex flex-col">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg border border-blue-500 flex flex-col flex-1 p-8 text-white relative overflow-hidden">
                {/* Dekorasi Background */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="relative z-10 flex flex-col h-full">
                  {/* Status Bar */}
                  <div className="flex justify-between items-start mb-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/40 backdrop-blur-md border border-blue-400/50">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-wider">Poli Gigi 1 - drg. Rina</span>
                    </div>
                    <span className="text-sm font-medium bg-black/20 px-3 py-1 rounded-lg backdrop-blur-sm">
                      {activeQueueTime ? `${activeQueueTime} WIB` : "--"}
                    </span>
                  </div>
                  {/* Main Info */}
                  <div className="text-center my-12">
                    <p className="text-blue-200 text-sm font-bold uppercase tracking-[0.2em] mb-2">Sedang Dilayani</p>
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <h1 className="text-7xl font-black tabular-nums tracking-tighter drop-shadow-md">{activeQueueRegistration?.queueNumber ?? "--"}</h1>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">{activeQueueRegistration?.nama ?? "Belum ada pasien dipanggil"}</h2>
                    <p className="text-blue-100/80 font-medium">{activeQueueRegistration?.keluhan ?? "Panggil pasien dari daftar antrian QR"}</p>
                  </div>
                  {/* Control Bar */}
                  <div className="mt-auto bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs text-blue-100 font-medium">Mulai: <strong className="text-white">{activeQueueTime ?? "--"}</strong></span>
                      <span className="text-xs text-blue-100 font-medium">Estimasi: <strong className="text-white">30
                          Min</strong></span>
                    </div>
                    <div className="w-full bg-black/20 rounded-full h-1.5 mb-5">
                      <div className="bg-emerald-400 h-1.5 rounded-full" style={{width: activeQueueRegistration ? '48%' : '0%'}} />
                    </div>
                    <div className="flex gap-3">
                      <button
                        data-action="show-antrian-selesai-modal"
                        disabled={!activeQueueRegistration}
                        className={`flex-1 py-3 font-bold rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 ${
                          activeQueueRegistration
                            ? "bg-white text-blue-800 hover:bg-blue-50"
                            : "bg-white/30 text-blue-100 cursor-not-allowed"
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="check-circle" aria-hidden="true" className="lucide lucide-check-circle w-5 h-5"><path d="M21.801 10A10 10 0 1 1 17 3.335" /><path d="m9 11 3 3L22 4" /></svg> Selesai
                      </button>
                      <button disabled={!activeQueueRegistration} className="p-3 bg-blue-800/50 text-white font-bold border border-blue-400/30 rounded-lg hover:bg-blue-800 transition-colors tooltip disabled:cursor-not-allowed disabled:opacity-40" title="Tunda / Lewati">
                        <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="pause-circle" aria-hidden="true" className="lucide lucide-pause-circle w-5 h-5"><circle cx={12} cy={12} r={10} /><line x1={10} x2={10} y1={15} y2={9} /><line x1={14} x2={14} y1={15} y2={9} /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Bagian Kanan: Daftar Antrian (Next in Line) */}
            <div className="w-full lg:w-7/12 flex flex-col h-full">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="list-ordered" aria-hidden="true" className="lucide lucide-list-ordered w-5 h-5 text-gray-400"><path d="M11 5h10" /><path d="M11 12h10" /><path d="M11 19h10" /><path d="M4 4h1v5" /><path d="M4 9h2" /><path d="M6.5 20H3.4c0-1 2.6-1.925 2.6-3.5a1.5 1.5 0 0 0-2.6-1.02" /></svg> Antrian Berikutnya
                  </h3>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <span className="text-xs font-bold text-gray-500 bg-gray-200 px-3 py-1 rounded-full">Sisa: {waitingQueueCount} Pasien</span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">Selesai: {completedQueueCount}</span>
                  </div>
                </div>
                {/* List Antrian */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{scrollbarWidth: 'thin'}}>
                  {waitingQueueRegistrations.length > 0 ? (
                    waitingQueueRegistrations.map((registration, index) => {
                      const isFirst = index === 0;
                      const queueTime = formatQueueTime(registration.createdAt);

                      return (
                        <div
                          key={registration.id}
                          className={`rounded-xl p-4 flex items-center justify-between group transition-all relative overflow-hidden ${
                            isFirst
                              ? "bg-white border-2 border-emerald-100 shadow-sm hover:shadow-md"
                              : "bg-gray-50 border border-gray-100 hover:bg-white hover:border-gray-200"
                          }`}
                        >
                          {isFirst && <div className="absolute w-1 h-full bg-emerald-500 left-0 top-0" />}
                          <div className={`flex items-center gap-4 ${isFirst ? "pl-2" : ""}`}>
                            <div
                              title={`Pasien ${queueInitials(registration)}`}
                              className={`w-16 h-16 rounded-lg flex flex-col items-center justify-center ${
                                isFirst
                                  ? "bg-emerald-50 border border-emerald-100 text-emerald-800"
                                  : "bg-white border border-gray-200 text-gray-600"
                              }`}
                            >
                              <span className={`text-[10px] font-bold uppercase ${isFirst ? "text-emerald-500" : "text-gray-400"}`}>Nomor</span>
                              <span className="font-black text-xl">{registration.queueNumber}</span>
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h4 className={`font-bold text-gray-900 ${isFirst ? "text-lg" : "text-base"}`}>{registration.nama}</h4>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                    isFirst
                                      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                      : "bg-gray-100 text-gray-500 border-gray-200"
                                  }`}
                                >
                                  {isFirst ? "Siap Dipanggil" : "Menunggu"}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mb-1">{registration.keluhan}</p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase">
                                Tujuan: {registration.tujuan}
                                {queueTime ? ` - ${queueTime} WIB` : ""}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            data-action="show-panggil-modal"
                            data-queue-id={registration.id}
                            data-queue-number={registration.queueNumber}
                            data-patient-name={registration.nama}
                            className={`px-5 py-2.5 border font-bold rounded-lg transition-colors flex items-center gap-2 text-sm shadow-sm group-hover:shadow ${
                              isFirst
                                ? "bg-gray-50 border-gray-200 text-gray-700 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200"
                                : "bg-white border-gray-200 text-gray-500 hover:text-blue-700 hover:bg-blue-50 hover:border-blue-200"
                            }`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="mic" aria-hidden="true" className="lucide lucide-mic w-4 h-4"><path d="M12 19v3" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><rect x={9} y={2} width={6} height={13} rx={3} /></svg> Panggil
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-100 bg-white text-indigo-600 shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><rect width={18} height={18} x={3} y={3} rx={2} ry={2}/><rect width={3} height={3} x={7} y={7}/><rect width={3} height={3} x={14} y={7}/><rect width={3} height={3} x={7} y={14}/><path d="M14 14h.01"/><path d="M14 17h.01"/><path d="M17 14h.01"/><path d="M17 17h.01"/></svg>
                      </div>
                      <h4 className="text-base font-black text-gray-900">Belum ada pendaftaran QR</h4>
                      <p className="mt-1 max-w-sm text-sm leading-relaxed text-gray-500">
                        Daftar antrian akan terisi otomatis setelah pasien mengirim formulir dari QR pendaftaran.
                      </p>
                      <span className="mt-4 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        Selesai hari ini: {completedQueueCount}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* PAGE NOTIFIKASI (Notification Center) */}
        <div id="page-notifikasi" className={pageClass("notifikasi", " h-full flex flex-col")}>
          {/* Header */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="bell" aria-hidden="true" className="lucide lucide-bell w-5 h-5 text-yellow-600"><path d="M10.268 21a2 2 0 0 0 3.464 0" /><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" /></svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Pusat Notifikasi</h3>
                <p className="text-xs text-gray-500">Pembaruan sistem, pengingat, dan status pasien terbaru</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="relative w-full sm:w-64">
                <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="search" aria-hidden="true" className="lucide lucide-search w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"><path d="m21 21-4.34-4.34" /><circle cx={11} cy={11} r={8} /></svg>
                <input type="text" placeholder="Cari notifikasi..." className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-yellow-500 transition-colors" />
              </div>
              <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 whitespace-nowrap tooltip" title="Tandai Semua Dibaca">
                <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="check-square" aria-hidden="true" className="lucide lucide-check-square w-4 h-4"><path d="M21 10.656V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12.344" /><path d="m9 11 3 3L22 4" /></svg> Tandai Dibaca
              </button>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
            {/* Kiri: Filter Kategori Notifikasi */}
            <div className="w-full lg:w-1/4 xl:w-1/5 flex flex-col gap-2 overflow-y-auto hide-scrollbar">
              <button className="w-full text-left p-3 rounded-lg bg-yellow-50 text-yellow-700 border border-yellow-200 shadow-sm transition-all flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="inbox" aria-hidden="true" className="lucide lucide-inbox w-4 h-4 text-yellow-600"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg>
                  <span className="text-sm font-bold">Semua Pesan</span>
                </div>
                <span className="bg-yellow-200 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded-full">12</span>
              </button>
              <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 text-gray-600 border border-transparent hover:border-gray-200 transition-all flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="calendar-heart" aria-hidden="true" className="lucide lucide-calendar-heart w-4 h-4"><path d="M12.127 22H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5.125" /><path d="M14.62 18.8A2.25 2.25 0 1 1 18 15.836a2.25 2.25 0 1 1 3.38 2.966l-2.626 2.856a.998.998 0 0 1-1.507 0z" /><path d="M16 2v4" /><path d="M3 10h18" /><path d="M8 2v4" /></svg>
                  <span className="text-sm font-semibold">Booking &amp; Jadwal</span>
                </div>
                <span className="text-[10px] font-bold text-gray-400">4</span>
              </button>
              <button className="w-full text-left p-3 rounded-lg hover:bg-rose-50 text-gray-600 border border-transparent hover:border-rose-100 transition-all flex items-center justify-between group">
                <div className="flex items-center gap-3 group-hover:text-rose-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="alert-circle" aria-hidden="true" className="lucide lucide-alert-circle w-4 h-4"><circle cx={12} cy={12} r={10} /><line x1={12} x2={12} y1={8} y2={12} /><line x1={12} x2="12.01" y1={16} y2={16} /></svg>
                  <span className="text-sm font-semibold">Prioritas Darurat</span>
                </div>
                <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm shadow-rose-500/20">3</span>
              </button>
              <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 text-gray-600 border border-transparent hover:border-gray-200 transition-all flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="flask-conical" aria-hidden="true" className="lucide lucide-flask-conical w-4 h-4"><path d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2" /><path d="M6.453 15h11.094" /><path d="M8.5 2h7" /></svg>
                  <span className="text-sm font-semibold">Hasil Lab &amp; Rontgen</span>
                </div>
                <span className="text-[10px] font-bold text-gray-400">5</span>
              </button>
              <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 text-gray-600 border border-transparent hover:border-gray-200 transition-all flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="cog" aria-hidden="true" className="lucide lucide-cog w-4 h-4"><path d="M11 10.27 7 3.34" /><path d="m11 13.73-4 6.93" /><path d="M12 22v-2" /><path d="M12 2v2" /><path d="M14 12h8" /><path d="m17 20.66-1-1.73" /><path d="m17 3.34-1 1.73" /><path d="M2 12h2" /><path d="m20.66 17-1.73-1" /><path d="m20.66 7-1.73 1" /><path d="m3.34 17 1.73-1" /><path d="m3.34 7 1.73 1" /><circle cx={12} cy={12} r={2} /><circle cx={12} cy={12} r={8} /></svg>
                  <span className="text-sm font-semibold">Sistem Administrasi</span>
                </div>
              </button>
            </div>
            {/* Kanan: Notifikasi Feed (Daftar Pesan) */}
            <div className="w-full lg:w-3/4 xl:w-4/5 flex flex-col h-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Feed List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{scrollbarWidth: 'thin'}}>
                {/* Unread: Sistem Darurat */}
                <div className="relative bg-rose-50/50 p-4 rounded-xl border border-rose-100 shadow-[0_2px_10px_-3px_rgba(244,63,94,0.15)] flex gap-4 transition-all">
                  <div className="absolute w-2 h-2 rounded-full bg-rose-500 top-4 right-4 animate-pulse" />
                  <div className="w-10 h-10 rounded-full bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="siren" aria-hidden="true" className="lucide lucide-siren w-5 h-5"><path d="M7 18v-6a5 5 0 1 1 10 0v6" /><path d="M5 21a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2z" /><path d="M21 12h1" /><path d="M18.5 4.5 18 5" /><path d="M2 12h1" /><path d="M12 2v1" /><path d="m4.929 4.929.707.707" /><path d="M12 12v6" /></svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1 pr-4">
                      <h4 className="font-bold text-rose-800 text-sm">Panggilan Triage Darurat (Fast-track)</h4>
                      <span className="text-[10px] text-gray-400 font-semibold">Baru saja</span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed mb-3">Pasien <strong className="text-gray-800">Bpk.
                        Haryono</strong> (Kasus Perdarahan Akut) telah tiba di UGD Dental. Menunggu kehadiran dokter
                      segera di Ruang Tindakan Bedah.</p>
                    <div className="flex gap-2">
                      <button data-page-id="detail-notifikasi" className="px-4 py-1.5 bg-rose-600 text-white text-[11px] font-bold rounded-lg shadow-sm hover:bg-rose-700 transition-colors">Lihat
                        Detail Kasus</button>
                      <button className="px-4 py-1.5 bg-white border border-rose-200 text-rose-700 text-[11px] font-bold rounded-lg shadow-sm hover:bg-rose-50 transition-colors">Tanda
                        Telah Dibaca</button>
                    </div>
                  </div>
                </div>
                {/* Unread: Baru Booking */}
                <div className="relative bg-blue-50/30 p-4 rounded-xl border border-blue-100 shadow-sm flex gap-4 transition-all">
                  <div className="absolute w-2 h-2 rounded-full bg-blue-500 top-4 right-4" />
                  <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="calendar-plus" aria-hidden="true" className="lucide lucide-calendar-plus w-5 h-5"><path d="M16 19h6" /><path d="M16 2v4" /><path d="M19 16v6" /><path d="M21 12.598V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8.5" /><path d="M3 10h18" /><path d="M8 2v4" /></svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1 pr-4">
                      <h4 className="font-bold text-blue-800 text-sm">Permintaan Booking Baru (VVIP)</h4>
                      <span className="text-[10px] text-gray-400 font-semibold">10 Menit yang lalu</span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed mb-3">Pasien <strong className="text-gray-800">Ny. Kartini
                        Setiawan</strong> meminta slot waktu besok pukul 10:00 untuk Konsultasi Estetika Gigi (Veneer).
                    </p>
                    <div className="flex gap-2">
                      <button data-page-id="detail-booking-vvip" className="px-3 py-1 bg-white border border-gray-200 text-gray-600 text-[10px] font-bold rounded shadow-sm hover:bg-gray-50 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="check" aria-hidden="true" className="lucide lucide-check w-3 h-3 inline"><path d="M20 6 9 17l-5-5" /></svg> Konfirmasi Booking</button>
                    </div>
                  </div>
                </div>
                {/* Read: Hasil Lab */}
                <div className="p-4 rounded-xl border border-gray-100 bg-white flex gap-4 transition-all opacity-70 hover:opacity-100">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="microscope" aria-hidden="true" className="lucide lucide-microscope w-5 h-5"><path d="M6 18h8" /><path d="M3 22h18" /><path d="M14 22a7 7 0 1 0 0-14h-1" /><path d="M9 14h2" /><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z" /><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" /></svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-semibold text-gray-800 text-sm">Hasil Lab / Rontgen Siap</h4>
                      <span className="text-[10px] text-gray-400 font-medium">1 Jam yang lalu</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed mb-2">Hasil foto rontgen panoramik untuk pasien <span className="font-medium">Kevin Andhika</span> telah diunggah oleh bagian Radiologi.</p>
                    <button className="text-[10px] items-center flex gap-1 font-bold text-emerald-600 hover:underline"><svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="file-image" aria-hidden="true" className="lucide lucide-file-image w-3 h-3"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /><path d="M14 2v5a1 1 0 0 0 1 1h5" /><circle cx={10} cy={12} r={2} /><path d="m20 17-1.296-1.296a2.41 2.41 0 0 0-3.408 0L9 22" /></svg> Buka Lampiran EHR</button>
                  </div>
                </div>
                {/* Read: System */}
                <div className="p-4 rounded-xl border border-gray-100 bg-white flex gap-4 transition-all opacity-60 hover:opacity-100">
                  <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="server" aria-hidden="true" className="lucide lucide-server w-5 h-5"><rect width={20} height={8} x={2} y={2} rx={2} ry={2} /><rect width={20} height={8} x={2} y={14} rx={2} ry={2} /><line x1={6} x2="6.01" y1={6} y2={6} /><line x1={6} x2="6.01" y1={18} y2={18} /></svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-semibold text-gray-700 text-sm">Update Sistem Aplikasi Klinik</h4>
                      <span className="text-[10px] text-gray-400 font-medium">Kmrn, 23:00</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">Versi sistem EHR telah diperbarui ke v3.4.1.
                      Penyederhanaan form rekam medis selesai dimuat.</p>
                  </div>
                </div>
              </div>
              {/* Pagination/Footer */}
              <div className="p-3 border-t border-gray-100 bg-gray-50 text-center">
                <button className="text-xs font-bold text-yellow-600 hover:text-yellow-700 hover:underline">Muat Lebih Banyak
                  Notifikasi (8)</button>
              </div>
            </div>
          </div>
        </div>
        {/* PAGE DETAIL NOTIFIKASI */}
        <div id="page-detail-notifikasi" className={pageClass("detail-notifikasi", " h-full overflow-y-auto")} style={{scrollbarWidth: 'thin', paddingBottom: '2rem'}}>
          {/* Top Action Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <button data-page-id="notifikasi" className="px-4 py-2 bg-white border border-gray-200 text-gray-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="arrow-left" aria-hidden="true" className="lucide lucide-arrow-left w-4 h-4"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg> Batal &amp; Kembali
            </button>
            <div className="flex gap-2 w-full sm:w-auto">
              <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="printer" aria-hidden="true" className="lucide lucide-printer w-4 h-4"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" /><rect x={6} y={14} width={12} height={8} rx={1} /></svg> Cetak Berkas
              </button>
              <button className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-black hover:bg-emerald-700 shadow-sm shadow-emerald-500/30 flex items-center justify-center gap-2 flex-1 transition-colors">
                Tandai Ditinjau
              </button>
            </div>
          </div>
          {/* Info Banner */}
          <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-xl mb-6 flex gap-4 items-start shadow-sm">
            <div>
              <h4 className="text-emerald-800 font-bold text-sm">Status: Notifikasi Klinis</h4>
              <p className="text-emerald-700/80 text-xs mt-1">Tinjau informasi pasien, riwayat medis, dan catatan kunjungan sebelum memperbarui status layanan.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Kolom Utama: Identitas & Tanda Vital */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/30 border border-gray-100 p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center text-gray-500 font-black text-xl border border-gray-200 shadow-inner">
                    HR
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900">Bpk. Haryono</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Laki-laki • 58 Tahun</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-xs text-gray-500 font-medium">Golongan Darah</span>
                    <span className="text-sm font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">O+</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-xs text-gray-500 font-medium">Alergi Obat</span>
                    <span className="text-sm font-bold text-gray-800">Penisilin</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-xs text-gray-500 font-medium">Riwayat Kondisi</span>
                    <span className="text-sm font-bold text-gray-800 text-right">Hipertensi Level 1</span>
                  </div>
                </div>
              </div>
              {/* Vital Signs Darurat */}
              <div className="bg-gray-900 rounded-2xl shadow-xl shadow-gray-900/20 border border-gray-800 p-6 text-white relative overflow-hidden group">
                <div className="absolute -right-10 -top-10 text-white/5 opacity-50 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="activity" aria-hidden="true" className="lucide lucide-activity w-48 h-48"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" /></svg>
                </div>
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-5 flex items-center gap-2 relative z-10"><svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="heart-pulse" aria-hidden="true" className="lucide lucide-heart-pulse w-4 h-4 text-rose-500 animate-pulse"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" /><path d="M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" /></svg> Tanda Vital Triage</h3>
                <div className="grid grid-cols-2 gap-4 relative z-10">
                  <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700/50">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Tekanan Darah</p>
                    <p className="text-xl font-black text-rose-400">150/95 <span className="text-[10px] font-normal text-gray-500 uppercase">mmHg</span></p>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700/50">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Heart Rate</p>
                    <p className="text-xl font-black text-yellow-400">110 <span className="text-[10px] font-normal text-gray-500 uppercase">BPM</span></p>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700/50">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Saturasi O2</p>
                    <p className="text-xl font-black text-emerald-400">97 <span className="text-[10px] font-normal text-gray-500 uppercase">%</span></p>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700/50">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Suhu</p>
                    <p className="text-xl font-black text-white">36.8 <span className="text-[10px] font-normal text-gray-500 uppercase">°C</span></p>
                  </div>
                </div>
              </div>
            </div>
            {/* Kolom Sekunder: Timeline & Deskripsi */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/30 border border-gray-100 p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-50 to-red-50 flex items-center justify-center text-rose-600 shadow-sm border border-rose-100/50">
                    <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="file-text" aria-hidden="true" className="lucide lucide-file-text w-5 h-5"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /><path d="M14 2v5a1 1 0 0 0 1 1h5" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Catatan Kasus (Perdarahan Akut)</h3>
                    <p className="text-xs text-gray-500">Direkam oleh Ns. Vina (UGD Triage)</p>
                  </div>
                </div>
                <div className="prose prose-sm max-w-none text-gray-600 mb-8">
                  <p>Pasien datang ke UGD klinik dengan keluhan perdarahan aktif pasca pencabutan gigi (ekstraksi gigi geraham bungsu / M3 bawah kanan) yang dilakukan di klinik luar kurang lebih 4 jam yang lalu. Perdarahan tidak berhenti walau sudah menggigit tampon bertenaga.</p>
                  <p>Observasi awal menunjukkan bekuan darah (blood clot) gagal terbentuk (<em>secondary hemorrhage</em>). Tampak darah segar mengalir dari soket gigi 48. Pasien tampak sedikit pucat dan cemas namun kesadaran kompos mentis (GCS 15).</p>
                  <h4 className="text-rose-700 uppercase tracking-widest text-[10px] font-black mt-6 mb-2">Diagnosis Sementara:</h4>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Hemorrhagia post-ekstraksi gigi 48</li>
                    <li>Anxietas ringan komorbid Hipertensi tak terkontrol</li>
                  </ul>
                </div>
                {/* Timeline Medis */}
                <div>
                  <h4 className="text-gray-400 uppercase tracking-widest text-[10px] font-black mb-4">Urutan Kejadian (Timeline)</h4>
                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-rose-100 text-rose-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                        <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="siren" aria-hidden="true" className="lucide lucide-siren w-4 h-4"><path d="M7 18v-6a5 5 0 1 1 10 0v6" /><path d="M5 21a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2z" /><path d="M21 12h1" /><path d="M18.5 4.5 18 5" /><path d="M2 12h1" /><path d="M12 2v1" /><path d="m4.929 4.929.707.707" /><path d="M12 12v6" /></svg>
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-center justify-between space-x-2 mb-1">
                          <div className="font-bold text-gray-900 text-sm">Pasien Tiba di UGD</div>
                          <time className="text-[10px] font-bold text-rose-500">Baru Saja</time>
                        </div>
                        <div className="text-xs text-gray-500 text-balance">Pasien diantar keluarga dalam kondisi memegang rahang kanan.</div>
                      </div>
                    </div>
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-emerald-100 text-emerald-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                        <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="stethoscope" aria-hidden="true" className="lucide lucide-stethoscope w-4 h-4"><path d="M11 2v2" /><path d="M5 2v2" /><path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1" /><path d="M8 15a6 6 0 0 0 12 0v-3" /><circle cx={20} cy={10} r={2} /></svg>
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-center justify-between space-x-2 mb-1">
                          <div className="font-bold text-gray-900 text-sm">Pemeriksaan Awal (Triage)</div>
                          <time className="text-[10px] font-bold text-gray-400">5 Mnt lalu</time>
                        </div>
                        <div className="text-xs text-gray-500 text-balance">Pemasangan pulse oxymeter dan tensimeter. Bebat tekan sementara.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* PAGE DETAIL BOOKING VVIP */}
        <div id="page-detail-booking-vvip" className={pageClass("detail-booking-vvip", " h-full overflow-y-auto")} style={{scrollbarWidth: 'thin', paddingBottom: '2rem'}}>
          {/* Top Action Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <button data-page-id="notifikasi" className="px-4 py-2 bg-white border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="arrow-left" aria-hidden="true" className="lucide lucide-arrow-left w-4 h-4"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg> Batal &amp; Kembali
            </button>
            <div className="flex gap-2 w-full sm:w-auto">
              <button className="px-4 py-2 bg-white border border-gray-200 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-50 flex items-center gap-2 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="x" aria-hidden="true" className="lucide lucide-x w-4 h-4"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg> Tolak / Jadwal Ulang
              </button>
              <button data-action="show-jadwal-modal" className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-black hover:bg-blue-700 shadow-sm shadow-blue-500/30 flex items-center justify-center gap-2 flex-1 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="calendar-check" aria-hidden="true" className="lucide lucide-calendar-check w-4 h-4"><path d="M8 2v4" /><path d="M16 2v4" /><rect width={18} height={18} x={3} y={4} rx={2} /><path d="M3 10h18" /><path d="m9 16 2 2 4-4" /></svg> Terima &amp; Konfirmasi Jadwal
              </button>
            </div>
          </div>
          {/* Info Banner VVIP */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 border-l-4 border-yellow-400 p-5 rounded-r-xl mb-6 flex gap-4 items-center shadow-lg text-white">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0 border border-white/30">
              <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="star" aria-hidden="true" className="lucide lucide-star w-6 h-6 text-yellow-400 fill-yellow-400"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" /></svg>
            </div>
            <div>
              <h4 className="text-white font-black text-base flex items-center gap-2">Prioritas Booking VVIP <span className="bg-yellow-400 text-blue-900 text-[10px] uppercase font-black px-2 py-0.5 rounded-full">Membership Plus</span></h4>
              <p className="text-blue-100 text-sm mt-1">Pasien premium meminta konfirmasi slot waktu eksklusif. Mohon prioritaskan penjadwalan sesuai ketersediaan.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Kolom Kiri: Profil Pasien VVIP */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/30 border border-gray-100 p-6 flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-blue-50 rounded-full flex items-center justify-center text-indigo-600 font-black text-3xl border-4 border-white shadow-xl mb-4 relative">
                  KS
                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-yellow-400 border-2 border-white rounded-full flex items-center justify-center text-blue-900">
                    <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="star" aria-hidden="true" className="lucide lucide-star w-3 h-3 fill-blue-900"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" /></svg>
                  </div>
                </div>
                <h2 className="text-xl font-black text-gray-900">Ny. Kartini Setiawan</h2>
                <p className="text-sm font-bold text-gray-400 mt-1 mb-4">Nomor Rekam Medis: #RM-99081</p>
                <div className="w-full flex justify-between gap-4 mb-4">
                  <div className="flex-1 bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Kunjungan</p>
                    <p className="text-xl font-black text-gray-800">14<span className="text-xs font-medium text-gray-500">x</span></p>
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">No. Telp</p>
                    <p className="text-xs font-bold text-indigo-600 mt-2">0812-990X-XXXX</p>
                  </div>
                </div>
                <button className="w-full py-2.5 text-blue-600 font-bold bg-blue-50 hover:bg-blue-100 rounded-lg text-sm transition-colors mt-2">
                  Buka Riwayat EHR Lengkap
                </button>
              </div>
            </div>
            {/* Kolom Kanan: Detail Request & Jadwal */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/30 border border-gray-100 p-6 sm:p-8">
                <h3 className="font-bold text-gray-900 text-lg mb-6 border-b border-gray-100 pb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="file-check-2" aria-hidden="true" className="lucide lucide-file-check-2 w-5 h-5 text-indigo-500"><path d="M10.5 22H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v6" /><path d="M14 2v5a1 1 0 0 0 1 1h5" /><path d="m14 20 2 2 4-4" /></svg> Detail Rencana Konsultasi
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                  {/* Jadwal Diminta */}
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Jadwal yang Diminta</p>
                    <div className="flex items-center gap-3 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="calendar" aria-hidden="true" className="lucide lucide-calendar w-5 h-5 text-blue-600"><path d="M8 2v4" /><path d="M16 2v4" /><rect width={18} height={18} x={3} y={4} rx={2} /><path d="M3 10h18" /></svg>
                      <span className="font-black text-gray-800">Besok, 13 Oktober 2023</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="clock" aria-hidden="true" className="lucide lucide-clock w-5 h-5 text-blue-600"><circle cx={12} cy={12} r={10} /><path d="M12 6v6l4 2" /></svg>
                      <span className="font-black text-gray-800 text-lg">10:00 - 11:00 WIB</span>
                    </div>
                  </div>
                  {/* Layanan / Tindakan */}
                  <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Layanan Utama</p>
                    <div className="flex items-start gap-3 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="sparkles" aria-hidden="true" className="lucide lucide-sparkles w-5 h-5 text-indigo-600 mt-0.5"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" /><path d="M20 2v4" /><path d="M22 4h-4" /><circle cx={4} cy={20} r={2} /></svg>
                      <div>
                        <span className="font-black text-gray-800">Konsultasi Estetika Gigi (Veneer)</span>
                        <p className="text-xs text-gray-500 mt-1">Konsultasi lanjutan untuk persiapan pemasangan Veneer Porcelain di lengkung rahang atas.</p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Slot Availability Checker */}
                <h4 className="text-gray-400 uppercase tracking-widest text-[10px] font-black mb-4">Status Ketersediaan Slot Waktu (Besok)</h4>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="relative flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                    <div className="flex-1 text-center font-bold text-gray-400 text-sm">09:00</div>
                    <div className="flex-1 text-center font-black text-blue-700 text-base bg-blue-100 py-1 rounded">10:00 (Diminta)</div>
                    <div className="flex-1 text-center font-bold text-gray-400 text-sm">11:00</div>
                    <div className="flex-1 text-center font-bold text-orange-500 text-sm opacity-50">12:00 (Terisi)</div>
                  </div>
                  <p className="text-xs text-emerald-600 font-bold flex items-center gap-2 bg-emerald-50 p-2 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="check-circle-2" aria-hidden="true" className="lucide lucide-check-circle-2 w-4 h-4"><circle cx={12} cy={12} r={10} /><path d="m9 12 2 2 4-4" /></svg> Slot waktu 10:00 saat ini KOSONG dan tersedia untuk dikonfirmasi.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* PAGE ANALITIK (Analytics Dashboard) */}
        <div id="page-analitik" className={pageClass("analitik", " h-full overflow-y-auto")} style={{scrollbarWidth: 'thin'}}>
          {/* Header & Action Bar */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="pie-chart" aria-hidden="true" className="lucide lucide-pie-chart w-5 h-5 text-violet-600"><path d="M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z" /><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /></svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Analitik &amp; Performa</h3>
                <p className="text-xs text-gray-500">Statistik klinik, distribusi pasien, dan efisiensi waktu</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-1">
                <button className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-800 rounded transition-colors">Minggu
                  Ini</button>
                <button className="px-3 py-1.5 text-xs font-bold bg-white text-violet-700 shadow-sm rounded-md border border-gray-100">Bulan
                  Ini</button>
                <button className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-800 rounded transition-colors">Tahun
                  Ini</button>
              </div>
              <button className="px-4 py-2 bg-violet-600 border border-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 transition-colors flex items-center gap-2 shadow-sm shadow-violet-600/30 whitespace-nowrap">
                <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="download" aria-hidden="true" className="lucide lucide-download w-4 h-4"><path d="M12 15V3" /><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5" /></svg> Export Data
              </button>
            </div>
          </div>
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col group hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="users" aria-hidden="true" className="lucide lucide-users w-6 h-6"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><path d="M16 3.128a4 4 0 0 1 0 7.744" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><circle cx={9} cy={7} r={4} /></svg>
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="trending-up" aria-hidden="true" className="lucide lucide-trending-up w-3 h-3"><path d="M16 7h6v6" /><path d="m22 7-8.5 8.5-5-5L2 17" /></svg> +12%</span>
              </div>
              <h4 className="text-3xl font-black text-gray-900 mb-1">342</h4>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Pasien Bulan Ini</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col group hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="clock" aria-hidden="true" className="lucide lucide-clock w-6 h-6"><circle cx={12} cy={12} r={10} /><path d="M12 6v6l4 2" /></svg>
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="trending-down" aria-hidden="true" className="lucide lucide-trending-down w-3 h-3"><path d="M16 17h6v-6" /><path d="m22 17-8.5-8.5-5 5L2 7" /></svg> -5m</span>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <h4 className="text-3xl font-black text-gray-900">18</h4><span className="text-sm font-bold text-gray-500">Menit</span>
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Rata-rata Waktu Tunggu</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col group hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="check-square" aria-hidden="true" className="lucide lucide-check-square w-6 h-6"><path d="M21 10.656V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12.344" /><path d="m9 11 3 3L22 4" /></svg>
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="trending-up" aria-hidden="true" className="lucide lucide-trending-up w-3 h-3"><path d="M16 7h6v6" /><path d="m22 7-8.5 8.5-5-5L2 17" /></svg> +3%</span>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <h4 className="text-3xl font-black text-gray-900">92</h4><span className="text-sm font-bold text-gray-500">%</span>
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tingkat Kehadiran Booking</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col group hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="heart-pulse" aria-hidden="true" className="lucide lucide-heart-pulse w-6 h-6"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" /><path d="M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" /></svg>
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="minus" aria-hidden="true" className="lucide lucide-minus w-3 h-3"><path d="M5 12h14" /></svg> Tepat</span>
              </div>
              <h4 className="text-3xl font-black text-gray-900 mb-1">14</h4>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Kasus Darurat (Triage)</p>
            </div>
          </div>
          {/* Charts Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Chart: Kunjungan Jam Sibuk */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:col-span-2">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="font-bold text-gray-800 text-lg">Distribusi Jam Sibuk Pasien</h4>
                  <p className="text-[11px] text-gray-500">Rataan volume pengunjung per jam operasional</p>
                </div>
                <button className="text-gray-400 hover:text-violet-600"><svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="more-horizontal" aria-hidden="true" className="lucide lucide-more-horizontal w-5 h-5"><circle cx={12} cy={12} r={1} /><circle cx={19} cy={12} r={1} /><circle cx={5} cy={12} r={1} /></svg></button>
              </div>
              <div className="flex items-end justify-between h-48 gap-2 relative">
                {/* Y-Axis */}
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-gray-400 font-medium pb-5 pr-2 border-r border-gray-100">
                  <span>100%</span>
                  <span>75%</span>
                  <span>50%</span>
                  <span>25%</span>
                </div>
                {/* Bar Graphs */}
                <div className="flex items-end justify-around w-full h-full pl-8 pb-5 relative group">
                  <div className="absolute bottom-5 w-full h-[1px] bg-gray-100/50" />
                  <div className="absolute bottom-1/2 w-full h-[1px] bg-gray-100 border-dashed border-t" />
                  <div className="absolute top-0 w-full h-[1px] bg-gray-100 border-dashed border-t" />
                  <div className="w-[10%] bg-violet-100 transition-colors rounded-t-lg relative group/bar hover:bg-violet-500" style={{height: '30%'}}>
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold text-violet-700 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-violet-50 px-2 py-0.5 rounded shadow">15</span>
                  </div>
                  <div className="w-[10%] bg-violet-200 transition-colors rounded-t-lg relative group/bar hover:bg-violet-500" style={{height: '48%'}}>
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold text-violet-700 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-violet-50 px-2 py-0.5 rounded shadow">24</span>
                  </div>
                  <div className="w-[10%] bg-violet-300 transition-colors rounded-t-lg relative group/bar hover:bg-violet-500" style={{height: '70%'}}>
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold text-violet-700 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-violet-50 px-2 py-0.5 rounded shadow">35</span>
                  </div>
                  {/* Peak Time Highlight */}
                  <div className="w-[10%] bg-violet-500 transition-colors rounded-t-lg relative group/bar shadow-lg shadow-violet-500/20 hover:bg-violet-600" style={{height: '95%'}}>
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold text-violet-800 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-violet-100 border border-violet-200 px-2 py-0.5 rounded shadow-sm z-10">48</span>
                  </div>
                  <div className="w-[10%] bg-violet-400 transition-colors rounded-t-lg relative group/bar hover:bg-violet-600" style={{height: '80%'}}>
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold text-violet-700 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-violet-50 px-2 py-0.5 rounded shadow">40</span>
                  </div>
                  <div className="w-[10%] bg-violet-200 transition-colors rounded-t-lg relative group/bar hover:bg-violet-500" style={{height: '40%'}}>
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold text-violet-700 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-violet-50 px-2 py-0.5 rounded shadow">20</span>
                  </div>
                  <div className="w-[10%] bg-violet-100 transition-colors rounded-t-lg relative group/bar hover:bg-violet-500" style={{height: '25%'}}>
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold text-violet-700 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-violet-50 px-2 py-0.5 rounded shadow">12</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-around pl-8 text-[10px] text-gray-400 font-bold mt-2">
                <span>08:00</span>
                <span>10:00</span>
                <span>12:00</span>
                <span className="text-violet-600">14:00</span>
                <span>16:00</span>
                <span>18:00</span>
                <span>20:00</span>
              </div>
            </div>
            {/* Chart: Demografi Pasien */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:col-span-1 flex flex-col h-full">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h4 className="font-bold text-gray-800 text-lg">Demografi Pasien</h4>
                  <p className="text-[11px] text-gray-500">Rasio berdasarkan usia (Bulan Ini)</p>
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-center items-center gap-6 mt-4">
                {/* Custom CSS Pie Chart Simulative */}
                <div className="relative w-40 h-40 rounded-full flex items-center justify-center bg-gray-50 shadow-sm" style={{background: 'conic-gradient(#8b5cf6 0% 45%, #ec4899 45% 75%, #0ea5e9 75% 100%)'}}>
                  <div className="absolute w-28 h-28 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                    <span className="font-black text-2xl text-gray-800">342</span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Total</span>
                  </div>
                </div>
                {/* Legend */}
                <div className="w-full flex justify-between px-2 gap-2 text-xs">
                  <div className="flex flex-col gap-1 items-center">
                    <div className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-violet-500" /><span className="font-bold text-gray-700">Dewasa</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-semibold">45%</span>
                  </div>
                  <div className="flex flex-col gap-1 items-center">
                    <div className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-pink-500" /><span className="font-bold text-gray-700">Anak/Balita</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-semibold">30%</span>
                  </div>
                  <div className="flex flex-col gap-1 items-center">
                    <div className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-sky-500" /><span className="font-bold text-gray-700">Lansia</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-semibold">25%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Tabel Top Diagnosa */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="clipboard-list" aria-hidden="true" className="lucide lucide-clipboard-list w-5 h-5 text-gray-400"><rect width={8} height={4} x={8} y={2} rx={1} ry={1} /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" /></svg> Top 5 Diagnosa Penyakit (ICD-10)</h4>
                <p className="text-[11px] text-gray-500">Distribusi jumlah kasus klinis terbanyak yang ditangani bulan ini</p>
              </div>
              <button className="text-sm font-bold text-violet-600 hover:text-violet-700 hover:underline">Lihat Semua
                Laporan</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-white text-gray-400 text-[10px] font-bold uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 w-16">Rank</th>
                    <th className="px-6 py-4">Kode ICD-10</th>
                    <th className="px-6 py-4">Nama Diagnosa Klinis</th>
                    <th className="px-6 py-4">Kategori Layanan</th>
                    <th className="px-6 py-4">Total Kasus</th>
                    <th className="px-6 py-4">Tren</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <tr className="hover:bg-violet-50/30 transition-colors group">
                    <td className="px-6 py-4 font-black text-violet-600 text-base">#1</td>
                    <td className="px-6 py-4"><span className="font-mono text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200">K02.1</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-800">Caries of Dentine (Karies Gigi)</td>
                    <td className="px-6 py-4"><span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">Konservasi</span></td>
                    <td className="px-6 py-4 font-bold text-gray-900">124 Kasus</td>
                    <td className="px-6 py-4"><span className="flex items-center gap-1 text-emerald-500 text-xs font-bold"><svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="trending-up" aria-hidden="true" className="lucide lucide-trending-up w-4 h-4"><path d="M16 7h6v6" /><path d="m22 7-8.5 8.5-5-5L2 17" /></svg> +8%</span></td>
                  </tr>
                  <tr className="hover:bg-violet-50/30 transition-colors group">
                    <td className="px-6 py-4 font-bold text-gray-400 text-base group-hover:text-violet-500">#2</td>
                    <td className="px-6 py-4"><span className="font-mono text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200">K04.0</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-800">Pulpitis (Radang Pulpa Akut)</td>
                    <td className="px-6 py-4"><span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded">Endodontik</span></td>
                    <td className="px-6 py-4 font-bold text-gray-900">89 Kasus</td>
                    <td className="px-6 py-4"><span className="flex items-center gap-1 text-emerald-500 text-xs font-bold"><svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="trending-up" aria-hidden="true" className="lucide lucide-trending-up w-4 h-4"><path d="M16 7h6v6" /><path d="m22 7-8.5 8.5-5-5L2 17" /></svg> +2%</span></td>
                  </tr>
                  <tr className="hover:bg-violet-50/30 transition-colors group">
                    <td className="px-6 py-4 font-bold text-gray-400 text-base group-hover:text-violet-500">#3</td>
                    <td className="px-6 py-4"><span className="font-mono text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200">K01.1</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-800">Impacted Teeth (Gigi Impaksi)</td>
                    <td className="px-6 py-4"><span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded">Bedah Mulut</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">56 Kasus</td>
                    <td className="px-6 py-4"><span className="flex items-center gap-1 text-rose-500 text-xs font-bold"><svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="trending-down" aria-hidden="true" className="lucide lucide-trending-down w-4 h-4"><path d="M16 17h6v-6" /><path d="m22 17-8.5-8.5-5 5L2 7" /></svg> -4%</span></td>
                  </tr>
                  <tr className="hover:bg-violet-50/30 transition-colors group">
                    <td className="px-6 py-4 font-bold text-gray-300 text-base group-hover:text-violet-500">#4</td>
                    <td className="px-6 py-4"><span className="font-mono text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200">K05.0</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-800">Acute Gingivitis (Radang Gusi)</td>
                    <td className="px-6 py-4"><span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Periodonsia</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">42 Kasus</td>
                    <td className="px-6 py-4"><span className="flex items-center gap-1 text-gray-400 text-xs font-bold"><svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="minus" aria-hidden="true" className="lucide lucide-minus w-4 h-4"><path d="M5 12h14" /></svg> Stabil</span></td>
                  </tr>
                  <tr className="hover:bg-violet-50/30 transition-colors group">
                    <td className="px-6 py-4 font-bold text-gray-300 text-base group-hover:text-violet-500">#5</td>
                    <td className="px-6 py-4"><span className="font-mono text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200">K00.6</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-800">Gangguan Erupsi Gigi (Anak)</td>
                    <td className="px-6 py-4"><span className="text-[10px] font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded">Pedodontik</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">31 Kasus</td>
                    <td className="px-6 py-4"><span className="flex items-center gap-1 text-emerald-500 text-xs font-bold"><svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="trending-up" aria-hidden="true" className="lucide lucide-trending-up w-4 h-4"><path d="M16 7h6v6" /><path d="m22 7-8.5 8.5-5-5L2 17" /></svg> +14%</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div id="page-tambah-pasien" className={pageClass("tambah-pasien", " h-full overflow-y-auto")} style={{scrollbarWidth: 'thin', paddingBottom: '2rem'}}>
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <button data-page-id="rekam-medis" className="px-4 py-2 bg-white border border-gray-200 text-gray-600 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 rounded-lg text-sm font-semibold transition-all flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="arrow-left" aria-hidden="true" className="lucide lucide-arrow-left w-4 h-4"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg> Batal &amp; Kembali
          </button>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button className="px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-semibold cursor-pointer w-full sm:w-auto transition-colors">
              Bersihkan Form
            </button>
            <button data-page-id="rekam-medis" className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 shadow-sm shadow-emerald-500/30 flex items-center justify-center gap-2 w-full sm:w-auto transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="save" aria-hidden="true" className="lucide lucide-save w-4 h-4"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" /><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" /><path d="M7 3v4a1 1 0 0 0 1 1h7" /></svg> Simpan Data Pasien
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Kolom Kiri: Data Utama (2 span) */}
          <div className="xl:col-span-2 space-y-6">
            {/* Card: Informasi Pribadi */}
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/30 border border-gray-100 p-6 sm:p-8 hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-300">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100/50">
                  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="user" aria-hidden="true" className="lucide lucide-user w-5 h-5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx={12} cy={7} r={4} /></svg>
                </div>
                <div>
                  <h4 className="text-base font-black text-gray-800 leading-tight">Informasi Pribadi</h4>
                  <p className="text-[11px] text-gray-400 font-medium mt-0.5">Data demografi dasar pasien</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-5 relative">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nama
                    Lengkap Pasien <span className="text-rose-500">*</span></label>
                  <input type="text" className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-700 font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all shadow-sm" placeholder="Cth: Ahmad Surya" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">KTP /
                    NIK</label>
                  <input type="text" className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-700 font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all shadow-sm" placeholder="16 digit angka NIK" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nomor
                    WhatsApp <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <div className="absolute left-0 top-0 bottom-0 px-4 bg-gray-100 border-r border-gray-200 rounded-l-xl flex items-center justify-center">
                      <span className="text-gray-500 font-bold text-sm">+62</span>
                    </div>
                    <input type="text" className="w-full pl-16 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-700 font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all shadow-sm" placeholder="812xxxxxx" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Tanggal
                    Lahir <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="calendar" aria-hidden="true" className="lucide lucide-calendar w-4 h-4 text-emerald-500 absolute left-4 top-1/2 -translate-y-1/2"><path d="M8 2v4" /><path d="M16 2v4" /><rect width={18} height={18} x={3} y={4} rx={2} /><path d="M3 10h18" /></svg>
                    <input type="date" className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-700 font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all shadow-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Jenis
                    Kelamin <span className="text-rose-500">*</span></label>
                  <div className="grid grid-cols-2 gap-3 h-[46px]">
                    <label className="relative flex items-center justify-center gap-2 border border-gray-200 bg-gray-50/50 rounded-xl cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-all [&:has(input:checked)]:bg-blue-50 [&:has(input:checked)]:border-blue-500 [&:has(input:checked)]:text-blue-700 shadow-sm">
                      <input type="radio" name="gender" className="peer hidden" />
                      <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="scan-face" aria-hidden="true" className="lucide lucide-scan-face w-4 h-4 text-gray-400 peer-checked:text-blue-600 transition-colors"><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><path d="M9 9h.01" /><path d="M15 9h.01" /></svg>
                      <span className="text-sm font-bold text-gray-500 peer-checked:text-blue-700 transition-colors">Pria</span>
                    </label>
                    <label className="relative flex items-center justify-center gap-2 border border-gray-200 bg-gray-50/50 rounded-xl cursor-pointer hover:border-rose-300 hover:bg-rose-50/50 transition-all [&:has(input:checked)]:bg-rose-50 [&:has(input:checked)]:border-rose-500 [&:has(input:checked)]:text-rose-700 shadow-sm">
                      <input type="radio" name="gender" className="peer hidden" />
                      <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="scan-face" aria-hidden="true" className="lucide lucide-scan-face w-4 h-4 text-gray-400 peer-checked:text-rose-600 transition-colors"><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><path d="M9 9h.01" /><path d="M15 9h.01" /></svg>
                      <span className="text-sm font-bold text-gray-500 peer-checked:text-rose-700 transition-colors">Wanita</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            {/* Card: Domisili & Kerabat */}
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/30 border border-gray-100 p-6 sm:p-8 hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-300">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100/50">
                  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="map" aria-hidden="true" className="lucide lucide-map w-5 h-5"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z" /><path d="M15 5.764v15" /><path d="M9 3.236v15" /></svg>
                </div>
                <div>
                  <h4 className="text-base font-black text-gray-800 leading-tight">Alamat Rumah &amp; Kontak</h4>
                  <p className="text-[11px] text-gray-400 font-medium mt-0.5">Informasi tempat tinggal dan kontak darurat
                    pasien</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-5">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Alamat
                    Tinggal Lengkap <span className="text-rose-500">*</span></label>
                  <textarea rows={3} className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-700 font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all shadow-sm resize-none" placeholder="Masukkan alamat lengkap berserta RT/RW..." defaultValue={""} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Kota /
                    Kabupaten</label>
                  <div className="relative">
                    <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="building-2" aria-hidden="true" className="lucide lucide-building-2 w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2"><path d="M10 12h4" /><path d="M10 8h4" /><path d="M14 21v-3a2 2 0 0 0-4 0v3" /><path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" /><path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" /></svg>
                    <input type="text" className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-700 font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all shadow-sm" placeholder="Cth: Kota Jakarta" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Kontak
                    Darurat (Kerabat)</label>
                  <div className="relative">
                    <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="phone-forwarded" aria-hidden="true" className="lucide lucide-phone-forwarded w-4 h-4 text-emerald-500 absolute left-4 top-1/2 -translate-y-1/2"><path d="M14 6h8" /><path d="m18 2 4 4-4 4" /><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" /></svg>
                    <input type="text" className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-700 font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all shadow-sm" placeholder="Nama + Hubungan (Siti - Istri)" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Kolom Kanan: Pengaturan Medis & Asuransi */}
          <div className="space-y-6">
            {/* Card: Anamnesis Ringkas */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl shadow-xl shadow-emerald-500/20 border border-emerald-500 p-6 sm:p-8 relative overflow-hidden text-white group">
              <div className="absolute -right-8 -top-8 text-white/5 opacity-50 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
                <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="heart-pulse" aria-hidden="true" className="lucide lucide-heart-pulse w-48 h-48"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" /><path d="M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" /></svg></div>
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white backdrop-blur-md border border-white/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="activity" aria-hidden="true" className="lucide lucide-activity w-5 h-5"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" /></svg>
                </div>
                <div>
                  <h4 className="text-base font-black text-white leading-tight">Profil Medis</h4>
                  <p className="text-[11px] text-emerald-100/80 font-medium mt-0.5">Skrining risiko kesehatan</p>
                </div>
              </div>
              <div className="space-y-5 relative z-10">
                <div>
                  <label className="block text-[10px] font-black text-emerald-200 uppercase tracking-widest mb-2 ml-1">Golongan
                    Darah</label>
                  <div className="grid grid-cols-4 gap-2">
                    <label className="cursor-pointer">
                      <input type="radio" name="blood" className="peer hidden" defaultValue="A" />
                      <div className="text-center py-2.5 bg-black/20 border border-white/10 rounded-xl text-sm font-black text-white peer-checked:bg-white peer-checked:text-emerald-700 peer-checked:shadow-lg hover:bg-white/30 transition-all">
                        A</div>
                    </label>
                    <label className="cursor-pointer">
                      <input type="radio" name="blood" className="peer hidden" defaultValue="B" />
                      <div className="text-center py-2.5 bg-black/20 border border-white/10 rounded-xl text-sm font-black text-white peer-checked:bg-white peer-checked:text-emerald-700 peer-checked:shadow-lg hover:bg-white/30 transition-all">
                        B</div>
                    </label>
                    <label className="cursor-pointer">
                      <input type="radio" name="blood" className="peer hidden" defaultValue="AB" />
                      <div className="text-center py-2.5 bg-black/20 border border-white/10 rounded-xl text-sm font-black text-white peer-checked:bg-white peer-checked:text-emerald-700 peer-checked:shadow-lg hover:bg-white/30 transition-all">
                        AB</div>
                    </label>
                    <label className="cursor-pointer">
                      <input type="radio" name="blood" className="peer hidden" defaultValue="O" />
                      <div className="text-center py-2.5 bg-black/20 border border-white/10 rounded-xl text-sm font-black text-white peer-checked:bg-white peer-checked:text-emerald-700 peer-checked:shadow-lg hover:bg-white/30 transition-all">
                        O</div>
                    </label>
                  </div>
                </div>
                <div className="pt-5 border-t border-white/10">
                  <label className="block text-[10px] font-black text-emerald-200 uppercase tracking-widest mb-2 ml-1">Riwayat
                    Alergi &amp; Penyakit</label>
                  <textarea rows={4} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors shadow-inner placeholder:text-emerald-100/50 resize-none" placeholder="Tuliskan catatan alergi atau penyakit kronis (bisa dikosongkan jika tidak ada)" defaultValue={""} />
                </div>
              </div>
            </div>
            {/* Card: Asuransi */}
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/30 border border-gray-100 p-6 sm:p-8 hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-300 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-16 h-16 bg-amber-500/5 rounded-bl-full" />
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center text-amber-500 shadow-sm border border-amber-100/50">
                  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="credit-card" aria-hidden="true" className="lucide lucide-credit-card w-5 h-5"><rect width={20} height={14} x={2} y={5} rx={2} /><line x1={2} x2={22} y1={10} y2={10} /></svg>
                </div>
                <div>
                  <h4 className="text-base font-black text-gray-800 leading-tight">Tipe Penjaminan</h4>
                  <p className="text-[11px] text-gray-400 font-medium mt-0.5">Metode pendanaan pasien</p>
                </div>
              </div>
              <div className="space-y-3 relative z-10">
                <label className="flex items-start gap-3 p-4 border-2 border-gray-100 rounded-xl cursor-pointer hover:border-amber-300 hover:bg-amber-50/30 transition-all [&:has(input:checked)]:border-amber-500 [&:has(input:checked)]:bg-amber-50">
                  <div className="mt-0.5">
                    <input type="radio" name="insurance" className="w-4 h-4 text-amber-600 focus:ring-amber-500 border-gray-300" defaultChecked />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-800">Pembayaran Pribadi</p>
                    <p className="text-[10px] text-gray-500 font-medium leading-relaxed mt-0.5">Tunai, QRIS, atau Kartu
                      Kredit/Debit secara mandiri.</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-4 border-2 border-gray-100 rounded-xl cursor-pointer hover:border-amber-300 hover:bg-amber-50/30 transition-all [&:has(input:checked)]:border-amber-500 [&:has(input:checked)]:bg-amber-50">
                  <div className="mt-0.5">
                    <input type="radio" name="insurance" className="w-4 h-4 text-amber-600 focus:ring-amber-500 border-gray-300" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-800">BPJS Ketenagakerjaan/Kesehatan</p>
                    <p className="text-[10px] text-gray-500 font-medium leading-relaxed mt-0.5">Ditanggung oleh asuransi
                      pemerintah atau corporate.</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* MODAL SELESAIKAN SESI (Feedback Selesai) */}
      <div id="modal-sesi-selesai" className="fixed inset-0 z-50 hidden">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" data-action="close-finish-modal">
        </div>
        {/* Centered Modal Box */}
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
          <div className="relative bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-sm sm:w-full border border-gray-100">
            {/* Decorative Top Bar */}
            <div className="h-2 w-full bg-emerald-500" />
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 text-center">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 sm:mx-auto mb-4 relative">
                <div className="absolute w-full h-full rounded-full border-4 border-white" />
                <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="check-circle-2" aria-hidden="true" className="lucide lucide-check-circle-2 h-8 w-8 text-emerald-600"><circle cx={12} cy={12} r={10} /><path d="m9 12 2 2 4-4" /></svg>
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-center ml-0">
                <h3 className="text-xl leading-6 font-black text-gray-900 mb-2">Pemeriksaan Selesai!</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-1">Data SOAP dan Rekam Medis pasien <strong>Ahmad Surya</strong>
                    telah berhasil dikonfirmasi dan disimpan ke dalam sistem.</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-4 sm:px-6 flex flex-col justify-center items-center gap-2">
              <button data-action="confirm-finish-session" type="button" className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-2.5 bg-emerald-600 text-base font-semibold text-white hover:bg-emerald-700 focus:outline-none transition-colors sm:text-sm shadow-emerald-500/30">
                Tutup &amp; Kembali ke Jadwal
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* MODAL JADWAL BERHASIL */}
      <div id="modal-jadwal-berhasil" className="fixed inset-0 z-50 hidden">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" data-action="close-jadwal-modal">
        </div>
        {/* Centered Modal Box */}
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
          <div className="relative bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-sm sm:w-full border border-gray-100">
            {/* Decorative Top Bar */}
            <div className="h-2 w-full bg-indigo-500" />
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 text-center">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 sm:mx-auto mb-4 relative">
                <div className="absolute w-full h-full rounded-full border-4 border-white" />
                <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="calendar-check" aria-hidden="true" className="lucide lucide-calendar-check h-8 w-8 text-indigo-600"><path d="M8 2v4" /><path d="M16 2v4" /><rect width={18} height={18} x={3} y={4} rx={2} /><path d="M3 10h18" /><path d="m9 16 2 2 4-4" /></svg>
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-center ml-0">
                <h3 className="text-xl leading-6 font-black text-gray-900 mb-2">Jadwal Disimpan!</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-1">Jadwal baru untuk pasien <strong>Ahmad Surya</strong> berhasil
                    ditambahkan ke kalender.</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-4 sm:px-6 flex flex-col justify-center items-center gap-2">
              <button data-action="confirm-jadwal-modal" type="button" className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-2.5 bg-indigo-600 text-base font-semibold text-white hover:bg-indigo-700 focus:outline-none transition-colors sm:text-sm shadow-indigo-500/30">
                Selesai &amp; Keluar
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* MODAL ANTRIAN SELESAI */}
      <div id="modal-antrian-selesai" className="fixed inset-0 z-50 hidden">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" data-action="close-antrian-selesai-modal">
        </div>
        {/* Centered Modal Box */}
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
          <div className="relative bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-sm sm:w-full border border-gray-100">
            {/* Decorative Top Bar */}
            <div className="h-2 w-full bg-blue-500" />
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 text-center">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 sm:mx-auto mb-4 relative">
                <div className="absolute w-full h-full rounded-full border-4 border-white" />
                <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="check-circle" aria-hidden="true" className="lucide lucide-check-circle h-8 w-8 text-blue-600"><path d="M21.801 10A10 10 0 1 1 17 3.335" /><path d="m9 11 3 3L22 4" /></svg>
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-center ml-0">
                <h3 className="text-xl leading-6 font-black text-gray-900 mb-2">Penanganan Selesai</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-1">
                    Pasien <strong>{activeQueueRegistration?.nama ?? "terpilih"}</strong>{" "}
                    ({activeQueueRegistration?.queueNumber ?? "--"}) telah selesai dilayani.
                    Mempersiapkan antrian selanjutnya...
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-4 sm:px-6 flex flex-col justify-center items-center gap-2">
              <button data-action="confirm-antrian-selesai-modal" type="button" className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-2.5 bg-blue-600 text-base font-semibold text-white hover:bg-blue-700 focus:outline-none transition-colors sm:text-sm shadow-blue-500/30">
                OK &amp; Lanjut Antrian
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* MODAL PANGGIL PASIEN */}
      <div id="modal-panggil-pasien" className="fixed inset-0 z-50 hidden">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" data-action="close-panggil-modal">
        </div>
        {/* Centered Modal Box */}
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
          <div className="relative bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:max-w-sm sm:w-full border border-gray-100 p-8 flex flex-col items-center">
            {/* Ripple Animation Microphone */}
            <div className="relative mb-8 mt-4">
              <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20 scale-150" />
              <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-30 scale-110" style={{animationDelay: '0.2s'}} />
              <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/40 z-10">
                <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-lucide="mic" aria-hidden="true" className="lucide lucide-mic w-10 h-10 text-white"><path d="M12 19v3" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><rect x={9} y={2} width={6} height={13} rx={3} /></svg>
              </div>
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-1 text-center">Memanggil Pasien...</h3>
            <p className="text-sm text-gray-500 mb-6 text-center font-medium">Suara panggilan sedang disiarkan ke ruang tunggu
              poli gigi.</p>
            <div className="bg-blue-50 border border-blue-100 w-full rounded-2xl p-4 mb-6 text-center">
              <p className="text-[10px] uppercase font-black text-blue-400 tracking-widest mb-1">Nomor Antrian</p>
              <h4 id="modal-panggil-nomor" className="text-3xl font-black text-blue-700">--</h4>
              <p id="modal-panggil-nama" className="text-sm font-bold text-gray-700 mt-1">Pasien</p>
            </div>
            <div className="flex gap-3 w-full">
              <button data-action="close-panggil-modal" type="button" className="w-full inline-flex justify-center rounded-xl border border-gray-200 shadow-sm px-4 py-3 bg-white text-sm font-bold text-gray-600 hover:bg-gray-50 focus:outline-none transition-colors">
                Batal Panggilan
              </button>
              <button data-action="close-panggil-modal" type="button" className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-3 bg-blue-600 text-sm font-bold text-white hover:bg-blue-700 focus:outline-none transition-colors shadow-blue-500/30">
                Selesai Memanggil
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* MODAL QR PENDAFTARAN */}
      <div id="modal-qr-pendaftaran" className="fixed inset-0 z-50 hidden" role="dialog" aria-modal="true" aria-labelledby="qr-pendaftaran-title">
        <div className="absolute inset-0 bg-gray-900/55 backdrop-blur-sm transition-opacity" data-action="close-qr-pendaftaran-modal" />
        <div className="flex min-h-screen items-center justify-center px-4 py-8 text-center">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-gray-100 bg-white text-left shadow-2xl">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-indigo-600" />
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 pb-4 pt-6">
              <div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-indigo-500">Registrasi Mandiri</p>
                <h3 id="qr-pendaftaran-title" className="text-xl font-black text-gray-900">QR Pendaftaran Antrian</h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">
                  Pasien dapat membuka formulir pendaftaran dari QR ini.
                </p>
              </div>
              <button type="button" data-action="close-qr-pendaftaran-modal" className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40" aria-label="Tutup QR pendaftaran">
                <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </button>
            </div>

            <div className="px-6 py-6">
              <a href={REGISTRATION_FORM_PATH} target="_blank" rel="noreferrer" aria-label="Buka halaman pendaftaran antrian" className="group block rounded-3xl border border-indigo-100 bg-gradient-to-b from-indigo-50 to-white p-4 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500/40">
                <div className="mx-auto w-full max-w-[15rem] rounded-3xl border border-gray-200 bg-white p-4 shadow-inner">
                  <QRCodeSVG
                    value={REGISTRATION_QR_URL}
                    size={220}
                    level="M"
                    marginSize={2}
                    title="QR pendaftaran antrian"
                    className="aspect-square h-auto w-full"
                  />
                </div>
                <div className="mt-4 rounded-2xl border border-indigo-100 bg-white px-4 py-3">
                  <p className="text-sm font-black text-gray-900">Klik QR untuk membuka formulir</p>
                  <p className="mt-1 break-all text-xs font-semibold text-indigo-600">{REGISTRATION_QR_URL}</p>
                </div>
              </a>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <a href={REGISTRATION_FORM_PATH} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-sm shadow-indigo-500/20 transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40">
                  Buka Formulir
                  <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7" /><path d="M7 7h10v10" /></svg>
                </a>
                <button type="button" data-action="simulate-qr-scan" className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/40">
                  Simulasi Scan
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL FORM PENDAFTARAN DEMO */}
      <div id="modal-form-pendaftaran" className="fixed inset-0 z-50 hidden" role="dialog" aria-modal="true" aria-labelledby="form-pendaftaran-title">
        <div className="absolute inset-0 bg-gray-900/55 backdrop-blur-sm transition-opacity" data-action="close-form-pendaftaran" />
        <div className="flex min-h-screen items-center justify-center px-4 py-8 text-center">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-gray-100 bg-white text-left shadow-2xl">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-indigo-600" />
            <div className="px-6 pb-4 pt-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-indigo-500">Demo Scan QR</p>
                  <h3 id="form-pendaftaran-title" className="text-xl font-black text-gray-900">Input Pendaftaran Pasien</h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-500">
                    Data ini akan menambahkan pasien baru ke daftar antrian demo.
                  </p>
                </div>
                <button type="button" data-action="close-form-pendaftaran" className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40" aria-label="Tutup form pendaftaran">
                  <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="input-nama-pasien-qr" className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-600">
                    Nama Pasien
                  </label>
                  <input id="input-nama-pasien-qr" type="text" placeholder="Contoh: Nadia Permata" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-600">
                    Tujuan Kunjungan
                  </label>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
                    Poli Gigi Umum
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:grid-cols-2">
              <button type="button" data-action="close-form-pendaftaran" className="inline-flex justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-600 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/40">
                Batal
              </button>
              <button type="button" data-action="submit-form-pendaftaran" className="inline-flex justify-center rounded-xl border border-transparent bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-sm shadow-indigo-500/20 transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40">
                Tambahkan Antrian
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
      {/* ==================== SCRIPTS ==================== */}
    </>
  );
}
