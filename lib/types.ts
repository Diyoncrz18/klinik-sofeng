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
