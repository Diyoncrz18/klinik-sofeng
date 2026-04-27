"use client";

import { useRouter } from "next/navigation";

import FormKonsultasiOnline from "@/app/components/pasien/FormKonsultasiOnline";

export default function PasienKonsultasiPage() {
  const router = useRouter();
  return <FormKonsultasiOnline onBack={() => router.back()} />;
}
