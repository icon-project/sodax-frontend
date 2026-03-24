import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { DISCORD_ROUTE, GITHUB_ROUTE, X_ROUTE } from '@/constants/routes';
import Providers from '../providers/providers';
import AppSidebar from '@/components/landing/sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppStoreProvider } from '@/stores/app-store-provider';
import { GoogleTagManager } from '@next/third-parties/google';
import { CookieConsentBanner } from '@/components/cookie-consent/cookie-consent-banner';
import { headers } from 'next/headers';
import { cookieToInitialState } from 'wagmi';
import { createWagmiConfig } from '@sodax/wallet-sdk-react';
import { rpcConfig } from '../providers/constants';

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialState = cookieToInitialState(
    createWagmiConfig(rpcConfig),
    (await headers()).get('cookie'), // Note: await headers() in Next.js 15+
  );

  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data for SEO */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: Consent Mode v2 defaults must execute synchronously before GTM */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
try{
window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
var m=document.cookie.match(/cookie_consent_region=([^;]+)/);
var r=m?m[1]:'other';
var c=document.cookie.match(/cc_cookie=([^;]+)/);
var hasMarketing=false;
if(c){try{var p=JSON.parse(decodeURIComponent(c[1]));if(p&&Array.isArray(p.categories)){hasMarketing=p.categories.indexOf('marketing')!==-1;}}catch(e2){hasMarketing=false;}}
if(r==='eu'&&!hasMarketing){
  gtag('consent','default',{'ad_storage':'denied','ad_user_data':'denied','ad_personalization':'denied','analytics_storage':'granted','wait_for_update':500});
}else{
  gtag('consent','default',{'ad_storage':'granted','ad_user_data':'granted','ad_personalization':'granted','analytics_storage':'granted'});
}
}catch(e){
window.dataLayer=window.dataLayer||[];
function gtag(){window.dataLayer.push(arguments);}
gtag('consent','default',{'ad_storage':'denied','ad_user_data':'denied','ad_personalization':'denied','analytics_storage':'denied'});
}`,
          }}
        />

        <GoogleTagManager gtmId="GTM-W355PCS6" />
        <SidebarProvider>
          <AppSidebar />
          <Providers initialState={initialState}>
            <AppStoreProvider>{children}</AppStoreProvider>
          </Providers>
        </SidebarProvider>
        <CookieConsentBanner />
      </body>
    </html>
  );
}
