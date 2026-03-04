import { describe, it, expect, vi, beforeEach } from 'vitest';
import { decodeFunctionData, type Address } from 'viem';
import { assetManagerAbi } from '../../abis/index.js';
import {
  EvmAssetManagerService,
  EvmSpokeProvider,
  type EvmDepositToDataParams,
  type EvmWithdrawAssetDataParams,
  EvmHubProvider,
  type EvmHubProviderConfig,
  Sodax,
} from '../../../index.js';
import { BSC_MAINNET_CHAIN_ID, spokeChainConfig, type IEvmWalletProvider } from '@sodax/types';

describe('EvmAssetManagerService', async () => {
  const sodax = new Sodax();
  const bscEthToken = '0x2170Ed0880ac9A755fd29B2688956BD959F933F8';

  const mockEvmWalletProvider = {
    sendTransaction: vi.fn(),
    getWalletAddress: vi.fn().mockResolvedValue('0x9999999999999999999999999999999999999999' as `0x${string}`),
    waitForTransactionReceipt: vi.fn(),
  } as unknown as IEvmWalletProvider;

  const mockBscSpokeProvider = new EvmSpokeProvider(mockEvmWalletProvider, spokeChainConfig[BSC_MAINNET_CHAIN_ID]);

  const mockHubConfig = {
    hubRpcUrl: 'https://rpc.soniclabs.com',
    chainConfig: sodax.config.getHubChainConfig(),
  } satisfies EvmHubProviderConfig;

  const mockHubProvider = new EvmHubProvider({ config: mockHubConfig, configService: sodax.config });

  describe('getAssetInfo', () => {
    it('should correctly fetch asset information', async () => {
      const mockResponse = [
        mockBscSpokeProvider.chainConfig.chain.id,
        mockBscSpokeProvider.chainConfig.addresses.spokeAddress,
      ] as const;
      vi.spyOn(mockBscSpokeProvider.publicClient, 'readContract').mockResolvedValueOnce(mockResponse);

      const result = await EvmAssetManagerService.getAssetInfo(
        bscEthToken,
        mockBscSpokeProvider.chainConfig.addresses.assetManager,
        mockBscSpokeProvider.publicClient,
      );

      expect(mockBscSpokeProvider.publicClient.readContract).toHaveBeenCalledWith({
        address: mockBscSpokeProvider.chainConfig.addresses.assetManager,
        abi: assetManagerAbi,
        functionName: 'assetInfo',
        args: [bscEthToken],
      });

      expect(result).toEqual({
        chainId: mockBscSpokeProvider.chainConfig.chain.id,
        spokeAddress: mockBscSpokeProvider.chainConfig.addresses.spokeAddress,
      });
    });

    it('should handle zero values', async () => {
      const mockResponse = [0n, '0x0000000000000000000000000000000000000000' as Address] as const;
      vi.spyOn(mockBscSpokeProvider.publicClient, 'readContract').mockResolvedValueOnce(mockResponse);

      const result = await EvmAssetManagerService.getAssetInfo(
        bscEthToken,
        mockBscSpokeProvider.chainConfig.addresses.assetManager,
        mockBscSpokeProvider.publicClient,
      );

      expect(result).toEqual({
        chainId: 0n,
        spokeAddress: '0x0000000000000000000000000000000000000000',
      });
    });
  });

  describe('encodeTransfer', () => {
    it('should correctly encode transfer transaction data', async () => {
      const walletAddress = (await mockEvmWalletProvider.getWalletAddress()) as `0x${string}`;
      const encodedCall = EvmAssetManagerService.encodeTransfer(
        bscEthToken,
        walletAddress,
        1000000000000000000n,
        mockBscSpokeProvider.chainConfig.addresses.assetManager,
      );

      expect(encodedCall).toEqual({
        address: mockBscSpokeProvider.chainConfig.addresses.assetManager,
        value: 0n,
        data: expect.any(String),
      });

      const decoded = decodeFunctionData({
        abi: assetManagerAbi,
        data: encodedCall.data,
      });

      expect(decoded.functionName).toBe('transfer');
      expect(decoded.args).toEqual([bscEthToken, walletAddress, 1000000000000000000n, '0x']);
    });

    it('should handle zero amount transfers', async () => {
      const walletAddress = (await mockEvmWalletProvider.getWalletAddress()) as `0x${string}`;
      const encodedCall = EvmAssetManagerService.encodeTransfer(
        bscEthToken,
        walletAddress,
        0n,
        mockBscSpokeProvider.chainConfig.addresses.assetManager,
      );

      const decoded = decodeFunctionData({
        abi: assetManagerAbi,
        data: encodedCall.data,
      });

      expect(decoded.args).toEqual([bscEthToken, walletAddress, 0n, '0x']);
    });

    it('should handle maximum uint256 amount', async () => {
      const walletAddress = (await mockEvmWalletProvider.getWalletAddress()) as `0x${string}`;
      const maxUint256 = 2n ** 256n - 1n;
      const encodedCall = EvmAssetManagerService.encodeTransfer(
        bscEthToken,
        walletAddress,
        maxUint256,
        mockBscSpokeProvider.chainConfig.addresses.assetManager,
      );

      const decoded = decodeFunctionData({
        abi: assetManagerAbi,
        data: encodedCall.data,
      });

      expect(decoded.args?.[2]).toBe(maxUint256);
    });

    it('should maintain data precision for large numbers', async () => {
      const walletAddress = (await mockEvmWalletProvider.getWalletAddress()) as `0x${string}`;
      const largeAmount = 2n ** 128n;
      const encodedCall = EvmAssetManagerService.encodeTransfer(
        bscEthToken,
        walletAddress,
        largeAmount,
        mockBscSpokeProvider.chainConfig.addresses.assetManager,
      );

      const decoded = decodeFunctionData({
        abi: assetManagerAbi,
        data: encodedCall.data,
      });

      expect(decoded.args?.[2]).toBe(largeAmount);
    });
  });

  describe('depositToData', () => {
    let depositParams: EvmDepositToDataParams;

    beforeEach(async () => {
      const walletAddress = (await mockEvmWalletProvider.getWalletAddress()) as `0x${string}`;
      depositParams = {
        token: bscEthToken,
        to: walletAddress,
        amount: 1000000000000000000n,
      };
    });

    it('should correctly encode deposit transaction data', () => {
      const result = EvmAssetManagerService.depositToData(
        depositParams,
        mockBscSpokeProvider.chainConfig.chain.id,
        sodax.config,
      );
      expect(result).toBe(
        '0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000140000000000000000000000000000000000000000000000000000000000000022000000000000000000000000057fc2ac5701e463ae261adbd6c99fbeb48ce5293000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000044095ea7b30000000000000000000000004effb5813271699683c25c734f4dabc45b3637090000000000000000000000000000000000000000000000000de0b6b3a7640000000000000000000000000000000000000000000000000000000000000000000000000000000000004effb5813271699683c25c734f4dabc45b36370900000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000004447e7ef2400000000000000000000000057fc2ac5701e463ae261adbd6c99fbeb48ce52930000000000000000000000000000000000000000000000000de0b6b3a7640000000000000000000000000000000000000000000000000000000000000000000000000000000000004effb5813271699683c25c734f4dabc45b363709000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000044a9059cbb00000000000000000000000099999999999999999999999999999999999999990000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000000000',
      );
    });

    it('should throw error if asset config not found', async () => {
      const walletAddress = (await mockEvmWalletProvider.getWalletAddress()) as `0x${string}`;
      const invalidToken = '0x9999999999999999999999999999999999999999' as Address;
      const invalidParams = { ...depositParams, token: invalidToken, to: walletAddress };

      expect(() =>
        EvmAssetManagerService.depositToData(invalidParams, mockBscSpokeProvider.chainConfig.chain.id, sodax.config),
      ).toThrow('[depositToData] Hub asset not found');
    });
  });

  describe('withdrawAssetData', () => {
    let withdrawParams: EvmWithdrawAssetDataParams;

    beforeEach(async () => {
      const walletAddress = (await mockEvmWalletProvider.getWalletAddress()) as `0x${string}`;
      withdrawParams = {
        token: bscEthToken,
        to: walletAddress,
        amount: 1000000000000000000n,
      };
    });

    it('should correctly encode withdraw transaction data', () => {
      const result = EvmAssetManagerService.withdrawAssetData(
        withdrawParams,
        mockHubProvider,
        mockBscSpokeProvider.chainConfig.chain.id,
      );
      expect(result).toBe(
        '0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000060c5681bd1db4e50735c4ca3386005a4ba4937c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000e4c6b4180b00000000000000000000000057fc2ac5701e463ae261adbd6c99fbeb48ce529300000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000149999999999999999999999999999999999999999000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
      );
    });

    it('should throw error if asset config not found', async () => {
      const walletAddress = (await mockEvmWalletProvider.getWalletAddress()) as `0x${string}`;
      const invalidToken = '0x9999999999999999999999999999999999999999' as Address;
      const invalidParams = { ...withdrawParams, token: invalidToken, to: walletAddress };

      expect(() =>
        EvmAssetManagerService.withdrawAssetData(
          invalidParams,
          mockHubProvider,
          mockBscSpokeProvider.chainConfig.chain.id,
        ),
      ).toThrow('[withdrawAssetData] Hub asset not found');
    });
  });
});
