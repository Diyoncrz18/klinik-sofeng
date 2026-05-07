"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CalendarCheck,
  ClipboardList,
  Droplet,
  FileText,
  Mail,
  Phone,
  UserRound,
  Users,
} from "lucide-react";

import { appointmentTitle } from "@/lib/appointment-display";
import { formatJamRange, formatStatusLabel, formatTanggalIndo } from "@/lib/format";
import type { DokterDashboardData } from "@/lib/hooks/useDokterDashboard";
import { listPasienMedicalRecords } from "@/lib/pasien";
import type { Appointment, PasienMedicalRecordItem, RekamMedisRecord } from "@/lib/types";

interface DoctorMedicalRecordDetailPageProps {
  dashboardData?: DokterDashboardData;
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

function genderLabel(value: string | null | undefined): string {
  if (value === "L") return "Laki-laki";
  if (value === "P") return "Perempuan";
  return "Gender belum diisi";
}

function patientRecordNumber(item: PasienMedicalRecordItem): string {
  return item.pasien?.no_rm?.trim() || `RM-${item.profile.id.slice(0, 8).toUpperCase()}`;
}

function latestRecord(item: PasienMedicalRecordItem): RekamMedisRecord | null {
  return item.rekamMedis[0] ?? null;
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

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-28 animate-pulse rounded-xl bg-gray-100" />
        <div className="h-28 animate-pulse rounded-xl bg-gray-100" />
        <div className="h-28 animate-pulse rounded-xl bg-gray-100" />
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-gray-100" />
    </div>
  );
}

