/**
 * pasienRouting.ts
 * ─────────────────
 * Sumber kebenaran tunggal untuk path & metadata halaman pasien.
 * Mirror konsepnya dari `doctorDesignRouting.ts`.
 *
 * Cara pakai:
 *   import { PASIEN_PATHS, PASIEN_TAB_PATHS } from "@/app/components/pasien/pasienRouting";
 *   <Link href={PASIEN_PATHS.jadwal}>Jadwal Saya</Link>
 */

// ── Path konstanta (single source of truth) ─────────────────────────────────
export const PASIEN_PATHS = {
  // Tab utama (bottom nav)
  home:    "/pasien",
  jadwal:  "/pasien/jadwal",
  riwayat: "/pasien/riwayat",
  profil:  "/pasien/profil",

  // Sub-view dari tab (form, detail, dll)
  buatJanji:        "/pasien/buat-janji",
  konsultasi:       "/pasien/konsultasi",
  lokasi:           "/pasien/lokasi",
  notifikasi:       "/pasien/notifikasi",

  // Profil sub-pages
  profilEdit:                "/pasien/profil/edit",
  profilNotifikasiSetting:   "/pasien/profil/pengaturan-notifikasi",
  profilKeamanan:            "/pasien/profil/keamanan",

  // Auth flow
  welcome:        "/pasien/welcome",
  onboarding:     "/pasien/onboarding",
  login:          "/pasien/login",
  register:       "/pasien/register",
  verifikasi:     "/pasien/verifikasi",
  lupaPassword:   "/pasien/lupa-password",
} as const;

export type PasienPathKey = keyof typeof PASIEN_PATHS;

// ── Path dengan parameter dinamis ───────────────────────────────────────────
export const PASIEN_DYNAMIC = {
  jadwalTiket:       (id: string) => `/pasien/jadwal/${encodeURIComponent(id)}/tiket`,
  jadwalUlang:       (id: string) => `/pasien/jadwal/${encodeURIComponent(id)}/jadwal-ulang`,
  riwayatDetail:     (id: string) => `/pasien/riwayat/${encodeURIComponent(id)}`,
} as const;

// ── Path tab (untuk menentukan visibility bottom nav) ───────────────────────
export const PASIEN_TAB_PATHS: readonly string[] = [
  PASIEN_PATHS.home,
  PASIEN_PATHS.jadwal,
  PASIEN_PATHS.riwayat,
  PASIEN_PATHS.profil,
];

// ── Path auth (tidak menampilkan bottom nav) ────────────────────────────────
export const PASIEN_AUTH_PATHS: readonly string[] = [
  PASIEN_PATHS.welcome,
  PASIEN_PATHS.onboarding,
  PASIEN_PATHS.login,
  PASIEN_PATHS.register,
  PASIEN_PATHS.verifikasi,
  PASIEN_PATHS.lupaPassword,
];

// ── Helper: normalisasi pathname (hilangkan trailing slash) ────────────────
export function normalizePasienPathname(pathname: string): string {
  if (!pathname) return PASIEN_PATHS.home;
  const trimmed = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
  return trimmed || PASIEN_PATHS.home;
}

// ── Helper: cek apakah pathname adalah tab utama ────────────────────────────
export function isPasienTabPath(pathname: string): boolean {
  return PASIEN_TAB_PATHS.includes(normalizePasienPathname(pathname));
}

// ── Helper: cek apakah pathname adalah halaman auth ─────────────────────────
export function isPasienAuthPath(pathname: string): boolean {
  return PASIEN_AUTH_PATHS.includes(normalizePasienPathname(pathname));
}

// ── Helper: tentukan tab aktif berdasarkan pathname ─────────────────────────
export type PasienTabId = "home" | "jadwal" | "riwayat" | "profil";

export function getActivePasienTab(pathname: string): PasienTabId {
  const path = normalizePasienPathname(pathname);
  if (path.startsWith(PASIEN_PATHS.jadwal)) return "jadwal";
  if (path.startsWith(PASIEN_PATHS.riwayat)) return "riwayat";
  if (path.startsWith(PASIEN_PATHS.profil)) return "profil";
  return "home";
}
