// packages/sdk/src/partner/PartnerFeeClaimService.ts
import invariant from 'tiny-invariant';
import { erc20Abi, encodeFunctionData, type Address, isAddress } from 'viem';
import type { EvmHubProvider, SonicSpokeProvider } from '../shared/entities/Providers.js';
import type { ConfigService } from '../shared/config/ConfigService.js';
import type {
  SolverExecutionResponse,
  Result,
  TxReturnType,
  Prettify,
  SonicSpokeProviderType,
  OptionalRaw,
  GetAddressType,
  SolverErrorResponse,
} from '../shared/types.js';
import { Erc20Service } from '../shared/services/erc-20/Erc20Service.js';
import { SolverApiService } from '../swap/SolverApiService.js';
import {
  isSonicSpokeProviderType,
  isSonicRawSpokeProvider,
  isConfiguredSolverConfig,
  isSonicSpokeProvider,
} from '../shared/guards.js';
import { ProtocolIntentsAbi } from '../shared/abis/protocolIntents.abi.js';
import {
  SONIC_MAINNET_CHAIN_ID,
  type SpokeChainId,
  getSolverConfig,
  getIntentRelayChainId,
  type SolverConfig,
  type Hex,
  type HubAsset,
  type OriginalAssetAddress,
  type XToken,
  type IntentRelayChainId,
} from '@sodax/types';
import { encodeAddress } from '../index.js';

export type AssetBalance = {
  symbol: string;
  name: string;
  address: Address; // The wrapped asset address on Sonic (hub chain)
  originalChain: SpokeChainId; // The original chain where this token comes from
  originalAddress: Address; // The original token address on the spoke chain
  decimal: number;
  balance: bigint;
};

export type AutoSwapPreferences = {
  outputToken: Address;
  dstChain: SpokeChainId | 'not configured';
  dstAddress: Hex;
};

export type GetAutoSwapPreferencesParams =
  | {
      address: Address;
    }
  | {
      spokeProvider: SonicSpokeProviderType;
    };

export type FetchAssetsBalancesParams =
  | {
      address: Address;
    }
  | {
      spokeProvider: SonicSpokeProviderType;
    };

export type SetSwapPreferenceParams = {
  outputToken: Address;
  dstChain: SpokeChainId;
  dstAddress: string;
};

export type FeeTokenApproveParams = {
  token: Address;
  spokeProvider: SonicSpokeProviderType;
};

export type AssetEntry = {
  assetAddress: Address; // The wrapped asset address on Sonic
  originalChain: SpokeChainId;
  originalAddress: Address; // The original token address on the spoke chain
  hubAsset: { symbol: string; name: string; decimal: number };
};

export type PartnerFeeClaimSwapParams = {
  fromToken: Address;
  amount: bigint;
  timeout?: number;
};

export type PartnerFeeClaimServiceConfig = Prettify<
  SolverConfig & { relayerApiEndpoint?: string; protocolIntentsContract?: Address }
>;

export type PartnerFeeClaimServiceConstructorParams = {
  config?: PartnerFeeClaimServiceConfig;
  configService: ConfigService;
  hubProvider: EvmHubProvider;
};

export type SetSwapPreferenceError = {
  code: 'SET_SWAP_PREFERENCE_FAILED';
  data: {
    payload: SetSwapPreferenceParams;
    error: unknown;
  };
};

export type IntentAutoSwapErrorData = {
  payload: PartnerFeeClaimSwapParams;
  error: unknown;
};

export type CreateIntentAutoSwapError = {
  code: 'CREATE_INTENT_AUTO_SWAP_FAILED';
  data: IntentAutoSwapErrorData;
};

export type WaitIntentAutoSwapError = {
  code: 'WAIT_INTENT_AUTO_SWAP_FAILED';
  data: IntentAutoSwapErrorData;
};

export type UnknownIntentAutoSwapError = {
  code: 'UNKNOWN';
  data: IntentAutoSwapErrorData;
};

