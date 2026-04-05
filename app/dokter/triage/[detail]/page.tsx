import { notFound } from "next/navigation";

import DoctorDesignRoutePage from "@/app/components/dokter/DoctorDesignRoutePage";
import type { DoctorDesignPageId } from "@/app/components/dokter/doctorDesignRouting";

const triageDetailPageIds: Record<string, DoctorDesignPageId> = {
  "pemeriksaan-darurat": "pemeriksaan-darurat",
  "resusitasi-cepat": "resusitasi-cepat",
};

export default async function TriageDetailPage({
  params,
}: {
  params: Promise<{ detail: string }>;
}) {
  const { detail } = await params;
  const pageId = triageDetailPageIds[detail];

  if (!pageId) {
    notFound();
  }

  return <DoctorDesignRoutePage pageId={pageId} />;
}
