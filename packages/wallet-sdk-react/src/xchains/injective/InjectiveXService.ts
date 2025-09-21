import { XService } from '@/core/XService';
import { Network, getNetworkEndpoints } from '@injectivelabs/networks';
import { ChainGrpcWasmApi, IndexerGrpcAccountPortfolioApi } from '@injectivelabs/sdk-ts';
import { ChainId as InjectiveChainId } from '@injectivelabs/ts-types';
import { MsgBroadcaster } from '@injectivelabs/wallet-core';
import type { XToken } from '@sodax/types';
import { mainnet } from 'wagmi/chains';
import { WalletStrategy } from '@injectivelabs/wallet-strategy';

export class InjectiveXService extends XService {
  private static instance: InjectiveXService;

  public walletStrategy: WalletStrategy;
  public indexerGrpcAccountPortfolioApi: IndexerGrpcAccountPortfolioApi;
  public chainGrpcWasmApi: ChainGrpcWasmApi;
  public msgBroadcaster: MsgBroadcaster;

  private constructor() {
    super('INJECTIVE');

    const endpoints = getNetworkEndpoints(Network.Mainnet);

    this.walletStrategy = new WalletStrategy({
      chainId: InjectiveChainId.Mainnet,
      strategies: {},
      evmOptions: {
        evmChainId: mainnet.id,
        rpcUrl: mainnet.rpcUrls.default.http[0],
      },
    });

    this.indexerGrpcAccountPortfolioApi = new IndexerGrpcAccountPortfolioApi(endpoints.indexer);
    this.chainGrpcWasmApi = new ChainGrpcWasmApi(endpoints.grpc);
    this.msgBroadcaster = new MsgBroadcaster({
      walletStrategy: this.walletStrategy,
      network: Network.Mainnet,
      endpoints,
    });
  }

  public static getInstance(): InjectiveXService {
    if (!InjectiveXService.instance) {
      InjectiveXService.instance = new InjectiveXService();
    }
    return InjectiveXService.instance;
  }

  async getBalance(address: string | undefined, xToken: XToken) {
    if (!address) return 0n;

    const portfolio = await this.indexerGrpcAccountPortfolioApi.fetchAccountPortfolioBalances(address);

    const xTokenAddress = xToken.address;

    const balance = portfolio.bankBalancesList.find(_balance => _balance.denom === xTokenAddress);
    if (balance) {
      return BigInt(balance.amount);
    }

    return 0n;
  }
}
