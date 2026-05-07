/**
 * Shared types — sumber kebenaran tunggal untuk shape data yang
 * dikirim antar frontend ↔ backend.
 *
 * Semua tipe di sini harus match dengan response shape di
 * `backend-klinik-sofeng/src/routes/*.ts`.
 */

// ── Roles ──────────────────────────────────────────────────────────────
export type Role = "pasien" | "dokter";

// ── Auth user (subset Supabase User yang kita pakai di FE) ─────────────
export interface AuthUserMetadata {
  full_name?: string;
  role?: Role;
}

export interface AuthUser {
  id: string;
  email?: string | null;
  email_confirmed_at?: string | null;
  user_metadata?: AuthUserMetadata;
  created_at?: string;
}

// ── Session ────────────────────────────────────────────────────────────
// PENTING: refresh_token TIDAK ada di sini — disimpan di httpOnly cookie
// oleh backend, tidak pernah masuk JS.
export interface AuthSession {
  access_token: string;
  expires_at?: number;
}

// ── Response shapes dari /api/auth/* ──────────────────────────────────
export interface LoginResponse {
  user: AuthUser;
  session: AuthSession;
}

export interface RegisterResponse {
  user: AuthUser;
}

export interface MeResponse {
  user: AuthUser;
}

// ── Error body standar ────────────────────────────────────────────────
export interface ApiErrorBody {
  error: {
    message: string;
    details?: unknown;
  };
}

// ── Helper: ambil role dari user (atau null kalau tidak ada) ──────────
export function getUserRole(user: AuthUser | null | undefined): Role | null {
  const r = user?.user_metadata?.role;
  return r === "pasien" || r === "dokter" ? r : null;
}

// ── Helper: nama display ──────────────────────────────────────────────
export function getUserDisplayName(user: AuthUser | null | undefined): string {
  if (!user) return "";
  return (
    user.user_metadata?.full_name?.trim() ||
    user.email?.split("@")[0] ||
    "Pengguna"
  );
}

// ── Helper: inisial 2 huruf untuk avatar ──────────────────────────────
export function getUserInitials(user: AuthUser | null | undefined): string {
  const name = getUserDisplayName(user);
  if (!name) return "??";
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? "")
      .join("") || "??"
  );
}

// =====================================================================
// DOMAIN TYPES — sesuai response shape backend (lihat
// `backend-klinik-sofeng/src/routes/{pasien,dokter,appointment}.routes.ts`).
// =====================================================================

// ── Enums ─────────────────────────────────────────────────────────────
export type AppointmentStatus =
  | "terjadwal"
  | "menunggu"
  | "sedang_ditangani"
  | "selesai"
  | "dibatalkan"
  | "tidak_hadir";

export type AppointmentType =
  | "konsultasi"
  | "pemeriksaan"
  | "kontrol"
  | "tindakan"
  | "darurat";

export type JenisKelamin = "L" | "P";

// ── Profile (subset profiles table, dipakai di nested join) ───────────
export interface ProfileSummary {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

// ── Pasien ────────────────────────────────────────────────────────────
export interface PasienProfileData {
  id: string;
  no_rm: string | null;
  tanggal_lahir: string | null; // YYYY-MM-DD
  jenis_kelamin: JenisKelamin | null;
  alamat: string | null;
  golongan_darah: string | null;
  riwayat_alergi: string | null;
  catatan_medis: string | null;
}

export interface PasienBundle {
  profile: {
    id: string;
    full_name: string;
    role: Role;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
  };
  pasien: PasienProfileData;
}

// ── Dokter ────────────────────────────────────────────────────────────
export interface DokterProfileData {
  id: string;
  nip: string | null;
  sip: string | null;
  spesialisasi: string;
  rating: number;
  bio: string | null;
  pengalaman_tahun: number;
  profile: ProfileSummary & { email?: string | null; phone?: string | null };
}

export interface JadwalDokter {
  id: string;
  dokter_id?: string;
  hari: number; // 0=Minggu..6=Sabtu
  jam_mulai: string; // HH:MM:SS
  jam_selesai: string;
  kuota: number;
  is_active: boolean;
}

// ── Appointment ───────────────────────────────────────────────────────
export interface Appointment {
  id: string;
  pasien_id: string;
  dokter_id: string;
  tanggal: string; // YYYY-MM-DD
  jam: string; // HH:MM:SS
  jenis: AppointmentType;
  status: AppointmentStatus;
  keluhan: string | null;
  catatan_dokter: string | null;
  created_at: string;
  updated_at: string;

