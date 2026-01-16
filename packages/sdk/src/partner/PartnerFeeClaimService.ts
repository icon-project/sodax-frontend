// packages/sdk/src/partner/PartnerFeeClaimService.ts
import invariant from 'tiny-invariant';
import { erc20Abi, encodeFunctionData, type Address, type Hex } from 'viem';
import type { EvmHubProvider } from '../shared/entities/Providers.js';
import type { ConfigService } from '../shared/config/ConfigService.js';
import type {
  SolverConfigParams,
  SolverExecutionResponse,
  Result,
  TxReturnType,
  Prettify,
  SonicSpokeProviderType,
} from '../shared/types.js';
import { Erc20Service } from '../shared/services/erc-20/Erc20Service.js';
import { SolverApiService } from '../swap/SolverApiService.js';
import { isConfiguredSolverConfig } from '../shared/guards.js';
import { isSonicSpokeProviderType, isSonicRawSpokeProvider } from '../shared/guards.js';
import { ProtocolIntentsAbi } from '../shared/abis/protocolIntents.abi.js';
import type { IntentError, IntentErrorCode } from '../swap/SwapService.js';
import {
  SONIC_MAINNET_CHAIN_ID,
  type SpokeChainId,
  getSolverConfig,
  hubAssets,
  getIntentRelayChainId,
} from '@sodax/types';
import type { SolverConfig } from '@sodax/types';

export type AssetBalance = {
  symbol: string;
  name: string;
  address: Address; // The wrapped asset address on Sonic (hub chain)
  originalChain: SpokeChainId; // The original chain where this token comes from
  originalAddress: Address; // The original token address on the spoke chain
  decimal: number;
  balance: bigint;
};

export type SetSwapPreferenceParams = {
  outputToken: Address;
  dstChain: SpokeChainId;
  dstAddress: string;
};

export type SwapParams = {
  fromToken: Address;
  amount: bigint;
  timeout?: number;
};

export type PartnerFeeClaimServiceConfig = Prettify<
  SolverConfig & { relayerApiEndpoint?: string; protocolIntentsContract?: Address }
>;

export type PartnerFeeClaimServiceConstructorParams = {
  config: SolverConfigParams | undefined;
  configService: ConfigService;
  hubProvider: EvmHubProvider;
};

export class PartnerFeeClaimService {
  readonly config: PartnerFeeClaimServiceConfig;
  readonly hubProvider: EvmHubProvider;
  readonly configService: ConfigService;

  public constructor({ config, configService, hubProvider }: PartnerFeeClaimServiceConstructorParams) {
    const solverConfig = config
      ? isConfiguredSolverConfig(config)
        ? config
        : getSolverConfig(hubProvider.chainConfig.chain.id)
      : getSolverConfig(SONIC_MAINNET_CHAIN_ID);

    this.config = {
      ...solverConfig,
      relayerApiEndpoint: undefined,
      protocolIntentsContract: (solverConfig as SolverConfig & { protocolIntentsContract?: Address })
        .protocolIntentsContract,
    };
    this.configService = configService;
    this.hubProvider = hubProvider;
  }

