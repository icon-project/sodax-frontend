import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { cookieToInitialState } from 'wagmi';
import type { RpcConfig } from '@sodax/types';
import Providers from './providers';
import { createServerWagmiConfig } from './wagmi-config';

export const metadata = { title: 'sodax next16 repro' };

const rpcConfig: RpcConfig = {
  sonic: 'https://rpc.soniclabs.com',
  '0x1.icon': 'https://ctz.solidwallet.io/api/v3',
  solana: 'https://solana-rpc.publicnode.com',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const initialState = cookieToInitialState(
    createServerWagmiConfig(rpcConfig),
    (await headers()).get('cookie'),
  );

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers initialState={initialState}>{children}</Providers>
      </body>
    </html>
  );
}
