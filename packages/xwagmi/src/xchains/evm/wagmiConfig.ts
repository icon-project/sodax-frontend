import { http, createConfig } from 'wagmi';
import { arbitrum, avalanche, avalancheFuji, base, bsc, mainnet, optimism } from 'wagmi/chains';

// TODO: remove?
export const wagmiConfig = createConfig({
  chains: [avalanche, bsc, avalancheFuji, arbitrum, base, optimism, mainnet],
  connectors: [],
  transports: {
    [mainnet.id]: http(),
    [avalanche.id]: http(),
    [bsc.id]: http(),
    [avalancheFuji.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
  },
});
