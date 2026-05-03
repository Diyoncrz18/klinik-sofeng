/**
 * api.ts — Typed fetch wrapper dengan auto-refresh on 401.
 * ─────────────────────────────────────────────────────────
 * Fitur:
 *  • Auto-attach `Authorization: Bearer <access_token>` dari `session`.
 *  • `credentials: "include"` agar httpOnly cookie (refresh token) terkirim.
 *  • Auto-retry 1x setelah refresh kalau dapat 401.
 *  • Dedupe parallel /refresh call (kalau 5 request expired bersamaan,
 *    cuma 1 yang benar-benar hit /auth/refresh).
 *  • Error tipe-aman via `ApiError`.
 */

import { session } from "./session";
import type { ApiErrorBody, LoginResponse } from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:4000/api";

export class ApiError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  isUnauthorized(): boolean {
    return this.status === 401;
  }
}

// ── /auth/refresh dedupe ───────────────────────────────────────────────
let _refreshInFlight: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  if (_refreshInFlight) return _refreshInFlight;

  _refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        session.clear();
        return null;
      }
      const data = (await res.json()) as LoginResponse;
      session.set(data.session.access_token);
      return data.session.access_token;
    } catch {
      session.clear();
      return null;
    } finally {
      _refreshInFlight = null;
    }
  })();

  return _refreshInFlight;
}

// ── apiFetch: low-level wrapper ───────────────────────────────────────
interface RequestOptions extends Omit<RequestInit, "body"> {
  /** Auto-serialize ke JSON kalau bukan FormData/Blob/string. */
  body?: unknown;
  /** Skip Authorization header (untuk endpoint publik mis. /login). */
  skipAuth?: boolean;
  /** Internal flag untuk cegah infinite loop saat retry setelah refresh. */
  _retried?: boolean;
}

function buildHeaders(opts: RequestOptions): Headers {
  const headers = new Headers(opts.headers);

  // Auto Content-Type untuk JSON body.
  const isJsonBody =
    opts.body !== undefined &&
    !(opts.body instanceof FormData) &&
    !(opts.body instanceof Blob) &&
    typeof opts.body !== "string";

  if (isJsonBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (!opts.skipAuth) {
    const token = session.get();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

function serializeBody(body: unknown): BodyInit | undefined {
  if (body === undefined || body === null) return undefined;
  if (
    typeof body === "string" ||
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof URLSearchParams ||
    body instanceof ArrayBuffer
  ) {
    return body;
  }
  return JSON.stringify(body);
}

export async function apiFetch<T = unknown>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const headers = buildHeaders(opts);

  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers,
    credentials: "include",
    body: serializeBody(opts.body),
    cache: opts.cache,
    signal: opts.signal,
  });

  // Auto-refresh on 401 (sekali saja).
  if (res.status === 401 && !opts.skipAuth && !opts._retried) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiFetch<T>(path, { ...opts, _retried: true });
    }
  }

  if (!res.ok) {
    let body: ApiErrorBody | undefined;
    try {
      body = (await res.json()) as ApiErrorBody;
    } catch {
      // Response bukan JSON — biarkan body undefined.
    }
    throw new ApiError(
      res.status,
      body?.error?.message ?? `HTTP ${res.status}`,
      body?.error?.details,
    );
  }

  if (res.status === 204) return undefined as T;

  // Parse JSON dengan toleransi response kosong.
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

// ── Convenience wrappers ──────────────────────────────────────────────
export const api = {
  get: <T = unknown>(path: string, opts?: RequestOptions) =>
    apiFetch<T>(path, { ...opts, method: "GET" }),

  post: <T = unknown>(path: string, body?: unknown, opts?: RequestOptions) =>
    apiFetch<T>(path, { ...opts, method: "POST", body }),

  patch: <T = unknown>(path: string, body?: unknown, opts?: RequestOptions) =>
    apiFetch<T>(path, { ...opts, method: "PATCH", body }),

  put: <T = unknown>(path: string, body?: unknown, opts?: RequestOptions) =>
    apiFetch<T>(path, { ...opts, method: "PUT", body }),

  delete: <T = unknown>(path: string, opts?: RequestOptions) =>
    apiFetch<T>(path, { ...opts, method: "DELETE" }),
};
