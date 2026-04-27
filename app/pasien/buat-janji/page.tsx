"use client";

import { useRouter } from "next/navigation";

import FormBuatJanji from "@/app/components/pasien/FormBuatJanji";
import { PASIEN_PATHS } from "@/app/components/pasien/pasienRouting";

export default function PasienBuatJanjiPage() {
  const router = useRouter();
  return (
    <FormBuatJanji
      onBack={() => router.back()}
      onSuccess={() => router.push(PASIEN_PATHS.jadwal)}
    />
  );
}
