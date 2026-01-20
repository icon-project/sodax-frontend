import type { Metadata } from 'next';
import { PartnerPageHeader } from './partner-page-header';
import { PartnerSimpleFooter } from './partner-simple-footer';
import { PartnerFooter } from './partner-footer';

export interface PartnerMetadata {
  partnerName: string;
  tagline: string;
  description: string;
  logoUrl: string;
  industry?: string;
  metrics?: {
    volume?: string;
    revenue?: string;
  };
}

interface PartnerPageLayoutProps {
  metadata: PartnerMetadata;
  children: React.ReactNode;
  backLink?: string;
  backText?: string;
}

export function generatePartnerMetadata(metadata: PartnerMetadata): Metadata {
  const { partnerName, tagline, description, logoUrl } = metadata;
  const pageUrl = `https://sodax.com/partners/${partnerName.toLowerCase().replace(/\s+/g, '-')}`;
  const fullTitle = `${partnerName} Case Study | SODAX Partners`;

  return {
    title: fullTitle,
    description: description,
    keywords: `${partnerName}, SODAX, DeFi, cross-chain, SDK, ${tagline}`,
    openGraph: {
      title: fullTitle,
      description: description,
      type: 'article',
      url: pageUrl,
      images: [{
        url: `https://sodax.com${logoUrl}`,
        width: 1200,
        height: 630,
        alt: `${partnerName} Case Study`
      }]
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: description,
      images: [`https://sodax.com${logoUrl}`]
    }
  };
}

export function PartnerPageLayout({ 
  metadata, 
  children, 
  backLink, 
  backText 
}: PartnerPageLayoutProps) {
  const { partnerName, tagline, description, logoUrl } = metadata;

  return (
    <div className="bg-white flex flex-col min-h-screen w-full">
        <PartnerPageHeader backLink={backLink} backText={backText} />

        {/* Content */}
        <div className="flex flex-col items-center w-full">
          <div className="flex flex-col gap-8 items-start pt-14 pb-14 w-full max-w-5xl px-4 md:px-8">
            {children}
          </div>
        </div>

        {/* Footer */}
        <PartnerSimpleFooter />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Article',
              headline: `${partnerName} Case Study`,
              description: description,
              image: `https://sodax.com${logoUrl}`,
              author: {
                '@type': 'Organization',
                name: 'SODAX',
                url: 'https://sodax.com'
              },
              publisher: {
                '@type': 'Organization',
                name: 'SODAX',
                logo: {
                  '@type': 'ImageObject',
                  url: 'https://sodax.com/symbol.png'
                }
              },
              about: {
                '@type': 'SoftwareApplication',
                name: partnerName,
                applicationCategory: 'FinanceApplication',
                operatingSystem: 'Web',
                description: tagline
              }
            })
          }}
        />
    </div>
  );
}
