"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Download,
  LineChart,
  RefreshCw,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { useDoctorAnalytics } from "@/lib/hooks/useDoctorAnalytics";
import type {
  DoctorAnalyticsBucket,
  DoctorAnalyticsMetric,
  DoctorAnalyticsRange,
} from "@/lib/types";

const RANGE_OPTIONS: Array<{ key: DoctorAnalyticsRange; label: string }> = [
  { key: "week", label: "Minggu Ini" },
  { key: "month", label: "Bulan Ini" },
  { key: "year", label: "Tahun Ini" },
];

const TYPE_LABELS: Record<string, string> = {
  konsultasi: "Konsultasi",
  pemeriksaan: "Pemeriksaan",
  kontrol: "Kontrol",
  tindakan: "Tindakan",
  darurat: "Darurat",
};

const STATUS_LABELS: Record<string, string> = {
  terjadwal: "Terjadwal",
  menunggu: "Menunggu",
  sedang_ditangani: "Sedang Ditangani",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
  tidak_hadir: "Tidak Hadir",
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercentValue(value: number): string {
  return `${formatNumber(value)}%`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function metricTrend(metric: DoctorAnalyticsMetric): {
  label: string;
  className: string;
  Icon: LucideIcon;
} {
  if (metric.deltaPct > 0) {
    return {
      label: `+${metric.deltaPct}%`,
      className: "bg-emerald-50 text-emerald-700 border-emerald-100",
      Icon: TrendingUp,
    };
  }
  if (metric.deltaPct < 0) {
    return {
      label: `${metric.deltaPct}%`,
      className: "bg-rose-50 text-rose-700 border-rose-100",
      Icon: TrendingDown,
    };
  }
  return {
    label: "Stabil",
    className: "bg-gray-50 text-gray-600 border-gray-100",
    Icon: Activity,
  };
}

function maxBucketValue(items: DoctorAnalyticsBucket[]): number {
  return Math.max(1, ...items.map((item) => item.value));
}

function displayBucketLabel(item: DoctorAnalyticsBucket): string {
  return TYPE_LABELS[item.key] ?? STATUS_LABELS[item.key] ?? item.label;
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="h-10 w-10 rounded-lg bg-gray-100 animate-pulse" />
            <div className="mt-5 h-7 w-24 rounded bg-gray-100 animate-pulse" />
            <div className="mt-3 h-3 w-32 rounded bg-gray-50 animate-pulse" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="h-80 rounded-xl border border-gray-100 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="h-4 w-48 rounded bg-gray-100 animate-pulse" />
          <div className="mt-8 h-52 rounded bg-gray-50 animate-pulse" />
        </div>
        <div className="h-80 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="h-4 w-40 rounded bg-gray-100 animate-pulse" />
          <div className="mt-8 h-52 rounded bg-gray-50 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  metric,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  metric: DoctorAnalyticsMetric;
  icon: LucideIcon;
  tone: string;
}) {
  const trend = metricTrend(metric);
  const TrendIcon = trend.Icon;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-black ${trend.className}`}
        >
          <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {trend.label}
        </span>
      </div>
      <p className="mt-5 text-2xl font-black text-gray-900">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase text-gray-500">{title}</p>
      <p className="mt-3 text-[11px] font-medium text-gray-400">
        Sebelumnya: {formatNumber(metric.previous)}
      </p>
    </div>
  );
}

function BreakdownList({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: DoctorAnalyticsBucket[];
  emptyLabel: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h4 className="text-sm font-black text-gray-900">{title}</h4>
        <BarChart3 className="h-4 w-4 text-gray-400" aria-hidden="true" />
      </div>
      {items.length === 0 ? (
        <div className="flex min-h-40 items-center justify-center rounded-lg bg-gray-50 px-4 text-center text-sm font-semibold text-gray-400">
          {emptyLabel}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.key}>
              <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                <span className="font-bold text-gray-700">{displayBucketLabel(item)}</span>
                <span className="font-black text-gray-900">{formatNumber(item.value)}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-blue-600"
                  style={{ width: `${Math.max(3, item.percentage ?? 0)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DoctorAnalyticsPage() {
  const [range, setRange] = useState<DoctorAnalyticsRange>("month");
  const { data, loading, errorMsg, refetch } = useDoctorAnalytics(range);

  const maxVisit = useMemo(
    () => maxBucketValue(data?.charts.visitTrend ?? []),
    [data?.charts.visitTrend],
  );
  const maxHour = useMemo(
    () => maxBucketValue(data?.charts.hourlyDistribution ?? []),
    [data?.charts.hourlyDistribution],
  );
  const ageTotal = data?.charts.demographics.ageGroups.reduce((sum, item) => sum + item.value, 0) ?? 0;

  function exportCsv() {
    if (!data) return;

    const rows = [
      ["Periode", `${formatDate(data.period.from)} - ${formatDate(data.period.to)}`],
      ["Appointment", String(data.kpis.appointments.value)],
      ["Pasien Unik", String(data.kpis.uniquePatients.value)],
      ["Pasien Baru", String(data.kpis.newPatients.value)],
      ["Tingkat Selesai", `${data.kpis.completionRate.value}%`],
      ["Pendapatan Rekam Medis", String(data.kpis.revenue.value)],
      [],
      ["Top Diagnosa", "Total Kasus", "Pendapatan"],
      ...data.topDiagnoses.map((item) => [
        item.diagnosa,
        String(item.count),
        String(item.revenue),
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `analitik-dokter-${data.range}-${data.period.to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="h-full overflow-y-auto pb-8" style={{ scrollbarWidth: "thin" }}>
      <div className="mb-5 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-700">
              <LineChart className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Analitik &amp; Performa</h3>
              <p className="text-xs font-medium text-gray-500">
                {data
                  ? `${formatDate(data.period.from)} - ${formatDate(data.period.to)}`
                  : "Menghitung data operasional dokter"}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
              {RANGE_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setRange(option.key)}
                  className={[
                    "rounded-md px-3 py-1.5 text-xs font-black transition-colors",
                    range === option.key
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-800",
                  ].join(" ")}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={refetch}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-wait disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
              Refresh
            </button>
            <button
              type="button"
              onClick={exportCsv}
              disabled={!data}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {errorMsg ? (
        <div className="mb-5 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          {errorMsg}
        </div>
      ) : null}

      {loading && !data ? (
        <AnalyticsSkeleton />
      ) : data ? (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title="Appointment"
              value={formatNumber(data.kpis.appointments.value)}
              metric={data.kpis.appointments}
              icon={CalendarCheck}
              tone="bg-blue-50 text-blue-700"
            />
            <KpiCard
              title="Pasien Unik"
              value={formatNumber(data.kpis.uniquePatients.value)}
              metric={data.kpis.uniquePatients}
              icon={Users}
              tone="bg-emerald-50 text-emerald-700"
            />
            <KpiCard
              title="Tingkat Selesai"
              value={formatPercentValue(data.kpis.completionRate.value)}
              metric={data.kpis.completionRate}
              icon={CheckCircle2}
              tone="bg-teal-50 text-teal-700"
            />
            <KpiCard
              title="Pendapatan"
              value={formatCurrency(data.kpis.revenue.value)}
              metric={data.kpis.revenue}
              icon={Wallet}
              tone="bg-amber-50 text-amber-700"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <KpiCard
              title="Pasien Baru"
              value={formatNumber(data.kpis.newPatients.value)}
              metric={data.kpis.newPatients}
              icon={Users}
              tone="bg-cyan-50 text-cyan-700"
            />
            <KpiCard
              title="Rata-rata / Hari"
              value={String(data.kpis.averageDailyAppointments.value)}
              metric={data.kpis.averageDailyAppointments}
              icon={Activity}
              tone="bg-slate-100 text-slate-700"
            />
            <KpiCard
              title="Kasus Darurat"
              value={formatNumber(data.kpis.emergencyCases.value)}
              metric={data.kpis.emergencyCases}
              icon={AlertTriangle}
              tone="bg-rose-50 text-rose-700"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm xl:col-span-2">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-base font-black text-gray-900">Tren Kunjungan</h4>
                  <p className="text-xs font-medium text-gray-500">
                    Total appointment berdasarkan periode pilihan
                  </p>
                </div>
                <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                  {formatNumber(data.kpis.appointments.value)} total
                </span>
              </div>
              <div className="flex h-56 items-end gap-2 overflow-x-auto border-b border-gray-100 pb-3">
                {data.charts.visitTrend.length === 0 ? (
                  <div className="flex h-full w-full items-center justify-center rounded-lg bg-gray-50 text-sm font-semibold text-gray-400">
                    Belum ada data kunjungan
                  </div>
                ) : (
                  data.charts.visitTrend.map((item) => (
                    <div key={item.key} className="flex min-w-10 flex-1 flex-col items-center justify-end gap-2">
                      <span className="text-[10px] font-black text-gray-700">{formatNumber(item.value)}</span>
                      <div
                        className="w-full rounded-t-lg bg-blue-600 transition-colors hover:bg-blue-700"
                        style={{ height: `${Math.max(6, (item.value / maxVisit) * 100)}%` }}
                      />
                    </div>
                  ))
                )}
              </div>
              <div className="mt-2 flex gap-2 overflow-x-auto text-[10px] font-bold text-gray-400">
                {data.charts.visitTrend.map((item) => (
                  <span key={item.key} className="min-w-10 flex-1 text-center">
                    {item.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-5">
                <h4 className="text-base font-black text-gray-900">Jam Sibuk</h4>
                <p className="text-xs font-medium text-gray-500">Distribusi appointment per jam</p>
              </div>
              <div className="space-y-3">
                {data.charts.hourlyDistribution.map((item) => (
                  <div key={item.key} className="grid grid-cols-[54px_minmax(0,1fr)_32px] items-center gap-2">
                    <span className="text-xs font-bold text-gray-500">{item.label}</span>
                    <div className="h-2.5 rounded-full bg-gray-100">
                      <div
                        className="h-2.5 rounded-full bg-emerald-600"
                        style={{ width: `${Math.max(2, (item.value / maxHour) * 100)}%` }}
                      />
                    </div>
                    <span className="text-right text-xs font-black text-gray-800">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
            <BreakdownList
              title="Jenis Appointment"
              items={data.charts.appointmentTypes}
              emptyLabel="Belum ada appointment"
            />
            <BreakdownList
              title="Status Appointment"
              items={data.charts.statuses}
              emptyLabel="Belum ada status appointment"
            />
            <BreakdownList
              title="Usia Pasien"
              items={data.charts.demographics.ageGroups}
              emptyLabel="Demografi usia belum tersedia"
            />
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h4 className="text-sm font-black text-gray-900">Ringkasan Pasien</h4>
                <Stethoscope className="h-4 w-4 text-gray-400" aria-hidden="true" />
              </div>
              <div className="flex min-h-40 flex-col justify-center gap-4">
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs font-bold text-gray-500">Pasien dengan demografi</p>
                  <p className="mt-1 text-2xl font-black text-gray-900">{formatNumber(ageTotal)}</p>
                </div>
                <div className="space-y-2">
                  {data.charts.demographics.gender.length === 0 ? (
                    <p className="text-sm font-semibold text-gray-400">Gender belum tersedia</p>
                  ) : (
                    data.charts.demographics.gender.map((item) => (
                      <div key={item.key} className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-600">{item.label}</span>
                        <span className="font-black text-gray-900">
                          {item.value} ({item.percentage}%)
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/60 px-5 py-4">
                <div>
                  <h4 className="text-base font-black text-gray-900">Top Diagnosa</h4>
                  <p className="text-xs font-medium text-gray-500">
                    Berdasarkan rekam medis pada periode ini
                  </p>
                </div>
                <ClipboardList className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-100 text-[10px] font-black uppercase text-gray-400">
                    <tr>
                      <th className="px-5 py-3">Rank</th>
                      <th className="px-5 py-3">Diagnosa</th>
                      <th className="px-5 py-3">Kasus</th>
                      <th className="px-5 py-3">Tindakan</th>
                      <th className="px-5 py-3">Pendapatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.topDiagnoses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-10 text-center text-sm font-semibold text-gray-400">
                          Belum ada rekam medis pada periode ini
                        </td>
                      </tr>
                    ) : (
                      data.topDiagnoses.map((item) => (
                        <tr key={item.diagnosa} className="hover:bg-blue-50/30">
                          <td className="px-5 py-4 text-base font-black text-blue-700">#{item.rank}</td>
                          <td className="px-5 py-4">
                            <p className="font-bold text-gray-900">{item.diagnosa}</p>
                            <p className="text-[11px] font-medium text-gray-400">
                              Terakhir {formatDate(item.latestDate)}
                            </p>
                          </td>
                          <td className="px-5 py-4 font-black text-gray-900">{item.count}</td>
                          <td className="px-5 py-4 font-bold text-gray-600">{item.treatmentCount}</td>
                          <td className="px-5 py-4 font-black text-emerald-700">
                            {formatCurrency(item.revenue)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <h4 className="mb-4 text-base font-black text-gray-900">Insight Otomatis</h4>
              <div className="space-y-3">
                {data.insights.map((item) => {
                  const toneClass =
                    item.tone === "success"
                      ? "border-emerald-100 bg-emerald-50 text-emerald-800"
                      : item.tone === "warning"
                        ? "border-amber-100 bg-amber-50 text-amber-800"
                        : "border-blue-100 bg-blue-50 text-blue-800";
                  return (
                    <div key={item.title} className={`rounded-lg border p-3 ${toneClass}`}>
                      <p className="text-sm font-black">{item.title}</p>
                      <p className="mt-1 text-xs font-medium leading-relaxed opacity-80">
                        {item.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
