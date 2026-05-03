import { notFound } from "next/navigation";

const appointmentDetailPages = new Set(["pemeriksaan", "edit-info"]);

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ detail: string }>;
}) {
  const { detail } = await params;

  if (!appointmentDetailPages.has(detail)) {
    notFound();
  }

  return null;
}
