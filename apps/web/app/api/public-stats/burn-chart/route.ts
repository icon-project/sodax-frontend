import { type NextRequest, NextResponse } from 'next/server';

import type { PublicStatsBurnChartPoint, PublicStatsBurnChartResponse } from '@/lib/public-stats-types';

const BD_API_BASE_URL = process.env.BD_API_BASE_URL ?? 'https://bd-api.sodax.com';
const BD_PUBLIC_STATS_API_KEY = process.env.PUBLIC_STATS_API_KEY;

const UPSTREAM_TIMEOUT_MS = 8000;
const EDGE_CACHE_SECONDS = 60;
const EDGE_STALE_WHILE_REVALIDATE_SECONDS = 300;

const DEFAULT_WINDOW = '30d';
const DEFAULT_BUCKET = 'day';
const ALLOWED_WINDOWS = new Set(['7d', '30d', '90d']);
const ALLOWED_BUCKETS = new Set(['hour', 'day', 'week']);

const CACHE_CONTROL_HEADER = `public, s-maxage=${EDGE_CACHE_SECONDS}, stale-while-revalidate=${EDGE_STALE_WHILE_REVALIDATE_SECONDS}`;

interface UpstreamBurnChart {
  window?: string;
  bucket?: string;
  series?: PublicStatsBurnChartPoint[];
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse<PublicStatsBurnChartResponse | { error: string }>> {
  const { searchParams } = new URL(request.url);
  const window = searchParams.get('window')?.trim() || DEFAULT_WINDOW;
  const bucket = searchParams.get('bucket')?.trim() || DEFAULT_BUCKET;

  if (!ALLOWED_WINDOWS.has(window)) {
    return NextResponse.json({ error: `Invalid window. Allowed: ${[...ALLOWED_WINDOWS].join(', ')}` }, { status: 400 });
  }
  if (!ALLOWED_BUCKETS.has(bucket)) {
    return NextResponse.json({ error: `Invalid bucket. Allowed: ${[...ALLOWED_BUCKETS].join(', ')}` }, { status: 400 });
  }

  if (!BD_PUBLIC_STATS_API_KEY) {
    return NextResponse.json({ error: 'Burn chart unavailable' }, { status: 503 });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const upstream = await fetch(
      `${BD_API_BASE_URL}/api/burns/soda/history?window=${encodeURIComponent(window)}&bucket=${encodeURIComponent(bucket)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${BD_PUBLIC_STATS_API_KEY}`,
          accept: 'application/json',
        },
        signal: controller.signal,
        cache: 'no-store',
      },
    );

    if (!upstream.ok) {
      console.error(`[public-stats/burn-chart] Upstream returned ${upstream.status}`);
      return NextResponse.json({ error: 'Burn chart unavailable' }, { status: 502 });
    }

    const data = (await upstream.json()) as UpstreamBurnChart;

    const body: PublicStatsBurnChartResponse = {
      window: data.window ?? window,
      bucket: data.bucket ?? bucket,
      series: Array.isArray(data.series) ? data.series : [],
      fetched_at: new Date().toISOString(),
    };

    return NextResponse.json(body, {
      headers: {
        'Cache-Control': CACHE_CONTROL_HEADER,
      },
    });
  } catch (error) {
    console.error('[public-stats/burn-chart] Failed:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Burn chart unavailable' }, { status: 502 });
  } finally {
    clearTimeout(timeoutId);
  }
}
