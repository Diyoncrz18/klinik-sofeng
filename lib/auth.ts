/**
 * auth.ts — Domain-level wrapper di atas api.ts untuk endpoint /api/auth/*.
 * Tujuan: komponen UI tidak perlu tahu detail HTTP — cukup panggil
 * `await login(email, password)` dst.
 */

import { api } from "./api";
import { session } from "./session";
import type {
  AuthUser,
  LoginResponse,
  MeResponse,
  RegisterResponse,
} from "./types";

export async function login(email: string, password: string): Promise<AuthUser> {
  const data = await api.post<LoginResponse>(
    "/auth/login",
    { email, password },
    { skipAuth: true },
  );
  session.set(data.session.access_token);
  return data.user;
}

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  role?: "pasien";
}

export async function register(input: RegisterInput): Promise<AuthUser> {
  const data = await api.post<RegisterResponse>("/auth/register", input, {
    skipAuth: true,
  });
  return data.user;
}

export async function logout(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } catch {
    // Logout idempotent — walaupun BE error, FE tetap clear session.
  } finally {
    session.clear();
  }
}

export async function fetchMe(): Promise<AuthUser | null> {
  try {
    const data = await api.get<MeResponse>("/auth/me");
    return data.user;
  } catch {
    return null;
  }
}
