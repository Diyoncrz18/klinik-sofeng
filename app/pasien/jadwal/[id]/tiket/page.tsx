"use client";

import { useParams, useRouter } from "next/navigation";

import FormLihatTiket from "@/app/components/pasien/FormLihatTiket";

export default function PasienJadwalTiketPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  // Next.js dynamic route params: bisa array kalau catch-all, tapi
  // route ini single-segment [id] jadi pasti string. Defensive cast.
  const rawId = params?.id;
  const appointmentId = Array.isArray(rawId) ? rawId[0] : rawId;

  if (!appointmentId) {
    return (
      <div style={{ padding: 24, fontSize: 13, color: "#b91c1c" }}>
        ID tiket tidak valid.
      </div>
    );
  }

  return (
    <FormLihatTiket
      appointmentId={appointmentId}
      onBack={() => router.back()}
    />
  );
}