  /**
   * Fetches balances for all hub assets across all chains on Sonic chain for a given address
   * Uses the wrapped asset addresses (asset field) on Sonic to query balances
   * @param {SonicSpokeProviderType} spokeProvider - The Sonic spoke provider
   * @param {Address} address - Optional address to query balances for. If not provided, uses the connected wallet address
   * @returns {Promise<Result<Map<string, AssetBalance>, Error>>} Map of asset address (on Sonic) to asset balance info
   */
  public async fetchAssetsBalances(
    spokeProvider: SonicSpokeProviderType,
    address?: Address,
  ): Promise<Result<Map<string, AssetBalance>, Error>> {
    try {
      invariant(isSonicSpokeProviderType(spokeProvider), 'PartnerFeeClaimService only supports Sonic spoke provider');

      const queryAddress = address || (await spokeProvider.walletProvider.getWalletAddress());
      console.log('[PartnerFeeClaimService] fetchAssetsBalances - queryAddress:', queryAddress);
      console.log(
        '[PartnerFeeClaimService] fetchAssetsBalances - address provided:',
        !!address,
        'using:',
        queryAddress,
      );

      // Collect all assets from all chains
      const allAssetEntries: Array<{
        assetAddress: Address; // The wrapped asset address on Sonic
        originalChain: SpokeChainId;
        originalAddress: Address; // The original token address on the spoke chain
        hubAsset: { symbol: string; name: string; decimal: number };
      }> = [];

      // Iterate through all chains in hubAssets
      for (const [chainId, chainAssets] of Object.entries(hubAssets)) {
        // Iterate through all tokens in this chain
        for (const [originalTokenAddress, hubAsset] of Object.entries(chainAssets)) {
          allAssetEntries.push({
            assetAddress: hubAsset.asset as Address, // Use the wrapped asset address on Sonic
            originalChain: chainId as SpokeChainId,
            originalAddress: originalTokenAddress as Address,
            hubAsset: {
              symbol: hubAsset.symbol,
              name: hubAsset.name,
              decimal: hubAsset.decimal,
            },
          });
        }
      }

      console.log('[PartnerFeeClaimService] fetchAssetsBalances - total assets collected:', allAssetEntries.length);

      // Remove duplicates based on asset address (same wrapped token might appear in multiple chains)
      const uniqueAssets = new Map<Address, (typeof allAssetEntries)[0]>();
      for (const entry of allAssetEntries) {
        if (!uniqueAssets.has(entry.assetAddress)) {
          uniqueAssets.set(entry.assetAddress, entry);
        }
      }

      const uniqueAssetEntries = Array.from(uniqueAssets.values());
      const assetAddresses = uniqueAssetEntries.map(entry => entry.assetAddress);

      console.log(
        '[PartnerFeeClaimService] fetchAssetsBalances - unique assets after deduplication:',
        uniqueAssetEntries.length,
      );
      console.log('[PartnerFeeClaimService] fetchAssetsBalances - sample asset addresses:', assetAddresses.slice(0, 5));
      console.log('[PartnerFeeClaimService] fetchAssetsBalances - queryAddress:', queryAddress);
      // Batch query balances using multicall for all wrapped assets on Sonic
      const balanceResults = await spokeProvider.publicClient.multicall({
        contracts: assetAddresses.map(assetAddress => ({
          address: assetAddress,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [queryAddress as Address] as const,
        })),
        allowFailure: true,
      });

      console.log('[PartnerFeeClaimService] fetchAssetsBalances - multicall results count:', balanceResults.length);
      console.log('[PartnerFeeClaimService] fetchAssetsBalances - sample balance results:', balanceResults.slice(0, 5));
      console.log('[PartnerFeeClaimService] fetchAssetsBalances - queryAddress:', queryAddress);

      // Build result map keyed by asset address (wrapped token on Sonic)
      const balancesMap = new Map<string, AssetBalance>();
      let nonZeroCount = 0;

      uniqueAssetEntries.forEach((entry, index) => {
        const balanceResult = balanceResults[index];
        // When allowFailure: true, results have status and result properties
        let balance: bigint;
        if (balanceResult?.status === 'success' && balanceResult.result !== undefined) {
          balance = balanceResult.result as bigint;
        } else if (balanceResult?.status === 'failure') {
          console.warn(
            `[PartnerFeeClaimService] Balance query failed for ${entry.hubAsset.symbol} (${entry.assetAddress}):`,
            balanceResult.error,
          );
          balance = 0n;
        } else if (typeof balanceResult === 'bigint') {
          // Fallback: if result is directly a bigint (shouldn't happen with allowFailure: true)
          balance = balanceResult;
        } else {
          console.warn(
            `[PartnerFeeClaimService] Unexpected balance result format for ${entry.hubAsset.symbol} (${entry.assetAddress}):`,
            balanceResult,
          );
          balance = 0n;
        }

        if (index < 5) {
          console.log(
            `[PartnerFeeClaimService] Asset ${entry.hubAsset.symbol} (${entry.assetAddress}): balance = ${balance.toString()}`,
          );
        }

        // Only add to map if balance is greater than zero
        if (balance > 0n) {
          nonZeroCount++;
          balancesMap.set(entry.assetAddress, {
            symbol: entry.hubAsset.symbol,
            name: entry.hubAsset.name,
            address: entry.assetAddress, // Wrapped asset address on Sonic
            originalChain: entry.originalChain,
            originalAddress: entry.originalAddress,
            decimal: entry.hubAsset.decimal,
            balance,
          });
        }
      });

      console.log('[PartnerFeeClaimService] fetchAssetsBalances - total balances in map:', balancesMap.size);
      console.log('[PartnerFeeClaimService] fetchAssetsBalances - non-zero balances:', nonZeroCount);
      console.log(
        '[PartnerFeeClaimService] fetchAssetsBalances - sample balances:',
        Array.from(balancesMap.values()).slice(0, 5),
      );

      return {
        ok: true,
        value: balancesMap,
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Sets the auto swap preferences for a user
   * @param {SetSwapPreferenceParams} params - The swap preference parameters
   * @param {SonicSpokeProviderType} spokeProvider - The Sonic spoke provider
   * @param {boolean} raw - Whether to return raw transaction data
   * @returns {Promise<Result<TxReturnType<SonicSpokeProviderType, R>, Error>>} Transaction hash or raw transaction
   */
  public async setSwapPreference<S extends SonicSpokeProviderType, R extends boolean = false>(
    params: SetSwapPreferenceParams,
    spokeProvider: S,
    raw?: R,
  ): Promise<Result<TxReturnType<S, R>, Error>> {
    try {
      invariant(isSonicSpokeProviderType(spokeProvider), 'PartnerFeeClaimService only supports Sonic spoke provider');

      invariant(this.config.protocolIntentsContract, 'protocolIntentsContract is not configured in solver config');

      const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
      const dstChainId = BigInt(getIntentRelayChainId(params.dstChain));
      // Use address directly as hex (no special encoding needed for EVM addresses)
      const dstAddressBytes = params.dstAddress as Hex;

      const rawTx = {
        from: walletAddress as Address,
        to: this.config.protocolIntentsContract,
        value: 0n,
        data: encodeFunctionData({
          abi: ProtocolIntentsAbi,
          functionName: 'setAutoSwapPreferences',
          args: [params.outputToken, dstChainId, dstAddressBytes],
        }),
      };

      if (raw || isSonicRawSpokeProvider(spokeProvider)) {
        return {
          ok: true,
          value: rawTx as TxReturnType<S, R>,
        };
      }

      const txHash = await spokeProvider.walletProvider.sendTransaction(rawTx);

      return {
        ok: true,
        value: txHash as TxReturnType<S, R>,
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Checks if a token is already approved to the protocol intents contract
   * @param {Address} token - The token address to check
   * @param {SonicSpokeProviderType} spokeProvider - The Sonic spoke provider
   * @param {Address} address - Optional address to check approval for. If not provided, uses the connected wallet address
   * @returns {Promise<Result<boolean, Error>>} True if token is approved (has max or sufficient allowance)
   */
  public async isTokenApproved(
    token: Address,
    spokeProvider: SonicSpokeProviderType,
    address?: Address,
  ): Promise<Result<boolean, Error>> {
    try {
      invariant(isSonicSpokeProviderType(spokeProvider), 'PartnerFeeClaimService only supports Sonic spoke provider');

      invariant(this.config.protocolIntentsContract, 'protocolIntentsContract is not configured in solver config');

      const queryAddress = address || (await spokeProvider.walletProvider.getWalletAddress());

      if (token.toLowerCase() === spokeProvider.chainConfig.nativeToken.toLowerCase()) {
        return {
          ok: true,
          value: true,
        };
      }

      const allowedAmount = await spokeProvider.publicClient.readContract({
        address: token,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [queryAddress as Address, this.config.protocolIntentsContract],
      });

      // Check if allowance is max (2^256 - 1) or a very large number (essentially max)
      const maxUint256 = 2n ** 256n - 1n;
      const isMaxApproved = allowedAmount >= maxUint256 - 1000n; // Allow for small rounding differences

      return {
        ok: true,
        value: isMaxApproved,
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Approves a token to the protocol intents contract with maximum allowance
   * @param {Address} token - The token address to approve
   * @param {SonicSpokeProviderType} spokeProvider - The Sonic spoke provider
   * @param {boolean} raw - Whether to return raw transaction data
   * @returns {Promise<Result<TxReturnType<SonicSpokeProviderType, R>, Error>>} Transaction hash or raw transaction
   */
  public async approveToken<S extends SonicSpokeProviderType, R extends boolean = false>(
    token: Address,
    spokeProvider: S,
    raw?: R,
  ): Promise<Result<TxReturnType<S, R>, Error>> {
    try {
      invariant(isSonicSpokeProviderType(spokeProvider), 'PartnerFeeClaimService only supports Sonic spoke provider');

      invariant(this.config.protocolIntentsContract, 'protocolIntentsContract is not configured in solver config');

      // Always approve max (2^256 - 1)
      const maxUint256 = 2n ** 256n - 1n;
      const result = await Erc20Service.approve(
        token,
        maxUint256,
        this.config.protocolIntentsContract,
        spokeProvider,
        raw,
      );

      return {
        ok: true,
        value: result as TxReturnType<S, R>,
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Creates an intent auto swap and handles post-execution
   * @param {SwapParams} params - The swap parameters
   * @param {SonicSpokeProviderType} spokeProvider - The Sonic spoke provider
   * @returns {Promise<Result<SolverExecutionResponse, IntentError<IntentErrorCode>>>} Solver execution response
   */
  public async swap<S extends SonicSpokeProviderType>(
    params: SwapParams,
    spokeProvider: S,
  ): Promise<Result<SolverExecutionResponse, IntentError<IntentErrorCode>>> {
    try {
      invariant(isSonicSpokeProviderType(spokeProvider), 'PartnerFeeClaimService only supports Sonic spoke provider');

      invariant(this.config.protocolIntentsContract, 'protocolIntentsContract is not configured in solver config');

      const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
      const minOutputAmount = 0n;

      // Call createIntentAutoSwap
      const rawTx = {
        from: walletAddress as Address,

        to: this.config.protocolIntentsContract,
        value: 0n,
        data: encodeFunctionData({
          abi: ProtocolIntentsAbi,
          functionName: 'createIntentAutoSwap',
          args: [walletAddress as Address, params.fromToken, params.amount, minOutputAmount],
        }),
      };
      //TODO make it type safe, remove any
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      const txHash = await (spokeProvider.walletProvider as any).sendTransaction(rawTx);
      // Wait for transaction receipt
      const receipt = await spokeProvider.publicClient.waitForTransactionReceipt({
        hash: txHash as `0x${string}`,
      });

      // Extract intent_tx_hash from transaction receipt
      // The intent_tx_hash should be the transaction hash itself for auto-swap
      const intentTxHash = receipt.transactionHash;

      // Post execution to solver API
      const result = await SolverApiService.postExecution(
        {
          intent_tx_hash: intentTxHash as `0x${string}`,
        },
        this.config,
      );

      if (!result.ok) {
        return {
          ok: false,
          error: {
            code: 'POST_EXECUTION_FAILED',
            data: {
              ...result.error,
            },
          } as IntentError<'POST_EXECUTION_FAILED'>,
        };
      }

      return {
        ok: true,
        value: result.value,
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'UNKNOWN',
          data: {
            payload: {
              inputToken: params.fromToken,
              outputToken: '0x0000000000000000000000000000000000000000' as Address,
              inputAmount: params.amount,
              minOutputAmount: 0n,
              deadline: 0n,
              allowPartialFill: false,
              srcChain: SONIC_MAINNET_CHAIN_ID,
              dstChain: SONIC_MAINNET_CHAIN_ID,
              srcAddress: '',
              dstAddress: '',
              solver: '0x0000000000000000000000000000000000000000' as Address,
              data: '0x' as Hex,
            },
            error: error,
          },
        } as IntentError<'UNKNOWN'>,
      };
    }
  }
}
