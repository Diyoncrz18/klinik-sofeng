/**
 * pasien.ts — Domain wrapper untuk endpoint /api/pasien/*.
 */

import { api } from "./api";
import type { JenisKelamin, PasienBundle, PasienMedicalRecordItem } from "./types";

export async function getPasienMe(): Promise<PasienBundle> {
  return api.get<PasienBundle>("/pasien/me");
}

export async function listPasienMedicalRecords(): Promise<PasienMedicalRecordItem[]> {
  const data = await api.get<{ items: PasienMedicalRecordItem[] }>("/pasien");
  return data.items;
}

export interface UpdatePasienInput {
  fullName?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  tanggalLahir?: string | null; // YYYY-MM-DD
  jenisKelamin?: JenisKelamin | null;
  alamat?: string | null;
  golonganDarah?: string | null;
  riwayatAlergi?: string | null;
}

export async function updatePasienMe(
  input: UpdatePasienInput,
): Promise<PasienBundle> {
  return api.patch<PasienBundle>("/pasien/me", input);
}
