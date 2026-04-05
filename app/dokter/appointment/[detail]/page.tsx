import { notFound } from "next/navigation";

import DoctorDesignRoutePage from "@/app/components/dokter/DoctorDesignRoutePage";
import type { DoctorDesignPageId } from "@/app/components/dokter/doctorDesignRouting";

const appointmentDetailPageIds: Record<string, DoctorDesignPageId> = {
  pemeriksaan: "pemeriksaan",
  "edit-info": "edit-info",
};

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ detail: string }>;
}) {
  const { detail } = await params;
  const pageId = appointmentDetailPageIds[detail];

  if (!pageId) {
    notFound();
  }

  return <DoctorDesignRoutePage pageId={pageId} />;
}
