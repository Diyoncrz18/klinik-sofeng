"use client";

import type { ReactNode } from "react";
import {
  ArrowLeft,
  Award,
  BadgeCheck,
  BookOpen,
  Calendar,
  ChevronRight,
  Clock,
  MessageCircle,
  Phone,
  Shield,
  Star,
  Stethoscope,
  TrendingUp,
  Wifi,
} from "lucide-react";

import type { DokterProfileData } from "@/lib/types";

interface Props {
  doctor: DokterProfileData;
  isStarting?: boolean;
  onBack: () => void;
  onStartChat: () => void;
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

const SPECIALTY_DESCRIPTIONS: Record<string, string> = {
  "Gigi Umum": "Perawatan gigi dan mulut secara komprehensif untuk semua usia.",
  "Ortodonti": "Spesialis pemasangan behel, koreksi gigi bengkok, dan maloklusi.",
  "Prostodonti": "Ahli gigi palsu, mahkota gigi, dan restorasi gigi yang hilang.",
  "Periodonti": "Perawatan gusi, jaringan penyangga gigi, dan implan gigi.",
  "Endodonti": "Perawatan saluran akar gigi dan jaringan pulpa.",
  "Pedodonti": "Dokter gigi anak, spesialis perawatan gigi pada bayi dan anak.",
};

const SPECIALTY_ICONS: Record<string, ReactNode> = {
  "Ortodonti": <Award className="h-5 w-5" />,
  "Prostodonti": <Shield className="h-5 w-5" />,
  "Periodonti": <TrendingUp className="h-5 w-5" />,
  "Endodonti": <BookOpen className="h-5 w-5" />,
  "Pedodonti": <Star className="h-5 w-5" />,
};

function getSpecialtyIcon(spesialisasi: string) {
  return SPECIALTY_ICONS[spesialisasi] ?? <Stethoscope className="h-5 w-5" />;
}

function getSpecialtyDesc(spesialisasi: string) {
  return (
    SPECIALTY_DESCRIPTIONS[spesialisasi] ??
    `Dokter spesialis ${spesialisasi.toLowerCase()} berpengalaman dan profesional.`
  );
}

function renderStars(rating: number) {
  return Array.from({ length: 5 }).map((_, i) => {
    const filled = i < Math.floor(rating);
    const half = !filled && i < rating;
    return (
      <Star
        key={i}
        className={`h-3.5 w-3.5 ${filled || half ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}`}
        aria-hidden="true"
      />
    );
  });
}

// ── Tagline badges untuk dokter ──────────────────────────────────────────
const TAGLINES = [
  { icon: <BadgeCheck className="h-3 w-3" />, label: "Terverifikasi" },
  { icon: <Wifi className="h-3 w-3" />, label: "Online" },
  { icon: <Calendar className="h-3 w-3" />, label: "Buka Hari Ini" },
];

// ── Jam praktik dummy (akan diganti realtime dari backend) ───────────────
const KONSULTASI_BENEFITS = [
  { icon: <Clock className="h-4 w-4 text-[#2A6B9B]" />, text: "Respons dalam 5–10 menit" },
  { icon: <Shield className="h-4 w-4 text-emerald-600" />, text: "Privasi data terjamin" },
  { icon: <MessageCircle className="h-4 w-4 text-violet-600" />, text: "Chat realtime langsung ke dokter" },
  { icon: <Phone className="h-4 w-4 text-amber-600" />, text: "Konsultasi teks tanpa biaya tambahan" },
];

export default function DoctorDetailView({ doctor, isStarting, onBack, onStartChat }: Props) {
  const initials = getInitials(doctor.profile.full_name);
  const ratingNum = Number(doctor.rating ?? 0);
  const specialtyDesc = getSpecialtyDesc(doctor.spesialisasi);

  return (
    <div className="flex min-h-[calc(100vh-40px)] flex-col pb-4">

      {/* ── Sticky Top Header ─────────────────────────────────────── */}
      <div className="sticky top-0 z-40 -mx-4 mb-0 border-b border-slate-100 bg-[#f0f4f8]/96 px-4 py-3 backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Kembali ke daftar dokter"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-[16px] font-black text-slate-950">Profil Dokter</h1>
            <p className="text-[11px] font-semibold text-slate-400">Detail & konsultasi online</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
            <Wifi className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* ── Hero Card ─────────────────────────────────────────────── */}
      <div className="relative mx-0 mb-4 overflow-hidden rounded-3xl bg-gradient-to-br from-[#0D3F60] via-[#1d4e73] to-[#2A6B9B] px-5 pb-6 pt-8 text-white shadow-xl shadow-[#0D3F60]/25">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute right-6 bottom-4 h-16 w-16 rounded-full bg-white/[0.04]" />

        {/* Doctor avatar + status badges */}
        <div className="relative mb-5 flex items-end gap-4">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-white/20 bg-gradient-to-br from-white/20 to-white/10 text-2xl font-black text-white shadow-lg backdrop-blur-sm">
              {initials}
            </div>
            {/* Online indicator */}
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#1d4e73] bg-emerald-500 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            </span>
          </div>

          {/* Taglines stacked on right */}
          <div className="flex flex-col gap-1.5">
            {TAGLINES.map((tag) => (
              <span
                key={tag.label}
                className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-black tracking-wide text-cyan-50"
              >
                {tag.icon}
                {tag.label}
              </span>
            ))}
          </div>
        </div>

        {/* Doctor name & specialty */}
        <h2 className="text-[20px] font-black leading-tight text-white">
          {doctor.profile.full_name}
        </h2>
        <p className="mt-1 text-[13px] font-bold text-cyan-200">{doctor.spesialisasi}</p>

        {/* Rating row */}
        <div className="mt-3 flex items-center gap-3">
          <div className="flex items-center gap-1">
            {renderStars(ratingNum)}
            <span className="ml-1 text-sm font-black text-white">{ratingNum.toFixed(1)}</span>
          </div>
          <span className="h-3.5 w-px bg-white/30" />
          <span className="text-[12px] font-semibold text-cyan-100">
            {doctor.pengalaman_tahun} tahun pengalaman
          </span>
        </div>
      </div>

      {/* ── Specialty Info Card ───────────────────────────────────── */}
      <div className="mb-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#2A6B9B]/10 text-[#2A6B9B]">
            {getSpecialtyIcon(doctor.spesialisasi)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-black text-slate-950">{doctor.spesialisasi}</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{specialtyDesc}</p>
          </div>
        </div>
      </div>

      {/* ── Bio Section ───────────────────────────────────────────── */}
      {doctor.bio && (
        <div className="mb-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <BookOpen className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Tentang Dokter
            </p>
          </div>
          <p className="text-[13px] leading-relaxed text-slate-700">{doctor.bio}</p>
        </div>
      )}

      {/* ── Stats Row ─────────────────────────────────────────────── */}
      <div className="mb-3 grid grid-cols-3 gap-2">
        {[
          { label: "Rating", value: ratingNum.toFixed(1), sub: "/ 5.0", color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Pengalaman", value: `${doctor.pengalaman_tahun}`, sub: "tahun", color: "text-[#2A6B9B]", bg: "bg-blue-50" },
          { label: "Status", value: "Aktif", sub: "online", color: "text-emerald-700", bg: "bg-emerald-50" },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`${stat.bg} flex flex-col items-center rounded-2xl border border-transparent py-3 text-center`}
          >
            <p className={`text-[18px] font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] font-bold text-slate-500">{stat.sub}</p>
            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-400">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Credential Pills ──────────────────────────────────────── */}
      {(doctor.nip || doctor.sip) && (
        <div className="mb-3 flex flex-wrap gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
          <p className="w-full text-[10px] font-black uppercase tracking-wider text-slate-400">
            Kredensial
          </p>
          {doctor.nip && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-700">
              <BadgeCheck className="h-3.5 w-3.5 text-[#2A6B9B]" />
              NIP: {doctor.nip}
            </span>
          )}
          {doctor.sip && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-700">
              <Shield className="h-3.5 w-3.5 text-emerald-600" />
              SIP: {doctor.sip}
            </span>
          )}
        </div>
      )}

      {/* ── Consultation Benefits ─────────────────────────────────── */}
      <div className="mb-5 rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
        <p className="mb-3 text-[11px] font-black uppercase tracking-wider text-slate-400">
          Apa yang Anda dapatkan
        </p>
        <div className="flex flex-col gap-2.5">
          {KONSULTASI_BENEFITS.map((b) => (
            <div key={b.text} className="flex items-center gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-slate-50">
                {b.icon}
              </div>
              <p className="text-[12px] font-semibold text-slate-700">{b.text}</p>
              <ChevronRight className="ml-auto h-3.5 w-3.5 flex-shrink-0 text-slate-300" />
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA Button ───────────────────────────────────────────── */}
      <div className="sticky bottom-0 -mx-0">
        <div className="rounded-3xl border border-slate-100 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm">
          <button
            type="button"
            onClick={onStartChat}
            disabled={isStarting}
            id="btn-mulai-chat-dokter"
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#1d4e73] to-[#2A6B9B] px-5 py-4 text-[15px] font-black text-white shadow-lg shadow-[#2A6B9B]/30 transition active:scale-[0.98] disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
          >
            {isStarting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Membuka Ruang Chat...
              </>
            ) : (
              <>
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
                Mulai Konsultasi
              </>
            )}
          </button>
          <p className="mt-2 text-center text-[10px] font-semibold text-slate-400">
            Pesan terenkripsi · Privasi terjaga · Realtime
          </p>
        </div>
      </div>
    </div>
  );
}
