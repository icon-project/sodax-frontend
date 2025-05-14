import { defineChain } from 'viem';
import { http, createConfig } from 'wagmi';
import { avalancheFuji, mainnet, sepolia } from 'wagmi/chains';

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
  chains: [mainnet, sepolia, avalancheFuji, sonicBlazeTestnet],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [avalancheFuji.id]: http(),
    [sonicBlazeTestnet.id]: http(),
  },
});

const solanaEndpoint = 'https://solana-mainnet.g.alchemy.com/v2/nCndZC8P7BdiVKkczCErdwpIgaBQpPFM';
