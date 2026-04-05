export const doctorDesignPathByPageId = {
  dashboard: "/dokter",
  appointment: "/dokter/appointment",
  pemeriksaan: "/dokter/appointment/pemeriksaan",
  "edit-info": "/dokter/appointment/edit-info",
  triage: "/dokter/triage",
  "pemeriksaan-darurat": "/dokter/triage/pemeriksaan-darurat",
  "resusitasi-cepat": "/dokter/triage/resusitasi-cepat",
  "rekam-medis": "/dokter/rekam-medis",
  "detail-rekam-medis": "/dokter/rekam-medis/detail",
  "tambah-pasien": "/dokter/rekam-medis/tambah-pasien",
  jadwal: "/dokter/jadwal",
  "tambah-jadwal": "/dokter/jadwal/tambah",
  antrian: "/dokter/antrian",
  notifikasi: "/dokter/notifikasi",
  "detail-notifikasi": "/dokter/notifikasi/detail",
  "detail-booking-vvip": "/dokter/notifikasi/verifikasi-booking-vvip",
  analitik: "/dokter/analitik",
} as const;

export type DoctorDesignPageId = keyof typeof doctorDesignPathByPageId;

export const doctorDesignNavPageByPageId: Record<DoctorDesignPageId, DoctorDesignPageId> = {
  dashboard: "dashboard",
  appointment: "appointment",
  pemeriksaan: "appointment",
  "edit-info": "appointment",
  triage: "triage",
  "pemeriksaan-darurat": "triage",
  "resusitasi-cepat": "triage",
  "rekam-medis": "rekam-medis",
  "detail-rekam-medis": "rekam-medis",
  "tambah-pasien": "rekam-medis",
  jadwal: "jadwal",
  "tambah-jadwal": "jadwal",
  antrian: "antrian",
  notifikasi: "notifikasi",
  "detail-notifikasi": "notifikasi",
  "detail-booking-vvip": "notifikasi",
  analitik: "analitik",
};

const doctorDesignPathEntries = Object.entries(
  doctorDesignPathByPageId,
) as Array<[DoctorDesignPageId, string]>;

export const doctorDesignPageIdByPathname = Object.fromEntries(
  doctorDesignPathEntries.map(([pageId, pathname]) => [pathname, pageId]),
) as Record<string, DoctorDesignPageId>;

export function normalizeDoctorDesignPathname(pathname: string) {
  if (!pathname) {
    return doctorDesignPathByPageId.dashboard;
  }

  const normalized = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
  return normalized || doctorDesignPathByPageId.dashboard;
}

export function getDoctorDesignPageIdFromPathname(pathname: string) {
  return doctorDesignPageIdByPathname[normalizeDoctorDesignPathname(pathname)];
}

export function isDoctorDesignPageId(value: string): value is DoctorDesignPageId {
  return value in doctorDesignPathByPageId;
}
