import TabJadwal from "@/app/components/pasien/TabJadwal";

export const metadata = {
  title: "Jadwal Saya — Klinik Gigi",
  description: "Daftar janji temu pasien: yang akan datang, selesai, dan dibatalkan.",
};

export default function PasienJadwalPage() {
  return <TabJadwal />;
}
