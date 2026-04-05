import { notFound } from "next/navigation";

import DoctorDesignRoutePage from "@/app/components/dokter/DoctorDesignRoutePage";
import type { DoctorDesignPageId } from "@/app/components/dokter/doctorDesignRouting";

const rekamMedisDetailPageIds: Record<string, DoctorDesignPageId> = {
  detail: "detail-rekam-medis",
  "tambah-pasien": "tambah-pasien",
};

export default async function RekamMedisDetailPage({
  params,
}: {
  params: Promise<{ detail: string }>;
}) {
  const { detail } = await params;
  const pageId = rekamMedisDetailPageIds[detail];

  if (!pageId) {
    notFound();
  }

  return <DoctorDesignRoutePage pageId={pageId} />;
}
