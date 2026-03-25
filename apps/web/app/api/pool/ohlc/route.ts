// apps/web/app/api/pool/ohlc/route.ts
import { type NextRequest, NextResponse } from 'next/server';

const SODAX_ANALYTICS_API_BASE = 'https://api.sodax.com/v1/a/v1';
const DEFAULT_LIMIT = 500;
const MAX_LIMIT = 500;
const DEFAULT_INTERVAL = '1h';
const POOL_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

type OhlcInterval = '1h' | '1d';

const ALLOWED_INTERVALS: ReadonlySet<OhlcInterval> = new Set(['1h', '1d']);

function normalizeInterval(interval: string): OhlcInterval | null {
  if (interval === '1h' || interval === '1d') {
    return interval;
  }
  // Keep backward compatibility for older clients that still request 4h.
  if (interval === '4h') {
    return '1d';
  }
  return null;
}

function isValidIsoDate(dateString: string): boolean {
  return Number.isFinite(Date.parse(dateString));
}

function isValidPoolId(poolId: string): boolean {
  return POOL_ID_PATTERN.test(poolId);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const poolId = searchParams.get('poolId')?.trim() ?? '';
  const from = searchParams.get('from')?.trim() ?? '';
  const to = searchParams.get('to')?.trim() ?? '';
  const intervalRaw = searchParams.get('interval')?.trim() ?? DEFAULT_INTERVAL;
  const intervalParam = normalizeInterval(intervalRaw);
  const limitParam = searchParams.get('limit');
  const parsedLimit = Number.parseInt(limitParam ?? String(DEFAULT_LIMIT), 10);
  const limit = Number.isNaN(parsedLimit) ? DEFAULT_LIMIT : Math.max(1, Math.min(MAX_LIMIT, parsedLimit));

  if (!poolId) {
    return NextResponse.json({ error: 'poolId is required' }, { status: 400 });
  }
  if (!isValidPoolId(poolId)) {
    return NextResponse.json(
      { error: 'poolId must be 1-128 characters and contain only letters, numbers, hyphens, or underscores' },
      { status: 400 },
    );
  }
  if (!from || !to || !isValidIsoDate(from) || !isValidIsoDate(to)) {
    return NextResponse.json({ error: 'Valid from and to ISO dates are required' }, { status: 400 });
  }
  if (!intervalParam || !ALLOWED_INTERVALS.has(intervalParam)) {
    return NextResponse.json({ error: 'Unsupported interval' }, { status: 400 });
  }

  const upstreamParams = new URLSearchParams({
    interval: intervalParam,
    from,
    to,
    limit: String(limit),
  });
  const endpoint = `${SODAX_ANALYTICS_API_BASE}/prices/ohlc/${encodeURIComponent(poolId)}?${upstreamParams.toString()}`;

  try {
    const response = await fetch(endpoint, { method: 'GET', cache: 'no-store' });
    if (!response.ok) {
      return NextResponse.json({ error: `Upstream OHLC request failed (${response.status})` }, { status: 502 });
    }

    const data: unknown = await response.json();
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: 'Invalid OHLC response from upstream service' }, { status: 502 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/pool/ohlc error:', error);
    return NextResponse.json({ error: 'Failed to fetch pool OHLC data' }, { status: 500 });
  }
}