  // Nested via foreign-key join
  pasien: {
    id: string;
    profile: ProfileSummary;
  } | null;
  dokter: {
    id: string;
    spesialisasi: string;
    profile: ProfileSummary;
  } | null;
}

// ── Rekam Medis ──────────────────────────────────────────────────────
export interface RekamMedisRecord {
  id: string;
  pasien_id: string;
  dokter_id: string;
  appointment_id: string | null;
  tanggal: string; // YYYY-MM-DD
  diagnosa: string;
  tindakan: string | null;
  resep: string | null;
  biaya: number | null;
  catatan: string | null;
  created_at: string;
  updated_at: string;
  dokter: {
    id: string;
    spesialisasi: string;
    profile: ProfileSummary;
  } | null;
  appointment: {
    id: string;
    tanggal: string;
    jam: string;
    jenis: AppointmentType;
    status: AppointmentStatus;
    keluhan: string | null;
    catatan_dokter: string | null;
  } | null;
}

export interface PasienMedicalRecordItem {
  profile: {
    id: string;
    full_name: string;
    role: "pasien";
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
  };
  pasien: PasienProfileData | null;
  rekamMedis: RekamMedisRecord[];
  appointments: Appointment[];
}

// ── Notifikasi ───────────────────────────────────────────────────────
export type NotifikasiType =
  | "pengingat"
  | "konfirmasi"
  | "pengumuman"
  | "darurat"
  | "lainnya";

export interface NotifikasiItem {
  id: string;
  user_id: string;
  type: NotifikasiType;
  title: string;
  description: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

// ── Realtime Chat Dokter-Pasien ─────────────────────────────────────
export interface ChatProfileSummary {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export interface ChatConversation {
  id: string;
  pasien_id: string;
  dokter_id: string;
  appointment_id: string | null;
  subject: string | null;
  status: "aktif" | "ditutup";
  last_message_at: string;
  created_at: string;
  updated_at: string;
  pasien: {
    id: string;
    profile: ChatProfileSummary | null;
  } | null;
  dokter: {
    id: string;
    spesialisasi: string | null;
    profile: ChatProfileSummary | null;
  } | null;
  appointment: {
    id: string;
    tanggal: string;
    jam: string;
    jenis: AppointmentType;
    status: AppointmentStatus;
    keluhan: string | null;
  } | null;
  messages: ChatMessage[];
  unreadCount: number;
  lastMessage: ChatMessage | null;
}

// ── Analitik Dokter ─────────────────────────────────────────────────
export type DoctorAnalyticsRange = "week" | "month" | "year";

export interface DoctorAnalyticsMetric {
  value: number;
  previous: number;
  deltaPct: number;
}

export interface DoctorAnalyticsBucket {
  key: string;
  label: string;
  value: number;
  percentage?: number;
}

export interface DoctorAnalyticsTopDiagnosis {
  rank: number;
  diagnosa: string;
  count: number;
  revenue: number;
  latestDate: string;
  treatmentCount: number;
}

export interface DoctorAnalyticsInsight {
  title: string;
  description: string;
  tone: "info" | "success" | "warning";
}

export interface DoctorAnalyticsData {
  range: DoctorAnalyticsRange;
  period: {
    from: string;
    to: string;
    previousFrom: string;
    previousTo: string;
    days: number;
  };
  kpis: {
    appointments: DoctorAnalyticsMetric;
    uniquePatients: DoctorAnalyticsMetric;
    newPatients: DoctorAnalyticsMetric;
    averageDailyAppointments: DoctorAnalyticsMetric;
    completionRate: DoctorAnalyticsMetric;
    attendanceRate: DoctorAnalyticsMetric;
    emergencyCases: DoctorAnalyticsMetric;
    revenue: DoctorAnalyticsMetric;
    medicalRecords: DoctorAnalyticsMetric;
  };
  charts: {
    visitTrend: DoctorAnalyticsBucket[];
    hourlyDistribution: DoctorAnalyticsBucket[];
    appointmentTypes: DoctorAnalyticsBucket[];
    statuses: DoctorAnalyticsBucket[];
    demographics: {
      gender: DoctorAnalyticsBucket[];
      ageGroups: DoctorAnalyticsBucket[];
    };
  };
  topDiagnoses: DoctorAnalyticsTopDiagnosis[];
  insights: DoctorAnalyticsInsight[];
  generatedAt: string;
}
