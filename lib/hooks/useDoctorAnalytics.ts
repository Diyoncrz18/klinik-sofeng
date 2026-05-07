"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { getMyDoctorAnalytics } from "@/lib/dokter";
import type { DoctorAnalyticsData, DoctorAnalyticsRange } from "@/lib/types";

export interface UseDoctorAnalyticsData {
  data: DoctorAnalyticsData | null;
  loading: boolean;
  errorMsg: string | null;
  refetch: () => void;
}

export function useDoctorAnalytics(range: DoctorAnalyticsRange): UseDoctorAnalyticsData {
  const [data, setData] = useState<DoctorAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchAnalytics = useCallback(
    async (options: { silent?: boolean } = {}) => {
      if (!options.silent) setLoading(true);
      try {
        const analytics = await getMyDoctorAnalytics(range);
        setData(analytics);
        setErrorMsg(null);
      } catch (error) {
        setErrorMsg(error instanceof Error ? error.message : "Gagal memuat analitik dokter.");
      } finally {
        if (!options.silent) setLoading(false);
      }
    },
    [range],
  );

  useEffect(() => {
    void fetchAnalytics();

    const refreshOnFocus = () => {
      void fetchAnalytics({ silent: true });
    };

    window.addEventListener("focus", refreshOnFocus);
    return () => window.removeEventListener("focus", refreshOnFocus);
  }, [fetchAnalytics]);

  return useMemo(
    () => ({
      data,
      loading,
      errorMsg,
      refetch: () => {
        void fetchAnalytics();
      },
    }),
    [data, errorMsg, fetchAnalytics, loading],
  );
}
