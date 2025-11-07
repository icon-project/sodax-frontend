import { encodeFunctionData, type Address, type Hash, type HttpTransport, type PublicClient } from 'viem';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { connectionAbi } from '../../abis/index.js';
import type { EvmHubProviderConfig } from '../../entities/index.js';
import {
  getHubChainConfig,
  EvmHubProvider,
  type EvmSpokeDepositParams,
  type EvmSpokeProvider,
  EvmSpokeService,
  Sodax,
} from '../../../index.js';
import {
  AVALANCHE_MAINNET_CHAIN_ID,
  getIntentRelayChainId,
  spokeChainConfig,
  type IEvmWalletProvider,
} from '@sodax/types';

// Hoisted mocks must be before any other code
vi.mock('../../../utils/evm-utils.js', () => ({
  encodeContractCalls: () => '0xencoded',
}));

vi.mock('../../../services/hub/EvmWalletAbstraction.js', () => ({
  EvmWalletAbstraction: {
    getUserHubWalletAddress: () => '0x4444444444444444444444444444444444444444',
  },
}));

// Mock assets configuration
vi.mock('../../../constants.js', async importOriginal => {
  const actual = (await importOriginal()) as object;
  return {
    ...actual,
    hubAssets: {
      '0xa86a.avax': {
        '0x1234567890123456789012345678901234567890': {
          asset: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          vault: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        },
      },
    },
    spokeChainConfig: {
      ['0xa86a.avax']: {
        chain: {
          id: '0xa86a.avax',
          name: 'Avalanche',
          type: 'EVM',
        },
        addresses: {
          assetManager: '0x5555555555555555555555555555555555555555',
          connection: '0x6666666666666666666666666666666666666666',
        },
        nativeToken: '0x0000000000000000000000000000000000000000',
      },
    },
    hubChainConfig: {
      [57054]: {
        chain: {
          id: 57054,
          name: 'Mock Hub Chain',
          type: 'EVM',
        },
        addresses: {
          assetManager: '0x7777777777777777777777777777777777777777',
          connection: '0x8888888888888888888888888888888888888888',
        },
      },
    },
  };
});

