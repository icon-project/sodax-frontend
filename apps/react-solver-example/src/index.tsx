import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
// import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
// import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, createConfig, WagmiProvider } from 'wagmi';
import { arbitrum, avalanche, avalancheFuji, base, bsc, mainnet, optimism, polygon } from 'wagmi/chains';
import App from './App';

BigInt.prototype['toJSON'] = function () {
  return this.toString();
};

export const wagmiConfig = createConfig({
  chains: [avalanche, bsc, avalancheFuji, arbitrum, base, optimism, polygon],
  connectors: [],
  transports: {
    [avalanche.id]: http(),
    [bsc.id]: http(),
    [avalancheFuji.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
    [polygon.id]: http(),
  },
});

const queryClient = new QueryClient();

// const networks = {
//   devnet: { url: getFullnodeUrl('devnet') },
//   mainnet: { url: getFullnodeUrl('mainnet') },
// };

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        {/* <SuiClientProvider networks={networks} defaultNetwork="mainnet"> */}
        {/* <WalletProvider> */}
        <App />
        {/* </WalletProvider> */}
        {/* </SuiClientProvider> */}
      </WagmiProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
