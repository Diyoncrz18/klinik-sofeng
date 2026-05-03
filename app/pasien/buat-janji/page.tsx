"use client";

import { useRouter } from "next/navigation";

import FormBuatJanji from "@/app/components/pasien/FormBuatJanji";
import { PASIEN_DYNAMIC } from "@/app/components/pasien/pasienRouting";

export default function PasienBuatJanjiPage() {
  const router = useRouter();
  return (
    <FormBuatJanji
      onBack={() => router.back()}
      onSuccess={(appt) => router.push(PASIEN_DYNAMIC.jadwalTiket(appt.id))}
    />
  );
}
