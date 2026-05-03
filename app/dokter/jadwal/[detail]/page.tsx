import { notFound } from "next/navigation";

const jadwalDetailPages = new Set(["tambah"]);

export default async function JadwalDetailPage({
  params,
}: {
  params: Promise<{ detail: string }>;
}) {
  const { detail } = await params;

  if (!jadwalDetailPages.has(detail)) {
    notFound();
  }

  return null;
}
