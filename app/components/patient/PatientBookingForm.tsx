"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

const SCHEDULE_SELECTED_EVENT = "patient:schedule-selected";

type ScheduleSelectedDetail = {
  visitDate: string;
  visitTime: string;
};

type PatientBookingFormProps = {
  serviceOptions: string[];
};

type SubmissionState = {
  type: "success" | "error";
  message: string;
} | null;

type BookingPayload = {
  patientName: string;
  patientPhone: string;
  serviceType: string;
  visitDate: string;
  visitTime: string;
  complaint: string | null;
};

type BookingApiResponse = {
  message?: string;
  booking?: {
    id?: number;
    createdAt?: string;
    created_at?: string;
  };
  error?: string;
  detail?: string;
};

type BookingApiItem = {
  id?: number;
  patientName?: string;
  patientPhone?: string;
  serviceType?: string;
  visitDate?: string;
  visitTime?: string;
  createdAt?: string;
  patient_name?: string;
  patient_phone?: string;
  service_type?: string;
  visit_date?: string;
  visit_time?: string;
  complaint_text?: string | null;
  complaint_texts?: string | null;
  complaint_detail?: string | null;
  complaint_notes?: string | null;
  complaint_note?: string | null;
  complaint?: string | null;
  created_at?: string;
};

type BookingListApiResponse = {
  bookings?: BookingApiItem[];
  error?: string;
  detail?: string;
};

type BookingHistoryItem = BookingPayload & {
  id: string;
  createdAt: string;
  status: "Terkirim";
};

type CopyState = "idle" | "done" | "error";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
const MAX_HISTORY_ITEMS = 20;

function toInputDateLabel(dateValue: string): string {
  const [year, month, day] = String(dateValue)
    .split("-")
    .map((part) => Number(part));

  if (!year || !month || !day) {
    return dateValue;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  const formatted = new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);

  return `${formatted.charAt(0).toUpperCase()}${formatted.slice(1)}`;
}

function toInputTimeLabel(timeValue: string): string {
  const [hour = "00", minute = "00"] = String(timeValue).split(":");
  return `${hour}.${minute}`;
}

function normalizeTimeForInput(value: string): string {
  const [hour = "", minute = ""] = String(value).split(":");

  if (!hour || !minute) {
    return String(value);
  }

  return `${hour}:${minute}`;
}

function toSavedAtLabel(dateValue: string): string {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Waktu tidak diketahui";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function mapApiBookingToHistory(item: BookingApiItem): BookingHistoryItem | null {
  const idValue = item.id;
  const patientName = String(item.patientName ?? item.patient_name ?? "").trim();
  const patientPhone = String(item.patientPhone ?? item.patient_phone ?? "").trim();
  const serviceType = String(item.serviceType ?? item.service_type ?? "").trim();
  const visitDate = String(item.visitDate ?? item.visit_date ?? "").trim();
  const visitTimeRaw = String(item.visitTime ?? item.visit_time ?? "").trim();

  if (
    !idValue ||
    !patientName ||
    !patientPhone ||
    !serviceType ||
    !visitDate ||
    !visitTimeRaw
  ) {
    return null;
  }

  return {
    id: `BK-${idValue}`,
    patientName,
    patientPhone,
    serviceType,
    visitDate,
    visitTime: normalizeTimeForInput(visitTimeRaw),
    complaint:
      String(
        item.complaint ??
          item.complaint_text ??
          item.complaint_texts ??
          item.complaint_detail ??
          item.complaint_notes ??
          item.complaint_note ??
          ""
      ).trim() || null,
    createdAt:
      String(item.createdAt ?? item.created_at ?? "").trim() ||
      new Date().toISOString(),
    status: "Terkirim",
  };
}

function mapSuccessToHistory(
  payload: BookingPayload,
  responseBody: BookingApiResponse | null
): BookingHistoryItem {
  const bookingId = responseBody?.booking?.id;
  const createdAt =
    responseBody?.booking?.createdAt ||
    responseBody?.booking?.created_at ||
    new Date().toISOString();

  return {
    ...payload,
    id: bookingId ? `BK-${bookingId}` : `temp-${Date.now()}`,
    createdAt,
    status: "Terkirim",
  };
}

