/**
 * dokter.ts — Domain wrapper untuk endpoint /api/dokter/*.
 */

import { api } from "./api";
import type {
  DoctorAnalyticsData,
  DoctorAnalyticsRange,
  DokterProfileData,
  JadwalDokter,
} from "./types";

export interface ListDokterParams {
  spesialisasi?: string;
  q?: string;
}

export async function listDokter(
  params: ListDokterParams = {},
): Promise<DokterProfileData[]> {
  const qs = new URLSearchParams();
  if (params.spesialisasi) qs.set("spesialisasi", params.spesialisasi);
  if (params.q) qs.set("q", params.q);

  const path = `/dokter${qs.toString() ? `?${qs.toString()}` : ""}`;
  const data = await api.get<{ items: DokterProfileData[] }>(path);
  return data.items;
}

export async function getDokter(id: string): Promise<{
  dokter: DokterProfileData;
  jadwal: JadwalDokter[];
}> {
  return api.get<{ dokter: DokterProfileData; jadwal: JadwalDokter[] }>(
    `/dokter/${id}`,
  );
}

export async function getMyJadwalDokter(): Promise<JadwalDokter[]> {
  const data = await api.get<{ items: JadwalDokter[] }>("/dokter/me/jadwal");
  return data.items;
}

export interface CreateJadwalDokterInput {
  hari: number;
  jamMulai: string;
  jamSelesai: string;
  kuota: number;
  isActive?: boolean;
}

export async function createMyJadwalDokter(
  input: CreateJadwalDokterInput,
): Promise<JadwalDokter> {
  const data = await api.post<{ jadwal: JadwalDokter }>("/dokter/me/jadwal", input);
  return data.jadwal;
}

export async function getMyDoctorAnalytics(
  range: DoctorAnalyticsRange = "month",
): Promise<DoctorAnalyticsData> {
  return api.get<DoctorAnalyticsData>(`/dokter/me/analytics?range=${range}`);
}
