// apps/web/app/api/pool/apy/route.ts
import { type NextRequest, NextResponse } from 'next/server';

const SODAX_ANALYTICS_APY_URL = 'https://api.sodax.com/v1/a/v1/apy';
const DEFAULT_POOL_ID = '0x1fbed2bab018dd01756162d135964186addbab00158eda8013de8a15948995cd';
const POOL_ID_PATTERN = /^0x[a-fA-F0-9]{64}$/;

type ApyResponseItem = {
  pool_id?: string;
  fee_apy_24h?: number | null;
  fee_apy_7d?: number | null;
  incentive_apy?: number | null;
};

type PoolApyResponse = {
  poolId: string;
  feeApy24h: number | null;
  feeApy7d: number | null;
  incentiveApy: number | null;
  apy: number | null;
};

function toNumberOrNull(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }
  return value;
}

function isValidPoolId(poolId: string): boolean {
  return POOL_ID_PATTERN.test(poolId);
}

function mapPoolApy(poolId: string, entry: ApyResponseItem): PoolApyResponse {
  const feeApy24h = toNumberOrNull(entry.fee_apy_24h);
  const feeApy7d = toNumberOrNull(entry.fee_apy_7d);
  const incentiveApy = toNumberOrNull(entry.incentive_apy);
  const feeApy = feeApy24h ?? 0 / (feeApy7d ?? 0);
  const totalApy = feeApy === null ? 0 : feeApy + (incentiveApy ?? 0);

  return {
    poolId,
    feeApy24h,
    feeApy7d,
    incentiveApy,
    apy: totalApy,
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const rawPoolId = searchParams.get('poolId')?.trim() ?? DEFAULT_POOL_ID;
  const poolId = rawPoolId.toLowerCase();

  if (!isValidPoolId(poolId)) {
    return NextResponse.json({ error: 'poolId must be a 0x-prefixed 32-byte hex value' }, { status: 400 });
  }

  try {
    const response = await fetch(SODAX_ANALYTICS_APY_URL, { method: 'GET', cache: 'no-store' });
    if (!response.ok) {
      return NextResponse.json({ error: `Upstream APY request failed (${response.status})` }, { status: 502 });
    }

    const data: unknown = await response.json();
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: 'Invalid APY response from upstream service' }, { status: 502 });
    }

    const poolEntry = (data as ApyResponseItem[]).find(item => item.pool_id?.toLowerCase() === poolId);
    if (!poolEntry) {
      return NextResponse.json({ error: 'Pool APY not found' }, { status: 404 });
    }

    return NextResponse.json(mapPoolApy(poolId, poolEntry));
  } catch (error) {
    console.error('GET /api/pool/apy error:', error);
    return NextResponse.json({ error: 'Failed to fetch pool APY data' }, { status: 500 });
  }
}
