"use client";

import { useRouter } from "next/navigation";

import FormLihatTiket from "@/app/components/pasien/FormLihatTiket";

export default function PasienJadwalTiketPage() {
  const router = useRouter();
  return <FormLihatTiket onBack={() => router.back()} />;
}
