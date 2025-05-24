import { describe, it, expect, vi, beforeEach } from 'vitest';
import { decodeFunctionData, type Address, type HttpTransport, type PublicClient } from 'viem';
import { assetManagerAbi } from '../../../abis/index.js';
import {
  EvmAssetManagerService,
  type EvmSpokeProvider,
  spokeChainConfig,
  type EvmDepositToDataParams,
  type EvmWithdrawAssetDataParams,
  getHubChainConfig,
  AVALANCHE_FUJI_TESTNET_CHAIN_ID,
  EvmHubProvider,
  type EvmHubProviderConfig,
  SONIC_MAINNET_CHAIN_ID,
  type IEvmWalletProvider,
} from '../../../index.js';

vi.mock('../../../utils/evm-utils.js', () => ({
  encodeContractCalls: () => '0xencoded',
}));

vi.mock('../../../services/hub/EvmWalletAbstraction.js', () => ({
  EvmWalletAbstraction: {
    getUserHubWalletAddress: () => '0x4444444444444444444444444444444444444444',
  },
}));

vi.mock('../../../constants.js', async importOriginal => {
  const actual = (await importOriginal()) as object;
  return {
    ...actual,
    hubAssets: {
      '0xa869.fuji': {
        // Mock token configuration for Avalanche Fuji testnet
        '0x1234567890123456789012345678901234567890': {
          asset: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          decimal: 18,
          vault: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        },
      },
    },
  };
});

