/**
 * dokter.ts — Domain wrapper untuk endpoint /api/dokter/*.
 */

import { api } from "./api";
import type { DokterProfileData, JadwalDokter } from "./types";

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
