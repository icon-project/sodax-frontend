import { type Address, type Hex, type PublicClient, encodeFunctionData } from 'viem';
import { assetManagerAbi } from '../../abis/index.js';
import type { EvmHubProvider } from '../../entities/Providers.js';
import type { EvmContractCall } from '../../types.js';
import { encodeContractCalls } from '../../utils/evm-utils.js';
import { EvmVaultTokenService } from './EvmVaultTokenService.js';
import type { SpokeChainId, AssetInfo } from '@sodax/types';
import type { ConfigService } from '../../config/ConfigService.js';
import { Erc20Service } from '../erc-20/index.js';

export type EvmDepositToDataParams = {
  token: Hex | string;
  to: Address;
  amount: bigint;
};

export type EvmWithdrawAssetDataParams = {
  token: Hex | string;
  to: Hex; // since spoke chain can  be non-evm as well
  amount: bigint;
};

export class EvmAssetManagerService {
  private constructor() {}

  /**
   * Get asset information for a given asset address
   * @param asset - The address of the asset contract
   * @param assetManager - The address of the asset manager contract
   * @param client - The Viem public client
   * @returns Object containing chainID and spoke address for the asset
   */
  public static async getAssetInfo(asset: Address, assetManager: Address, client: PublicClient): Promise<AssetInfo> {
    const [chainId, spokeAddress] = await client.readContract({
      address: assetManager,
      abi: assetManagerAbi,
      functionName: 'assetInfo',
      args: [asset],
    });

    return {
      chainId,
      spokeAddress,
    };
  }

  /**
   * Encodes a transfer transaction for an asset.
   * @param token - The address of the token.
   * @param to - The address to transfer the token to.
   * @param amount - The amount of the token to transfer.
   * @param assetManager
   * @returns The encoded contract call.
   */
  public static encodeTransfer(token: Address, to: Address, amount: bigint, assetManager: Address): EvmContractCall {
    return {
      address: assetManager,
      value: 0n,
      data: encodeFunctionData({
        abi: assetManagerAbi,
        functionName: 'transfer',
        args: [token, to, amount, '0x'],
      }),
    };
  }

  /**
   * Constructs the data for depositing tokens to the spoke chain.
   * @param {EvmDepositToDataParams} params - The address of the token to deposit.
   * @param {EvmSpokeProvider} spokeProvider - The provider for the spoke chain.
   * @returns {Hex} Encoded contract calls for the deposit transaction.
   * @throws Will throw an error if the asset or vault address is not found.
   */
  public static depositToData(
    params: EvmDepositToDataParams,
    spokeChainId: SpokeChainId,
    configService: ConfigService,
  ): Hex {
    const calls: EvmContractCall[] = [];
    const assetConfig = configService.getHubAssetInfo(spokeChainId, params.token);

    if (!assetConfig) {
      throw new Error('[depositToData] Hub asset not found');
    }

    const assetAddress = assetConfig.asset;
    const vaultAddress = assetConfig.vault;

    calls.push(Erc20Service.encodeApprove(assetAddress, vaultAddress, params.amount));
    calls.push(EvmVaultTokenService.encodeDeposit(vaultAddress, assetAddress, params.amount));
    const translatedAmount = EvmVaultTokenService.translateIncomingDecimals(assetConfig.decimal, params.amount);
    calls.push(Erc20Service.encodeTransfer(vaultAddress, params.to, translatedAmount));

    return encodeContractCalls(calls);
  }

  /**
   * Withdraw tokens from the spoke chain.
   * @param {EvmWithdrawAssetDataParams} params - Parameters for the withdrawal.
   * @param {EvmSpokeProvider} spokeProvider - The provider for the spoke chain.
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain.
   * @returns {Hex} Encoded contract calls for the withdrawal transaction.
   * @throws Will throw an error if the asset address is not found.
   */
  public static withdrawAssetData(
    params: EvmWithdrawAssetDataParams,
    hubProvider: EvmHubProvider,
    spokeChainId: SpokeChainId,
  ): Hex {
    const calls: EvmContractCall[] = [];
    const assetConfig = hubProvider.configService.getHubAssetInfo(spokeChainId, params.token);

    if (!assetConfig) {
      throw new Error('[withdrawAssetData] Hub asset not found');
    }

    const assetAddress = assetConfig.asset;

    calls.push(
      EvmAssetManagerService.encodeTransfer(
        assetAddress,
        params.to,
        params.amount,
        hubProvider.chainConfig.addresses.assetManager,
      ),
    );

    return encodeContractCalls(calls);
  }

  /**
   * Get asset address for a given chain ID and spoke address
   * @param chainId Chain ID where the asset exists
   * @param spokeAddress Address of the asset on the spoke chain
   * @param assetManager Address of the asset manager contract
   * @param client The Viem public client
   * @returns The asset's address on the hub chain
   */
  async getAssetAddress(
    chainId: bigint,
    spokeAddress: Address,
    assetManager: Address,
    client: PublicClient,
  ): Promise<Address> {
    return client.readContract({
      address: assetManager,
      abi: assetManagerAbi,
      functionName: 'assets',
      args: [chainId, spokeAddress],
    });
  }
}
