import { notFound } from "next/navigation";

import DoctorDesignRoutePage from "@/app/components/dokter/DoctorDesignRoutePage";
import type { DoctorDesignPageId } from "@/app/components/dokter/doctorDesignRouting";

const jadwalDetailPageIds: Record<string, DoctorDesignPageId> = {
  tambah: "tambah-jadwal",
};

export default async function JadwalDetailPage({
  params,
}: {
  params: Promise<{ detail: string }>;
}) {
  const { detail } = await params;
  const pageId = jadwalDetailPageIds[detail];

  if (!pageId) {
    notFound();
  }

  return <DoctorDesignRoutePage pageId={pageId} />;
}
