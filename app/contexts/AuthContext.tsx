"use client";

/**
 * AuthContext
 * ───────────
 * State global untuk autentikasi. Dipasang sekali di root layout.
 *
 * Lifecycle:
 *   1. Mount  → coba `/auth/refresh` (kirim cookie httpOnly).
 *      ↳ kalau sukses, `session` ter-set + fetch /auth/me untuk dapat user.
 *      ↳ kalau gagal, user tetap null (logged out).
 *   2. login(email, password)    → /auth/login → set user
 *   3. register(...)             → /auth/register → tidak auto-login
 *   4. logout()                  → /auth/logout → clear user + cookie
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { refreshAccessToken } from "@/lib/api";
import {
  fetchMe,
  login as loginApi,
  logout as logoutApi,
  register as registerApi,
  type RegisterInput,
} from "@/lib/auth";
import { getUserRole, type AuthUser, type Role } from "@/lib/types";

interface AuthContextValue {
  // State
  user: AuthUser | null;
  /** True saat hydration awal (cek /refresh). Setelah selesai, false selamanya. */
  isLoading: boolean;
  isAuthenticated: boolean;
  role: Role | null;

  // Actions
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
  /** Re-fetch /auth/me (mis. setelah update profil). */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hydratedRef = useRef(false);

  // ── Initial hydration ────────────────────────────────────────────────
  useEffect(() => {
    // StrictMode di dev memanggil effect 2x — guard dengan ref.
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    let cancelled = false;
    (async () => {
      const token = await refreshAccessToken();
      if (cancelled) return;

      if (token) {
        const me = await fetchMe();
        if (!cancelled) setUser(me);
      }

      if (!cancelled) setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Actions ─────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    const u = await loginApi(email, password);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    return registerApi(input);
  }, []);

  const logout = useCallback(async () => {
    await logoutApi();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const me = await fetchMe();
    setUser(me);
  }, []);

  // ── Value (memoized untuk stabilitas referensi) ─────────────────────
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      role: getUserRole(user),
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth() harus dipakai di dalam <AuthProvider>");
  }
  return ctx;
}