describe('EvmAssetManagerService', () => {
  const mockAsset = '0x1234567890123456789012345678901234567890' as Address;
  const mockAssetManager = '0x0987654321098765432109876543210987654321' as Address;
  const mockTo = '0x5555555555555555555555555555555555555555' as Address;
  const mockAmount = 1000000000000000000n; // 1 token with 18 decimals
  const mockChainId = 1n;
  const mockSpokeChainId = '0xa869.fuji';
  const mockSpokeAddress = '0x3333333333333333333333333333333333333333' as Address;

  // Mock PublicClient
  const mockPublicClient = {
    readContract: vi.fn(),
  } as unknown as PublicClient;

  // Mock providers setup
  const mockSpokeWalletProvider = {
    publicClient: {
      readContract: vi.fn(),
    },
    getWalletAddressBytes: {
      writeContract: vi.fn(),
    },
    getWalletAddress: vi.fn().mockReturnValue('0x9999999999999999999999999999999999999999'),
    sendTransaction: vi.fn(),
    waitForTransactionReceipt: vi.fn(),
  } as unknown as IEvmWalletProvider;

  const mockSpokeProvider = {
    walletProvider: mockSpokeWalletProvider,
    chainConfig: {
      ...spokeChainConfig[mockSpokeChainId],
      chain: {
        id: AVALANCHE_FUJI_TESTNET_CHAIN_ID,
        name: 'Avalanche Fuji',
        type: 'evm',
      },
      addresses: {
        assetManager: '0x5555555555555555555555555555555555555555' as Address,
        connection: '0x6666666666666666666666666666666666666666' as Address,
      },
      nativeToken: '0x0000000000000000000000000000000000000000' as Address,
    },
    publicClient: {
      readContract: vi.fn(),
    } as unknown as PublicClient<HttpTransport>,
  } satisfies EvmSpokeProvider;

  const mockHubConfig = {
    hubRpcUrl: 'https://rpc.soniclabs.com',
    chainConfig: getHubChainConfig(SONIC_MAINNET_CHAIN_ID),
  } satisfies EvmHubProviderConfig;

  const mockHubProvider = new EvmHubProvider(mockHubConfig);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('getAssetInfo', () => {
    it('should correctly fetch asset information', async () => {
      const mockResponse = [mockChainId, mockSpokeAddress] as const;
      vi.mocked(mockPublicClient.readContract).mockResolvedValueOnce(mockResponse);

      const result = await EvmAssetManagerService.getAssetInfo(mockAsset, mockAssetManager, mockPublicClient);

      expect(mockPublicClient.readContract).toHaveBeenCalledWith({
        address: mockAssetManager,
        abi: assetManagerAbi,
        functionName: 'assetInfo',
        args: [mockAsset],
      });

      expect(result).toEqual({
        chainId: mockChainId,
        spokeAddress: mockSpokeAddress,
      });
    });

    it('should handle zero values', async () => {
      const mockResponse = [0n, '0x0000000000000000000000000000000000000000' as Address] as const;
      vi.mocked(mockPublicClient.readContract).mockResolvedValueOnce(mockResponse);

      const result = await EvmAssetManagerService.getAssetInfo(mockAsset, mockAssetManager, mockPublicClient);

      expect(result).toEqual({
        chainId: 0n,
        spokeAddress: '0x0000000000000000000000000000000000000000',
      });
    });
  });

  describe('encodeTransfer', () => {
    it('should correctly encode transfer transaction data', () => {
      const encodedCall = EvmAssetManagerService.encodeTransfer(mockAsset, mockTo, mockAmount, mockAssetManager);

      expect(encodedCall).toEqual({
        address: mockAssetManager,
        value: 0n,
        data: expect.any(String),
      });

      const decoded = decodeFunctionData({
        abi: assetManagerAbi,
        data: encodedCall.data,
      });

      expect(decoded.functionName).toBe('transfer');
      expect(decoded.args).toEqual([mockAsset, mockTo, mockAmount, '0x']);
    });

    it('should handle zero amount transfers', () => {
      const encodedCall = EvmAssetManagerService.encodeTransfer(mockAsset, mockTo, 0n, mockAssetManager);

      const decoded = decodeFunctionData({
        abi: assetManagerAbi,
        data: encodedCall.data,
      });

      expect(decoded.args).toEqual([mockAsset, mockTo, 0n, '0x']);
    });

    it('should handle maximum uint256 amount', () => {
      const maxUint256 = 2n ** 256n - 1n;
      const encodedCall = EvmAssetManagerService.encodeTransfer(mockAsset, mockTo, maxUint256, mockAssetManager);

      const decoded = decodeFunctionData({
        abi: assetManagerAbi,
        data: encodedCall.data,
      });

      expect(decoded.args?.[2]).toBe(maxUint256);
    });

    it('should maintain data precision for large numbers', () => {
      const largeAmount = 2n ** 128n;
      const encodedCall = EvmAssetManagerService.encodeTransfer(mockAsset, mockTo, largeAmount, mockAssetManager);

      const decoded = decodeFunctionData({
        abi: assetManagerAbi,
        data: encodedCall.data,
      });

      expect(decoded.args?.[2]).toBe(largeAmount);
    });
  });

  describe('depositToData', () => {
    const depositParams = {
      token: mockAsset,
      to: mockTo,
      amount: mockAmount,
    } satisfies EvmDepositToDataParams;

    it('should correctly encode deposit transaction data', () => {
      const result = EvmAssetManagerService.depositToData(depositParams, mockSpokeProvider.chainConfig.chain.id);
      expect(result).toBe('0xencoded');
    });

    it('should throw error if asset config not found', () => {
      const invalidToken = '0x9999999999999999999999999999999999999999' as Address;
      const invalidParams = { ...depositParams, token: invalidToken };

      expect(() => EvmAssetManagerService.depositToData(invalidParams, mockSpokeProvider.chainConfig.chain.id)).toThrow(
        'Asset or vault address not found',
      );
    });
  });

  describe('withdrawAssetData', () => {
    const withdrawParams = {
      token: mockAsset,
      to: mockTo,
      amount: mockAmount,
    } satisfies EvmWithdrawAssetDataParams;

    it('should correctly encode withdraw transaction data', () => {
      const result = EvmAssetManagerService.withdrawAssetData(
        withdrawParams,
        mockHubProvider,
        mockSpokeProvider.chainConfig.chain.id,
      );
      expect(result).toBe('0xencoded');
    });

    it('should throw error if asset config not found', () => {
      const invalidToken = '0x9999999999999999999999999999999999999999' as Address;
      const invalidParams = { ...withdrawParams, token: invalidToken };

      expect(() =>
        EvmAssetManagerService.withdrawAssetData(
          invalidParams,
          mockHubProvider,
          mockSpokeProvider.chainConfig.chain.id,
        ),
      ).toThrow('Asset or vault address not found');
    });
  });

  describe('getAssetAddress', () => {
    it('should correctly fetch asset address', async () => {
      const expectedAddress = '0x4444444444444444444444444444444444444444' as Address;
      vi.mocked(mockPublicClient.readContract).mockResolvedValueOnce(expectedAddress);

      const result = await EvmAssetManagerService.prototype.getAssetAddress.call(
        { constructor: EvmAssetManagerService },
        mockChainId,
        mockSpokeAddress,
        mockAssetManager,
        mockPublicClient,
      );

      expect(mockPublicClient.readContract).toHaveBeenCalledWith({
        address: mockAssetManager,
        abi: assetManagerAbi,
        functionName: 'assets',
        args: [mockChainId, mockSpokeAddress],
      });

      expect(result).toBe(expectedAddress);
    });

    it('should handle zero address response', async () => {
      const zeroAddress = '0x0000000000000000000000000000000000000000' as Address;
      vi.mocked(mockPublicClient.readContract).mockResolvedValueOnce(zeroAddress);

      const result = await EvmAssetManagerService.prototype.getAssetAddress.call(
        { constructor: EvmAssetManagerService },
        mockChainId,
        mockSpokeAddress,
        mockAssetManager,
        mockPublicClient,
      );

      expect(result).toBe(zeroAddress);
    });

    it('should handle different chain IDs', async () => {
      const expectedAddress = '0x4444444444444444444444444444444444444444' as Address;
      vi.mocked(mockPublicClient.readContract).mockResolvedValueOnce(expectedAddress);

      const differentChainId = 42n;
      await EvmAssetManagerService.prototype.getAssetAddress.call(
        { constructor: EvmAssetManagerService },
        differentChainId,
        mockSpokeAddress,
        mockAssetManager,
        mockPublicClient,
      );

      expect(mockPublicClient.readContract).toHaveBeenCalledWith({
        address: mockAssetManager,
        abi: assetManagerAbi,
        functionName: 'assets',
        args: [differentChainId, mockSpokeAddress],
      });
    });
  });
});
