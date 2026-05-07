/**
 * appointments.ts — Domain wrapper untuk endpoint /api/appointments/*.
 */

import { api } from "./api";
import type {
  Appointment,
  AppointmentStatus,
  AppointmentType,
} from "./types";

export interface ListAppointmentsParams {
  /** Filter status (CSV di backend). */
  status?: AppointmentStatus[];
  /** Tanggal >= from (YYYY-MM-DD). */
  from?: string;
  /** Tanggal <= to (YYYY-MM-DD). */
  to?: string;
  /** Hanya yang tanggal >= today. */
  upcoming?: boolean;
}

export async function listAppointments(
  params: ListAppointmentsParams = {},
): Promise<Appointment[]> {
  const qs = new URLSearchParams();
  if (params.status && params.status.length > 0) {
    qs.set("status", params.status.join(","));
  }
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  if (params.upcoming) qs.set("upcoming", "1");

  const path = `/appointments${qs.toString() ? `?${qs.toString()}` : ""}`;
  const data = await api.get<{ items: Appointment[] }>(path);
  return data.items;
}

export async function getAppointment(id: string): Promise<Appointment> {
  const data = await api.get<{ appointment: Appointment }>(`/appointments/${id}`);
  return data.appointment;
}

export interface AppointmentQueue {
  id: string;
  appointment_id: string;
  nomor: number;
  status: "menunggu" | "dipanggil" | "sedang_ditangani" | "selesai" | "dilewati";
  estimasi_jam: string | null;
  dipanggil_at: string | null;
  selesai_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CheckInAppointmentResponse {
  appointment: Appointment;
  queue: AppointmentQueue;
  confirmed: boolean;
}

export async function checkInAppointment(
  id: string,
): Promise<CheckInAppointmentResponse> {
  return api.post<CheckInAppointmentResponse>(
    `/appointments/${id}/check-in`,
    undefined,
    { skipAuth: true },
  );
}

export interface CompleteAppointmentInput {
  keluhan?: string | null;
  areaGigi?: string | null;
  diagnosa: string;
  temuan?: string | null;
  tindakan: string;
  resep?: string | null;
  catatan?: string | null;
  biaya?: number | null;
  perluKontrol?: boolean;
}

export interface RekamMedisSummary {
  id: string;
  pasien_id: string;
  dokter_id: string;
  appointment_id: string | null;
  tanggal: string;
  diagnosa: string;
  tindakan: string | null;
  resep: string | null;
  biaya: number | null;
  catatan: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompleteAppointmentResponse {
  appointment: Appointment;
  record: RekamMedisSummary;
}

export async function completeAppointment(
  id: string,
  input: CompleteAppointmentInput,
): Promise<CompleteAppointmentResponse> {
  return api.post<CompleteAppointmentResponse>(
    `/appointments/${id}/complete`,
    input,
  );
}

export interface CreateAppointmentInput {
  dokterId: string;
  /** YYYY-MM-DD */
  tanggal: string;
  /** HH:MM (atau HH:MM:SS) */
  jam: string;
  jenis?: AppointmentType;
  keluhan?: string | null;
}

export async function createAppointment(
  input: CreateAppointmentInput,
): Promise<Appointment> {
  const data = await api.post<{ appointment: Appointment }>(
    "/appointments",
    input,
  );
  return data.appointment;
}

export async function cancelAppointment(
  id: string,
  alasan?: string | null,
): Promise<Appointment> {
  const data = await api.post<{ appointment: Appointment }>(
    `/appointments/${id}/cancel`,
    { alasan: alasan ?? null },
  );
  return data.appointment;
}
