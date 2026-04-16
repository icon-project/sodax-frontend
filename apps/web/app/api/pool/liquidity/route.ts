// apps/web/app/api/pool/liquidity/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import type { LiquidityBucket } from '@/app/(apps)/pool/_components/pool-detail-dialog/pool-liquidity-chart';

const SODAX_ANALYTICS_API_BASE = 'https://api.sodax.com/v1/a/v1';
const POOL_ID_PATTERN = /^0x[a-fA-F0-9]{64}$/;

type UpstreamLiquidityBucket = {
  tick_lower?: number;
  tick_upper?: number;
  liquidity?: string | number;
  is_current?: boolean;
};

type UpstreamLiquidityResponse = {
  buckets?: unknown;
  current_tick?: number;
  total_liquidity_usd?: string | number;
};

type LiquidityRouteError = {
  error: string;
};

type LiquidityRouteSuccess = {
  buckets: LiquidityBucket[];
  total_liquidity_usd: string;
};

function isValidPoolId(poolId: string): boolean {
  return POOL_ID_PATTERN.test(poolId);
}

function toLiquidityBucketArray(payload: UpstreamLiquidityResponse): LiquidityBucket[] {
  if (Array.isArray(payload.buckets)) {
    return payload.buckets.reduce<LiquidityBucket[]>((acc, bucket) => {
      const candidate = bucket as UpstreamLiquidityBucket;
      if (
        typeof candidate.tick_lower === 'number' &&
        Number.isFinite(candidate.tick_lower) &&
        typeof candidate.tick_upper === 'number' &&
        Number.isFinite(candidate.tick_upper)
      ) {
        acc.push({
          tick_lower: candidate.tick_lower,
          tick_upper: candidate.tick_upper,
          liquidity: String(candidate.liquidity ?? '0'),
          is_current: candidate.is_current === true,
        });
      }
      return acc;
    }, []);
  }
  return [];
}

export async function GET(request: NextRequest): Promise<NextResponse<LiquidityRouteSuccess | LiquidityRouteError>> {
  const { searchParams } = new URL(request.url);
  const poolId = searchParams.get('poolId')?.trim() ?? '';

  if (!poolId) {
    return NextResponse.json({ error: 'poolId is required' }, { status: 400 });
  }
  if (!isValidPoolId(poolId)) {
    return NextResponse.json({ error: 'poolId must be a 0x-prefixed 32-byte hex value' }, { status: 400 });
  }

  const endpoint = `${SODAX_ANALYTICS_API_BASE}/pools/${encodeURIComponent(poolId)}/liquidity`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        accept: 'application/json',
      },
    });
    if (!response.ok) {
      return NextResponse.json({ error: `Upstream liquidity request failed (${response.status})` }, { status: 502 });
    }

    const data = (await response.json()) as UpstreamLiquidityResponse;
    const buckets = toLiquidityBucketArray(data);
    const totalLiquidityUsd = String(data.total_liquidity_usd ?? '0');
    return NextResponse.json({
      buckets,
      total_liquidity_usd: totalLiquidityUsd,
    });
  } catch (error) {
    console.error('GET /api/pool/liquidity error:', error);
    return NextResponse.json({ error: 'Failed to fetch pool liquidity data' }, { status: 500 });
  }
}
