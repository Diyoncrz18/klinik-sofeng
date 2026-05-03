"use client";

import React, { useState } from "react";
import Link from "next/link";

import {
  saveQueueRegistration,
  type QueueRegistration,
} from "@/lib/queue-registration";

export default function PendaftaranAntrianPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nama: "",
    keluhan: "",
    telepon: "",
  });
  const [registeredQueue, setRegisteredQueue] = useState<QueueRegistration | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.keluhan) return;

    const registration = saveQueueRegistration({
      nama: formData.nama,
      keluhan: formData.keluhan,
      telepon: formData.telepon,
      tujuan: "Poli Gigi Umum",
    });

    setRegisteredQueue(registration);
    setStep(2);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header Mobile */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10 flex items-center shadow-sm">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-600/20 mr-4">
          <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight leading-tight">Klinik Sofeng</h1>
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Pendaftaran Antrian</p>
        </div>
      </header>

      <main className="flex-1 p-6 flex flex-col max-w-md mx-auto w-full">
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
              <h2 className="text-2xl font-black text-gray-900 mb-2">Selamat Datang 👋</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Silakan isi data diri Anda untuk mengambil nomor antrian secara mandiri.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                {/* Input Nama */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                    Nama Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nama"
                    value={formData.nama}
                    onChange={handleChange}
                    required
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors shadow-sm"
                  />
                </div>

                {/* Select Keluhan */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                    Keluhan / Tujuan <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="keluhan"
                      value={formData.keluhan}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors shadow-sm appearance-none"
                    >
                      <option value="" disabled>-- Pilih Tujuan Kunjungan --</option>
                      <option value="Konsultasi Umum">Konsultasi Umum</option>
                      <option value="Sakit Gigi / Nyeri">Sakit Gigi / Nyeri</option>
                      <option value="Cabut Gigi">Cabut Gigi</option>
                      <option value="Pembersihan Karang Gigi">Pembersihan Karang Gigi (Scaling)</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                </div>

                {/* Input Telepon */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                    Nomor Telepon <span className="text-gray-400 font-normal normal-case">(Opsional)</span>
                  </label>
                  <input
                    type="tel"
                    name="telepon"
                    value={formData.telepon}
                    onChange={handleChange}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors shadow-sm"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full py-4 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>
                  Ambil Nomor Antrian
                </button>
                <p className="text-center text-[10px] text-gray-400 mt-4 font-medium uppercase tracking-widest">
                  Aman & Terenkripsi
                </p>
              </div>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in zoom-in-95 duration-500 flex flex-col items-center justify-center flex-1 py-10">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-500 mb-6 shadow-inner border border-emerald-200">
              <svg xmlns="http://www.w3.org/2000/svg" width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
            </div>
            
            <h2 className="text-2xl font-black text-gray-900 mb-2 text-center">Pendaftaran Berhasil!</h2>
            <p className="text-sm text-gray-500 text-center mb-8 px-4">
              Halo, <strong className="text-gray-900">{formData.nama}</strong>. Anda telah berhasil mendaftar ke dalam sistem antrian. Silakan tunggu panggilan dari dokter.
            </p>

            <div className="w-full bg-white rounded-2xl border-2 border-indigo-100 shadow-md p-6 text-center mb-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-indigo-500"></div>
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">Nomor Antrian Anda</p>
              <h3 className="text-5xl font-black text-indigo-700 tracking-tighter">
                {registeredQueue?.queueNumber ?? "--"}
              </h3>
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-xs">
                <span className="text-gray-500 font-medium">Tujuan:</span>
                <span className="font-bold text-gray-900">
                  {registeredQueue?.keluhan ?? formData.keluhan}
                </span>
              </div>
            </div>

            <Link href="/" className="px-6 py-3 bg-white text-gray-700 font-bold text-sm rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm">
              Kembali ke Beranda
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
