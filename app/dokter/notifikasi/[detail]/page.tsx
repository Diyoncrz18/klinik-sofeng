import { notFound } from "next/navigation";

import DoctorDesignRoutePage from "@/app/components/dokter/DoctorDesignRoutePage";
import type { DoctorDesignPageId } from "@/app/components/dokter/doctorDesignRouting";

const notifikasiDetailPageIds: Record<string, DoctorDesignPageId> = {
  detail: "detail-notifikasi",
  "verifikasi-booking-vvip": "detail-booking-vvip",
};

export default async function NotifikasiDetailPage({
  params,
}: {
  params: Promise<{ detail: string }>;
}) {
  const { detail } = await params;
  const pageId = notifikasiDetailPageIds[detail];

  if (!pageId) {
    notFound();
  }

  return <DoctorDesignRoutePage pageId={pageId} />;
}
