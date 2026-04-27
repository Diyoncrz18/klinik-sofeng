"use client";

import { useRouter } from "next/navigation";

import FormDetailRiwayat from "@/app/components/pasien/FormDetailRiwayat";

export default function PasienRiwayatDetailPage() {
  const router = useRouter();
  return <FormDetailRiwayat onBack={() => router.back()} />;
}
