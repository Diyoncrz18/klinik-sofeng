"use client";

import { useEffect, useRef, type FormEvent } from "react";
import {
  ArrowLeft,
  CheckCheck,
  MessageCircle,
  Send,
  ShieldCheck,
  Wifi,
  WifiOff,
} from "lucide-react";

import type { AuthUser, ChatConversation } from "@/lib/types";

// ─── helpers ────────────────────────────────────────────────────────────────

function getInitials(name: string | null | undefined) {
  return (
    name
      ?.trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "DR"
  );
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(d);
}

function fmtDateSep(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Hari ini";
  if (d.toDateString() === yesterday.toDateString()) return "Kemarin";
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

function needsDateSep(
  msgs: ChatConversation["messages"],
  idx: number,
): boolean {
  if (idx === 0) return true;
  const prev = new Date(msgs[idx - 1].created_at);
  const curr = new Date(msgs[idx].created_at);
  return prev.toDateString() !== curr.toDateString();
}

function needsTimeSep(
  msgs: ChatConversation["messages"],
  idx: number,
): boolean {
  if (idx === 0) return false;
  const prev = new Date(msgs[idx - 1].created_at);
  const curr = new Date(msgs[idx].created_at);
  return curr.getTime() - prev.getTime() > 5 * 60 * 1000;
}

// ─── props ──────────────────────────────────────────────────────────────────

interface Props {
  conversation: ChatConversation;
  user: AuthUser | null;
  connected: boolean;
  isTyping: boolean;
  draft: string;
  sending: boolean;
  actionError: string | null;
  onBack: () => void;
  onDraftChange: (value: string) => void;
  onSend: (e: FormEvent<HTMLFormElement>) => void;
}

// ─── component ──────────────────────────────────────────────────────────────

export default function ChatRoomView({
  conversation,
  user,
  connected,
  isTyping,
  draft,
  sending,
  actionError,
  onBack,
  onDraftChange,
  onSend,
}: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const doctorName =
    conversation.dokter?.profile?.full_name?.trim() || "Dokter Klinik";
  const doctorSpecialty = conversation.dokter?.spesialisasi || "Dokter";
  const doctorInitials = getInitials(doctorName);
  const msgs = conversation.messages;

  // scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length]);

  // auto-resize textarea
  function handleTextareaInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
    onDraftChange(el.value);
  }

  return (
    <div
      className="flex flex-col"
      style={{
        flex: 1,
        height: "100%",
        minHeight: 0,
        fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
        background: "#F0F4F8",
      }}
    >
      {/* ── Header ──────────────────────────────────────────────── */}
      <header
        style={{
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(226,232,240,0.8)",
          boxShadow: "0 1px 12px rgba(0,0,0,0.06)",
          flexShrink: 0,
          zIndex: 40,
        }}
        className="px-4 py-3"
      >
        <div className="flex items-center gap-3">
          {/* back */}
          <button
            type="button"
            onClick={onBack}
            aria-label="Kembali ke daftar dokter"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all active:scale-90"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>

          {/* avatar */}
          <div className="relative flex-shrink-0">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-black text-white"
              style={{
                background: "linear-gradient(135deg, #0B4F71 0%, #2A6B9B 100%)",
                boxShadow: "0 3px 10px rgba(42,107,155,0.35)",
              }}
            >
              {doctorInitials}
            </div>
            {/* online dot */}
            <span
              className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white"
              style={{ background: connected ? "#10B981" : "#CBD5E1" }}
            />
          </div>

          {/* name + status */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-black text-slate-900 leading-tight">
              {doctorName}
            </p>
            <p className="mt-0.5 truncate text-[11px] font-semibold leading-tight"
              style={{ color: connected ? "#059669" : "#94A3B8" }}>
              {connected ? `${doctorSpecialty} · Online` : "Menyambung ulang..."}
            </p>
          </div>

          {/* wifi badge */}
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl"
            style={{
              background: connected ? "#ECFDF5" : "#F1F5F9",
              color: connected ? "#059669" : "#94A3B8",
            }}
            title={connected ? "Realtime aktif" : "Offline"}
          >
            {connected
              ? <Wifi className="h-3.5 w-3.5" />
              : <WifiOff className="h-3.5 w-3.5" />}
          </div>
        </div>
      </header>

      {/* ── Messages ────────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto"
        style={{
          padding: "16px 16px 8px",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {msgs.length === 0 ? (
          /* ── Empty state ── */
          <div className="flex h-full min-h-[300px] flex-col items-center justify-center py-8 text-center">
            <div
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl"
              style={{ background: "rgba(42,107,155,0.10)" }}
            >
              <MessageCircle className="h-8 w-8" style={{ color: "#2A6B9B" }} />
            </div>
            <p className="text-[16px] font-black text-slate-800">Ruang Konsultasi Siap</p>
            <p className="mt-1.5 max-w-[210px] text-[12px] leading-relaxed text-slate-500">
              Sampaikan keluhan Anda. Dokter akan merespons secepatnya.
            </p>
            {/* trust badge */}
            <div
              className="mt-5 flex items-center gap-2 rounded-2xl px-4 py-2.5"
              style={{
                background: "#ECFDF5",
                border: "1px solid #A7F3D0",
              }}
            >
              <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0 text-emerald-600" />
              <p className="text-[11px] font-bold text-emerald-700">
                Percakapan terenkripsi · Privasi terjaga
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {msgs.map((msg, idx) => {
              const isMine = msg.sender_id === user?.id;
              const showDateSep = needsDateSep(msgs, idx);
              const showTimeSep = !showDateSep && needsTimeSep(msgs, idx);

              return (
                <div key={msg.id}>
                  {/* date separator */}
                  {showDateSep && (
                    <div className="my-3 flex items-center gap-3">
                      <div className="h-px flex-1" style={{ background: "#E2E8F0" }} />
                      <span
                        className="rounded-full px-3 py-0.5 text-[10px] font-bold text-slate-500"
                        style={{ background: "#E2E8F0" }}
                      >
                        {fmtDateSep(msg.created_at)}
                      </span>
                      <div className="h-px flex-1" style={{ background: "#E2E8F0" }} />
                    </div>
                  )}
                  {/* time separator (if same day but 5min gap) */}
                  {showTimeSep && (
                    <div className="my-2 flex justify-center">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-slate-400"
                        style={{ background: "rgba(226,232,240,0.6)" }}
                      >
                        {fmtTime(msg.created_at)}
                      </span>
                    </div>
                  )}

                  {/* message row */}
                  <div className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                    {/* doctor avatar — only for doctor's messages */}
                    {!isMine && (
                      <div
                        className="mb-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[8px] font-black text-white"
                        style={{
                          background: "linear-gradient(135deg, #0B4F71 0%, #2A6B9B 100%)",
                          boxShadow: "0 2px 6px rgba(42,107,155,0.3)",
                        }}
                      >
                        {doctorInitials}
                      </div>
                    )}

                    {/* bubble */}
                    <div
                      className="max-w-[78%] rounded-2xl px-4 py-2.5"
                      style={
                        isMine
                          ? {
                              background: "linear-gradient(135deg, #0D3F60 0%, #2A6B9B 100%)",
                              color: "#fff",
                              borderBottomRightRadius: "6px",
                              boxShadow: "0 3px 12px rgba(42,107,155,0.25)",
                            }
                          : {
                              background: "#FFFFFF",
                              color: "#1E293B",
                              borderBottomLeftRadius: "6px",
                              border: "1px solid #E2E8F0",
                              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                            }
                      }
                    >
                      <p className="whitespace-pre-wrap break-words text-[13px] font-medium leading-relaxed">
                        {msg.body}
                      </p>
                      <div
                        className={`mt-1 flex items-center gap-1 text-[10px] font-semibold ${
                          isMine ? "justify-end text-blue-200" : "text-slate-400"
                        }`}
                      >
                        <span>{fmtTime(msg.created_at)}</span>
                        {isMine && <CheckCheck className="h-3 w-3" aria-hidden="true" />}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* typing indicator */}
            {isTyping && (
              <div className="flex items-end gap-2">
                <div
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[8px] font-black text-white"
                  style={{ background: "linear-gradient(135deg, #0B4F71 0%, #2A6B9B 100%)" }}
                >
                  {doctorInitials}
                </div>
                <div
                  className="flex items-center gap-1.5 rounded-2xl px-4 py-3"
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderBottomLeftRadius: "6px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  }}
                >
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="h-1.5 w-1.5 animate-bounce rounded-full"
                      style={{ background: "#94A3B8", animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ── Input Bar ───────────────────────────────────────────── */}
      <div
        style={{
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(226,232,240,0.8)",
          boxShadow: "0 -2px 16px rgba(0,0,0,0.05)",
          flexShrink: 0,
          padding: "10px 16px",
          paddingBottom: "max(10px, env(safe-area-inset-bottom, 10px))",
        }}
      >
        {/* error banner */}
        {actionError && (
          <p
            className="mb-2 rounded-xl px-3 py-2 text-[11px] font-semibold"
            style={{ background: "#FFF1F2", color: "#BE123C" }}
          >
            {actionError}
          </p>
        )}

        <form onSubmit={onSend} className="flex items-end gap-2.5">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Tulis pesan untuk dokter</span>
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={handleTextareaInput}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
              rows={1}
              placeholder="Tulis pesan..."
              className="w-full resize-none rounded-2xl border outline-none transition-all"
              style={{
                minHeight: "44px",
                maxHeight: "120px",
                padding: "11px 16px",
                fontSize: "13px",
                fontWeight: 500,
                color: "#1E293B",
                background: "#F8FAFC",
                borderColor: draft ? "#2A6B9B" : "#E2E8F0",
                boxShadow: draft ? "0 0 0 3px rgba(42,107,155,0.08)" : "none",
                lineHeight: "1.5",
                fontFamily: "inherit",
              }}
            />
          </label>

          <button
            type="submit"
            disabled={!draft.trim() || sending}
            title="Kirim pesan"
            className="flex flex-shrink-0 items-center justify-center rounded-2xl transition-all active:scale-90"
            style={{
              height: "44px",
              width: "44px",
              background:
                !draft.trim() || sending
                  ? "#E2E8F0"
                  : "linear-gradient(135deg, #0D3F60 0%, #2A6B9B 100%)",
              color: !draft.trim() || sending ? "#94A3B8" : "#fff",
              boxShadow:
                !draft.trim() || sending
                  ? "none"
                  : "0 4px 14px rgba(42,107,155,0.35)",
            }}
          >
            {sending ? (
              <span
                className="h-4 w-4 animate-spin rounded-full border-2"
                style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff" }}
              />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
