// apps/web/app/api/pool/positions/route.ts
import { type NextRequest, NextResponse } from 'next/server';

const SODAX_ANALYTICS_API_BASE = 'https://api.sodax.com/v1/a/v1';
const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;
const DEFAULT_LIMIT = 100;
const DEFAULT_OFFSET = 0;

type PositionsApiItem = {
  token_id: string;
  owner: string;
  pool_id: string;
  is_burned: boolean;
};

type PositionsApiError = {
  error: string;
};

function isValidAddress(address: string): boolean {
  return ADDRESS_PATTERN.test(address);
}

function toNonNegativeInteger(value: string | null, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
}

export async function GET(request: NextRequest): Promise<NextResponse<PositionsApiItem[] | PositionsApiError>> {
  const { searchParams } = new URL(request.url);
  const rawAddress = searchParams.get('address')?.trim();

  if (!rawAddress || !isValidAddress(rawAddress)) {
    return NextResponse.json({ error: 'address must be a valid 0x-prefixed EVM address' }, { status: 400 });
  }

  const includeBurnedParam = searchParams.get('include_burned');
  const includeBurned = includeBurnedParam === 'true';
  const limit = toNonNegativeInteger(searchParams.get('limit'), DEFAULT_LIMIT);
  const offset = toNonNegativeInteger(searchParams.get('offset'), DEFAULT_OFFSET);

  const endpoint = `${SODAX_ANALYTICS_API_BASE}/positions/${rawAddress}?include_burned=${String(includeBurned)}&limit=${String(limit)}&offset=${String(offset)}`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        accept: 'application/json',
      },
    });
    if (!response.ok) {
      return NextResponse.json({ error: `Upstream positions request failed (${response.status})` }, { status: 502 });
    }

    const data: unknown = await response.json();
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: 'Invalid positions response from upstream service' }, { status: 502 });
    }

    return NextResponse.json(data as PositionsApiItem[]);
  } catch (error) {
    console.error('GET /api/pool/positions error:', error);
    return NextResponse.json({ error: 'Failed to fetch pool positions data' }, { status: 500 });
  }
}
