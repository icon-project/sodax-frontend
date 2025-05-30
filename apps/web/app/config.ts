import { defineChain } from 'viem';
import { http, createConfig } from 'wagmi';
import { avalancheFuji, mainnet, sepolia, avalanche, base, optimism, polygon, arbitrum, bsc } from 'wagmi/chains';

export const sonicBlazeTestnet = /*#__PURE__*/ defineChain({
  id: 57_054,
  name: 'Sonic Blaze Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Sonic',
    symbol: 'S',
  },
  rpcUrls: {
    default: { http: ['https://rpc.blaze.soniclabs.com'] },
  },
  blockExplorers: {
    default: {
      name: 'Sonic Blaze Testnet Explorer',
      url: 'https://testnet.soniclabs.com/',
    },
  },
  testnet: true,
});

export const wagmiConfig = createConfig({
  chains: [mainnet, sepolia, avalancheFuji, sonicBlazeTestnet, avalanche, base, optimism, polygon, arbitrum, bsc],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [avalancheFuji.id]: http(),
    [sonicBlazeTestnet.id]: http(),
    [avalanche.id]: http(),
    [base.id]: http(),
    [optimism.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [bsc.id]: http(),
  },
});
