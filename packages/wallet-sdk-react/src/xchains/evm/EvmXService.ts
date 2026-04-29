import { XService } from '@/core/XService.js';
import { ChainKeys, type RpcConfig, type XToken } from '@sodax/types';
import { getWagmiChainId, isNativeToken } from '@/utils/index.js';

import { type Address, type Chain, defineChain, erc20Abi } from 'viem';
import { getPublicClient } from 'wagmi/actions';
import { type Config, type CreateConnectorFn, createConfig, http, createStorage, cookieStorage } from 'wagmi';
import {
  mainnet,
  avalanche,
  base,
  optimism,
  polygon,
  arbitrum,
  bsc,
  sonic,
  lightlinkPhoenix,
  redbellyMainnet,
  kaia,
} from 'wagmi/chains';
type WagmiOptions = {
  reconnectOnMount?: boolean;
  ssr?: boolean;
};

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

export const createWagmiConfig = (
  config: RpcConfig,
  options?: WagmiOptions & { connectors?: CreateConnectorFn[] },
): Config => {
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
    connectors: options?.connectors ?? [],
    ssr: options?.ssr,
    transports: {
      [mainnet.id]: http(config[ChainKeys.ETHEREUM_MAINNET]),
      [avalanche.id]: http(config[ChainKeys.AVALANCHE_MAINNET]),
      [arbitrum.id]: http(config[ChainKeys.ARBITRUM_MAINNET]),
      [base.id]: http(config[ChainKeys.BASE_MAINNET]),
      [bsc.id]: http(config[ChainKeys.BSC_MAINNET]),
      [sonic.id]: http(config[ChainKeys.SONIC_MAINNET]),
      [optimism.id]: http(config[ChainKeys.OPTIMISM_MAINNET]),
      [polygon.id]: http(config[ChainKeys.POLYGON_MAINNET]),
      [hyper.id]: http(config[ChainKeys.HYPEREVM_MAINNET]),
      [lightlinkPhoenix.id]: http(config[ChainKeys.LIGHTLINK_MAINNET]),
      [redbellyMainnet.id]: http(config[ChainKeys.REDBELLY_MAINNET]),
      [kaia.id]: http(config[ChainKeys.KAIA_MAINNET]),
    },
    storage: createStorage({
      storage: cookieStorage,
      key: 'sodax',
    }),
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

  override getXConnectors() {
    return [];
  }

  public static getInstance(): EvmXService {
    if (!EvmXService.instance) {
      EvmXService.instance = new EvmXService();
    }
    return EvmXService.instance;
  }

  // get erc20 token balance in a chain (evm chain only)
  async _getTokenBalance(address: string | undefined, chainId: number, tokenAddress: string): Promise<bigint> {
    const publicClient = getPublicClient(this.wagmiConfig as Config, { chainId: chainId });
    if (!publicClient) throw new Error('Public client not found');
    const balance = await publicClient.readContract({
      abi: erc20Abi,
      address: tokenAddress as `0x${string}`,
      functionName: 'balanceOf',
      args: [address as `0x${string}`],
    });
    return balance || 0n;
  }

  //get native balance of the chain (evm chain only)
  async _getChainBalance(address: string | undefined, chainId: number) {
    const balance = await getPublicClient(this.wagmiConfig as Config, { chainId: chainId })?.getBalance({
      address: address as Address,
    });
    return balance || 0n;
  }

  override async getBalance(address: string | undefined, xToken: XToken): Promise<bigint> {
    if (!address) return 0n;
    if (!this.wagmiConfig) return 0n;

    const chainId = getWagmiChainId(xToken.chainKey);

    if (isNativeToken(xToken)) {
      return this._getChainBalance(address, chainId);
    }

    throw new Error(`Unsupported token: ${xToken.symbol}`);
  }

  override async getBalances(address: string | undefined, xTokens: XToken[]) {
    if (!address) return {};
    if (!this.wagmiConfig) return {};

    const nativeTokenBalancePromises = xTokens
      .filter(xToken => isNativeToken(xToken))
      .map(async xToken => {
        const balance = await this.getBalance(address, xToken);
        return { symbol: xToken.symbol, address: xToken.address, balance };
      });

    const nativeTokenBalances = await Promise.all(nativeTokenBalancePromises);
    const tokenMap: Record<string, bigint> = nativeTokenBalances.reduce<Record<string, bigint>>(
      (map, { address, balance }) => {
        if (balance) map[address] = balance;
        return map;
      },
      {},
    );

    const nonNativeXTokens = xTokens.filter(xToken => !isNativeToken(xToken));
    const firstToken = xTokens[0];
    if (!firstToken) return tokenMap;
    const chainKey = firstToken.chainKey;
    const viemChain: Chain = this.wagmiConfig.chains.find(chain => chain.id === getWagmiChainId(chainKey)) as Chain;
    const chainId = getWagmiChainId(chainKey);

    const publicClient = getPublicClient(this.wagmiConfig, { chainId: chainId });
    if (!publicClient) throw new Error('Public client not found');

    if (viemChain?.contracts?.multicall3) {
      //multicall supports
      const result = await publicClient.multicall({
        contracts: nonNativeXTokens.map(token => ({
          abi: erc20Abi,
          address: token.address as `0x${string}`,
          functionName: 'balanceOf',
          args: [address],
        })),
      });

      return nonNativeXTokens.reduce((acc, token, index) => {
        const resultValue = result?.[index]?.result;
        acc[token.address] = resultValue !== undefined && resultValue !== null ? BigInt(resultValue) : 0n;
        return acc;
      }, tokenMap);
    }

    const nonNativeTokenBalances: bigint[] = await Promise.all(
      nonNativeXTokens.map(token => this._getTokenBalance(address, chainId, token.address)),
    );

    return nonNativeXTokens.reduce((acc, token, idx) => {
      acc[token.address] = nonNativeTokenBalances[idx] ?? 0n;
      return acc;
    }, tokenMap);
  }
}