export default function DoctorMedicalRecordDetailPage({
  dashboardData,
}: DoctorMedicalRecordDetailPageProps) {
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patientId");
  const [items, setItems] = useState<PasienMedicalRecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fallbackItems = useMemo(
    () => buildFallbackItems(dashboardData?.appointments ?? []),
    [dashboardData?.appointments],
  );

  useEffect(() => {
    async function loadPatients() {
      setLoading(true);
      try {
        const data = await listPasienMedicalRecords();
        setItems(data);
        setErrorMsg(null);
      } catch (error) {
        setItems(fallbackItems);
        setErrorMsg(
          error instanceof Error ? error.message : "Gagal memuat detail rekam medis pasien.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadPatients();
    // fallbackItems berubah ketika dashboard refetch; request utama tetap satu kali saat mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const item = useMemo(
    () => (patientId ? items.find((candidate) => candidate.profile.id === patientId) ?? null : null),
    [items, patientId],
  );
  const record = item ? latestRecord(item) : null;

  if (loading) {
    return (
      <section className="min-h-[calc(100vh-112px)]">
        <DetailSkeleton />
      </section>
    );
  }

  if (!patientId || !item) {
    return (
      <section className="flex min-h-[calc(100vh-112px)] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center">
        <div>
          <Users className="mx-auto mb-3 h-9 w-9 text-gray-300" aria-hidden="true" />
          <p className="text-sm font-black text-gray-800">Detail pasien tidak ditemukan.</p>
          <p className="mt-1 text-xs text-gray-400">
            Buka detail dari tombol mata di daftar rekam medis agar sistem membawa ID pasien yang benar.
          </p>
          <button
            type="button"
            data-page-id="rekam-medis"
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-black text-teal-700 transition-colors hover:bg-teal-100"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Kembali ke Daftar
          </button>
        </div>
      </section>
    );
  }

  const allergy = item.pasien?.riwayat_alergi?.trim();

  return (
    <section className="min-h-[calc(100vh-112px)] space-y-5 pb-8" data-testid="doctor-medical-record-detail-page">
      <div className="sticky top-20 z-20 flex flex-col gap-3 rounded-xl border border-gray-100 bg-white/95 p-4 shadow-sm backdrop-blur lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            data-page-id="rekam-medis"
            aria-label="Kembali ke daftar rekam medis"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <div className="h-7 w-px bg-gray-200" aria-hidden="true" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-black text-gray-900">{item.profile.full_name}</h3>
              <span className="rounded-md border border-teal-200 bg-teal-50 px-2 py-0.5 font-mono text-[10px] font-black text-teal-700">
                {patientRecordNumber(item)}
              </span>
              {allergy && (
                <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-black text-rose-600">
                  <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                  Alergi
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-gray-400">
              {record
                ? `Kunjungan terakhir: ${formatTanggalIndo(record.tanggal)}`
                : "Belum ada rekam medis tertulis untuk pasien ini."}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-lg border border-teal-100 bg-teal-50 px-3 py-2 text-xs font-black text-teal-700">
          <BadgeCheck className="h-4 w-4" aria-hidden="true" />
          {item.rekamMedis.length} Rekam Medis
        </span>
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
          {fallbackItems.length > 0
            ? `Data API pasien belum tersedia: ${errorMsg}. Menampilkan data appointment dokter sebagai fallback.`
            : errorMsg}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="mb-4 text-[10px] font-black uppercase tracking-wider text-gray-400">Profil Pasien</p>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-lg font-black text-teal-700">
              {initials(item.profile.full_name)}
            </div>
            <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <span className="block text-[10px] font-black uppercase tracking-wider text-gray-400">Nama Lengkap</span>
                <span className="font-black text-gray-900">{item.profile.full_name}</span>
              </div>
              <div>
                <span className="block text-[10px] font-black uppercase tracking-wider text-gray-400">Usia / Gender</span>
                <span className="font-bold text-gray-700">{ageFromBirthDate(item.pasien?.tanggal_lahir)} / {genderLabel(item.pasien?.jenis_kelamin)}</span>
              </div>
              <div>
                <span className="block text-[10px] font-black uppercase tracking-wider text-gray-400">Telepon</span>
                <span className="inline-flex items-center gap-1.5 font-bold text-gray-700">
                  <Phone className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                  {item.profile.phone ?? "Belum diisi"}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-black uppercase tracking-wider text-gray-400">Email</span>
                <span className="inline-flex max-w-full items-center gap-1.5 truncate font-bold text-gray-700">
                  <Mail className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" aria-hidden="true" />
                  <span className="truncate">{item.profile.email ?? "Belum diisi"}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <Droplet className="mb-2 h-5 w-5 text-rose-500" aria-hidden="true" />
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Golongan Darah</p>
            <p className="mt-1 text-lg font-black text-gray-900">{item.pasien?.golongan_darah ?? "Belum diisi"}</p>
          </div>
          <div className={`rounded-xl border p-4 shadow-sm ${allergy ? "border-rose-200 bg-rose-50" : "border-gray-100 bg-white"}`}>
            <AlertTriangle className={`mb-2 h-5 w-5 ${allergy ? "text-rose-600" : "text-gray-300"}`} aria-hidden="true" />
            <p className={`text-[10px] font-black uppercase tracking-wider ${allergy ? "text-rose-700" : "text-gray-400"}`}>Alergi / Keamanan</p>
            <p className={`mt-1 text-sm font-black ${allergy ? "text-rose-800" : "text-gray-700"}`}>
              {allergy || "Tidak ada alergi tercatat"}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="font-black text-gray-900">Hasil Pemeriksaan Terakhir</h4>
            <p className="mt-0.5 text-xs text-gray-400">
              {record
                ? `${formatTanggalIndo(record.tanggal)} - ${record.dokter?.profile.full_name ?? "Dokter belum tercatat"}`
                : "Belum ada pemeriksaan tertulis."}
            </p>
          </div>
          {record && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-[11px] font-black text-teal-700">
              <span className="h-2 w-2 rounded-full bg-teal-500" />
              Tercatat
            </span>
          )}
        </div>

        {record ? (
          <div className="divide-y divide-gray-50">
            {[
              { label: "Diagnosis", value: record.diagnosa },
              { label: "Tindakan", value: record.tindakan || "Belum ada tindakan tercatat." },
              { label: "Resep", value: record.resep || "Tidak ada resep tercatat." },
              { label: "Catatan Dokter", value: record.catatan || "Tidak ada catatan tambahan." },
            ].map((row) => (
              <div key={row.label} className="grid gap-1.5 py-3.5 sm:grid-cols-[200px_1fr]">
                <p className="text-[11px] font-black uppercase tracking-wider text-gray-400">{row.label}</p>
                <p className="text-sm leading-relaxed text-gray-800">{row.value}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
            <ClipboardList className="mx-auto mb-3 h-9 w-9 text-gray-300" aria-hidden="true" />
            <p className="text-sm font-black text-gray-700">Belum ada rekam medis.</p>
            <p className="mt-1 text-xs text-gray-400">Appointment pasien tetap tersedia sebagai konteks klinis awal.</p>
          </div>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h4 className="font-black text-gray-900">Riwayat Rekam Medis</h4>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-500">{item.rekamMedis.length} catatan</span>
          </div>
          {item.rekamMedis.length > 0 ? (
            <div className="relative">
              <div className="absolute bottom-3 left-[15px] top-3 w-px bg-gray-100" aria-hidden="true" />
              <div className="space-y-4">
                {item.rekamMedis.map((entry, index) => (
                  <div key={entry.id} className="flex gap-4 pl-1">
                    <div className={`z-10 flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full border-2 ${index === 0 ? "border-teal-500 bg-teal-50" : "border-gray-200 bg-white"}`}>
                      <span className={`h-2 w-2 rounded-full ${index === 0 ? "bg-teal-500" : "bg-gray-300"}`} />
                    </div>
                    <article className={`flex-1 rounded-xl border p-4 ${index === 0 ? "border-teal-100 bg-teal-50/40" : "border-gray-100 bg-gray-50/40"}`}>
                      <div className="mb-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <p className={`text-sm font-black ${index === 0 ? "text-teal-900" : "text-gray-800"}`}>{entry.diagnosa}</p>
                        <p className={`text-[11px] font-semibold ${index === 0 ? "text-teal-600" : "text-gray-400"}`}>{formatTanggalIndo(entry.tanggal)}</p>
                      </div>
                      <p className="text-xs leading-relaxed text-gray-500">
                        {entry.tindakan || entry.catatan || "Tidak ada ringkasan tindakan."}
                      </p>
                    </article>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-5 text-center text-sm font-semibold text-gray-400">
              Belum ada riwayat rekam medis.
            </p>
          )}
        </div>

        <aside className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h4 className="mb-4 font-black text-gray-900">Riwayat Appointment</h4>
          <div className="space-y-3">
            {item.appointments.length > 0 ? (
              item.appointments.slice(0, 6).map((appointment) => (
                <article key={appointment.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-black text-gray-800">{appointmentTitle(appointment)}</p>
                      <p className="mt-0.5 text-[11px] text-gray-400">
                        {formatTanggalIndo(appointment.tanggal)} - {formatJamRange(appointment.jam)}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-gray-500">
                      {formatStatusLabel(appointment.status)}
                    </span>
                  </div>
                  {appointment.keluhan && (
                    <p className="text-[11px] leading-relaxed text-gray-500">{appointment.keluhan}</p>
                  )}
                </article>
              ))
            ) : (
              <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-xs font-semibold text-gray-400">
                Belum ada appointment.
              </p>
            )}
          </div>
        </aside>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <UserRound className="mb-2 h-5 w-5 text-teal-600" aria-hidden="true" />
          <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Alamat</p>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-gray-700">{item.pasien?.alamat || "Belum diisi"}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <CalendarCheck className="mb-2 h-5 w-5 text-blue-600" aria-hidden="true" />
          <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total Appointment</p>
          <p className="mt-1 text-2xl font-black text-gray-900">{item.appointments.length}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <FileText className="mb-2 h-5 w-5 text-emerald-600" aria-hidden="true" />
          <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Catatan Pasien</p>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-gray-700">{item.pasien?.catatan_medis || "Belum ada catatan tambahan."}</p>
        </div>
      </div>
    </section>
  );
}
