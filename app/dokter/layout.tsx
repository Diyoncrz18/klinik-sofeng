import RequireAuth from "@/app/components/auth/RequireAuth";
import DoctorDesignShell from "@/app/components/dokter/DoctorDesignShell";

export default function DokterLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RequireAuth role="dokter" redirectTo="/login">
      <DoctorDesignShell />
      {children}
    </RequireAuth>
  );
}
