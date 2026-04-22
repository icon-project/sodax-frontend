import { NextResponse } from 'next/server';

import type {
  PublicStatsActivity,
  PublicStatsBurns,
  PublicStatsNetworks,
  PublicStatsPrice,
  PublicStatsResponse,
  PublicStatsSupply,
} from '@/lib/public-stats-types';

const BD_API_BASE_URL = process.env.BD_API_BASE_URL ?? 'https://bd-api.sodax.com';
const BD_PUBLIC_STATS_API_KEY = process.env.BD_PUBLIC_STATS_API_KEY;

const UPSTREAM_TIMEOUT_MS = 8000;
const EDGE_CACHE_SECONDS = 60;
const EDGE_STALE_WHILE_REVALIDATE_SECONDS = 300;

const CACHE_CONTROL_HEADER = `public, s-maxage=${EDGE_CACHE_SECONDS}, stale-while-revalidate=${EDGE_STALE_WHILE_REVALIDATE_SECONDS}`;

type UpstreamFetchResult<T> = { ok: true; data: T } | { ok: false };

async function fetchUpstream<T>(path: string): Promise<UpstreamFetchResult<T>> {
  if (!BD_PUBLIC_STATS_API_KEY) {
    console.warn(`[public-stats] BD_PUBLIC_STATS_API_KEY not configured — skipping ${path}`);
    return { ok: false };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const response = await fetch(`${BD_API_BASE_URL}${path}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${BD_PUBLIC_STATS_API_KEY}`,
        accept: 'application/json',
      },
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`[public-stats] Upstream ${path} returned ${response.status}`);
      return { ok: false };
    }

    const data = (await response.json()) as T;
    return { ok: true, data };
  } catch (error) {
    console.error(`[public-stats] Upstream ${path} failed:`, error instanceof Error ? error.message : error);
    return { ok: false };
  } finally {
    clearTimeout(timeoutId);
  }
}

function unwrap<T>(result: UpstreamFetchResult<T>): T | null {
  return result.ok ? result.data : null;
}

export async function GET(): Promise<NextResponse<PublicStatsResponse>> {
  const [priceResult, burnsResult, supplyResult, networksResult, activityResult] = await Promise.all([
    fetchUpstream<PublicStatsPrice>('/api/prices/soda'),
    fetchUpstream<PublicStatsBurns>('/api/burns/soda'),
    fetchUpstream<PublicStatsSupply>('/api/supply/soda'),
    fetchUpstream<PublicStatsNetworks>('/api/networks/live'),
    fetchUpstream<PublicStatsActivity>('/api/activity/pulse'),
  ]);

  const body: PublicStatsResponse = {
    price: unwrap(priceResult),
    burns: unwrap(burnsResult),
    supply: unwrap(supplyResult),
    networks: unwrap(networksResult),
    activity: unwrap(activityResult),
    fetched_at: new Date().toISOString(),
  };

  return NextResponse.json(body, {
    headers: {
      'Cache-Control': CACHE_CONTROL_HEADER,
    },
  });
}
