import { notFound } from "next/navigation";

const notifikasiDetailPages = new Set(["detail", "verifikasi-booking-vvip"]);

export default async function NotifikasiDetailPage({
  params,
}: {
  params: Promise<{ detail: string }>;
}) {
  const { detail } = await params;

  if (!notifikasiDetailPages.has(detail)) {
    notFound();
  }

  return null;
}
