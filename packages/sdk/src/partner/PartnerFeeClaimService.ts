// packages/sdk/src/partner/PartnerFeeClaimService.ts
import invariant from 'tiny-invariant';
import { erc20Abi, encodeFunctionData, type Address } from 'viem';
import type { ConfigService } from '../shared/config/ConfigService.js';
import type { HubProvider } from '../shared/types/types.js';
import { SolverApiService } from '../swap/SolverApiService.js';
import { ProtocolIntentsAbi } from '../shared/abis/protocolIntents.abi.js';
import {
  type SpokeChainKey,
  getIntentRelayChainId,
  type Hex,
  type OriginalAssetAddress,
  type XToken,
  type IntentRelayChainId,
  type SolverErrorResponse,
  type SolverExecutionResponse,
  type Result,
  type GetAddressType,
  type SonicChainKey,
  type TxReturnType,
  type HubChainKey,
  type WalletProviderSlot,
} from '@sodax/types';
import {
  encodeAddress,
  isEvmWalletProviderType,
  isHubChainKeyType,
  isOptionalEvmWalletProviderType,
  type SpokeApproveParams,
  type SpokeService,
} from '../index.js';

export type PartnerFeeClaimAssetBalance = {
  symbol: string;
  name: string;
  address: Address; // The wrapped asset address on Sonic (hub chain)
  originalChain: SpokeChainKey; // The original chain where this token comes from
  originalAddress: Address; // The original token address on the spoke chain
  decimal: number;
  balance: bigint;
};

export type AutoSwapPreferences = {
  outputToken: Address;
  dstChain: SpokeChainKey | 'not configured';
  dstAddress: Hex;
};

export type SetSwapPreferenceParams = {
  srcChainKey: HubChainKey;
  srcAddress: Address;
  outputToken: Address;
  dstChain: SpokeChainKey;
  dstAddress: string;
};

export type SetSwapPreferenceAction<K extends SpokeChainKey, Raw extends boolean> = {
  params: SetSwapPreferenceParams;
  timeout?: number;
  skipSimulation?: boolean;
} & WalletProviderSlot<K, Raw>;

export type FeeTokenApproveParams = {
  srcChainKey: HubChainKey;
  srcAddress: Address;
  token: Address;
};

export type FeeTokenApproveAction<K extends HubChainKey, Raw extends boolean> = {
  params: FeeTokenApproveParams;
} & WalletProviderSlot<K, Raw>;

export type AssetEntry = {
  assetAddress: Address; // The wrapped asset address on Sonic
  originalChain: SpokeChainKey;
  originalAddress: Address; // The original token address on the spoke chain
  hubAsset: { symbol: string; name: string; decimal: number };
};

export type PartnerFeeClaimSwapParams = {
  srcChainKey: HubChainKey;
  srcAddress: Address;
  fromToken: Address;
  amount: bigint;
  timeout?: number;
};

export type PartnerFeeClaimSwapAction<K extends SpokeChainKey, Raw extends boolean> = {
  params: PartnerFeeClaimSwapParams;
  timeout?: number;
} & WalletProviderSlot<K, Raw>;

