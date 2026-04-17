import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ConnectCard } from '@/components/connect/connect-card';
import { connectRoute } from '@/constants/routes';
import { getAllConnectSlugs, getConnectEntryBySlug } from '@/lib/connect';

// ISR: re-render pages every 5 minutes. Well under Notion's ~1h presigned-URL
// window, but moot anyway since the page HTML points at the `/avatar` proxy,
// not the raw S3 URL.
export const revalidate = 300;

/** Pre-render known slugs at build; new slugs work on-demand. */
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const slugs = await getAllConnectSlugs();
  return slugs.map(slug => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getConnectEntryBySlug(slug);

  if (!entry) {
    return { title: 'Not found — SODAX' };
  }

  const path = connectRoute(entry.slug);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sodax.com';
  const url = `${baseUrl}${path}`;
  const title = entry.role ? `${entry.name}, ${entry.role} — SODAX` : `${entry.name} — SODAX`;
  const description = entry.role
    ? `Connect with ${entry.name}, ${entry.role} at SODAX — the cross-network execution layer for modern money.`
    : `Connect with ${entry.name} at SODAX — the cross-network execution layer for modern money.`;

  const ogImage = entry.avatarUrl
    ? { url: `${url}/avatar`, width: 400, height: 400, alt: entry.name }
    : { url: '/link-preview.png', width: 1200, height: 630, alt: 'SODAX' };

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      type: 'profile',
      url,
      siteName: 'SODAX',
      images: [ogImage],
    },
    twitter: {
      card: entry.avatarUrl ? 'summary' : 'summary_large_image',
      title,
      description,
      images: [ogImage.url],
      site: '@gosodax',
    },
  };
}

export default async function ConnectSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = await getConnectEntryBySlug(slug);

  if (!entry) notFound();

  return <ConnectCard entry={entry} avatarProxyUrl={`${connectRoute(entry.slug)}/avatar`} />;
}
