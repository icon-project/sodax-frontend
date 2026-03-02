import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { DISCORD_ROUTE, GITHUB_ROUTE, X_ROUTE } from '@/constants/routes';
import Providers from '../providers/providers';
import AppSidebar from '@/components/landing/sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppStoreProvider } from '@/stores/app-store-provider';
import { GoogleTagManager } from '@next/third-parties/google';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
});

export const metadata: Metadata = {
  title: 'SODAX · Infrastructure for Modern Money',
  description:
    'SODAX is a cross-network execution and liquidity system that helps applications support complex financial actions without becoming cross-network infrastructure companies.',
  keywords: [
    'SODAX',
    'cross-network execution',
    'DeFi infrastructure',
    'liquidity system',
    'cross-chain',
    'multi-network',
    'modern money',
    'blockchain infrastructure',
    'decentralized finance',
  ],
  alternates: {
    canonical: 'https://sodax.com',
  },
  openGraph: {
    title: 'SODAX · Infrastructure for Modern Money',
    description:
      'SODAX is a cross-network execution and liquidity system that helps applications support complex financial actions without becoming cross-network infrastructure companies.',
    type: 'website',
    url: 'https://sodax.com',
    siteName: 'SODAX',
    images: [
      {
        url: 'https://sodax.com/link-preview.png',
        width: 1200,
        height: 630,
        alt: 'SODAX · Infrastructure for Modern Money',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SODAX · Infrastructure for Modern Money',
    description:
      'SODAX is a cross-network execution and liquidity system that helps applications support complex financial actions without becoming cross-network infrastructure companies.',
    images: ['https://sodax.com/link-preview.png'],
    site: '@gosodax',
    creator: '@gosodax',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://sodax.com/#organization',
      name: 'SODAX',
      url: 'https://sodax.com',
      logo: 'https://sodax.com/symbol2.png',
      sameAs: [X_ROUTE, GITHUB_ROUTE, DISCORD_ROUTE],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://sodax.com/#website',
      url: 'https://sodax.com',
      name: 'SODAX',
      description:
        'SODAX is a cross-network execution and liquidity system that helps applications support complex financial actions without becoming cross-network infrastructure companies.',
      publisher: { '@id': 'https://sodax.com/#organization' },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data for SEO */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <GoogleTagManager gtmId="GTM-W355PCS6" />
        <SidebarProvider>
          <AppSidebar />
          <Providers>
            <AppStoreProvider>{children}</AppStoreProvider>
          </Providers>
        </SidebarProvider>
      </body>
    </html>
  );
}
