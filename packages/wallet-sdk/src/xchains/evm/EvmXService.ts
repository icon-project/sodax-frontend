import { XService } from '@/core/XService';
import type { EVMConfig, XChainId, XToken } from '@/types';
import { getWagmiChainId, isNativeToken } from '@/utils';

// biome-ignore lint/style/useImportType: <explanation>
import { Address, PublicClient, WalletClient, erc20Abi } from 'viem';
import { getPublicClient, getWalletClient } from 'wagmi/actions';

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

  getPublicClient(chainId: number): PublicClient {
    if (!this.config) {
      throw new Error('EvmXService: config is not initialized yet');
    }

    // @ts-ignore
    return getPublicClient(this.config.wagmiConfig, { chainId });
  }

  public async getWalletClient(chainId: number): Promise<WalletClient> {
    if (!this.config) {
      throw new Error('EvmXService: config is not initialized yet');
    }
    //@ts-ignore
    return await getWalletClient(this.config.wagmiConfig, { chainId });
  }

  async getBalance(address: string | undefined, xToken: XToken, xChainId: XChainId): Promise<bigint> {
    if (!address) return 0n;

    const chainId = getWagmiChainId(xChainId);

    if (isNativeToken(xToken)) {
      const balance = await this.getPublicClient(chainId).getBalance({ address: address as Address });
      return balance;
    }

    throw new Error(`Unsupported token: ${xToken.symbol}`);
  }

  async getBalances(address: string | undefined, xTokens: XToken[], xChainId: XChainId) {
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
    const result = await this.getPublicClient(getWagmiChainId(xChainId)).multicall({
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
        balance: result[index].result?.toString() || '0',
      }))
      .reduce((acc, balance) => {
        acc[balance.address] = balance.balance;
        return acc;
      }, tokenMap);
  }
}
