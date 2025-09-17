import { XService } from '@/core/XService';
import type { ChainId, XToken } from '@sodax/types';
import type { EVMConfig } from '@/types';
import { getWagmiChainId, isNativeToken } from '@/utils';

import { type Address, type PublicClient, type WalletClient, defineChain, erc20Abi } from 'viem';
import { getPublicClient, getWalletClient } from 'wagmi/actions';
import { createConfig, http, type Transport } from 'wagmi';
import {
  mainnet,
  avalanche,
  base,
  optimism,
  polygon,
  arbitrum,
  bsc,
  sonic,
  nibiru,
  lightlinkPhoenix,
} from 'wagmi/chains';

import {
  AVALANCHE_MAINNET_CHAIN_ID,
  ARBITRUM_MAINNET_CHAIN_ID,
  BASE_MAINNET_CHAIN_ID,
  BSC_MAINNET_CHAIN_ID,
  SONIC_MAINNET_CHAIN_ID,
  OPTIMISM_MAINNET_CHAIN_ID,
  POLYGON_MAINNET_CHAIN_ID,
  NIBIRU_MAINNET_CHAIN_ID,
  HYPEREVM_MAINNET_CHAIN_ID,
  LIGHTLINK_MAINNET_CHAIN_ID,
} from '@sodax/types';

// HyperEVM chain is not supported by viem, so we need to define it manually
export const hyper = /*#__PURE__*/ defineChain({
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

const evmChainMap = {
  [AVALANCHE_MAINNET_CHAIN_ID]: avalanche,
  [ARBITRUM_MAINNET_CHAIN_ID]: arbitrum,
  [BASE_MAINNET_CHAIN_ID]: base,
  [BSC_MAINNET_CHAIN_ID]: bsc,
  [SONIC_MAINNET_CHAIN_ID]: sonic,
  [OPTIMISM_MAINNET_CHAIN_ID]: optimism,
  [POLYGON_MAINNET_CHAIN_ID]: polygon,
  [NIBIRU_MAINNET_CHAIN_ID]: nibiru,
  [HYPEREVM_MAINNET_CHAIN_ID]: hyper,
  [LIGHTLINK_MAINNET_CHAIN_ID]: lightlinkPhoenix,
} as const;

export type EvmChainId = keyof typeof evmChainMap;

export const getWagmiConfig = (chains: EvmChainId[]) => {
  const mappedChains = chains.map(chain => evmChainMap[chain]);
  const finalChains = mappedChains.length > 0 ? mappedChains : [mainnet];

  const transports = finalChains.reduce(
    (acc, chain) => {
      acc[chain.id] = http();
      return acc;
    },
    {} as Record<number, Transport>,
  );

  return createConfig({
    chains: finalChains as [typeof mainnet, ...(typeof mainnet)[]],
    transports,
    // ssr: true,
  });
};

/**
 * Service class for handling EVM chain interactions.
 * Implements singleton pattern and provides methods for wallet/chain operations.
 */

export class EvmXService extends XService {
  private static instance: EvmXService;
  private config: EVMConfig | undefined;
  private constructor() {
    super('EVM');
  }

  getXConnectors() {
    return [];
  }

  public static getInstance(): EvmXService {
    if (!EvmXService.instance) {
      EvmXService.instance = new EvmXService();
    }
    return EvmXService.instance;
  }

  public setConfig(config: EVMConfig) {
    this.config = config;
  }

  getPublicClient(chainId: number): PublicClient | undefined {
    if (!this.config) {
      throw new Error('EvmXService: config is not initialized yet');
    }

    // @ts-ignore
    return getPublicClient(getWagmiConfig(this.config.chains), { chainId });
  }

  public async getWalletClient(chainId: number): Promise<WalletClient> {
    if (!this.config) {
      throw new Error('EvmXService: config is not initialized yet');
    }
    return await getWalletClient(getWagmiConfig(this.config.chains), { chainId });
  }

  async getBalance(address: string | undefined, xToken: XToken, xChainId: ChainId): Promise<bigint> {
    if (!address) return 0n;

    const chainId = getWagmiChainId(xChainId);

    if (isNativeToken(xToken)) {
      const balance = await this.getPublicClient(chainId)?.getBalance({ address: address as Address });
      return balance || 0n;
    }

    throw new Error(`Unsupported token: ${xToken.symbol}`);
  }

  async getBalances(address: string | undefined, xTokens: XToken[], xChainId: ChainId) {
    if (!address) return {};

    const balancePromises = xTokens
      .filter(xToken => isNativeToken(xToken))
      .map(async xToken => {
        const balance = await this.getBalance(address, xToken, xChainId);
        return { symbol: xToken.symbol, address: xToken.address, balance };
      });

    const balances = await Promise.all(balancePromises);
    const tokenMap = balances.reduce((map, { address, balance }) => {
      if (balance) map[address] = balance;
      return map;
    }, {});

    const nonNativeXTokens = xTokens.filter(xToken => !isNativeToken(xToken));
    const result = await this.getPublicClient(getWagmiChainId(xChainId))?.multicall({
      contracts: nonNativeXTokens.map(token => ({
        abi: erc20Abi,
        address: token.address as `0x${string}`,
        functionName: 'balanceOf',
        args: [address],
        chainId: getWagmiChainId(xChainId),
      })),
    });

    return nonNativeXTokens
      .map((token, index) => ({
        symbol: token.symbol,
        address: token.address,
        balance: result?.[index]?.result?.toString() || '0',
      }))
      .reduce((acc, balance) => {
        acc[balance.address] = balance.balance;
        return acc;
      }, tokenMap);
  }
}
