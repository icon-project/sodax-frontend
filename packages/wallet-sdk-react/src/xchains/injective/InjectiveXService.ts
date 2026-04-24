import { XService } from '@/core/XService.js';
import { Network, getNetworkEndpoints } from '@injectivelabs/networks';
import { ChainGrpcWasmApi, IndexerGrpcAccountPortfolioApi } from '@injectivelabs/sdk-ts';
import { ChainId as InjectiveChainId } from '@injectivelabs/ts-types';
import { MsgBroadcaster } from '@injectivelabs/wallet-core';
import type { InjectiveRpcConfig, XToken } from '@sodax/types';
import { mainnet } from 'wagmi/chains';
import { WalletStrategy } from '@injectivelabs/wallet-strategy';

export class InjectiveXService extends XService {
  private static instance: InjectiveXService;

  public walletStrategy: WalletStrategy;
  public indexerGrpcAccountPortfolioApi: IndexerGrpcAccountPortfolioApi;
  public chainGrpcWasmApi: ChainGrpcWasmApi;
  public msgBroadcaster: MsgBroadcaster;

  private constructor(rpcConfig?: InjectiveRpcConfig) {
    super('INJECTIVE');

    const defaults = getNetworkEndpoints(Network.Mainnet);
    // Only `indexer` + `grpc` are overridable — the rest of the endpoints object
    // (rest, rpc, explorer, …) keeps the @injectivelabs/networks mainnet defaults.
    // Extend `InjectiveRpcConfig` if more endpoints need to be consumer-configurable.
    const endpoints = {
      ...defaults,
      indexer: rpcConfig?.indexer || defaults.indexer,
      grpc: rpcConfig?.grpc || defaults.grpc,
    };

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

  /**
   * @param rpcConfig - Only applied on first call. Subsequent calls return the
   *   existing instance unchanged — gRPC/Indexer clients are built in the
   *   constructor and can't be rebuilt at runtime. Pass the desired endpoints
   *   via `SodaxWalletProvider.config.rpcConfig` once at app init.
   */
  public static getInstance(rpcConfig?: InjectiveRpcConfig): InjectiveXService {
    if (!InjectiveXService.instance) {
      InjectiveXService.instance = new InjectiveXService(rpcConfig);
    }
    return InjectiveXService.instance;
  }

  override async getBalance(address: string | undefined, xToken: XToken) {
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
