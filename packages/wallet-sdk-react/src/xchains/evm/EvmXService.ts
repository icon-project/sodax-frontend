import { XService } from '@/core/XService';
import {
  ARBITRUM_MAINNET_CHAIN_ID,
  AVALANCHE_MAINNET_CHAIN_ID,
  BASE_MAINNET_CHAIN_ID,
  BSC_MAINNET_CHAIN_ID,
  ETHEREUM_MAINNET_CHAIN_ID,
  HYPEREVM_MAINNET_CHAIN_ID,
  LIGHTLINK_MAINNET_CHAIN_ID,
  OPTIMISM_MAINNET_CHAIN_ID,
  POLYGON_MAINNET_CHAIN_ID,
  SONIC_MAINNET_CHAIN_ID,
  type RpcConfig,
  type XToken,
} from '@sodax/types';
import { getWagmiChainId, isNativeToken } from '@/utils';

import { type Address, defineChain, erc20Abi } from 'viem';
import { getPublicClient } from 'wagmi/actions';
import { type Config, createConfig, http } from 'wagmi';
import { mainnet, avalanche, base, optimism, polygon, arbitrum, bsc, sonic, lightlinkPhoenix } from 'wagmi/chains';

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

export const createWagmiConfig = (config: RpcConfig) => {
  return createConfig({
    chains: [mainnet, avalanche, arbitrum, base, bsc, sonic, optimism, polygon, hyper, lightlinkPhoenix],
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
    },
  });
};

/**
 * Service class for handling EVM chain interactions.
 * Implements singleton pattern and provides methods for wallet/chain operations.
 */

export class EvmXService extends XService {
  private static instance: EvmXService;
  public wagmiConfig: Config | undefined;

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

  async getBalance(address: string | undefined, xToken: XToken): Promise<bigint> {
    if (!address) return 0n;
    if (!this.wagmiConfig) return 0n;

    const chainId = getWagmiChainId(xToken.xChainId);

    if (isNativeToken(xToken)) {
      const balance = await getPublicClient(this.wagmiConfig, { chainId: chainId })?.getBalance({
        address: address as Address,
      });
      return balance || 0n;
    }

    throw new Error(`Unsupported token: ${xToken.symbol}`);
  }

  async getBalances(address: string | undefined, xTokens: XToken[]) {
    if (!address) return {};
    if (!this.wagmiConfig) return {};

    const balancePromises = xTokens
      .filter(xToken => isNativeToken(xToken))
      .map(async xToken => {
        const balance = await this.getBalance(address, xToken);
        return { symbol: xToken.symbol, address: xToken.address, balance };
      });

    const balances = await Promise.all(balancePromises);
    const tokenMap = balances.reduce((map, { address, balance }) => {
      if (balance) map[address] = balance;
      return map;
    }, {});

    const nonNativeXTokens = xTokens.filter(xToken => !isNativeToken(xToken));
    const xChainId = xTokens[0].xChainId;
    const result = await getPublicClient(this.wagmiConfig, { chainId: getWagmiChainId(xChainId) })?.multicall({
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
