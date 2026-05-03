import { notFound } from "next/navigation";

const rekamMedisDetailPages = new Set(["detail", "tambah-pasien"]);

export default async function RekamMedisDetailPage({
  params,
}: {
  params: Promise<{ detail: string }>;
}) {
  const { detail } = await params;

  if (!rekamMedisDetailPages.has(detail)) {
    notFound();
  }

  return null;
}
