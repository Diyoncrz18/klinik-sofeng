"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Clock3,
  MessageCircle,
  RefreshCw,
  Search,
  Star,
  Stethoscope,
  Wifi,
} from "lucide-react";

import { useAuth } from "@/app/contexts/AuthContext";
import ChatRoomView from "@/app/components/pasien/ChatRoomView";
import { listDokter } from "@/lib/dokter";
import { useRealtimeChat } from "@/lib/hooks/useRealtimeChat";
import type { ChatConversation, DokterProfileData } from "@/lib/types";

interface Props {
  onBack: () => void;
}

function getInitials(name: string | null | undefined) {
  return (
    name
      ?.trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "DR"
  );
}

function doctorNameFromConversation(conversation: ChatConversation) {
  return conversation.dokter?.profile?.full_name?.trim() || "Dokter Klinik";
}

function getFriendlyConsultationError(message: string | null | undefined) {
  if (!message) return null;
  if (/chat_conversations|chat_messages|schema cache|Gagal ambil daftar chat/i.test(message)) {
    return "Riwayat chat belum tersedia. Daftar dokter tetap bisa dilihat, tetapi fitur chat perlu disiapkan dulu.";
  }
  if (/Failed to fetch|NetworkError|fetch failed/i.test(message)) {
    return "Koneksi ke server belum tersambung. Coba muat ulang halaman.";
  }
  return message;
}

