import { notFound } from "next/navigation";

export default async function TriageDetailPage({
  params,
}: {
  params: Promise<{ detail: string }>;
}) {
  await params;
  notFound();
}
