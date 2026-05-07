"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  CalendarClock,
  CheckCheck,
  Clock3,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  UserRound,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";

import { useAuth } from "@/app/contexts/AuthContext";
import { formatJamRange, formatJenis, formatTanggalSingkat } from "@/lib/format";
import { useRealtimeChat } from "@/lib/hooks/useRealtimeChat";
import type { ChatConversation, ChatMessage } from "@/lib/types";

const AVATAR_GRADIENTS = [
  "from-teal-500 to-cyan-500",
  "from-sky-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
  "from-rose-500 to-pink-500",
  "from-amber-500 to-orange-500",
];

function avatarGradient(index: number) {
  return AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
}

function getInitials(name: string | null | undefined) {
  return (
    name
      ?.trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "PS"
  );
}

function patientName(conversation: ChatConversation) {
  return conversation.pasien?.profile?.full_name?.trim() || "Pasien Klinik";
}

function previewText(conversation: ChatConversation) {
  return (
    conversation.lastMessage?.body ||
    conversation.appointment?.keluhan ||
    conversation.subject ||
    "Belum ada pesan dalam percakapan ini."
  );
}

function formatMessageTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatConversationTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function appointmentLabel(conversation: ChatConversation) {
  if (!conversation.appointment) return conversation.subject || "Konsultasi online";
  return `${formatJenis(conversation.appointment.jenis)} · ${formatTanggalSingkat(
    conversation.appointment.tanggal,
  )}, ${formatJamRange(conversation.appointment.jam)}`;
}

function unreadMessages(messages: ChatMessage[], userId: string | null | undefined) {
  if (!userId) return 0;
  return messages.filter((message) => message.sender_id !== userId && !message.read_at).length;
}

