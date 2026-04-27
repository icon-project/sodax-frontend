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
const BD_PUBLIC_STATS_API_KEY = process.env.PUBLIC_STATS_API_KEY;

const UPSTREAM_TIMEOUT_MS = 8000;
const EDGE_CACHE_SECONDS = 60;
const EDGE_STALE_WHILE_REVALIDATE_SECONDS = 300;

const CACHE_CONTROL_HEADER = `public, s-maxage=${EDGE_CACHE_SECONDS}, stale-while-revalidate=${EDGE_STALE_WHILE_REVALIDATE_SECONDS}`;

interface UpstreamPrice {
  price_usd?: number;
  oracle_updated_at?: number;
}

interface UpstreamBurns {
  total_burned_soda?: number;
  last_7d_burned_soda?: number;
  last_30d_burned_soda?: number;
  today_burned_soda?: number;
  first_burn_date?: string;
}

interface UpstreamSupply {
  circulating_supply?: number;
  total_supply?: number;
  locked_supply?: number;
  circulating_pct?: number;
  market_cap_usd?: number;
  fully_diluted_valuation_usd?: number;
}

interface UpstreamNetworks {
  supported?: number;
  active?: number;
}

interface UpstreamActivity {
  txns_24h?: number;
  txns_7d?: number;
  txns_30d?: number;
  cadence_seconds_24h?: number;
  accel_pct_vs_30d?: number;
}

type UpstreamFetchResult<T> = { ok: true; data: T } | { ok: false };

async function fetchUpstream<T>(path: string): Promise<UpstreamFetchResult<T>> {
  if (!BD_PUBLIC_STATS_API_KEY) {
    console.warn(`[public-stats] PUBLIC_STATS_API_KEY not configured — skipping ${path}`);
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

function normalizePrice(raw: UpstreamPrice | null): PublicStatsPrice | null {
  if (!raw || typeof raw.price_usd !== 'number' || typeof raw.oracle_updated_at !== 'number') {
    return null;
  }
  return { usd: raw.price_usd, oracle_updated_at: raw.oracle_updated_at };
}

function normalizeBurns(raw: UpstreamBurns | null): PublicStatsBurns | null {
  if (!raw) return null;
  return {
    total_soda: numberOrZero(raw.total_burned_soda),
    last_7d_soda: numberOrZero(raw.last_7d_burned_soda),
    last_30d_soda: numberOrZero(raw.last_30d_burned_soda),
    today_soda: numberOrZero(raw.today_burned_soda),
    first_burn_date: raw.first_burn_date ?? '',
  };
}

function normalizeSupply(raw: UpstreamSupply | null): PublicStatsSupply | null {
  if (!raw) return null;
  return {
    circulating: numberOrZero(raw.circulating_supply),
    total: numberOrZero(raw.total_supply),
    locked: numberOrZero(raw.locked_supply),
    circulating_pct: numberOrZero(raw.circulating_pct),
    market_cap_usd: numberOrZero(raw.market_cap_usd),
    fully_diluted_valuation_usd: numberOrZero(raw.fully_diluted_valuation_usd),
  };
}

function normalizeNetworks(raw: UpstreamNetworks | null): PublicStatsNetworks | null {
  if (!raw || typeof raw.supported !== 'number' || typeof raw.active !== 'number') {
    return null;
  }
  return { supported: raw.supported, active: raw.active };
}

function normalizeActivity(raw: UpstreamActivity | null): PublicStatsActivity | null {
  if (!raw) return null;
  return {
    txns_24h: numberOrZero(raw.txns_24h),
    txns_7d: numberOrZero(raw.txns_7d),
    txns_30d: numberOrZero(raw.txns_30d),
    cadence_seconds_24h: numberOrZero(raw.cadence_seconds_24h),
    accel_pct_vs_30d: numberOrZero(raw.accel_pct_vs_30d),
  };
}

function numberOrZero(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function unwrap<T>(result: UpstreamFetchResult<T>): T | null {
  return result.ok ? result.data : null;
}

export async function GET(): Promise<NextResponse<PublicStatsResponse>> {
  const [priceResult, burnsResult, supplyResult, networksResult, activityResult] = await Promise.all([
    fetchUpstream<UpstreamPrice>('/api/prices/soda'),
    fetchUpstream<UpstreamBurns>('/api/burns/soda'),
    fetchUpstream<UpstreamSupply>('/api/supply/soda'),
    fetchUpstream<UpstreamNetworks>('/api/networks/live'),
    fetchUpstream<UpstreamActivity>('/api/activity/pulse'),
  ]);

  const body: PublicStatsResponse = {
    price: normalizePrice(unwrap(priceResult)),
    burns: normalizeBurns(unwrap(burnsResult)),
    supply: normalizeSupply(unwrap(supplyResult)),
    networks: normalizeNetworks(unwrap(networksResult)),
    activity: normalizeActivity(unwrap(activityResult)),
    fetched_at: new Date().toISOString(),
  };

  return NextResponse.json(body, {
    headers: {
      'Cache-Control': CACHE_CONTROL_HEADER,
    },
  });
}
