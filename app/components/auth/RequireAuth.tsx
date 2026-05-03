"use client";

/**
 * RequireAuth
 * ───────────
 * Client-side route guard. Pasang di layout area yang protected.
 *
 * Kenapa client-side dan bukan Next.js middleware?
 * Backend (localhost:4000) dan frontend (localhost:3000) jalan di
 * origin berbeda. httpOnly refresh cookie disetel oleh backend di
 * domain/port-nya — Next.js middleware yang jalan di port frontend
 * TIDAK punya akses ke cookie itu (cookie jar terpisah per origin).
 *
 * Solusinya: AuthProvider hydrate via /auth/refresh saat mount;
 * RequireAuth menunggu hydration selesai lalu redirect kalau perlu.
 *
 * Trade-off: ada flash splash screen saat hydration awal. Sebagai
 * gantinya, arsitektur tetap clean (FE & BE bisa di-deploy terpisah).
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/app/contexts/AuthContext";
import type { Role } from "@/lib/types";

interface RequireAuthProps {
  /** Role yang diperlukan. Kalau tidak diisi, login apa pun OK. */
  role?: Role;
  /** Path tujuan redirect kalau belum login. */
  redirectTo: string;
  children: React.ReactNode;
  /** Render kustom saat hydration. Default: SplashScreen. */
  fallback?: React.ReactNode;
}

export default function RequireAuth({
  role,
  redirectTo,
  children,
  fallback,
}: RequireAuthProps) {
  const router = useRouter();
  const { user, isLoading, role: userRole } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace(redirectTo);
      return;
    }

    // Logged in tapi salah role → redirect ke area role-nya sendiri.
    if (role && userRole !== role) {
      router.replace(userRole === "dokter" ? "/dokter" : "/pasien");
    }
  }, [isLoading, user, role, userRole, router, redirectTo]);

  // Loading awal — tampilkan splash supaya UI tidak flicker antara
  // "logged-in dashboard" dan "login screen".
  if (isLoading) return <>{fallback ?? <SplashScreen />}</>;

  // Belum login atau salah role — render null sambil router.replace jalan.
  if (!user) return null;
  if (role && userRole !== role) return null;

  return <>{children}</>;
}

// ── Default splash ────────────────────────────────────────────────────
function SplashScreen() {
  return (
    <div
      role="status"
      aria-label="Memuat sesi"
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f8fbfd 0%, #e8f5fb 100%)",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          border: "3px solid #cde4f0",
          borderTopColor: "#2A6B9B",
          borderRadius: "50%",
          animation: "klinik-spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes klinik-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
