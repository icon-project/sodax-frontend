import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { PublicStatsBurnChartResponse, PublicStatsResponse } from '@/lib/public-stats-types';

const PUBLIC_STATS_ENDPOINT = '/api/public-stats';
const PUBLIC_STATS_BURN_CHART_ENDPOINT = '/api/public-stats/burn-chart';

const ONE_MINUTE_MS = 60 * 1000;
const FIVE_MINUTES_MS = 5 * ONE_MINUTE_MS;

async function fetchPublicStats(): Promise<PublicStatsResponse> {
  const response = await fetch(PUBLIC_STATS_ENDPOINT, { method: 'GET' });
  if (!response.ok) {
    throw new Error(`Failed to fetch public stats (${response.status})`);
  }
  return (await response.json()) as PublicStatsResponse;
}

export function usePublicStats(): UseQueryResult<PublicStatsResponse, Error> {
  return useQuery({
    queryKey: ['publicStats'],
    queryFn: fetchPublicStats,
    staleTime: ONE_MINUTE_MS,
    refetchInterval: FIVE_MINUTES_MS,
    retry: 1,
  });
}

async function fetchBurnChart(window: string, bucket: string): Promise<PublicStatsBurnChartResponse> {
  const url = `${PUBLIC_STATS_BURN_CHART_ENDPOINT}?window=${encodeURIComponent(window)}&bucket=${encodeURIComponent(bucket)}`;
  const response = await fetch(url, { method: 'GET' });
  if (!response.ok) {
    throw new Error(`Failed to fetch burn chart (${response.status})`);
  }
  return (await response.json()) as PublicStatsBurnChartResponse;
}

export function usePublicStatsBurnChart(
  window = '30d',
  bucket = 'day',
): UseQueryResult<PublicStatsBurnChartResponse, Error> {
  return useQuery({
    queryKey: ['publicStats', 'burnChart', window, bucket],
    queryFn: () => fetchBurnChart(window, bucket),
    staleTime: FIVE_MINUTES_MS,
    refetchInterval: FIVE_MINUTES_MS,
    retry: 1,
  });
}