export default function FormKonsultasiOnline({ onBack }: Props) {
  const { user } = useAuth();
  const {
    conversations,
    connected,
    loading: loadingChats,
    errorMsg,
    typingByConversation,
    refresh,
    joinConversation,
    createConversation,
    sendMessage,
    sendTyping,
  } = useRealtimeChat(user?.id);

  const [doctors, setDoctors] = useState<DokterProfileData[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [doctorsError, setDoctorsError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeSpecialty, setActiveSpecialty] = useState("Semua");
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [startingDoctorId, setStartingDoctorId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeConversationId,
  );
  const joinedConversationId = activeConversation?.id;
  const visibleActionError = getFriendlyConsultationError(actionError);
  const visibleDoctorsError = getFriendlyConsultationError(doctorsError);
  const visibleChatNotice =
    !activeConversation && !visibleActionError && !visibleDoctorsError
      ? getFriendlyConsultationError(errorMsg)
      : null;

  useEffect(() => {
    let cancelled = false;

    async function loadDoctors() {
      try {
        setLoadingDoctors(true);
        setDoctorsError(null);
        const items = await listDokter();
        if (!cancelled) setDoctors(items);
      } catch (error) {
        if (!cancelled) {
          setDoctorsError(error instanceof Error ? error.message : "Gagal memuat dokter");
        }
      } finally {
        if (!cancelled) setLoadingDoctors(false);
      }
    }

    void loadDoctors();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!joinedConversationId) return;
    void joinConversation(joinedConversationId);
  }, [joinedConversationId, joinConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.id, activeConversation?.messages.length]);

  const specialties = useMemo(() => {
    const unique = new Set(
      doctors.map((doctor) => doctor.spesialisasi?.trim()).filter(Boolean),
    );
    return ["Semua", ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    const q = query.trim().toLowerCase();
    return doctors.filter((doctor) => {
      const matchesSpecialty =
        activeSpecialty === "Semua" || doctor.spesialisasi === activeSpecialty;
      const matchesQuery =
        !q ||
        [doctor.profile.full_name, doctor.spesialisasi, doctor.bio]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);
      return matchesSpecialty && matchesQuery;
    });
  }, [activeSpecialty, doctors, query]);


  async function handleStartConversation(doctor: DokterProfileData) {
    try {
      setStartingDoctorId(doctor.id);
      setActionError(null);
      const conversation = await createConversation({
        dokterId: doctor.id,
        subject: `Konsultasi online - ${doctor.spesialisasi}`,
      });
      setActiveConversationId(conversation.id);
      await joinConversation(conversation.id);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Gagal membuka chat");
    } finally {
      setStartingDoctorId(null);
    }
  }

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !activeConversation || sending) return;

    try {
      setSending(true);
      setActionError(null);
      await sendMessage(activeConversation.id, body);
      setDraft("");
      sendTyping(activeConversation.id, false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Gagal mengirim pesan");
    } finally {
      setSending(false);
    }
  }

  function handleDraftChange(value: string) {
    setDraft(value);
    if (!activeConversation) return;
    sendTyping(activeConversation.id, true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      sendTyping(activeConversation.id, false);
    }, 1200);
  }


  const hasActiveConversation = Boolean(activeConversation);

  // Saat chat aktif: hapus padding & overflow dari .pasien-main agar
  // ChatRoomView bisa mengisi penuh tanpa terpotong
  useEffect(() => {
    const main = document.querySelector(".pasien-main") as HTMLElement | null;
    if (!main) return;
    if (hasActiveConversation) {
      main.classList.add("chat-mode");
    } else {
      main.classList.remove("chat-mode");
    }
    return () => { main.classList.remove("chat-mode"); };
  }, [hasActiveConversation]);

  if (activeConversation) {
    const isTyping = !!typingByConversation[activeConversation.id];
    return (
      <ChatRoomView
        conversation={activeConversation}
        user={user}
        connected={connected}
        isTyping={isTyping}
        draft={draft}
        sending={sending}
        actionError={visibleActionError ?? getFriendlyConsultationError(errorMsg)}
        onBack={() => setActiveConversationId(null)}
        onDraftChange={handleDraftChange}
        onSend={handleSendMessage}
      />
    );
  }


  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100dvh - 0px)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── Sticky Top: Header + Search + Filter ─────────────────────── */}
      <div
        className="sticky top-0 z-40 -mx-4 flex-shrink-0"
        style={{
          background: "rgba(247,249,251,0.97)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(226,232,240,0.8)",
          boxShadow: "0 1px 12px rgba(0,0,0,0.05)",
        }}
      >
        {/* Header row */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Kembali"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition active:scale-90"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>

          <div className="min-w-0 flex-1">
            <h2 className="text-[16px] font-black text-slate-950 leading-tight">Konsultasi Online</h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-bold"
              style={{ color: connected ? "#059669" : "#94A3B8" }}>
              <span className="h-1.5 w-1.5 rounded-full"
                style={{ background: connected ? "#10B981" : "#CBD5E1" }} />
              {connected ? "Realtime aktif" : "Menyambung..."}
            </p>
          </div>

          <button
            type="button"
            title="Muat ulang"
            onClick={() => {
              void refresh();
              setLoadingDoctors(true);
              void listDokter()
                .then((items) => setDoctors(items))
                .catch((error) =>
                  setDoctorsError(error instanceof Error ? error.message : "Gagal memuat dokter"),
                )
                .finally(() => setLoadingDoctors(false));
            }}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition active:scale-90"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Search input */}
        <div className="px-4 pb-3">
          <label className="relative block">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari dokter atau spesialisasi..."
              type="search"
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-300 focus:border-[#2A6B9B] focus:ring-2 transition"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
            />
          </label>
        </div>

        {/* Specialty filter chips */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 hide-scrollbar">
          {specialties.map((specialty) => (
            <button
              key={specialty}
              type="button"
              onClick={() => setActiveSpecialty(specialty)}
              className="flex-shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-black transition-all"
              style={
                activeSpecialty === specialty
                  ? { background: "#2A6B9B", color: "#fff", boxShadow: "0 2px 8px rgba(42,107,155,0.3)" }
                  : { background: "#fff", color: "#64748B", border: "1px solid #E2E8F0" }
              }
            >
              {specialty}
            </button>
          ))}
        </div>
      </div>

      {/* ── Scrollable content ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ scrollbarWidth: "none" }}>

        {/* Error banners */}
        {(visibleActionError || visibleDoctorsError) && (
          <div className="mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
            {visibleActionError || visibleDoctorsError}
          </div>
        )}
        {visibleChatNotice && (
          <div className="mb-4 rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-xs font-semibold leading-relaxed text-cyan-800">
            {visibleChatNotice}
          </div>
        )}

        {/* Active conversations */}
        {conversations.length > 0 && (
          <section className="mb-5 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-slate-950">Percakapan Aktif</p>
                <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
                  Lanjutkan konsultasi yang sudah aktif
                </p>
              </div>
              <BadgeCheck className="h-5 w-5 text-emerald-500" aria-hidden="true" />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setActiveConversationId(conversation.id)}
                  className="min-w-[200px] rounded-2xl border border-slate-100 bg-slate-50 p-3 text-left transition hover:border-[#2A6B9B]/20 hover:bg-white active:scale-95"
                >
                  <p className="truncate text-sm font-black text-slate-900">
                    {doctorNameFromConversation(conversation)}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] font-semibold text-[#2A6B9B]">
                    {conversation.dokter?.spesialisasi || "Konsultasi online"}
                  </p>
                  <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-slate-500">
                    {conversation.lastMessage?.body || "Belum ada pesan"}
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Doctor list section header */}
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[12px] font-black uppercase tracking-wider text-slate-400">
            {loadingDoctors || loadingChats
              ? "Memuat..."
              : `${filteredDoctors.length} Dokter Tersedia`}
          </p>
          {filteredDoctors.length > 0 && !loadingDoctors && !loadingChats && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Online
            </span>
          )}
        </div>

        {/* Doctor cards */}
        <section className="flex flex-col gap-3 pb-4">
          {loadingDoctors || loadingChats ? (
            [0, 1, 2].map((item) => (
              <div key={item} className="h-28 animate-pulse rounded-3xl bg-white shadow-sm" />
            ))
          ) : filteredDoctors.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center">
              <Stethoscope className="mx-auto mb-3 h-9 w-9 text-slate-300" />
              <p className="text-sm font-black text-slate-900">Dokter tidak ditemukan</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Coba ubah kata kunci atau filter spesialisasi.
              </p>
            </div>
          ) : (
            filteredDoctors.map((doctor) => (
              <article
                key={doctor.id}
                className="group cursor-pointer rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]"
                style={{ borderColor: startingDoctorId === doctor.id ? "#2A6B9B" : undefined }}
                onClick={() => void handleStartConversation(doctor)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && void handleStartConversation(doctor)}
                aria-label={`Chat dengan ${doctor.profile.full_name}`}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-black text-white"
                      style={{ background: "linear-gradient(135deg, #0B4F71 0%, #2A6B9B 100%)", boxShadow: "0 3px 8px rgba(42,107,155,0.3)" }}
                    >
                      {getInitials(doctor.profile.full_name)}
                    </div>
                    <span
                      className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white"
                      style={{ background: "#10B981" }}
                    />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[14px] font-black text-slate-950 leading-tight">
                      {doctor.profile.full_name}
                    </h3>
                    <p className="mt-0.5 truncate text-[12px] font-bold text-[#2A6B9B]">
                      {doctor.spesialisasi}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-700">
                        <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                        {Number(doctor.rating ?? 0).toFixed(1)}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                        <Clock3 className="h-2.5 w-2.5" aria-hidden="true" />
                        {doctor.pengalaman_tahun} thn
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        <Wifi className="h-2.5 w-2.5" aria-hidden="true" />
                        Online
                      </span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="flex-shrink-0">
                    {startingDoctorId === doctor.id ? (
                      <span
                        className="flex h-9 w-9 items-center justify-center rounded-xl"
                        style={{ background: "#EFF6FF" }}
                      >
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#2A6B9B]/30 border-t-[#2A6B9B]" />
                      </span>
                    ) : (
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-xl transition group-hover:scale-105"
                        style={{ background: "linear-gradient(135deg, #0B4F71 0%, #2A6B9B 100%)", boxShadow: "0 2px 8px rgba(42,107,155,0.3)" }}
                      >
                        <MessageCircle className="h-4 w-4 text-white" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                </div>

                {doctor.bio && (
                  <p className="mt-3 line-clamp-2 border-t border-slate-50 pt-3 text-[11px] leading-relaxed text-slate-500">
                    {doctor.bio}
                  </p>
                )}
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
