// packages/sdk/src/services/bridge/BridgeService.ts
import invariant from 'tiny-invariant';
import {
  type SpokeProvider,
  type Hex,
  type Result,
  type TxReturnType,
  SpokeService,
  type RelayErrorCode,
  Erc20Service,
  type GetSpokeDepositParamsType,
  SonicSpokeService,
  SonicSpokeProvider,
  EvmSpokeProvider,
  type EvmHubProvider,
  relayTxAndWaitPacket,
  SolanaSpokeProvider,
  DEFAULT_RELAY_TX_TIMEOUT,
  type HubTxHash,
  type SpokeTxHash,
  getHubAssetInfo,
  WalletAbstractionService,
  type HubAssetInfo,
  type EvmContractCall,
  EvmVaultTokenService,
  EvmAssetManagerService,
  encodeContractCalls,
  calculateFeeAmount,
  type PartnerFee,
  type HttpUrl,
  isValidVault,
} from '../../index.js';
import { spokeChainConfig } from '../../constants.js';
import { type SpokeChainId, SONIC_MAINNET_CHAIN_ID, type XToken } from '@sodax/types';
import { isAddress, type Address } from 'viem';

export type BridgeParams = {
  srcChainId: SpokeChainId;
  srcAsset: string;
  amount: bigint;
  dstChainId: SpokeChainId;
  dstAsset: string;
  recipient: Hex;
  partnerFee?: PartnerFee;
};

export type BridgeErrorCode =
  | 'ALLOWANCE_CHECK_FAILED'
  | 'APPROVAL_FAILED'
  | 'CREATE_BRIDGE_INTENT_FAILED'
  | 'BRIDGE_FAILED'
  | RelayErrorCode;

export type BridgeError<T extends BridgeErrorCode> = {
  code: T;
  error: unknown;
};

export type BridgeExtraData = { address: Hex; payload: Hex };
export type BridgeOptionalExtraData = { data?: BridgeExtraData };

/**
 * BridgeService is a service that allows you to bridge tokens between chains
 * Birdge action can be between to spokes chains but can also be used to withdraw and deposit into soda tokens on the HUB.
 * By using soda tokens as src or destinatin address.
 * @param hubProvider - The hub provider
 * @param relayerApiEndpoint - The relayer API endpoint
 */
export class BridgeService {
  private readonly hubProvider: EvmHubProvider;
  private readonly relayerApiEndpoint: HttpUrl;

  constructor(hubProvider: EvmHubProvider, relayerApiEndpoint: HttpUrl) {
    this.hubProvider = hubProvider;
    this.relayerApiEndpoint = relayerApiEndpoint;
  }