export function PatientBookingForm({ serviceOptions }: PatientBookingFormProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [submissionState, setSubmissionState] = useState<SubmissionState>(null);
  const [lastBooking, setLastBooking] = useState<BookingHistoryItem | null>(null);
  const [bookingHistory, setBookingHistory] = useState<BookingHistoryItem[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<CopyState>("idle");

  useEffect(() => {
    void loadBookingHistory();
  }, []);

  useEffect(() => {
    if (copyState !== "done") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopyState("idle");
    }, 1600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copyState]);

  useEffect(() => {
    function setFormInputValue(inputName: string, value: string) {
      const input = formRef.current?.elements.namedItem(inputName);

      if (!(input instanceof HTMLInputElement)) {
        return;
      }

      input.value = value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }

    function handleScheduleSelected(event: Event) {
      const customEvent = event as CustomEvent<ScheduleSelectedDetail>;
      const detail = customEvent.detail;

      if (!detail?.visitDate || !detail?.visitTime) {
        return;
      }

      setFormInputValue("visitDate", detail.visitDate);
      setFormInputValue("visitTime", detail.visitTime);
      setSubmissionState({
        type: "success",
        message:
          `Jadwal ${toInputDateLabel(detail.visitDate)} | ${toInputTimeLabel(
            detail.visitTime
          )} dipilih. Lengkapi data pasien lalu kirim booking.`,
      });

      const patientNameInput = formRef.current?.elements.namedItem("patientName");

      if (patientNameInput instanceof HTMLInputElement) {
        patientNameInput.focus();
      }
    }

    window.addEventListener(
      SCHEDULE_SELECTED_EVENT,
      handleScheduleSelected as EventListener
    );

    return () => {
      window.removeEventListener(
        SCHEDULE_SELECTED_EVENT,
        handleScheduleSelected as EventListener
      );
    };
  }, []);

  async function loadBookingHistory(): Promise<boolean> {
    setIsLoadingHistory(true);
    setHistoryError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/patient-bookings?limit=20`, {
        cache: "no-store",
      });

      const responseBody =
        (await response.json().catch(() => null)) as BookingListApiResponse | null;

      if (!response.ok) {
        const errorMessage = responseBody?.error || "Gagal mengambil riwayat booking.";
        const detail = responseBody?.detail ? ` Detail: ${responseBody.detail}` : "";
        throw new Error(`${errorMessage}${detail}`);
      }

      const mappedHistory = Array.isArray(responseBody?.bookings)
        ? responseBody.bookings
            .map(mapApiBookingToHistory)
            .filter((item): item is BookingHistoryItem => Boolean(item))
            .slice(0, MAX_HISTORY_ITEMS)
        : [];

      setBookingHistory(mappedHistory);
      return true;
    } catch (error) {
      setHistoryError(
        error instanceof Error
          ? error.message
          : "Gagal sinkronisasi riwayat booking."
      );
      return false;
    } finally {
      setIsLoadingHistory(false);
    }
  }

  function startNewBooking() {
    formRef.current?.reset();
    setSubmissionState(null);
    setCopyState("idle");

    const patientNameInput = formRef.current?.elements.namedItem("patientName");

    if (patientNameInput instanceof HTMLInputElement) {
      patientNameInput.focus();
    }
  }

  async function copyBookingCode() {
    if (!lastBooking) {
      return;
    }

    try {
      await navigator.clipboard.writeText(lastBooking.id);
      setCopyState("done");
    } catch {
      setCopyState("error");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload: BookingPayload = {
      patientName: String(formData.get("patientName") || "").trim(),
      patientPhone: String(formData.get("patientPhone") || "").trim(),
      serviceType: String(formData.get("serviceType") || "").trim(),
      visitDate: String(formData.get("visitDate") || "").trim(),
      visitTime: String(formData.get("visitTime") || "").trim(),
      complaint: String(formData.get("complaint") || "").trim() || null,
    };

    try {
      setIsSubmitting(true);
      setSubmissionState(null);

      const response = await fetch(`${API_BASE_URL}/api/patient-bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseBody =
        (await response.json().catch(() => null)) as BookingApiResponse | null;

      if (!response.ok) {
        const errorMessage = responseBody?.error || "Gagal mengirim booking.";
        const detail = responseBody?.detail
          ? ` Detail: ${responseBody.detail}`
          : "";

        setSubmissionState({
          type: "error",
          message: `${errorMessage}${detail}`,
        });
        return;
      }

      const nextHistoryItem = mapSuccessToHistory(payload, responseBody);

      setLastBooking(nextHistoryItem);
      setCopyState("idle");
      const isSynced = await loadBookingHistory();

      if (!isSynced) {
        setBookingHistory((prevHistory) =>
          [nextHistoryItem, ...prevHistory].slice(0, MAX_HISTORY_ITEMS)
        );
      }

      setSubmissionState({
        type: "success",
        message:
          responseBody?.message || "Booking pasien berhasil disimpan ke Supabase.",
      });
      form.reset();
    } catch {
      setSubmissionState({
        type: "error",
        message: "Tidak bisa terhubung ke backend. Pastikan backend berjalan.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <article className="booking-card">
      <header>
        <h2>Booking Pasien</h2>
      </header>

      <form
        id="patient-booking-form"
        ref={formRef}
        className="booking-form"
        onSubmit={handleSubmit}
      >
        <div className="field-grid two-columns">
          <label className="field-label">
            Nama Lengkap Pasien
            <input
              type="text"
              name="patientName"
              minLength={3}
              maxLength={120}
              required
            />
          </label>

          <label className="field-label">
            Nomor WhatsApp
            <input
              type="tel"
              name="patientPhone"
              inputMode="tel"
              minLength={8}
              maxLength={20}
              required
            />
          </label>
        </div>

        <div className="field-grid">
          <label className="field-label">
            Layanan yang Dibutuhkan
            <select name="serviceType" defaultValue="" required>
              <option value="" disabled>
                Pilih layanan
              </option>
              {serviceOptions.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="field-grid two-columns">
          <label className="field-label">
            Tanggal Kunjungan
            <input type="date" name="visitDate" required />
          </label>

          <label className="field-label">
            Jam Kunjungan
            <input type="time" name="visitTime" required />
          </label>
        </div>

        <label className="field-label">
          Keluhan Singkat
          <textarea name="complaint" rows={4} maxLength={500} />
        </label>

        <button type="submit" className="booking-button" disabled={isSubmitting}>
          {isSubmitting ? "Mengirim Booking..." : "Lanjut ke Konfirmasi Booking"}
        </button>

        {submissionState ? (
          <p
            className={`booking-feedback ${
              submissionState.type === "success" ? "is-success" : "is-error"
            }`}
            role="status"
            aria-live="polite"
          >
            {submissionState.message}
          </p>
        ) : null}
      </form>

      <section
        className="patient-after-submit"
        aria-label="Ringkasan dan riwayat booking"
        style={{ marginTop: "1.75rem" }}
      >
        {lastBooking ? (
          <article className="after-card confirmation-card" aria-live="polite">
            <header className="after-card-head">
              <div>
                <h3 className="after-card-title">Konfirmasi Booking</h3>
                <p className="after-card-subtitle">Booking sudah tersimpan.</p>
              </div>
              <span className="history-pill">{lastBooking.status}</span>
            </header>

            <p className="booking-code-badge">Kode: {lastBooking.id}</p>

            <div className="summary-grid">
              <div className="summary-row">
                <span>Pasien</span>
                <strong>{lastBooking.patientName}</strong>
              </div>
              <div className="summary-row">
                <span>WhatsApp</span>
                <strong>{lastBooking.patientPhone}</strong>
              </div>
              <div className="summary-row">
                <span>Jadwal</span>
                <strong>
                  {toInputDateLabel(lastBooking.visitDate)} | {toInputTimeLabel(lastBooking.visitTime)}
                </strong>
              </div>
              <div className="summary-row">
                <span>Layanan</span>
                <strong>{lastBooking.serviceType}</strong>
              </div>
            </div>

            <div className="after-card-actions">
              <button type="button" className="after-action-button" onClick={startNewBooking}>
                Booking Baru
              </button>
              <button
                type="button"
                className="after-action-button secondary"
                onClick={copyBookingCode}
              >
                {copyState === "done" ? "Kode Disalin" : "Salin Kode"}
              </button>
            </div>

            {copyState === "error" ? (
              <p className="after-inline-note is-error">Gagal menyalin kode booking.</p>
            ) : null}
          </article>
        ) : null}

        <article className="after-card history-card" aria-label="Riwayat booking pasien">
          <header className="after-card-head">
            <div>
              <h3 className="after-card-title">Riwayat Booking Saya</h3>
            </div>
          </header>

          {historyError ? <p className="history-empty is-error">{historyError}</p> : null}

          {!historyError && bookingHistory.length === 0 && isLoadingHistory ? (
            <p className="history-empty">Memuat riwayat booking...</p>
          ) : null}

          {!historyError && bookingHistory.length === 0 && !isLoadingHistory ? (
            <p className="history-empty">Belum ada riwayat booking.</p>
          ) : (
            <ol className="history-list">
              {bookingHistory.map((historyItem) => (
                <li className="history-item" key={`${historyItem.id}-${historyItem.createdAt}`}>
                  <div className="history-item-header">
                    <strong>{historyItem.patientName}</strong>
                    <span className="history-item-time">{toSavedAtLabel(historyItem.createdAt)}</span>
                  </div>

                  <p className="history-item-code">{historyItem.id}</p>

                  <p className="history-item-main">
                    {toInputDateLabel(historyItem.visitDate)} | {toInputTimeLabel(historyItem.visitTime)}
                  </p>

                  <p className="history-item-meta">{historyItem.serviceType}</p>
                </li>
              ))}
            </ol>
          )}
        </article>
      </section>
    </article>
  );
}