export default function DoctorChatPage() {
  const { user } = useAuth();
  const {
    conversations,
    connected,
    loading,
    errorMsg,
    unreadTotal,
    typingByConversation,
    refresh,
    joinConversation,
    sendMessage,
    sendTyping,
  } = useRealtimeChat(user?.id);

  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filteredConversations = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((conversation) =>
      [
        patientName(conversation),
        conversation.subject,
        conversation.appointment?.keluhan,
        conversation.dokter?.spesialisasi,
        conversation.lastMessage?.body,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [conversations, query]);

  const selectedConversation =
    conversations.find((conversation) => conversation.id === selectedId) ??
    filteredConversations[0] ??
    null;
  const selectedConversationId = selectedConversation?.id;

  useEffect(() => {
    if (!selectedId && filteredConversations[0]) {
      setSelectedId(filteredConversations[0].id);
      return;
    }
    if (selectedId && !conversations.some((conversation) => conversation.id === selectedId)) {
      setSelectedId(filteredConversations[0]?.id ?? null);
    }
  }, [conversations, filteredConversations, selectedId]);

  useEffect(() => {
    if (!selectedConversationId) return;
    void joinConversation(selectedConversationId);
  }, [joinConversation, selectedConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConversation?.id, selectedConversation?.messages.length]);

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !selectedConversation || sending) return;

    try {
      setSending(true);
      setSendError(null);
      await sendMessage(selectedConversation.id, body);
      setDraft("");
      sendTyping(selectedConversation.id, false);
    } catch (error) {
      setSendError(error instanceof Error ? error.message : "Gagal mengirim pesan");
    } finally {
      setSending(false);
    }
  }

  function handleDraftChange(value: string) {
    setDraft(value);
    if (!selectedConversation) return;
    sendTyping(selectedConversation.id, true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      sendTyping(selectedConversation.id, false);
    }, 1200);
  }

  if (loading) {
    return (
      <section className="grid h-full min-h-[560px] grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="h-10 rounded-xl bg-gray-100" />
          <div className="mt-5 space-y-3">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-20 rounded-xl bg-gray-100" />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="h-14 rounded-xl bg-gray-100" />
          <div className="mt-8 space-y-4">
            <div className="h-14 w-2/3 rounded-2xl bg-gray-100" />
            <div className="ml-auto h-14 w-1/2 rounded-2xl bg-gray-100" />
            <div className="h-14 w-3/5 rounded-2xl bg-gray-100" />
          </div>
        </div>
      </section>
    );
  }

  if (conversations.length === 0) {
    return (
      <section className="flex min-h-[560px] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
        <div className="max-w-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 ring-1 ring-teal-100">
            <MessageCircle className="h-7 w-7 text-teal-600" aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-base font-black text-gray-900">Belum ada chat pasien</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            Percakapan akan muncul setelah pasien memulai konsultasi online dari akun mereka.
          </p>
          <button
            type="button"
            onClick={() => void refresh()}
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-teal-100 bg-teal-50 px-4 py-2 text-sm font-bold text-teal-700 transition-colors hover:bg-teal-100"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Muat ulang
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-full min-h-0 flex-col gap-4" data-testid="doctor-chat-page">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                Percakapan
              </p>
              <p className="mt-2 text-3xl font-black text-gray-900">{conversations.length}</p>
              <p className="mt-1 text-xs font-medium text-gray-500">Konsultasi aktif</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 ring-1 ring-teal-100">
              <Users className="h-5 w-5 text-teal-600" aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                Belum Dibaca
              </p>
              <p className="mt-2 text-3xl font-black text-amber-600">{unreadTotal}</p>
              <p className="mt-1 text-xs font-medium text-gray-500">Perlu tindak lanjut</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 ring-1 ring-amber-100">
              <Clock3 className="h-5 w-5 text-amber-500" aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                Status Realtime
              </p>
              <p className={`mt-2 text-lg font-black ${connected ? "text-emerald-600" : "text-gray-500"}`}>
                {connected ? "Terhubung" : "Menyambung"}
              </p>
              <p className="mt-1 text-xs font-medium text-gray-500">Socket.IO live chat</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 ring-1 ring-emerald-100">
              {connected ? (
                <Wifi className="h-5 w-5 text-emerald-500" aria-hidden="true" />
              ) : (
                <WifiOff className="h-5 w-5 text-gray-400" aria-hidden="true" />
              )}
            </div>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          {errorMsg}
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="flex min-h-[440px] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-4 pb-3 pt-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-gray-900">Inbox Pasien</h3>
                <p className="mt-0.5 text-[11px] font-medium text-gray-400">
                  Data real dari konsultasi online
                </p>
              </div>
              <button
                type="button"
                title="Muat ulang chat"
                onClick={() => void refresh()}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 hover:text-teal-600"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <label className="relative block">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                type="search"
                placeholder="Cari pasien atau keluhan..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50/80 py-2.5 pl-9 pr-3 text-xs font-semibold text-gray-700 outline-none transition-all placeholder:text-gray-300 focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-500/20"
              />
            </label>
          </div>

          <div className="flex-1 overflow-y-auto p-2" style={{ scrollbarWidth: "thin" }}>
            {filteredConversations.length === 0 ? (
              <div className="flex h-full min-h-48 flex-col items-center justify-center px-4 text-center">
                <Search className="mb-3 h-8 w-8 text-gray-200" aria-hidden="true" />
                <p className="text-xs font-bold text-gray-500">Percakapan tidak ditemukan</p>
              </div>
            ) : (
              filteredConversations.map((conversation, index) => {
                const isSelected = selectedConversation?.id === conversation.id;
                const name = patientName(conversation);
                const unread = conversation.unreadCount || unreadMessages(conversation.messages, user?.id);

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setSelectedId(conversation.id)}
                    className={`mb-1.5 w-full rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? "border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50 shadow-sm"
                        : "border-transparent bg-white hover:border-gray-100 hover:bg-gray-50/80"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${avatarGradient(
                            index,
                          )} text-[12px] font-black text-white shadow-sm`}
                        >
                          {getInitials(name)}
                        </div>
                        {unread > 0 && (
                          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white ring-2 ring-white">
                            {unread}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-bold text-gray-900">{name}</p>
                          <span className="shrink-0 text-[10px] font-bold text-gray-400">
                            {formatConversationTime(conversation.last_message_at)}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-[11px] font-semibold text-teal-700">
                          {appointmentLabel(conversation)}
                        </p>
                        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-gray-400">
                          {previewText(conversation)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="flex min-h-[520px] min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          {selectedConversation ? (
            <>
              <div className="flex items-center gap-4 border-b border-gray-100 bg-white px-5 py-3.5">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-sm font-black text-white shadow-sm">
                  {getInitials(patientName(selectedConversation))}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-black text-gray-900">
                    {patientName(selectedConversation)}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-lg border border-gray-100 bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-500">
                      <CalendarClock className="h-3 w-3" aria-hidden="true" />
                      {appointmentLabel(selectedConversation)}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                      <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                      {connected ? "Realtime" : "Offline fallback"}
                    </span>
                  </div>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Status
                  </p>
                  <p className="mt-1 text-xs font-black text-teal-700">
                    {selectedConversation.status === "aktif" ? "Aktif" : "Ditutup"}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 to-white px-5 py-4">
                <div className="mx-auto flex max-w-2xl flex-col gap-3">
                  <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-teal-100 bg-white px-4 py-1.5 text-[11px] font-semibold text-gray-500 shadow-sm">
                    <UserRound className="h-3.5 w-3.5 text-teal-500" aria-hidden="true" />
                    Konsultasi privat tersimpan di sistem klinik
                  </div>

                  {selectedConversation.messages.length === 0 ? (
                    <div className="mx-auto mt-10 max-w-sm rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-6 text-center">
                      <MessageCircle className="mx-auto mb-3 h-9 w-9 text-teal-300" />
                      <p className="text-sm font-black text-gray-800">Belum ada pesan</p>
                      <p className="mt-1 text-xs leading-relaxed text-gray-500">
                        Pasien sudah membuka ruang konsultasi. Kirim sapaan profesional untuk memulai.
                      </p>
                    </div>
                  ) : (
                    selectedConversation.messages.map((message) => {
                      const isMine = message.sender_id === user?.id;
                      return (
                        <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                              isMine
                                ? "rounded-br-sm bg-gradient-to-br from-teal-600 to-teal-700 text-white"
                                : "rounded-bl-sm border border-gray-100 bg-white text-gray-700"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{message.body}</p>
                            <div
                              className={`mt-2 flex items-center gap-1 text-[10px] font-semibold ${
                                isMine ? "text-teal-200" : "text-gray-400"
                              }`}
                            >
                              <span>{formatMessageTime(message.created_at)}</span>
                              {isMine && <CheckCheck className="h-3 w-3" aria-hidden="true" />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {typingByConversation[selectedConversation.id] && (
                    <div className="text-xs font-semibold text-gray-400">Pasien sedang mengetik...</div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <form onSubmit={handleSendMessage} className="border-t border-gray-100 bg-white px-5 py-4">
                {sendError && (
                  <p className="mb-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                    {sendError}
                  </p>
                )}
                <div className="flex items-end gap-2">
                  <label className="min-w-0 flex-1">
                    <span className="sr-only">Tulis balasan untuk pasien</span>
                    <textarea
                      value={draft}
                      onChange={(event) => handleDraftChange(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          event.currentTarget.form?.requestSubmit();
                        }
                      }}
                      rows={2}
                      placeholder="Tulis balasan profesional..."
                      className="max-h-32 min-h-11 w-full resize-none rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 text-sm font-medium text-gray-700 outline-none transition-all placeholder:text-gray-300 focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-500/20"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={!draft.trim() || sending || selectedConversation.status !== "aktif"}
                    className="inline-flex h-11 flex-shrink-0 items-center gap-2 rounded-xl bg-teal-600 px-5 text-sm font-black text-white shadow-sm transition-all hover:bg-teal-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                  >
                    <Send className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline">{sending ? "Mengirim" : "Kirim"}</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-center">
              <div>
                <MessageCircle className="mx-auto mb-3 h-10 w-10 text-gray-200" />
                <p className="text-sm font-black text-gray-800">Pilih percakapan pasien</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