  /**
   * Check if allowance is valid for the bridge transaction
   * @param params - The bridge parameters
   * @param spokeProvider - The spoke provider
   * @returns Promise<Result<boolean, BridgeError<'ALLOWANCE_CHECK_FAILED'>>>
   */
  public async isAllowanceValid<S extends SpokeProvider>(
    params: BridgeParams,
    spokeProvider: S,
  ): Promise<Result<boolean, BridgeError<'ALLOWANCE_CHECK_FAILED'>>> {
    try {
      invariant(params.amount > 0n, 'Amount must be greater than 0');
      invariant(params.srcAsset.length > 0, 'Source asset is required');

      const walletAddress = await spokeProvider.walletProvider.getWalletAddress();

      // For regular EVM chains (non-Sonic), check ERC20 allowance against assetManager
      if (spokeProvider instanceof EvmSpokeProvider) {
        invariant(isAddress(params.srcAsset), 'Invalid source asset address for EVM chain');

        const allowanceResult = await Erc20Service.isAllowanceValid(
          params.srcAsset as `0x${string}`,
          params.amount,
          walletAddress as `0x${string}`,
          spokeProvider.chainConfig.addresses.assetManager,
          spokeProvider,
        );

        if (!allowanceResult.ok) {
          return {
            ok: false,
            error: {
              code: 'ALLOWANCE_CHECK_FAILED',
              error: allowanceResult.error,
            },
          };
        }

        return {
          ok: true,
          value: allowanceResult.value,
        };
      }

      // For Sonic chain, check ERC20 allowance against userRouter
      if (spokeProvider instanceof SonicSpokeProvider) {
        invariant(isAddress(params.srcAsset), 'Invalid source asset address for Sonic chain');

        const userRouter = await SonicSpokeService.getUserRouter(walletAddress as `0x${string}`, spokeProvider);

        const allowanceResult = await Erc20Service.isAllowanceValid(
          params.srcAsset as `0x${string}`,
          params.amount,
          walletAddress as `0x${string}`,
          userRouter,
          spokeProvider,
        );

        if (!allowanceResult.ok) {
          return {
            ok: false,
            error: {
              code: 'ALLOWANCE_CHECK_FAILED',
              error: allowanceResult.error,
            },
          };
        }

        return {
          ok: true,
          value: allowanceResult.value,
        };
      }

      // For non-EVM chains (Icon, Sui, Stellar, etc.), no allowance check needed
      return {
        ok: true,
        value: true,
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'ALLOWANCE_CHECK_FAILED',
          error: error,
        },
      };
    }
  }

  /**
   * Approve token spending for the bridge transaction
   * @param params - The bridge parameters
   * @param spokeProvider - The spoke provider
   * @param raw - Whether to return raw transaction data
   * @returns Promise<Result<TxReturnType<S, R>, BridgeError<'APPROVAL_FAILED'>>>
   */
  public async approve<S extends SpokeProvider, R extends boolean = false>(
    params: BridgeParams,
    spokeProvider: S,
    raw?: R,
  ): Promise<Result<TxReturnType<S, R>, BridgeError<'APPROVAL_FAILED'>>> {
    try {
      invariant(params.amount > 0n, 'Amount must be greater than 0');
      invariant(params.srcAsset.length > 0, 'Source asset is required');

      const walletAddress = await spokeProvider.walletProvider.getWalletAddress();

      // For regular EVM chains (non-Sonic), approve against assetManager
      if (spokeProvider instanceof EvmSpokeProvider) {
        invariant(isAddress(params.srcAsset), 'Invalid source asset address for EVM chain');

        const result = await Erc20Service.approve(
          params.srcAsset as `0x${string}`,
          params.amount,
          spokeProvider.chainConfig.addresses.assetManager,
          spokeProvider,
          raw,
        );

        return {
          ok: true,
          value: result as TxReturnType<S, R>,
        };
      }

      // For Sonic chain, approve against userRouter
      if (spokeProvider instanceof SonicSpokeProvider) {
        invariant(isAddress(params.srcAsset), 'Invalid source asset address for Sonic chain');

        const userRouter = await SonicSpokeService.getUserRouter(walletAddress as `0x${string}`, spokeProvider);

        const result = await Erc20Service.approve(
          params.srcAsset as `0x${string}`,
          params.amount,
          userRouter,
          spokeProvider,
          raw,
        );

        return {
          ok: true,
          value: result as TxReturnType<S, R>,
        };
      }

      // For non-EVM chains, approval is not needed
      return {
        ok: false,
        error: {
          code: 'APPROVAL_FAILED',
          error: new Error('Approval only supported for EVM spoke chains'),
        },
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'APPROVAL_FAILED',
          error: error,
        },
      };
    }
  }

  /**
   * Execute a bridge transaction to transfer tokens from one chain to another
   * @param params - The bridge parameters including source/destination chains, assets, and recipient
   * @param spokeProvider - The spoke provider for the source chain
   * @param timeout - The timeout in milliseconds for the transaction. Default is 60 seconds.
   * @returns {Promise<Result<[SpokeTxHash, HubTxHash], BridgeError<BridgeErrorCode>>>} - Returns the transaction hashes for both spoke and hub chains or error
   *
   * @example
   * const result = await bridgeService.bridge(
   *   {
   *     srcChainId: '0x2105.base',
   *     srcAsset: '0x...', // Address of the source token
   *     amount: 1000n, // Amount to bridge (in token decimals)
   *     dstChainId: '0x89.polygon',
   *     dstAsset: '0x...', // Address of the destination token
   *     recipient: '0x...', // Recipient address on destination chain
   *     partnerFee: { address: '0x...', percentage: 0.1 } // Optional partner fee. Partner fees and denominated in vault token decimals (18)
   *   },
   *   spokeProvider,
   *   30000 // Optional timeout in milliseconds (default: 60000, i.e. 60 seconds)
   * );
   *
   * if (!result.ok) {
   *   // Handle error
   * }
   *
   * const [
   *  spokeTxHash, // transaction hash on the source chain
   *  hubTxHash,   // transaction hash on the hub chain
   * ] = result.value;
   * console.log('Bridge transaction hashes:', { spokeTxHash, hubTxHash });
   */
  public async bridge<S extends SpokeProvider>(
    params: BridgeParams,
    spokeProvider: S,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  ): Promise<Result<[SpokeTxHash, HubTxHash], BridgeError<BridgeErrorCode>>> {
    try {
      const txResult = await this.createBridgeIntent(params, spokeProvider);

      if (!txResult.ok) {
        return txResult;
      }

      const packetResult = await relayTxAndWaitPacket(
        txResult.value,
        spokeProvider instanceof SolanaSpokeProvider ? txResult.data : undefined,
        spokeProvider,
        this.relayerApiEndpoint,
        timeout,
      );

      if (!packetResult.ok) {
        return {
          ok: false,
          error: {
            code: packetResult.error.code,
            error: 'BRIDGE_FAILED', // TODO
          },
        };
      }

      return { ok: true, value: [txResult.value, packetResult.value.dst_tx_hash] };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'BRIDGE_FAILED',
          error: error,
        },
      };
    }
  }

  /**
   * Create bridge intent only (without relaying to hub)
   * NOTE: This method only executes the transaction on the spoke chain and creates the bridge intent
   * In order to successfully bridge tokens, you need to:
   * 1. Check if the allowance is sufficient using isAllowanceValid
   * 2. Approve the appropriate contract to spend the tokens using approve
   * 3. Create the bridge intent using this method
   * 4. Relay the transaction to the hub and await completion using the bridge method
   *
   * @param params - The bridge parameters including source/destination chains, assets, and recipient
   * @param spokeProvider - The spoke provider for the source chain
   * @param raw - Whether to return the raw transaction data
   * @returns {Promise<Result<TxReturnType<S, R>, BridgeError<BridgeErrorCode>>>} - Returns the transaction result
   *
   * @example
   * const bridgeService = new BridgeService(hubProvider, relayerApiEndpoint);
   * const result = await bridgeService.createBridgeIntent(
   *   {
   *     srcChainId: 'ethereum',
   *     srcAsset: "0x123...", // source token address
   *     amount: 1000000000000000000n, // 1 token in wei
   *     dstChainId: 'polygon',
   *     dstAsset: "0x456...", // destination token address
   *     recipient: "0x789..." // recipient address
   *   },
   *   spokeProvider,
   *   raw // Optional: true = return the raw transaction data, false = execute and return the transaction hash (default: false)
   * );
   *
   * if (result.ok) {
   *   const txHash = result.value;
   *   console.log('Bridge intent transaction hash:', txHash);
   * } else {
   *   console.error('Bridge intent creation failed:', result.error);
   * }
   */
  async createBridgeIntent<S extends SpokeProvider = SpokeProvider, R extends boolean = false>(
    params: BridgeParams,
    spokeProvider: S,
    raw?: R,
  ): Promise<Result<TxReturnType<S, R>, BridgeError<BridgeErrorCode>> & BridgeOptionalExtraData> {
    try {
      invariant(params.amount > 0n, 'Amount must be greater than 0');
      const srcAssetInfo = getHubAssetInfo(params.srcChainId, params.srcAsset);
      const dstAssetInfo = getHubAssetInfo(params.dstChainId, params.dstAsset);

      // Vault can only be used on Sonic
      invariant(
        srcAssetInfo || (isValidVault(params.srcAsset as Address) && params.srcChainId === SONIC_MAINNET_CHAIN_ID),
        `Unsupported spoke chain (${params.srcChainId}) token: ${params.srcAsset}`,
      );
      // dstination
      invariant(
        dstAssetInfo || (isValidVault(params.dstAsset as Address) && params.dstChainId === SONIC_MAINNET_CHAIN_ID),
        `Unsupported spoke chain (${params.dstChainId}) token: ${params.dstAsset}`,
      );

      const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
      const hubWallet = await WalletAbstractionService.getUserHubWalletAddress(
        walletAddress,
        spokeProvider,
        this.hubProvider,
      );

      const data: Hex = this.buildBridgeData(params, srcAssetInfo, dstAssetInfo);

      const txResult = await SpokeService.deposit(
        {
          from: walletAddress,
          to: hubWallet,
          token: params.srcAsset,
          amount: params.amount,
          data,
        } as unknown as GetSpokeDepositParamsType<S>,
        spokeProvider,
        this.hubProvider,
        raw,
      );

      return {
        ok: true,
        value: txResult as TxReturnType<S, R>,
        data: {
          address: hubWallet,
          payload: data,
        },
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'CREATE_BRIDGE_INTENT_FAILED',
          error: error,
        },
      };
    }
  }

  /**
   * Build the bridge transaction data for executing the bridge operation on the hub
   * @param params - The bridge parameters
   * @param srcAssetInfo - The source asset information
   * @param dstAssetInfo - The destination asset information
   * @returns Hex - The encoded contract calls for the bridge operation
   */
  buildBridgeData(params: BridgeParams, srcAssetInfo?: HubAssetInfo, dstAssetInfo?: HubAssetInfo): Hex {
    const calls: EvmContractCall[] = [];
    let translatedAmount = params.amount;
    let srcVault = params.srcAsset as `0x${string}`;
    // If srcAssetInfo is provided, it means the source asset is a a native token
    if (srcAssetInfo) {
      calls.push(Erc20Service.encodeApprove(srcAssetInfo.asset, srcAssetInfo.vault, params.amount));
      calls.push(EvmVaultTokenService.encodeDeposit(srcAssetInfo.vault, srcAssetInfo.asset, params.amount));
      translatedAmount = EvmVaultTokenService.translateIncomingDecimals(srcAssetInfo.decimal, params.amount);
      srcVault = srcAssetInfo.vault;
    }
    const feeAmount = calculateFeeAmount(translatedAmount, params.partnerFee);

    if (params.partnerFee && feeAmount) {
      calls.push(Erc20Service.encodeTransfer(srcVault, params.partnerFee.address, feeAmount));
    }

    const withdrawAmount = translatedAmount - feeAmount;
    let translatedWithdrawAmount = withdrawAmount;

    // If dstAssetInfo is provided, it means the destination asset is a native token
    if (dstAssetInfo) {
      calls.push(EvmVaultTokenService.encodeWithdraw(dstAssetInfo.vault, dstAssetInfo.asset, withdrawAmount));
      translatedWithdrawAmount = EvmVaultTokenService.translateOutgoingDecimals(dstAssetInfo.decimal, withdrawAmount);
    }
    // If the destination chain is Sonic, we can directly transfer the tokens to the recipient
    if (params.dstChainId === SONIC_MAINNET_CHAIN_ID) {
      calls.push(
        Erc20Service.encodeTransfer(params.dstAsset as `0x${string}`, params.recipient, translatedWithdrawAmount),
      );
    } else {
      invariant(dstAssetInfo, `Unsupported hub chain (${params.dstChainId}) token: ${params.dstAsset}`);
      calls.push(
        EvmAssetManagerService.encodeTransfer(
          dstAssetInfo.asset,
          params.recipient,
          translatedWithdrawAmount,
          this.hubProvider.chainConfig.addresses.assetManager,
        ),
      );
    }
    return encodeContractCalls(calls);
  }

  /**
   * Check if two assets on different chains are bridgeable
   * Two assets are bridgeable if they share the same vault on the hub chain
   * @param from - The source token with chain information
   * @param to - The destination token with chain information
   * @returns boolean - true if assets are bridgeable, false otherwise
   */
  public static isBridgeable(from: XToken, to: XToken): boolean {
    try {
      // Get hub asset info for both source and destination assets
      const srcAssetInfo = getHubAssetInfo(from.xChainId as SpokeChainId, from.address);
      const dstAssetInfo = getHubAssetInfo(to.xChainId as SpokeChainId, to.address);

      // Check if both assets are supported and have vault information
      if (!srcAssetInfo || !dstAssetInfo) {
        return false;
      }

      // Check if the vault addresses are the same (case-insensitive comparison)
      return srcAssetInfo.vault.toLowerCase() === dstAssetInfo.vault.toLowerCase();
    } catch (error) {
      // Return false on any error
      return false;
    }
  }

  /**
   * Get all bridgeable tokens from a source token to a destination chain
   * @param from - The source token with chain information
   * @param toChainId - The destination chain ID
   * @returns XToken[] - Array of bridgeable tokens on the destination chain
   */
  public static getBridgeableTokens(from: XToken, toChainId: SpokeChainId): XToken[] {
    try {
      // Get hub asset info for the source asset
      const srcAssetInfo = getHubAssetInfo(from.xChainId as SpokeChainId, from.address);

      if (!srcAssetInfo) {
        return [];
      }

      // Get all supported tokens for the destination chain
      const supportedTokens = spokeChainConfig[toChainId].supportedTokens;

      // Filter tokens that share the same vault as the source asset
      const bridgeableTokens: XToken[] = [];

      for (const token of Object.values(supportedTokens)) {
        const dstAssetInfo = getHubAssetInfo(toChainId, token.address);

        if (dstAssetInfo && dstAssetInfo.vault.toLowerCase() === srcAssetInfo.vault.toLowerCase()) {
          bridgeableTokens.push({
            ...token,
            xChainId: toChainId,
          });
        }
      }

      return bridgeableTokens;
    } catch (error) {
      // Return empty array on any error
      return [];
    }
  }
}
