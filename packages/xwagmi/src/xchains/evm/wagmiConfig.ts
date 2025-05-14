import { http, createConfig } from 'wagmi';
import { arbitrum, avalanche, avalancheFuji, base, bsc, mainnet, optimism } from 'wagmi/chains';

export const wagmiConfig = createConfig({
  chains: [avalanche, bsc, avalancheFuji, arbitrum, base, optimism],
  connectors: [],
  transports: {
    //@ts-ignore
    [mainnet.id]: http(),
    [avalanche.id]: http(),
    [bsc.id]: http(),
    [avalancheFuji.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
  },
});
