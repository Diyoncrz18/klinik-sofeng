export const QUEUE_REGISTRATIONS_STORAGE_KEY = "klinik-sofeng:queue-registrations";
export const QUEUE_REGISTRATION_EVENT = "klinik-sofeng:queue-registered";

export interface QueueRegistration {
  id: string;
  queueNumber: string;
  nama: string;
  keluhan: string;
  telepon?: string;
  tujuan: string;
  source: "qr";
  status: QueueRegistrationStatus;
  createdAt: string;
  calledAt?: string;
  completedAt?: string;
}

export type QueueRegistrationStatus = "menunggu" | "dipanggil" | "selesai" | "ditunda";

interface QueueRegistrationInput {
  nama: string;
  keluhan: string;
  telepon?: string;
  tujuan?: string;
}

function isQueueRegistration(value: unknown): value is QueueRegistration {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<QueueRegistration>;
  return (
    typeof item.id === "string" &&
    typeof item.queueNumber === "string" &&
    typeof item.nama === "string" &&
    typeof item.keluhan === "string" &&
    typeof item.tujuan === "string" &&
    item.source === "qr" &&
    (item.status === "menunggu" ||
      item.status === "dipanggil" ||
      item.status === "selesai" ||
      item.status === "ditunda") &&
    typeof item.createdAt === "string"
  );
}

function nextQueueNumber(existingCount: number): string {
  return `A-${String(15 + existingCount).padStart(3, "0")}`;
}

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `qr-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function readQueueRegistrations(): QueueRegistration[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(QUEUE_REGISTRATIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed
          .filter(isQueueRegistration)
          .sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          )
      : [];
  } catch {
    return [];
  }
}

function writeQueueRegistrations(items: QueueRegistration[]) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(QUEUE_REGISTRATIONS_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(QUEUE_REGISTRATION_EVENT));
}

export function saveQueueRegistration(input: QueueRegistrationInput): QueueRegistration {
  const existing = readQueueRegistrations();
  const registration: QueueRegistration = {
    id: createId(),
    queueNumber: nextQueueNumber(existing.length),
    nama: input.nama.trim() || "Pasien Baru",
    keluhan: input.keluhan.trim() || "Konsultasi Umum",
    telepon: input.telepon?.trim() || undefined,
    tujuan: input.tujuan?.trim() || "Poli Gigi Umum",
    source: "qr",
    status: "menunggu",
    createdAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(QUEUE_REGISTRATIONS_STORAGE_KEY, JSON.stringify([...existing, registration]));
    window.dispatchEvent(
      new CustomEvent<QueueRegistration>(QUEUE_REGISTRATION_EVENT, {
        detail: registration,
      }),
    );
  }

  return registration;
}

export function updateQueueRegistrationStatus(
  id: string,
  status: QueueRegistrationStatus,
): QueueRegistration[] {
  const now = new Date().toISOString();
  const updated = readQueueRegistrations().map((item) => {
    if (item.id !== id) {
      return status === "dipanggil" && item.status === "dipanggil"
        ? { ...item, status: "menunggu" as const, calledAt: undefined }
        : item;
    }

    return {
      ...item,
      status,
      calledAt: status === "dipanggil" ? now : item.calledAt,
      completedAt: status === "selesai" ? now : item.completedAt,
    };
  });

  writeQueueRegistrations(updated);
  return updated;
}
