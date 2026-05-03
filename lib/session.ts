/**
 * session.ts — In-memory access token store
 * ───────────────────────────────────────────
 * Access token disimpan di module-scoped variable (TIDAK di
 * localStorage/sessionStorage). Konsekuensinya:
 *
 *   ✅ Aman dari XSS (JS hostile tidak bisa baca token via eval).
 *   ✅ Hilang otomatis saat tab ditutup → re-hydrate via /auth/refresh
 *      (refresh token ada di httpOnly cookie, tahan lama).
 *   ⚠️ Hilang juga saat full reload — diatasi oleh AuthProvider yang
 *      auto-call /refresh saat mount.
 *
 * Pattern publish/subscribe agar `api.ts` (low-level) dan `AuthContext`
 * (high-level) bisa stay in sync tanpa coupling dependency.
 */

type Listener = (token: string | null) => void;

let _accessToken: string | null = null;
const _listeners = new Set<Listener>();

export const session = {
  get(): string | null {
    return _accessToken;
  },

  set(token: string | null): void {
    if (_accessToken === token) return;
    _accessToken = token;
    _listeners.forEach((l) => {
      try {
        l(token);
      } catch (err) {
        // Listener tidak boleh menjatuhkan listener lain.
        console.error("[session] listener error:", err);
      }
    });
  },

  clear(): void {
    this.set(null);
  },

  subscribe(listener: Listener): () => void {
    _listeners.add(listener);
    return () => _listeners.delete(listener);
  },
};
