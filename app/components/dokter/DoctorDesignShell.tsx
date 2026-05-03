"use client";

import type { CSSProperties, MouseEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import DoctorDashboardMarkup from "./DoctorDashboardMarkup";
import DoctorSidebar from "./DoctorSidebar";
import {
  getDoctorDesignPageIdFromPathname,
  doctorDesignNavPageByPageId,
  doctorDesignPathByPageId,
  isDoctorDesignPageId,
  normalizeDoctorDesignPathname,
  type DoctorDesignPageId,
} from "./doctorDesignRouting";
import { useAuth } from "@/app/contexts/AuthContext";
import { getUserDisplayName } from "@/lib/types";
import { useDokterDashboard } from "@/lib/hooks/useDokterDashboard";
import {
  QUEUE_REGISTRATION_EVENT,
  QUEUE_REGISTRATIONS_STORAGE_KEY,
  readQueueRegistrations,
  saveQueueRegistration,
  updateQueueRegistrationStatus,
  type QueueRegistration,
} from "@/lib/queue-registration";

type DoctorWindow = Window & {
  __doctorDesignNavigate?: (pathname: string, mode?: "push" | "replace") => void;
  toggleSidebar?: () => void;
};

const PAGE_TITLES: Record<DoctorDesignPageId, { title: string; subtitle: string }> = {
  // `subtitle` di sini adalah default (fallback) saat user belum termuat.
  // Subtitle dashboard di-overwrite secara dinamis pakai nama user.
  dashboard: { title: "Dashboard", subtitle: "Selamat datang kembali" },
  appointment: { title: "Manajemen Appointment", subtitle: "Kelola semua booking pasien" },
  pemeriksaan: { title: "Ruang Pemeriksaan Medis", subtitle: "Form pengisian SOAP & Tindakan Klinis" },
  "edit-info": { title: "Edit Data Kunjungan", subtitle: "Pembaruan Anamnesis dan Informasi Dasar Pasien" },
  "rekam-medis": { title: "Rekam Medis Pasien", subtitle: "Electronic Health Records (EHR)" },
  "tambah-pasien": { title: "Pendaftaran Pasien Baru", subtitle: "Registrasi data demografi dan informasi dasar" },
  "detail-rekam-medis": { title: "Detail EHR Pasien", subtitle: "Melihat riwayat diagnostik dan odontogram" },
  jadwal: { title: "Optimasi Jadwal", subtitle: "Smart scheduling engine" },
  "tambah-jadwal": { title: "Buat Jadwal Baru", subtitle: "Booking pasien & manajemen waktu klinis" },
  antrian: { title: "Manajemen Antrian", subtitle: "Real-time queue management" },
  notifikasi: { title: "Notifikasi", subtitle: "Pemberitahuan terbaru" },
  "detail-notifikasi": { title: "Detail Notifikasi", subtitle: "Tinjauan mendalam notifikasi klinis dan riwayat medis" },
  "detail-booking-vvip": { title: "Verifikasi Booking", subtitle: "Permintaan jadwal eksklusif pasien VVIP" },
  analitik: { title: "Analitik", subtitle: "Statistik dan laporan" },
};

function formatToday() {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function setModalVisibility(id: string, visible: boolean) {
  document.getElementById(id)?.classList.toggle("hidden", !visible);
}

function speakQueueCall(queueNumber: string, patientName: string) {
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();
  const readNumber = queueNumber
    .split("")
    .map((char) => {
      if (char === "-") return " ";
      if (char === "0") return "kosong";
      return char;
    })
    .join(" ");

  const utterance = new SpeechSynthesisUtterance(
    `Panggilan antrian, ${readNumber}. Pasien atas nama, ${patientName}. Silakan menuju Poli Gigi 1.`,
  );
  utterance.lang = "id-ID";
  utterance.rate = 0.85;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

export default function DoctorDesignShell({
  initialPageId,
}: {
  initialPageId?: DoctorDesignPageId | string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const dashboardData = useDokterDashboard();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [todayLabel] = useState(formatToday);
  const [queueRegistrations, setQueueRegistrations] = useState<QueueRegistration[]>([]);
  const activeQueueRegistration =
    queueRegistrations.find((registration) => registration.status === "dipanggil") ?? null;
  const activePage =
    getDoctorDesignPageIdFromPathname(pathname || "") ||
    (initialPageId && isDoctorDesignPageId(initialPageId) ? initialPageId : "dashboard");

  const navigateTo = useCallback(
    (pageId: DoctorDesignPageId, mode: "push" | "replace" = "push") => {
      setIsMobileOpen(false);

      const nextPath = doctorDesignPathByPageId[pageId];
      if (!nextPath) return;

      const currentPath = normalizeDoctorDesignPathname(pathname || "");
      if (currentPath === nextPath) return;

      if (mode === "replace") {
        router.replace(nextPath, { scroll: false });
      } else {
        router.push(nextPath, { scroll: false });
      }
    },
    [pathname, router],
  );

  const toggleSidebar = useCallback(() => {
    if (isDesktop) {
      setIsCollapsed((value) => !value);
    } else {
      setIsMobileOpen((value) => !value);
    }
  }, [isDesktop]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const syncDesktopState = () => {
      setIsDesktop(mediaQuery.matches);
      if (mediaQuery.matches) {
        setIsMobileOpen(false);
      }
    };

    syncDesktopState();
    mediaQuery.addEventListener("change", syncDesktopState);
    return () => mediaQuery.removeEventListener("change", syncDesktopState);
  }, []);

  useEffect(() => {
    const syncQueueRegistrations = () => {
      setQueueRegistrations(readQueueRegistrations());
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === QUEUE_REGISTRATIONS_STORAGE_KEY) {
        syncQueueRegistrations();
      }
    };

    const handleQueueRegistered = (event: Event) => {
      const detail = (event as CustomEvent<QueueRegistration>).detail;
      if (detail?.id) {
        setQueueRegistrations((current) =>
          [...current.filter((registration) => registration.id !== detail.id), detail].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          ),
        );
        return;
      }
      syncQueueRegistrations();
    };

    syncQueueRegistrations();
    window.addEventListener("storage", handleStorage);
    window.addEventListener(QUEUE_REGISTRATION_EVENT, handleQueueRegistered);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(QUEUE_REGISTRATION_EVENT, handleQueueRegistered);
    };
  }, []);

  useEffect(() => {
    const bodyClasses = ["doctor-dashboard-body", "bg-gray-50", "min-h-screen"];
    document.body.classList.add(...bodyClasses);
    return () => document.body.classList.remove(...bodyClasses);
  }, []);

  useEffect(() => {
    const doctorWindow = window as DoctorWindow;

    doctorWindow.toggleSidebar = toggleSidebar;
    doctorWindow.__doctorDesignNavigate = (nextPathname, mode = "push") => {
      const pageEntry = Object.entries(doctorDesignPathByPageId).find(
        ([, path]) => path === normalizeDoctorDesignPathname(nextPathname),
      );

      if (pageEntry && isDoctorDesignPageId(pageEntry[0])) {
        navigateTo(pageEntry[0], mode);
      }
    };

    return () => {
      delete doctorWindow.toggleSidebar;
      delete doctorWindow.__doctorDesignNavigate;
    };
  }, [navigateTo, toggleSidebar]);

  useEffect(() => {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    const collapseButton = document.getElementById("collapse-btn");
    const collapseIcon = document.getElementById("collapse-icon");
    const activeNavPage = doctorDesignNavPageByPageId[activePage];

    document.querySelectorAll(".menu-item").forEach((item) => {
      const isActive = item.id === `nav-${activeNavPage}`;
      item.classList.toggle("active", isActive);
      if (isActive) {
        item.setAttribute("aria-current", "page");
      } else {
        item.removeAttribute("aria-current");
      }
    });

    if (sidebar) {
      sidebar.classList.toggle("sidebar-collapsed", isDesktop && isCollapsed);
      sidebar.style.width = isDesktop && isCollapsed ? "72px" : "260px";
      sidebar.style.transform = isDesktop || isMobileOpen ? "translateX(0)" : "translateX(-100%)";
    }

    if (overlay) {
      overlay.classList.toggle("hidden", isDesktop || !isMobileOpen);
      overlay.style.opacity = !isDesktop && isMobileOpen ? "1" : "0";
    }

    if (collapseButton) {
      collapseButton.setAttribute("aria-expanded", String(!isCollapsed));
      collapseButton.setAttribute("aria-label", isCollapsed ? "Buka sidebar" : "Tutup sidebar");
    }

    if (collapseIcon) {
      collapseIcon.style.transform = isCollapsed ? "rotate(180deg)" : "rotate(0deg)";
    }
  }, [activePage, isCollapsed, isDesktop, isMobileOpen]);

  const handleDashboardClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const actionElement = target.closest<HTMLElement>("[data-page-id], [data-action]");
      if (!actionElement) return;

      event.preventDefault();
      const pageId = actionElement.dataset.pageId;
      if (pageId && isDoctorDesignPageId(pageId)) {
        navigateTo(pageId);
        return;
      }

      switch (actionElement.dataset.action) {
        case "toggle-sidebar":
          toggleSidebar();
          break;
        case "finish-session":
          setModalVisibility("modal-sesi-selesai", true);
          break;
        case "close-finish-modal":
          setModalVisibility("modal-sesi-selesai", false);
          break;
        case "confirm-finish-session":
          setModalVisibility("modal-sesi-selesai", false);
          navigateTo("appointment");
          break;
        case "show-jadwal-modal":
          setModalVisibility("modal-jadwal-berhasil", true);
          break;
        case "close-jadwal-modal":
          setModalVisibility("modal-jadwal-berhasil", false);
          break;
        case "confirm-jadwal-modal":
          setModalVisibility("modal-jadwal-berhasil", false);
          navigateTo("jadwal");
          break;
        case "show-antrian-selesai-modal":
          setModalVisibility("modal-antrian-selesai", true);
          break;
        case "close-antrian-selesai-modal":
          setModalVisibility("modal-antrian-selesai", false);
          break;
        case "confirm-antrian-selesai-modal":
          if (activeQueueRegistration) {
            setQueueRegistrations(
              updateQueueRegistrationStatus(activeQueueRegistration.id, "selesai"),
            );
          }
          setModalVisibility("modal-antrian-selesai", false);
          break;
        case "show-panggil-modal": {
          const queueId = actionElement.dataset.queueId;
          const queueNumber = actionElement.dataset.queueNumber || "--";
          const patientName = actionElement.dataset.patientName || "Pasien";
          if (queueId) {
            setQueueRegistrations(updateQueueRegistrationStatus(queueId, "dipanggil"));
          }
          document.getElementById("modal-panggil-nomor")?.replaceChildren(queueNumber);
          document.getElementById("modal-panggil-nama")?.replaceChildren(patientName);
          setModalVisibility("modal-panggil-pasien", true);
          speakQueueCall(queueNumber, patientName);
          break;
        }
        case "close-panggil-modal":
          if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
          }
          setModalVisibility("modal-panggil-pasien", false);
          break;
        case "show-qr-pendaftaran-modal":
          setModalVisibility("modal-qr-pendaftaran", true);
          break;
        case "close-qr-pendaftaran-modal":
          setModalVisibility("modal-qr-pendaftaran", false);
          break;
        case "simulate-qr-scan":
          setModalVisibility("modal-qr-pendaftaran", false);
          setModalVisibility("modal-form-pendaftaran", true);
          break;
        case "close-form-pendaftaran":
          setModalVisibility("modal-form-pendaftaran", false);
          break;
        case "submit-form-pendaftaran": {
          setModalVisibility("modal-form-pendaftaran", false);
          const nameInput = document.getElementById("input-nama-pasien-qr") as HTMLInputElement;
          const patientName = nameInput?.value || "Pasien Baru";
          const registration = saveQueueRegistration({
            nama: patientName,
            keluhan: "Konsultasi Umum",
            tujuan: "Poli Gigi Umum",
          });
          setQueueRegistrations((current) =>
            [...current.filter((item) => item.id !== registration.id), registration].sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            ),
          );
          if (nameInput) nameInput.value = "";
          break;
        }
      }
    },
    [activeQueueRegistration, navigateTo, toggleSidebar],
  );

  const baseInfo = PAGE_TITLES[activePage] ?? PAGE_TITLES.dashboard;

  // Subtitle dashboard di-personalisasi: "Selamat datang kembali, <Nama>".
  // Untuk halaman lain, pakai subtitle bawaan dari PAGE_TITLES.
  const pageInfo = useMemo(() => {
    if (activePage !== "dashboard") return baseInfo;
    const displayName = getUserDisplayName(user);
    if (!displayName) return baseInfo;
    return {
      title: baseInfo.title,
      subtitle: `Selamat datang kembali, ${displayName}`,
    };
  }, [activePage, baseInfo, user]);

  const mainContentStyle = useMemo<CSSProperties>(
    () => ({
      marginLeft: isDesktop ? (isCollapsed ? 72 : 260) : 0,
      transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    }),
    [isCollapsed, isDesktop],
  );

  return (
    <>
      <DoctorSidebar
        appointmentBadge={dashboardData.stats.activeAppointmentCount}
      />
      <DoctorDashboardMarkup
        activePage={activePage}
        mainContentStyle={mainContentStyle}
        pageInfo={pageInfo}
        todayLabel={todayLabel}
        onDashboardClick={handleDashboardClick}
        dashboardData={dashboardData}
        queueRegistrations={queueRegistrations}
      />
    </>
  );
}
