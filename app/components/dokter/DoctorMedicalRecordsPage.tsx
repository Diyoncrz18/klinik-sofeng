"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarCheck,
  Eye,
  FileText,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";

import { appointmentTitle } from "@/lib/appointment-display";
import { formatStatusLabel, formatTanggalIndo } from "@/lib/format";
import type { DokterDashboardData } from "@/lib/hooks/useDokterDashboard";
import { listPasienMedicalRecords } from "@/lib/pasien";
import type { Appointment, PasienMedicalRecordItem, RekamMedisRecord } from "@/lib/types";

type MedicalFilter = "semua" | "ada-rekam" | "belum-rekam" | "alergi";

interface DoctorMedicalRecordsPageProps {
  dashboardData?: DokterDashboardData;
}

const ACTIVE_APPOINTMENT_STATUS = new Set(["terjadwal", "menunggu", "sedang_ditangani"]);

function todayIsoLocal(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthPrefixLocal(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
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

function ageFromBirthDate(value: string | null | undefined): string {
  if (!value) return "Usia belum diisi";
  const birth = new Date(`${value}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return "Usia belum diisi";
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDelta = now.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return `${age} tahun`;
}

function patientRecordNumber(item: PasienMedicalRecordItem): string {
  return item.pasien?.no_rm?.trim() || `RM-${item.profile.id.slice(0, 8).toUpperCase()}`;
}

function latestRecord(item: PasienMedicalRecordItem): RekamMedisRecord | null {
  return item.rekamMedis[0] ?? null;
}

function latestAppointment(item: PasienMedicalRecordItem): Appointment | null {
  return item.appointments[0] ?? null;
}

function genderLabel(value: string | null | undefined): string {
  if (value === "L") return "Laki-laki";
  if (value === "P") return "Perempuan";
  return "Gender belum diisi";
}

function recordSummary(item: PasienMedicalRecordItem): string {
  const record = latestRecord(item);
  if (record) return record.diagnosa;
  const appointment = latestAppointment(item);
  if (appointment?.keluhan?.trim()) return appointment.keluhan.trim();
  if (item.pasien?.catatan_medis?.trim()) return item.pasien.catatan_medis.trim();
  return "Belum ada catatan rekam medis.";
}

function recordNote(item: PasienMedicalRecordItem): string {
  const record = latestRecord(item);
  if (record?.tindakan?.trim()) return record.tindakan.trim();
  if (record?.catatan?.trim()) return record.catatan.trim();
  const appointment = latestAppointment(item);
  if (appointment) return `${appointmentTitle(appointment)} - ${formatStatusLabel(appointment.status)}`;
  return "Pasien sudah terdaftar, belum ada kunjungan klinis.";
}

function hasActiveUpcomingAppointment(item: PasienMedicalRecordItem): boolean {
  const today = todayIsoLocal();
  return item.appointments.some(
    (appt) => appt.tanggal >= today && ACTIVE_APPOINTMENT_STATUS.has(appt.status),
  );
}

function itemMatchesFilter(item: PasienMedicalRecordItem, filter: MedicalFilter): boolean {
  if (filter === "ada-rekam") return item.rekamMedis.length > 0;
  if (filter === "belum-rekam") return item.rekamMedis.length === 0;
  if (filter === "alergi") return Boolean(item.pasien?.riwayat_alergi?.trim());
  return true;
}

function buildFallbackItems(appointments: Appointment[]): PasienMedicalRecordItem[] {
  const byPatient = new Map<string, Appointment[]>();
  for (const appointment of appointments) {
    if (!appointment.pasien) continue;
    byPatient.set(appointment.pasien.id, [
      ...(byPatient.get(appointment.pasien.id) ?? []),
      appointment,
    ]);
  }

  return Array.from(byPatient.entries()).map(([patientId, patientAppointments]) => {
    const sortedAppointments = patientAppointments.sort((a, b) => {
      if (a.tanggal !== b.tanggal) return b.tanggal.localeCompare(a.tanggal);
      return b.jam.localeCompare(a.jam);
    });
    const profile = sortedAppointments[0]?.pasien?.profile;
    return {
      profile: {
        id: patientId,
        full_name: profile?.full_name ?? "Pasien",
        role: "pasien",
        email: null,
        phone: null,
        avatar_url: profile?.avatar_url ?? null,
      },
      pasien: {
        id: patientId,
        no_rm: null,
        tanggal_lahir: null,
        jenis_kelamin: null,
        alamat: null,
        golongan_darah: null,
        riwayat_alergi: null,
        catatan_medis: null,
      },
      rekamMedis: [],
      appointments: sortedAppointments,
    };
  });
}

export default function DoctorMedicalRecordsPage({
  dashboardData,
}: DoctorMedicalRecordsPageProps) {
  const router = useRouter();
  const [items, setItems] = useState<PasienMedicalRecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MedicalFilter>("semua");

  const fallbackItems = useMemo(
    () => buildFallbackItems(dashboardData?.appointments ?? []),
    [dashboardData?.appointments],
  );

  async function loadPatients() {
    setLoading(true);
    try {
      const data = await listPasienMedicalRecords();
      setItems(data);
      setErrorMsg(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal memuat daftar pasien dan rekam medis.";
      setErrorMsg(message);
      setItems(fallbackItems);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPatients();
    // fallbackItems berubah ketika dashboard refetch; request utama tetap satu kali saat mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items
      .filter((item) => itemMatchesFilter(item, filter))
      .filter((item) => {
        if (!normalizedQuery) return true;
        return [
          item.profile.full_name,
          item.profile.email ?? "",
          item.profile.phone ?? "",
          patientRecordNumber(item),
          item.pasien?.golongan_darah ?? "",
          item.pasien?.riwayat_alergi ?? "",
          recordSummary(item),
          recordNote(item),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      });
  }, [filter, items, query]);

  const monthPrefix = monthPrefixLocal();
  const stats = useMemo(() => {
    const totalPatients = items.length;
    const withRecords = items.filter((item) => item.rekamMedis.length > 0).length;
    const monthRecords = items.reduce(
      (total, item) =>
        total + item.rekamMedis.filter((record) => record.tanggal.startsWith(monthPrefix)).length,
      0,
    );
    const allergyCount = items.filter((item) => item.pasien?.riwayat_alergi?.trim()).length;
    const followUpCount = items.filter(hasActiveUpcomingAppointment).length;

    return { totalPatients, withRecords, monthRecords, allergyCount, followUpCount };
  }, [items, monthPrefix]);

  const filters: Array<{ key: MedicalFilter; label: string; count: number }> = [
    { key: "semua", label: "Semua", count: stats.totalPatients },
    { key: "ada-rekam", label: "Ada Rekam", count: stats.withRecords },
    { key: "belum-rekam", label: "Belum Ada", count: stats.totalPatients - stats.withRecords },
    { key: "alergi", label: "Alergi", count: stats.allergyCount },
  ];

  function openPatientDetail(patientId: string) {
    router.push(`/dokter/rekam-medis/detail?patientId=${encodeURIComponent(patientId)}`, {
      scroll: false,
    });
  }

  return (
    <section className="flex h-full min-h-[calc(100vh-112px)] flex-col gap-5" data-testid="doctor-medical-records-page">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          {
            label: "Total Pasien",
            value: stats.totalPatients,
            sub: "Akun pasien terdaftar",
            icon: Users,
            tone: "text-teal-700 bg-teal-50 border-teal-100",
          },
          {
            label: "Rekam Medis",
            value: stats.withRecords,
            sub: "Pasien memiliki EHR",
            icon: FileText,
            tone: "text-emerald-700 bg-emerald-50 border-emerald-100",
          },
          {
            label: "Bulan Ini",
            value: stats.monthRecords,
            sub: "Catatan medis baru",
            icon: CalendarCheck,
            tone: "text-blue-700 bg-blue-50 border-blue-100",
          },
          {
            label: "Flag Alergi",
            value: stats.allergyCount,
            sub: "Perlu perhatian obat",
            icon: AlertTriangle,
            tone: "text-rose-700 bg-rose-50 border-rose-100",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`rounded-xl border bg-white p-4 shadow-sm ${stat.tone}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-500">{stat.label}</p>
                  <p className="mt-1 text-2xl font-black">{loading ? "-" : stat.value}</p>
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

      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              type="search"
              placeholder="Cari nama pasien, no. RM, alergi, diagnosa, atau catatan..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-sm font-medium text-gray-700 outline-none transition-all placeholder:text-gray-300 focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {filters.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={`rounded-lg border px-3 py-2 text-xs font-black transition-colors ${
                  filter === item.key
                    ? "border-teal-600 bg-teal-600 text-white shadow-sm"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {item.label}
                <span className={`ml-1.5 rounded-full px-1.5 py-0.5 ${filter === item.key ? "bg-white/20" : "bg-gray-100"}`}>
                  {item.count}
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => void loadPatients()}
              disabled={loading}
              title="Muat ulang data rekam medis"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-black text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-wait disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
              Refresh
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
            {fallbackItems.length > 0
              ? `Data API pasien belum tersedia: ${errorMsg}. Menampilkan data appointment dokter sebagai fallback.`
              : errorMsg}
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex min-h-[420px] w-full flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <h3 className="text-sm font-black text-gray-900">Daftar Semua Pasien</h3>
              <p className="text-xs text-gray-400">
                Menampilkan {filteredItems.length} dari {items.length} pasien.
              </p>
            </div>
            <span className="rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-xs font-black text-teal-700">
              EHR
            </span>
          </div>

          <div className="flex-1 overflow-auto" style={{ scrollbarWidth: "thin" }}>
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-gray-100 bg-gray-50 text-[11px] font-black uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="px-5 py-3.5">No. RM</th>
                  <th className="px-5 py-3.5">Pasien</th>
                  <th className="px-5 py-3.5">Rekam Medis</th>
                  <th className="px-5 py-3.5">Kunjungan Terakhir</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  [0, 1, 2, 3].map((index) => (
                    <tr key={index}>
                      <td className="px-5 py-4"><div className="h-5 w-24 animate-pulse rounded bg-gray-100" /></td>
                      <td className="px-5 py-4"><div className="h-10 w-48 animate-pulse rounded bg-gray-100" /></td>
                      <td className="px-5 py-4"><div className="h-10 w-56 animate-pulse rounded bg-gray-100" /></td>
                      <td className="px-5 py-4"><div className="h-8 w-36 animate-pulse rounded bg-gray-100" /></td>
                      <td className="px-5 py-4"><div className="h-6 w-24 animate-pulse rounded-full bg-gray-100" /></td>
                      <td className="px-5 py-4"><div className="mx-auto h-8 w-8 animate-pulse rounded bg-gray-100" /></td>
                    </tr>
                  ))
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center">
                      <FileText className="mx-auto mb-3 h-8 w-8 text-gray-300" aria-hidden="true" />
                      <p className="text-sm font-bold text-gray-700">Data pasien tidak ditemukan.</p>
                      <p className="mt-1 text-xs text-gray-400">Coba ubah kata kunci atau filter rekam medis.</p>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const record = latestRecord(item);
                    const appointment = latestAppointment(item);
                    const allergy = item.pasien?.riwayat_alergi?.trim();
                    const hasRecords = item.rekamMedis.length > 0;
                    return (
                      <tr key={item.profile.id} className="transition-colors hover:bg-teal-50/20">
                        <td className="px-5 py-4">
                          <span className="rounded bg-gray-100 px-2 py-1 font-mono text-xs font-black text-gray-600">
                            {patientRecordNumber(item)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-teal-100 text-xs font-black text-teal-700 ring-2 ring-white">
                              {initials(item.profile.full_name)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-black text-gray-900">{item.profile.full_name}</p>
                              <p className="mt-0.5 text-[11px] font-semibold text-gray-400">
                                {genderLabel(item.pasien?.jenis_kelamin)} - {ageFromBirthDate(item.pasien?.tanggal_lahir)}
                              </p>
                              {allergy && (
                                <span className="mt-1 inline-flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[9px] font-black text-rose-600">
                                  <AlertTriangle className="h-2.5 w-2.5" aria-hidden="true" />
                                  Alergi: {allergy}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="max-w-[340px] truncate font-bold text-gray-800">{recordSummary(item)}</p>
                          <p className="mt-0.5 max-w-[340px] truncate text-[11px] text-gray-400">{recordNote(item)}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-bold text-gray-800">
                            {record ? formatTanggalIndo(record.tanggal) : appointment ? formatTanggalIndo(appointment.tanggal) : "Belum ada"}
                          </p>
                          <p className="mt-0.5 text-[11px] text-gray-400">
                            {record?.dokter?.profile.full_name ?? appointment?.dokter?.profile.full_name ?? "Belum ditangani dokter"}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black ${
                              hasRecords
                                ? "border-teal-200 bg-teal-50 text-teal-700"
                                : "border-gray-200 bg-gray-50 text-gray-500"
                            }`}
                          >
                            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
                            {hasRecords ? `${item.rekamMedis.length} Rekam` : "Belum Ada EHR"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center">
                            <button
                              type="button"
                              title="Buka detail pasien"
                              onClick={() => openPatientDetail(item.profile.id)}
                              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-teal-50 hover:text-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                            >
                              <Eye className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
