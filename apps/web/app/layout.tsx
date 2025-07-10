import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Web3Provider } from '../providers';

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
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <div className="h-screen">
          <Web3Provider>{children}</Web3Provider>
        </div>
      </body>
    </html>
  );
}
