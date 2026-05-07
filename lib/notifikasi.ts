import { API_BASE_URL, api } from "./api";
import { session } from "./session";
import type { NotifikasiItem } from "./types";

export interface ListNotifikasiParams {
  limit?: number;
  unread?: boolean;
}

export interface ListNotifikasiResponse {
  items: NotifikasiItem[];
  unreadCount: number;
  serverTime: string;
}

export interface SubscribeNotifikasiOptions {
  onSnapshot: (payload: ListNotifikasiResponse) => void;
  onStatus?: (status: string) => void;
  onError?: (error: Error) => void;
}

export async function listNotifikasi(
  params: ListNotifikasiParams = {},
): Promise<ListNotifikasiResponse> {
  const qs = new URLSearchParams();
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.unread) qs.set("unread", "1");

  return api.get<ListNotifikasiResponse>(
    `/notifikasi${qs.toString() ? `?${qs.toString()}` : ""}`,
  );
}

export async function markNotifikasiRead(id: string): Promise<NotifikasiItem> {
  const data = await api.patch<{ notification: NotifikasiItem }>(
    `/notifikasi/${id}/read`,
  );
  return data.notification;
}

export async function markAllNotifikasiRead(): Promise<{ readAt: string }> {
  return api.patch<{ readAt: string }>("/notifikasi/read-all");
}

function parseSseMessage(rawMessage: string): { event: string; data: string } | null {
  const lines = rawMessage.split(/\r?\n/);
  let event = "message";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      event = line.slice("event:".length).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trimStart());
    }
  }

  if (dataLines.length === 0) return null;
  return { event, data: dataLines.join("\n") };
}

export function subscribeNotifikasiStream({
  onSnapshot,
  onStatus,
  onError,
}: SubscribeNotifikasiOptions): () => void {
  const controller = new AbortController();
  let stopped = false;

  const start = async () => {
    const token = session.get();
    if (!token) {
      onError?.(new Error("Token sesi belum tersedia untuk stream notifikasi."));
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/notifikasi/stream`, {
        method: "GET",
        headers: {
          Accept: "text/event-stream",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        cache: "no-store",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Stream notifikasi gagal dibuka: HTTP ${response.status}`);
      }
      if (!response.body) {
        throw new Error("Browser tidak mendukung stream notifikasi.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (!stopped) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const messages = buffer.split(/\n\n|\r\n\r\n/);
        buffer = messages.pop() ?? "";

        for (const message of messages) {
          const parsed = parseSseMessage(message);
          if (!parsed) continue;

          if (parsed.event === "snapshot") {
            onSnapshot(JSON.parse(parsed.data) as ListNotifikasiResponse);
          } else if (parsed.event === "status") {
            const payload = JSON.parse(parsed.data) as { status?: string };
            if (payload.status) onStatus?.(payload.status);
          }
        }
      }
    } catch (error) {
      if (stopped) return;
      if (error instanceof DOMException && error.name === "AbortError") return;
      onError?.(error instanceof Error ? error : new Error("Stream notifikasi terputus."));
    }
  };

  void start();

  return () => {
    stopped = true;
    controller.abort();
  };
}
