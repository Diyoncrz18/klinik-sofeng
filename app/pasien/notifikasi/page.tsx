"use client";

import { useRouter } from "next/navigation";

import FormNotifikasi from "@/app/components/pasien/FormNotifikasi";

export default function PasienNotifikasiPage() {
  const router = useRouter();
  return <FormNotifikasi onBack={() => router.back()} />;
}