describe('EvmSpokeService', () => {
  const sodax = new Sodax();
  const mockToken = '0x1234567890123456789012345678901234567890' as Address;
  const mockUser = '0x4444444444444444444444444444444444444444' as Address;
  const mockAmount = 1000000000000000000n; // 1 token with 18 decimals
  const mockChainId = AVALANCHE_MAINNET_CHAIN_ID; // Avalanche
  const mockTxHash = '0x123...' as Hash;
  const mockPayload = '0xabcd';

  // Mock providers setup
  const mockSpokeWalletProvider = {
    publicClient: {
      readContract: vi.fn(),
    },
    getWalletAddress: vi.fn().mockReturnValue('0x9999999999999999999999999999999999999999'),
    sendTransaction: vi.fn(),
    waitForTransactionReceipt: vi.fn(),
  } as unknown as IEvmWalletProvider;

  const mockSpokeProvider = {
    walletProvider: mockSpokeWalletProvider,
    chainConfig: {
      ...spokeChainConfig[mockChainId],
      chain: {
        id: mockChainId,
        name: 'Avalanche',
        type: 'EVM',
        chainId: 43_114,
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
    chainConfig: getHubChainConfig(),
  } satisfies EvmHubProviderConfig;

  const mockHubProvider = new EvmHubProvider({ config: mockHubConfig, configService: sodax.config });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('deposit', () => {
    const depositParams = {
      from: mockUser,
      token: mockToken,
      amount: mockAmount,
      data: '0x',
    } satisfies EvmSpokeDepositParams;

    it('should correctly initiate deposit', async () => {
      vi.mocked(mockSpokeWalletProvider.sendTransaction).mockResolvedValueOnce(mockTxHash);

      const result = await EvmSpokeService.deposit(depositParams, mockSpokeProvider, mockHubProvider);

      expect(result).toBe(mockTxHash);
    });

    it('should handle native token deposits', async () => {
      const nativeTokenParams = {
        ...depositParams,
        token: mockSpokeProvider.chainConfig.nativeToken,
      };

      vi.mocked(mockSpokeWalletProvider.sendTransaction).mockResolvedValueOnce(mockTxHash);

      await EvmSpokeService.deposit(nativeTokenParams, mockSpokeProvider, mockHubProvider);

      expect(mockSpokeWalletProvider.sendTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          value: mockAmount,
        }),
      );
    });
  });

  describe('getDeposit', () => {
    it('should correctly fetch token balance', async () => {
      const expectedBalance = 1000000n;
      vi.mocked(mockSpokeProvider.publicClient.readContract).mockResolvedValueOnce(expectedBalance);

      const result = await EvmSpokeService.getDeposit(mockToken, mockSpokeProvider);

      expect(result).toBe(expectedBalance);
    });

    it('should handle zero balance', async () => {
      vi.mocked(mockSpokeProvider.publicClient.readContract).mockResolvedValueOnce(0n);

      const result = await EvmSpokeService.getDeposit(mockToken, mockSpokeProvider);

      expect(result).toBe(0n);
    });
  });

  describe('callWallet', () => {
    it('should correctly call wallet with payload', async () => {
      vi.mocked(mockSpokeWalletProvider.sendTransaction).mockResolvedValueOnce(mockTxHash);

      const result = await EvmSpokeService.callWallet(mockUser, mockPayload, mockSpokeProvider, mockHubProvider);

      expect(result).toBe(mockTxHash);
    });

    it('should use correct connection contract address', async () => {
      vi.mocked(mockSpokeWalletProvider.sendTransaction).mockResolvedValueOnce(mockTxHash);

      await EvmSpokeService.callWallet(mockUser, mockPayload, mockSpokeProvider, mockHubProvider);

      expect(mockSpokeWalletProvider.sendTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          from: await mockSpokeProvider.walletProvider.getWalletAddress(),
          to: mockSpokeProvider.chainConfig.addresses.connection,
          data: encodeFunctionData({
            abi: connectionAbi,
            functionName: 'sendMessage',
            args: [getIntentRelayChainId(mockHubProvider.chainConfig.chain.id), mockUser, mockPayload],
          }),
        }),
      );
    });
  });

  describe('edge cases', () => {
    it('should handle maximum uint256 amount', async () => {
      const maxUint256 = 2n ** 256n - 1n;
      const largeAmountParams = {
        from: mockUser,
        token: mockToken,
        amount: maxUint256,
        data: '0x',
      } satisfies EvmSpokeDepositParams;

      vi.mocked(mockSpokeWalletProvider.sendTransaction).mockResolvedValueOnce(mockTxHash);

      const result = await EvmSpokeService.deposit(largeAmountParams, mockSpokeProvider, mockHubProvider);

      expect(result).toBe(mockTxHash);
    });

    it('should handle empty data parameter', async () => {
      const emptyDataParams = {
        from: mockUser,
        token: mockToken,
        amount: mockAmount,
        data: '0x',
      } satisfies EvmSpokeDepositParams;

      vi.mocked(mockSpokeWalletProvider.sendTransaction).mockResolvedValueOnce(mockTxHash);

      const result = await EvmSpokeService.deposit(emptyDataParams, mockSpokeProvider, mockHubProvider);

      expect(result).toBe(mockTxHash);
    });

    it('should handle custom data parameter', async () => {
      const customDataParams = {
        from: mockUser,
        token: mockToken,
        amount: mockAmount,
        data: '0x1234',
      } satisfies EvmSpokeDepositParams;

      vi.mocked(mockSpokeWalletProvider.sendTransaction).mockResolvedValueOnce(mockTxHash);

      const result = await EvmSpokeService.deposit(customDataParams, mockSpokeProvider, mockHubProvider);

      expect(result).toBe(mockTxHash);
    });
  });
});
