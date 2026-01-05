import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import Providers from '../providers/providers';
import AppSidebar from '@/components/landing/sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppStoreProvider } from '@/stores/app-store-provider';
import Script from 'next/script';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
});

export const metadata: Metadata = {
  title: 'SODAX · Money, as it Should be Be',
  description:
    'SODAX is a DeFi execution layer that lets you swap, lend, and borrow seamlessly. One platform, coordinated liquidity, and smarter yield — no slippage, no friction.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        {/* Google Tag Manager */}
        <Script id="gtm" strategy="beforeInteractive" src="https://www.googletagmanager.com/gtm.js?id=GTM-W355PCS6" />
      </head>

      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            title="Google Tag Manager"
            src="https://www.googletagmanager.com/ns.html?id=GTM-W355PCS6"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>

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
