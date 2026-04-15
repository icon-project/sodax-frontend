import { NextResponse } from 'next/server';
import { getConnectEntryBySlug } from '@/lib/connect';

/**
 * Avatar proxy: resolves the Notion presigned S3 URL at request time and
 * streams the image bytes. Gives `/connect/{slug}/avatar` a stable, permanent
 * URL even though the underlying S3 links expire hourly.
 *
 * Caches the rendered image for 1h publicly, which matches Notion's presigned
 * URL lifetime and lets CDNs serve it without touching Notion every request.
 * The `getConnectEntryBySlug` call itself is cached by the shared 5-min ISR
 * on the Notion fetch, so most requests won't even round-trip to Notion.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = await getConnectEntryBySlug(slug);

  if (!entry?.avatarUrl) {
    return new NextResponse('Not found', { status: 404 });
  }

  const upstream = await fetch(entry.avatarUrl);

  if (!upstream.ok || !upstream.body) {
    console.error(`[connect/avatar] Upstream fetch failed for slug=${slug}: ${upstream.status}`);
    return new NextResponse('Upstream fetch failed', { status: 502 });
  }

  const contentType = upstream.headers.get('content-type') ?? 'image/jpeg';

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      // Public cache for 1h; allow a 24h stale-while-revalidate window so CDNs
      // keep serving during Notion hiccups. Notion DB edits surface in <=5min
      // via the page's ISR + our own 5-min tag cache.
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
