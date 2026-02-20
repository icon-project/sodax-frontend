import { getAllSlugs } from '@/lib/notion';
import type { Metadata } from 'next';
import GlossaryDetailPage, {
  CONCEPT_CONFIG,
  generateGlossaryMetadata,
} from '@/components/glossary/glossary-detail-page';

// ISR: Revalidate every hour
export const revalidate = 3600;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllSlugs('concepts');
  return slugs.map(slug => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return generateGlossaryMetadata(slug, CONCEPT_CONFIG);
}

export default async function ConceptPage({ params }: Props) {
  const { slug } = await params;
  return <GlossaryDetailPage slug={slug} config={CONCEPT_CONFIG} />;
}