export type PartnerFeeClaimServiceConstructorParams = {
  config: ConfigService;
  hubProvider: HubProvider;
  spoke: SpokeService;
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

/**
 * PartnerFeeClaimService is a service that allows you to claim partner fees for a given address or provider.
 * @namespace SodaxFeatures
 */
export class PartnerFeeClaimService {
  private readonly hubProvider: HubProvider;
  private readonly config: ConfigService;
  private readonly spoke: SpokeService;
  private readonly protocolIntentsContract: Address;

  public constructor({ config, hubProvider, spoke }: PartnerFeeClaimServiceConstructorParams) {
    this.config = config;
    this.hubProvider = hubProvider;
    this.spoke = spoke;
    this.protocolIntentsContract = config.solver.protocolIntentsContract;
  }

  /**
   * Util methods for dealing with tokens and hub assets
   */

  public getOriginalAssetAddress(chainId: SpokeChainKey, hubAsset: Address): OriginalAssetAddress | undefined {
    return this.config.getOriginalAssetAddress(chainId, hubAsset);
  }

  public getSpokeTokenFromOriginalAssetAddress(
    chainId: SpokeChainKey,
    originalAssetAddress: OriginalAssetAddress,
  ): XToken | undefined {
    return this.config.getSpokeTokenFromOriginalAssetAddress(chainId, originalAssetAddress);
  }

  /**
   * Fetches balances for all hub assets across all chains on Sonic for a given address or provider.
   *
   * @param params - Either an EVM address (as a string) or a SonicSpokeProviderType.
   *   If an address, queries balances for that address.
   *   If a SonicSpokeProviderType, uses the connected wallet's address.
   * @returns A promise resolving to a Result containing a Map from wrapped asset address (on Sonic)
   *   to PartnerFeeClaimAssetBalance, or an Error on failure.
   */
  public async fetchAssetsBalances(
    queryAddress: string,
  ): Promise<Result<Map<string, PartnerFeeClaimAssetBalance>, Error>> {
    try {
      // Collect all assets from all chains
      const allAssetEntries: Array<AssetEntry> = [];

      // Iterate through all chains' supported tokens
      for (const [chainId, chainConfig] of Object.entries(this.config.spokeChainConfig)) {
        for (const token of Object.values(chainConfig.supportedTokens)) {
          allAssetEntries.push({
            assetAddress: token.hubAsset.toLowerCase() as Address,
            originalChain: chainId as SpokeChainKey,
            originalAddress: token.address.toLowerCase() as Address,
            hubAsset: {
              symbol: token.symbol,
              name: token.name,
              decimal: token.decimals,
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
      const balancesMap = new Map<string, PartnerFeeClaimAssetBalance>();
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
  public async getAutoSwapPreferences(queryAddress: string): Promise<Result<AutoSwapPreferences, Error>> {
    try {
      invariant(this.protocolIntentsContract, 'protocolIntentsContract is not configured in solver config');

      const autoSwapPreferences = await this.hubProvider.publicClient.readContract({
        address: this.protocolIntentsContract,
        abi: ProtocolIntentsAbi,
        functionName: 'getAutoSwapPreferences',
        args: [queryAddress as GetAddressType<SonicChainKey>],
      });

      // If dstChain is 0 (not configured), return "not configured" without conversion
      const dstChain =
        autoSwapPreferences.dstChain === 0n
          ? ('not configured' as const)
          : this.config.getSpokeChainKeyFromIntentRelayChainId(autoSwapPreferences.dstChain as IntentRelayChainId);

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
   * @template Raw - Whether to return raw transaction data (default: false)
   * @param {Object} args - The argument object
   * @param {SetSwapPreferenceParams} args.params - The swap preference parameters
   * @param {S} args.spokeProvider - The Sonic spoke provider
   * @param {Raw} [args.raw] - If true, the raw transaction data will be returned
   * @returns {Promise<Result<TxReturnType<S, Raw>, SetSwapPreferenceError>>}
   *   - If `raw` is true or the provider is a raw provider, returns the raw transaction object.
   *   - Otherwise, returns the transaction hash of the submitted transaction.
   *   - If failed, returns an error object with code 'SET_SWAP_PREFERENCE_FAILED'.
   */
  public async setSwapPreference<K extends SpokeChainKey, Raw extends boolean>(
    _params: SetSwapPreferenceAction<K, Raw>,
  ): Promise<Result<TxReturnType<K, Raw>, SetSwapPreferenceError>> {
    const { params, walletProvider, raw } = _params;
    try {
      invariant(isHubChainKeyType(params.srcChainKey), 'PartnerFeeClaimService only supports Sonic spoke provider');
      invariant(this.protocolIntentsContract, 'protocolIntentsContract is not configured in solver config');

      const outputToken =
        params.dstChain !== this.hubProvider.chainConfig.chain.key
          ? this.hubProvider.config.getSpokeTokenFromOriginalAssetAddress(params.dstChain, params.outputToken)?.hubAsset
          : params.outputToken;

      invariant(
        outputToken,
        `hub asset not found for spoke chain token (params.outputToken): ${params.outputToken} with chain id: ${params.dstChain}`,
      );

      const rawTx = {
        from: params.srcAddress,
        to: this.protocolIntentsContract,
        value: 0n,
        data: encodeFunctionData({
          abi: ProtocolIntentsAbi,
          functionName: 'setAutoSwapPreferences',
          args: [
            outputToken,
            BigInt(getIntentRelayChainId(params.dstChain)),
            encodeAddress(params.dstChain, params.dstAddress),
          ],
        }),
      } satisfies TxReturnType<HubChainKey, true>;

      if (raw) {
        return {
          ok: true,
          value: rawTx satisfies TxReturnType<HubChainKey, true> as TxReturnType<K, Raw>,
        };
      }

      invariant(
        isEvmWalletProviderType(walletProvider),
        'PartnerFeeClaimService only supports Evm (sonic) wallet provider',
      );

      const txHash = await walletProvider.sendTransaction(rawTx);

      return {
        ok: true,
        value: txHash satisfies TxReturnType<HubChainKey, false> as TxReturnType<K, Raw>,
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
  public async isTokenApproved({ token, srcAddress }: FeeTokenApproveParams): Promise<Result<boolean, Error>> {
    try {
      invariant(this.protocolIntentsContract, 'protocolIntentsContract is not configured in solver config');

      if (token.toLowerCase() === this.hubProvider.chainConfig.nativeToken.toLowerCase()) {
        return {
          ok: true,
          value: true,
        };
      }

      const allowedAmount = await this.hubProvider.publicClient.readContract({
        address: token,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [srcAddress, this.protocolIntentsContract],
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
  public async approveToken<Raw extends boolean>(
    _params: FeeTokenApproveAction<HubChainKey, Raw>,
  ): Promise<Result<TxReturnType<HubChainKey, Raw>>> {
    const { params } = _params;
    try {
      invariant(isHubChainKeyType(params.srcChainKey), 'PartnerFeeClaimService only supports Hub srcChainKey');
      invariant(
        isOptionalEvmWalletProviderType(_params.walletProvider),
        'PartnerFeeClaimService only supports Evm wallet provider',
      );
      invariant(
        this.config.solver.protocolIntentsContract,
        'protocolIntentsContract is not configured in solver config',
      );

      // Always approve max (2^256 - 1)
      const maxUint256 = 2n ** 256n - 1n;

      const coreParams = {
        srcChainKey: params.srcChainKey,
        token: params.token,
        amount: maxUint256,
        spender: this.config.solver.protocolIntentsContract,
        owner: params.srcAddress,
      } as const;

      const approveParams = _params.raw
        ? ({
            ...coreParams,
            raw: true,
          } satisfies SpokeApproveParams<HubChainKey, true>)
        : ({
            ...coreParams,
            raw: false,
            walletProvider: _params.walletProvider,
          } satisfies SpokeApproveParams<HubChainKey, false>);

      const result = await this.spoke.approve<HubChainKey, boolean>(approveParams);

      if (!result.ok) return result;

      return {
        ok: true,
        value: result.value satisfies TxReturnType<HubChainKey, boolean> as TxReturnType<HubChainKey, Raw>,
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
  public async createIntentAutoSwap<Raw extends boolean>(
    _params: PartnerFeeClaimSwapAction<HubChainKey, Raw>,
  ): Promise<Result<TxReturnType<HubChainKey, Raw>, CreateIntentAutoSwapError>> {
    const { params } = _params;
    try {
      invariant(isHubChainKeyType(params.srcChainKey), 'PartnerFeeClaimService only supports Hub srcChainKey');
      invariant(
        isOptionalEvmWalletProviderType(_params.walletProvider),
        'PartnerFeeClaimService only supports Evm wallet provider',
      );
      invariant(
        this.config.solver.protocolIntentsContract,
        'protocolIntentsContract is not configured in solver config',
      );

      // currently we only allow Sodax solver to fille the intent using best price
      // IMPORTANT: if this is changed, quote needs to be used to create slippage based min output amount
      const minOutputAmount = 0n;

      // Call createIntentAutoSwap
      const rawTx = {
        from: params.srcAddress,
        to: this.config.solver.protocolIntentsContract,
        value: 0n,
        data: encodeFunctionData({
          abi: ProtocolIntentsAbi,
          functionName: 'createIntentAutoSwap',
          args: [params.srcAddress, params.fromToken, params.amount, minOutputAmount],
        }),
      };

      if (_params.raw) {
        return {
          ok: true,
          value: rawTx satisfies TxReturnType<HubChainKey, true> as TxReturnType<HubChainKey, Raw>,
        };
      }

      const txHash = await _params.walletProvider.sendTransaction(rawTx);

      return {
        ok: true,
        value: txHash satisfies TxReturnType<HubChainKey, false> as TxReturnType<HubChainKey, Raw>,
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
  public async swap(
    _params: PartnerFeeClaimSwapAction<HubChainKey, false>,
  ): Promise<Result<IntentAutoSwapResult, ExecuteIntentAutoSwapError>> {
    const { params } = _params;
    try {
      const txHash = await this.createIntentAutoSwap(_params);

      if (!txHash.ok) {
        return txHash;
      }

      let intentTxHash: Hex;
      try {
        const receipt = await this.hubProvider.publicClient.waitForTransactionReceipt({ hash: txHash.value });
        // Extract intent_tx_hash from transaction receipt
        // The intent_tx_hash should be the transaction hash itself for auto-swap
        intentTxHash = receipt.transactionHash;
      } catch (error) {
        return {
          ok: false,
          error: {
            code: 'WAIT_INTENT_AUTO_SWAP_FAILED',
            data: {
              payload: _params.params,
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
        this.config.solver,
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
