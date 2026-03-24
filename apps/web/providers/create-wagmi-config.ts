// apps/web/providers/create-wagmi-config.ts
import {
  ARBITRUM_MAINNET_CHAIN_ID,
  AVALANCHE_MAINNET_CHAIN_ID,
  BASE_MAINNET_CHAIN_ID,
  BSC_MAINNET_CHAIN_ID,
  ETHEREUM_MAINNET_CHAIN_ID,
  HYPEREVM_MAINNET_CHAIN_ID,
  KAIA_MAINNET_CHAIN_ID,
  LIGHTLINK_MAINNET_CHAIN_ID,
  OPTIMISM_MAINNET_CHAIN_ID,
  POLYGON_MAINNET_CHAIN_ID,
  REDBELLY_MAINNET_CHAIN_ID,
  SONIC_MAINNET_CHAIN_ID,
  type RpcConfig,
} from '@sodax/types';
import { cookieStorage, createConfig, createStorage, http, type Config } from 'wagmi';
import {
  arbitrum,
  avalanche,
  base,
  bsc,
  kaia,
  lightlinkPhoenix,
  mainnet,
  optimism,
  polygon,
  redbellyMainnet,
  sonic,
} from 'wagmi/chains';
import { defineChain } from 'viem';

const hyper = defineChain({
  id: 999,
  name: 'HyperEVM',
  nativeCurrency: {
    decimals: 18,
    name: 'HYPE',
    symbol: 'HYPE',
  },
  rpcUrls: {
    default: { http: ['https://rpc.hyperliquid.xyz/evm'] },
  },
  blockExplorers: {
    default: {
      name: 'HyperEVMScan',
      url: 'https://hyperevmscan.io/',
    },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 13051,
    },
  },
});

export const createServerWagmiConfig = (config: RpcConfig): Config => {
  return createConfig({
    chains: [
      mainnet,
      avalanche,
      arbitrum,
      base,
      bsc,
      sonic,
      optimism,
      polygon,
      hyper,
      lightlinkPhoenix,
      kaia,
      redbellyMainnet,
    ],
    ssr: true,
    transports: {
      [mainnet.id]: http(config[ETHEREUM_MAINNET_CHAIN_ID]),
      [avalanche.id]: http(config[AVALANCHE_MAINNET_CHAIN_ID]),
      [arbitrum.id]: http(config[ARBITRUM_MAINNET_CHAIN_ID]),
      [base.id]: http(config[BASE_MAINNET_CHAIN_ID]),
      [bsc.id]: http(config[BSC_MAINNET_CHAIN_ID]),
      [sonic.id]: http(config[SONIC_MAINNET_CHAIN_ID]),
      [optimism.id]: http(config[OPTIMISM_MAINNET_CHAIN_ID]),
      [polygon.id]: http(config[POLYGON_MAINNET_CHAIN_ID]),
      [hyper.id]: http(config[HYPEREVM_MAINNET_CHAIN_ID]),
      [lightlinkPhoenix.id]: http(config[LIGHTLINK_MAINNET_CHAIN_ID]),
      [redbellyMainnet.id]: http(config[REDBELLY_MAINNET_CHAIN_ID]),
      [kaia.id]: http(config[KAIA_MAINNET_CHAIN_ID]),
    },
    storage: createStorage({
      storage: cookieStorage,
      key: 'sodax',
    }),
  });
};
