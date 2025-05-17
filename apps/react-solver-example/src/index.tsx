import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, WagmiProvider, createConfig } from 'wagmi';
import { arbitrum, bsc } from 'wagmi/chains';
import App from './App';
import { SolverContextProvider } from './contexts/SolverContextProvider';

BigInt.prototype['toJSON'] = function () {
  return this.toString();
};

export const wagmiConfig = createConfig({
  chains: [arbitrum, bsc],
  transports: {
    [arbitrum.id]: http(),
    [bsc.id]: http(),
  },
});

const queryClient = new QueryClient();

const networks = {
  devnet: { url: getFullnodeUrl('devnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <SuiClientProvider networks={networks} defaultNetwork="mainnet">
          <WalletProvider>
            <SolverContextProvider>
              <App />
            </SolverContextProvider>
          </WalletProvider>
        </SuiClientProvider>
      </WagmiProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
