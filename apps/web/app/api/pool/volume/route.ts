// apps/web/app/api/pool/volume/route.ts
import { type NextRequest, NextResponse } from 'next/server';

const SODAX_ANALYTICS_API_BASE = 'https://api.sodax.com/v1/a/v1';
const DEFAULT_INTERVAL = '1h';
const DEFAULT_LIMIT = '500';
const DEFAULT_POOL_ID = '0x1fbed2bab018dd01756162d135964186addbab00158eda8013de8a15948995cd';
const POOL_ID_PATTERN = /^0x[a-fA-F0-9]{64}$/;

type UpstreamVolumeBucket = {
  bucket?: string;
  volume0?: string | number;
  volume1?: string | number;
  trade_count?: number;
  volume_usd?: string | number;
};

type PoolVolumeSuccess = {
  poolId: string;
  interval: string;
  from: string;
  to: string;
  bucketCount: number;
  tradeCount: number;
  totalVolume0: string;
  totalVolume1: string;
  totalVolumeUsd: string;
};

type PoolVolumeError = {
  error: string;
};

function isValidPoolId(poolId: string): boolean {
  return POOL_ID_PATTERN.test(poolId);
}

function toSqlTimestamp(date: Date): string {
  const isoDate = date.toISOString();
  return isoDate.slice(0, 19).replace('T', ' ');
}

function pow10(power: number): bigint {
  return 10n ** BigInt(power);
}

// Purpose: parse non-negative integer/scientific numeric text into exact bigint.
function parseVolumeToBigInt(value: string | number | undefined): bigint {
  if (value === undefined) {
    return 0n;
  }

  const normalized = String(value).trim();
  if (normalized === '') {
    return 0n;
  }

  if (!/^[+]?\d+(\.\d+)?([eE][+]?\d+)?$/.test(normalized)) {
    return 0n;
  }

  const [basePart, exponentPart] = normalized.split(/[eE]/);
  const exponent = exponentPart === undefined ? 0 : Number(exponentPart);
  if (!Number.isInteger(exponent) || exponent < 0) {
    return 0n;
  }

  const decimalParts = basePart?.split('.') ?? [];
  const whole = decimalParts[0] ?? '0';
  const fraction = decimalParts[1] ?? '';
  const digits = `${whole}${fraction}`.replace(/^0+/, '') || '0';
  const scale = fraction.length;
  const shift = exponent - scale;

  if (shift >= 0) {
    return BigInt(digits) * pow10(shift);
  }

  const divisor = pow10(-shift);
  return BigInt(digits) / divisor;
}

export async function GET(request: NextRequest): Promise<NextResponse<PoolVolumeSuccess | PoolVolumeError>> {
  const { searchParams } = new URL(request.url);
  const rawPoolId = searchParams.get('poolId')?.trim() ?? DEFAULT_POOL_ID;
  const poolId = rawPoolId.toLowerCase();
  const interval = searchParams.get('interval')?.trim() || DEFAULT_INTERVAL;
  const limit = searchParams.get('limit')?.trim() || DEFAULT_LIMIT;

  if (!isValidPoolId(poolId)) {
    return NextResponse.json({ error: 'poolId must be a 0x-prefixed 32-byte hex value' }, { status: 400 });
  }

  const toDate = new Date();
  const fromDate = new Date(toDate.getTime() - 24 * 60 * 60 * 1000);
  const from = toSqlTimestamp(fromDate);
  const to = toSqlTimestamp(toDate);

  const endpoint = `${SODAX_ANALYTICS_API_BASE}/volume/pool/${encodeURIComponent(poolId)}?interval=${encodeURIComponent(interval)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&limit=${encodeURIComponent(limit)}`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        accept: 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Upstream volume request failed (${response.status})` }, { status: 502 });
    }

    const data: unknown = await response.json();
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: 'Invalid volume response from upstream service' }, { status: 502 });
    }

    const buckets = data as UpstreamVolumeBucket[];
    const totals = buckets.reduce(
      (acc, item) => {
        acc.volume0 += parseVolumeToBigInt(item.volume0);
        acc.volume1 += parseVolumeToBigInt(item.volume1);
        acc.tradeCount += Number.isFinite(item.trade_count) ? Number(item.trade_count) : 0;
        const parsedVolumeUsd = Number(item.volume_usd ?? 0);
        acc.volumeUsd += Number.isFinite(parsedVolumeUsd) ? parsedVolumeUsd : 0;
        return acc;
      },
      { volume0: 0n, volume1: 0n, tradeCount: 0, volumeUsd: 0 },
    );

    return NextResponse.json({
      poolId,
      interval,
      from,
      to,
      bucketCount: buckets.length,
      tradeCount: totals.tradeCount,
      totalVolume0: totals.volume0.toString(),
      totalVolume1: totals.volume1.toString(),
      totalVolumeUsd: totals.volumeUsd.toString(),
    });
  } catch (error) {
    console.error('GET /api/pool/volume error:', error);
    return NextResponse.json({ error: 'Failed to fetch pool volume data' }, { status: 500 });
  }
}
