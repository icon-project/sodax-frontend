import { getAllSlugs } from '@/lib/notion';
import type { Metadata } from 'next';
import GlossaryDetailPage, {
  SYSTEM_CONFIG,
  generateGlossaryMetadata,
} from '@/components/glossary/glossary-detail-page';

// ISR: Revalidate every hour
export const revalidate = 3600;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllSlugs('system');
  return slugs.map(slug => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return generateGlossaryMetadata(slug, SYSTEM_CONFIG);
}

export default async function SystemPage({ params }: Props) {
  const { slug } = await params;
  return <GlossaryDetailPage slug={slug} config={SYSTEM_CONFIG} />;
}
