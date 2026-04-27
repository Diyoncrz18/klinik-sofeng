"use client";

import { useRouter } from "next/navigation";

import FormLokasiKlinik from "@/app/components/pasien/FormLokasiKlinik";

export default function PasienLokasiPage() {
  const router = useRouter();
  return <FormLokasiKlinik onBack={() => router.back()} />;
}