export type ExecuteIntentAutoSwapError =
  | CreateIntentAutoSwapError
  | WaitIntentAutoSwapError
  | SolverErrorResponse
  | UnknownIntentAutoSwapError;

export type IntentAutoSwapResult = {
  srcTxHash: Hex; // The transaction hash of the source transaction on the source chain (Sonic chain)
  solverExecutionResponse: SolverExecutionResponse; // The solver execution response
  intentTxHash: Hex; // The transaction hash of the intent on the hub chain (Sonic chain)
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
      protocolIntentsContract: solverConfig.protocolIntentsContract,
    };
    this.configService = configService;
    this.hubProvider = hubProvider;
  }

  /**
   * Util methods for dealing with tokens and hub assets
   */

  public getAllHubAssets(): Record<SpokeChainId, Record<string, HubAsset>> {
    return this.configService.getHubAssets();
  }

  public getOriginalAssetAddress(chainId: SpokeChainId, hubAsset: Address): OriginalAssetAddress | undefined {
    return this.configService.getOriginalAssetAddress(chainId, hubAsset);
  }

  public getSpokeTokenFromOriginalAssetAddress(
    chainId: SpokeChainId,
    originalAssetAddress: OriginalAssetAddress,
  ): XToken | undefined {
    return this.configService.getSpokeTokenFromOriginalAssetAddress(chainId, originalAssetAddress);
  }

  /**
   * Fetches balances for all hub assets across all chains on Sonic for a given address or provider.
   *
   * @param params - Either an EVM address (as a string) or a SonicSpokeProviderType.
   *   If an address, queries balances for that address.
   *   If a SonicSpokeProviderType, uses the connected wallet's address.
   * @returns A promise resolving to a Result containing a Map from wrapped asset address (on Sonic)
   *   to AssetBalance, or an Error on failure.
   */
  public async fetchAssetsBalances(
    params: FetchAssetsBalancesParams,
  ): Promise<Result<Map<string, AssetBalance>, Error>> {
    try {
      let queryAddress: string;
      if ('address' in params) {
        invariant(isAddress(params.address), 'Address must be a valid EVM address');
        queryAddress = params.address;
      } else {
        invariant(
          isSonicSpokeProviderType(params.spokeProvider),
          'PartnerFeeClaimService only supports Sonic spoke provider',
        );
        queryAddress = await params.spokeProvider.walletProvider.getWalletAddress();
      }

      // Collect all assets from all chains
      const allAssetEntries: Array<AssetEntry> = [];

      // Iterate through all chains in hubAssets
      for (const [chainId, chainAssets] of Object.entries(this.getAllHubAssets())) {
        // Iterate through all tokens in this chain
        for (const [originalTokenAddress, hubAsset] of Object.entries(chainAssets)) {
          allAssetEntries.push({
            assetAddress: hubAsset.asset.toLowerCase() as Address, // Use the wrapped asset address on Sonic
            originalChain: chainId as SpokeChainId,
            originalAddress: originalTokenAddress.toLowerCase() as Address,
            hubAsset: {
              symbol: hubAsset.symbol,
              name: hubAsset.name,
              decimal: hubAsset.decimal,
            },
          });
        }
      }

      // Remove duplicates based on asset address (same wrapped token might appear in multiple chains)
      const uniqueAssets = new Map<Address, (typeof allAssetEntries)[0]>();
      for (const entry of allAssetEntries) {
        if (!uniqueAssets.has(entry.assetAddress)) {
          uniqueAssets.set(entry.assetAddress, entry);
        }
      }

      const uniqueAssetEntries = Array.from(uniqueAssets.values());
      const assetAddresses = uniqueAssetEntries.map(entry => entry.assetAddress);

      // Batch query balances using multicall for all wrapped assets on Sonic
      const balanceResults = await this.hubProvider.publicClient.multicall({
        contracts: assetAddresses.map(assetAddress => ({
          address: assetAddress,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [queryAddress],
        })),
        allowFailure: false,
      });

      // Build result map keyed by asset address (wrapped token on Sonic)
      const balancesMap = new Map<string, AssetBalance>();
      let nonZeroCount = 0;

      uniqueAssetEntries.forEach((entry, index) => {
        const balanceResult = balanceResults[index];
        // When allowFailure: true, results have status and result properties
        let balance: bigint;
        if (typeof balanceResult === 'bigint') {
          // Fallback: if result is directly a bigint (shouldn't happen with allowFailure: true)
          balance = balanceResult;
        } else {
          console.warn(
            `[PartnerFeeClaimService] Unexpected balance result format for ${entry.hubAsset.symbol} (${entry.assetAddress}):`,
            balanceResult,
          );
          balance = 0n;
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
   * Gets the auto swap preferences for a user.
   *
   * @param params - Either an EVM address (as a string) or a SonicSpokeProviderType.
   *   If an address, queries preferences for that address.
   *   If a SonicSpokeProviderType, uses the connected wallet's address.
   * @returns A promise resolving to a Result containing the auto swap preferences, or an Error on failure.
   *   The auto swap preferences include the output token, destination chain, and destination address.
   */
  public async getAutoSwapPreferences(
    params: GetAutoSwapPreferencesParams,
  ): Promise<Result<AutoSwapPreferences, Error>> {
    try {
      let queryAddress: string;
      if ('address' in params) {
        invariant(isAddress(params.address), 'Address must be a valid EVM address');
        queryAddress = params.address;
      } else {
        invariant(
          isSonicSpokeProviderType(params.spokeProvider),
          'PartnerFeeClaimService only supports Sonic spoke provider',
        );
        queryAddress = await params.spokeProvider.walletProvider.getWalletAddress();
      }
      invariant(this.config.protocolIntentsContract, 'protocolIntentsContract is not configured in solver config');

      const autoSwapPreferences = await this.hubProvider.publicClient.readContract({
        address: this.config.protocolIntentsContract,
        abi: ProtocolIntentsAbi,
        functionName: 'getAutoSwapPreferences',
        args: [queryAddress as GetAddressType<SonicSpokeProviderType>],
      });

      // If dstChain is 0 (not configured), return "not configured" without conversion
      const dstChain =
        autoSwapPreferences.dstChain === 0n
          ? ('not configured' as const)
          : this.configService.getSpokeChainIdFromIntentRelayChainId(
              autoSwapPreferences.dstChain as IntentRelayChainId,
            );

      return {
        ok: true,
        value: {
          outputToken: autoSwapPreferences.outputToken,
          dstChain,
          dstAddress: autoSwapPreferences.dstAddress,
        },
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Sets the auto swap preferences for a user.
   *
   * @template S - Type of the Sonic spoke provider
   * @template R - Whether to return raw transaction data (default: false)
   * @param {Object} args - The argument object
   * @param {SetSwapPreferenceParams} args.params - The swap preference parameters
   * @param {S} args.spokeProvider - The Sonic spoke provider
   * @param {R} [args.raw] - If true, the raw transaction data will be returned
   * @returns {Promise<Result<TxReturnType<S, R>, SetSwapPreferenceError>>}
   *   - If `raw` is true or the provider is a raw provider, returns the raw transaction object.
   *   - Otherwise, returns the transaction hash of the submitted transaction.
   *   - If failed, returns an error object with code 'SET_SWAP_PREFERENCE_FAILED'.
   */
  public async setSwapPreference<S extends SonicSpokeProviderType, R extends boolean = false>({
    params,
    spokeProvider,
    raw,
  }: { params: SetSwapPreferenceParams; spokeProvider: S; raw?: R }): Promise<
    Result<TxReturnType<S, R>, SetSwapPreferenceError>
  > {
    try {
      invariant(isSonicSpokeProviderType(spokeProvider), 'PartnerFeeClaimService only supports Sonic spoke provider');
      invariant(this.config.protocolIntentsContract, 'protocolIntentsContract is not configured in solver config');

      const walletAddress = await spokeProvider.walletProvider.getWalletAddress();

      const rawTx = {
        from: walletAddress as GetAddressType<SonicSpokeProviderType>,
        to: this.config.protocolIntentsContract,
        value: 0n,
        data: encodeFunctionData({
          abi: ProtocolIntentsAbi,
          functionName: 'setAutoSwapPreferences',
          args: [
            params.outputToken,
            BigInt(getIntentRelayChainId(params.dstChain)),
            encodeAddress(params.dstChain, params.dstAddress),
          ],
        }),
      } satisfies TxReturnType<SonicSpokeProviderType, true>;

      if (raw || isSonicRawSpokeProvider(spokeProvider)) {
        return {
          ok: true,
          value: rawTx satisfies TxReturnType<SonicSpokeProviderType, true> as TxReturnType<S, R>,
        };
      }

      const txHash = await spokeProvider.walletProvider.sendTransaction(rawTx);

      return {
        ok: true,
        value: txHash satisfies TxReturnType<SonicSpokeProviderType, false> as TxReturnType<S, R>,
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'SET_SWAP_PREFERENCE_FAILED',
          data: {
            payload: params,
            error: error,
          },
        },
      };
    }
  }

  /**
   * Checks if a token is already approved to the protocol intents contract for a given address or the connected wallet.
   *
   * @param params - Object containing:
   *   - token: The ERC20 token address to check.
   *   - spokeProvider: The SonicSpokeProviderType instance.
   *   - address (optional): The address to check allowance for. If not provided, uses the currently connected wallet.
   * @returns Promise resolving to a Result. Value is true if token is approved (has max or sufficient allowance), false otherwise. Returns an error if the check fails.
   */
  public async isTokenApproved({ token, spokeProvider }: FeeTokenApproveParams): Promise<Result<boolean, Error>> {
    try {
      invariant(isSonicSpokeProviderType(spokeProvider), 'PartnerFeeClaimService only supports Sonic spoke provider');
      invariant(this.config.protocolIntentsContract, 'protocolIntentsContract is not configured in solver config');

      const queryAddress = await spokeProvider.walletProvider.getWalletAddress();

      if (token.toLowerCase() === spokeProvider.chainConfig.nativeToken.toLowerCase()) {
        return {
          ok: true,
          value: true,
        };
      }

      const allowedAmount = await this.hubProvider.publicClient.readContract({
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
  public async approveToken<S extends SonicSpokeProviderType, R extends boolean = false>({
    token,
    spokeProvider,
    raw,
  }: FeeTokenApproveParams & OptionalRaw<R>): Promise<Result<TxReturnType<S, R>, Error>> {
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
        value: result satisfies TxReturnType<SonicSpokeProviderType, R> as TxReturnType<S, R>,
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Creates an intent to auto swap tokens using the protocol intents contract
   * @param {PartnerFeeClaimSwapParams} params - The swap parameters
   * @param {SonicSpokeProviderType} spokeProvider - The Sonic spoke provider
   * @param {boolean} raw - Whether to return raw transaction data
   * @returns {Promise<TxReturnType<SonicSpokeProviderType, R>>} Transaction hash or raw transaction
   */
  public async createIntentAutoSwap<S extends SonicSpokeProviderType, R extends boolean = false>({
    params,
    spokeProvider,
    raw,
  }: { params: PartnerFeeClaimSwapParams; spokeProvider: S } & OptionalRaw<R>): Promise<
    Result<TxReturnType<S, R>, CreateIntentAutoSwapError>
  > {
    try {
      invariant(isSonicSpokeProvider(spokeProvider), 'PartnerFeeClaimService only supports Sonic spoke provider');
      invariant(this.config.protocolIntentsContract, 'protocolIntentsContract is not configured in solver config');

      const walletAddress = await spokeProvider.walletProvider.getWalletAddress();

      // currently we only allow Sodax solver to fille the intent using best price
      // IMPORTANT: if this is changed, quote needs to be used to create slippage based min output amount
      const minOutputAmount = 0n;

      // Call createIntentAutoSwap
      const rawTx = {
        from: walletAddress,
        to: this.config.protocolIntentsContract,
        value: 0n,
        data: encodeFunctionData({
          abi: ProtocolIntentsAbi,
          functionName: 'createIntentAutoSwap',
          args: [walletAddress, params.fromToken, params.amount, minOutputAmount],
        }),
      };

      if (raw || isSonicRawSpokeProvider(spokeProvider)) {
        return {
          ok: true,
          value: rawTx satisfies TxReturnType<SonicSpokeProviderType, true> as TxReturnType<S, R>,
        };
      }

      const txHash = await spokeProvider.walletProvider.sendTransaction(rawTx);

      return {
        ok: true,
        value: txHash satisfies TxReturnType<SonicSpokeProviderType, false> as TxReturnType<S, R>,
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'CREATE_INTENT_AUTO_SWAP_FAILED',
          data: {
            payload: params,
            error: error,
          },
        },
      };
    }
  }

  /**
   * Creates an intent auto swap and handles post-execution
   * @param {PartnerFeeClaimSwapParams} params - The swap parameters
   * @param {SonicSpokeProviderType} spokeProvider - The Sonic spoke provider
   * @returns {Promise<Result<SolverExecutionResponse, IntentError<IntentErrorCode>>>} Solver execution response
   */
  public async swap<S extends SonicSpokeProvider>({
    params,
    spokeProvider,
  }: { params: PartnerFeeClaimSwapParams; spokeProvider: S }): Promise<
    Result<IntentAutoSwapResult, ExecuteIntentAutoSwapError>
  > {
    try {
      const txHash = await this.createIntentAutoSwap({ params, spokeProvider, raw: false });

      if (!txHash.ok) {
        return txHash;
      }

      let intentTxHash: Hex;
      try {
        const receipt = await spokeProvider.publicClient.waitForTransactionReceipt({ hash: txHash.value });
        // Extract intent_tx_hash from transaction receipt
        // The intent_tx_hash should be the transaction hash itself for auto-swap
        intentTxHash = receipt.transactionHash;
      } catch (error) {
        return {
          ok: false,
          error: {
            code: 'WAIT_INTENT_AUTO_SWAP_FAILED',
            data: {
              payload: params,
              error: error,
            },
          },
        };
      }

      // Post execution to solver API
      const solverExecutionResponse = await SolverApiService.postExecution(
        {
          intent_tx_hash: intentTxHash,
        },
        this.config,
      );

      if (!solverExecutionResponse.ok) {
        return solverExecutionResponse;
      }

      return {
        ok: true,
        value: {
          srcTxHash: txHash.value,
          solverExecutionResponse: solverExecutionResponse.value,
          intentTxHash,
        },
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'UNKNOWN',
          data: { payload: params, error: error },
        },
      };
    }
  }
}

/**
 * Error type guards for error handling
 */

export function isSetSwapPreferenceError(error: unknown): error is SetSwapPreferenceError {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'SET_SWAP_PREFERENCE_FAILED';
}

export function isCreateIntentAutoSwapError(error: unknown): error is CreateIntentAutoSwapError {
  return (
    typeof error === 'object' && error !== null && 'code' in error && error.code === 'CREATE_INTENT_AUTO_SWAP_FAILED'
  );
}

export function isWaitIntentAutoSwapError(error: unknown): error is WaitIntentAutoSwapError {
  return (
    typeof error === 'object' && error !== null && 'code' in error && error.code === 'WAIT_INTENT_AUTO_SWAP_FAILED'
  );
}

export function isSolverErrorResponse(error: unknown): error is SolverErrorResponse {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'SOLVER_ERROR';
}

export function isUnknownIntentAutoSwapError(error: unknown): error is UnknownIntentAutoSwapError {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'UNKNOWN';
}
