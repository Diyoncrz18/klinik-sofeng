import PasienAppShell from "@/app/components/pasien/PasienAppShell";

export const metadata = {
  title: "Aplikasi Pasien — Klinik Gigi",
  description: "Portal pasien Klinik Gigi untuk melihat jadwal, rekam medis, dan profil.",
};

export default function PasienLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <PasienAppShell>{children}</PasienAppShell>;
}
