"use client";

import { useRouter } from "next/navigation";

import FormJadwalUlang from "@/app/components/pasien/FormJadwalUlang";
import { PASIEN_PATHS } from "@/app/components/pasien/pasienRouting";

export default function PasienJadwalUlangPage() {
  const router = useRouter();
  return (
    <FormJadwalUlang
      onBack={() => router.back()}
      onSuccess={() => router.push(PASIEN_PATHS.jadwal)}
    />
  );
}
