// apps/web/app/api/stake/vault-apy/route.ts
import { type NextRequest, NextResponse } from 'next/server';

const STAKE_VAULT_ADDRESS = '0xADC6561Cc8FC31767B4917CCc97F510D411378d9';
const SODAX_API_BASE = 'https://api.sodax.com/v1/a/v1';
const DEFAULT_DAYS = 7;
const MIN_DAYS = 1;
const MAX_DAYS = 365;

interface StakeVaultApyExternalResponse {
  apy_percent: string;
}

// This endpoint proxies browser traffic through Next.js server runtime to avoid CORS on the client.
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const daysParam = searchParams.get('days');
  const parsedDays = Number.parseInt(daysParam ?? String(DEFAULT_DAYS), 10);
  const days = Number.isNaN(parsedDays) ? DEFAULT_DAYS : Math.min(MAX_DAYS, Math.max(MIN_DAYS, parsedDays));

  const endpoint = `${SODAX_API_BASE}/vault-rates/${STAKE_VAULT_ADDRESS}/apy?days=${days}`;

  try {
    const response = await fetch(endpoint, { method: 'GET', cache: 'no-store' });
    if (!response.ok) {
      return NextResponse.json({ error: `Upstream APY request failed (${response.status})` }, { status: 502 });
    }

    const data: unknown = await response.json();
    if (!data || typeof data !== 'object' || !('apy_percent' in data)) {
      return NextResponse.json({ error: 'Invalid APY response from upstream service' }, { status: 502 });
    }

    const apyPercentRaw = (data as StakeVaultApyExternalResponse).apy_percent;
    const apyPercent = Number.parseFloat(apyPercentRaw);
    if (Number.isNaN(apyPercent)) {
      return NextResponse.json({ error: 'Invalid APY value from upstream service' }, { status: 502 });
    }

    return NextResponse.json({ apyPercent });
  } catch (error) {
    console.error('GET /api/stake/vault-apy error:', error);
    return NextResponse.json({ error: 'Failed to fetch stake APY' }, { status: 500 });
  }
}
