// packages/sdk/src/services/spoke/StellarSpokeService.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StellarSpokeService } from './StellarSpokeService.js';
import type { StellarSpokeProvider } from '../../entities/stellar/StellarSpokeProvider.js';
import { STELLAR_MAINNET_CHAIN_ID, spokeChainConfig } from '@sodax/types';
import { STELLAR_DEFAULT_TX_TIMEOUT_SECONDS } from '../../constants.js';
import { parseToStroops } from '../../utils/shared-utils.js';
import type { Horizon, rpc as StellarRpc } from '@stellar/stellar-sdk';

// Mock the Stellar SDK
vi.mock('@stellar/stellar-sdk', () => ({
  TransactionBuilder: vi.fn().mockImplementation(() => ({
    addOperation: vi.fn().mockReturnThis(),
    setTimeout: vi.fn().mockReturnThis(),
    build: vi.fn().mockReturnValue({
      toXDR: vi.fn().mockReturnValue('mock-transaction-xdr'),
    }),
  })),
  Operation: {
    changeTrust: vi.fn().mockReturnValue({}),
  },
  Asset: vi.fn().mockImplementation((code, issuer) => ({ code, issuer })),
  BASE_FEE: '100',
  SorobanRpc: {
    Server: vi.fn().mockImplementation(() => ({
      getNetwork: vi.fn().mockResolvedValue({
        passphrase: 'Test SDF Network ; September 2015',
      }),
      simulateTransaction: vi.fn().mockResolvedValue({
        minResourceFee: '100',
      }),
    })),
  },
}));

// Mock the CustomStellarAccount
vi.mock('../../entities/stellar/StellarSpokeProvider.js', () => ({
  CustomStellarAccount: vi.fn().mockImplementation(() => ({
    getAccountClone: vi.fn().mockReturnValue({
      accountId: 'GABC1234567890123456789012345678901234567890',
      sequence: '123456789',
    }),
  })),
}));

// Helper function to create proper balance line objects
const createNativeBalance = (balance: string): Horizon.HorizonApi.BalanceLineNative => ({
  asset_type: 'native',
  balance,
  buying_liabilities: '0.0000000',
  selling_liabilities: '0.0000000',
});

const createAssetBalance = (
  assetCode: string,
  assetIssuer: string,
  balance: string,
  limit: string,
): Horizon.HorizonApi.BalanceLineAsset<'credit_alphanum4'> => ({
  asset_type: 'credit_alphanum4',
  asset_code: assetCode,
  asset_issuer: assetIssuer,
  balance,
  limit,
  buying_liabilities: '0.0000000',
  selling_liabilities: '0.0000000',
  last_modified_ledger: 123456,
  is_authorized: true,
  is_authorized_to_maintain_liabilities: true,
  is_clawback_enabled: false,
});

describe('StellarSpokeService', () => {
  const mockWalletAddress = 'GABC1234567890123456789012345678901234567890';
  const mockToken = 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75'; // USDC
  const mockAmount = 10000000n; // 1 USDC in stroops
  const mockNativeToken = spokeChainConfig[STELLAR_MAINNET_CHAIN_ID].nativeToken;
  const mockLegacyBnUSD = spokeChainConfig[STELLAR_MAINNET_CHAIN_ID].supportedTokens.legacybnUSD.address;

  // Mock StellarSpokeProvider
  const mockAccountCall = vi.fn();
  const mockAccountId = vi.fn().mockReturnValue({ call: mockAccountCall });
  const mockAccounts = vi.fn().mockReturnValue({ accountId: mockAccountId });
  const mockLoadAccount = vi.fn();
  const mockSignAndSendTransaction = vi.fn().mockResolvedValue('mock-transaction-hash');

  const mockSpokeProvider = {
    walletProvider: {
      getWalletAddress: vi.fn().mockResolvedValue(mockWalletAddress),
    },
    chainConfig: {
      ...spokeChainConfig[STELLAR_MAINNET_CHAIN_ID],
      nativeToken: mockNativeToken,
    },
    server: {
      accounts: mockAccounts,
      loadAccount: mockLoadAccount,
    },
    sorobanServer: {
      getNetwork: vi.fn().mockResolvedValue({
        passphrase: 'Test SDF Network ; September 2015',
      }),
    },
    signAndSendTransaction: mockSignAndSendTransaction,
  } as unknown as StellarSpokeProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementations
    mockAccountCall.mockResolvedValue({ balances: [] });
    mockLoadAccount.mockResolvedValue({
      accountId: mockWalletAddress,
      sequence: '123456789',
    });
    mockSignAndSendTransaction.mockResolvedValue('mock-transaction-hash');
  });

  describe('hasSufficientTrustline', () => {
    it('should return true for native token (XLM)', async () => {
      const result = await StellarSpokeService.hasSufficientTrustline(mockNativeToken, mockAmount, mockSpokeProvider);

      expect(result).toBe(true);
    });

    it('should return true for legacy bnUSD token', async () => {
      const result = await StellarSpokeService.hasSufficientTrustline(mockLegacyBnUSD, mockAmount, mockSpokeProvider);

      expect(result).toBe(true);
    });

    it('should return true for native token with different case', async () => {
      const result = await StellarSpokeService.hasSufficientTrustline(
        mockNativeToken.toLowerCase(),
        mockAmount,
        mockSpokeProvider,
      );

      expect(result).toBe(true);
    });

    it('should throw error when trustline config not found', async () => {
      const unknownToken = 'UNKNOWN_TOKEN_ADDRESS';

      await expect(
        StellarSpokeService.hasSufficientTrustline(unknownToken, mockAmount, mockSpokeProvider),
      ).rejects.toThrow(`Trustline config not found for token: ${unknownToken}`);
    });

    it('should return false when no token balance found', async () => {
      const mockBalances: Horizon.HorizonApi.BalanceLine[] = [
        createNativeBalance('1000.0000000'),
        createAssetBalance('OTHER', 'OTHER_ISSUER', '500.0000000', '1000.0000000'),
      ];

      mockAccountCall.mockResolvedValue({
        balances: mockBalances,
      });

      const result = await StellarSpokeService.hasSufficientTrustline(mockToken, mockAmount, mockSpokeProvider);

      expect(result).toBe(false);
    });

    it('should return true when sufficient trustline available', async () => {
      const trustlineConfig = mockSpokeProvider.chainConfig.trustlineConfigs.find(
        config => config.contractId.toLowerCase() === mockToken.toLowerCase(),
      );

      if (!trustlineConfig) {
        throw new Error('Trustline config not found');
      }

      const mockBalances: Horizon.HorizonApi.BalanceLine[] = [
        createNativeBalance('1000.0000000'),
        createAssetBalance(
          trustlineConfig.assetCode,
          trustlineConfig.assetIssuer,
          '100.0000000', // 100 USDC
          '1000.0000000', // 1000 USDC limit
        ),
      ];

      mockAccountCall.mockResolvedValue({
        balances: mockBalances,
      });

      const result = await StellarSpokeService.hasSufficientTrustline(
        mockToken,
        mockAmount, // 1 USDC
        mockSpokeProvider,
      );

      expect(result).toBe(true);
    });

    it('should return false when insufficient trustline available', async () => {
      const trustlineConfig = mockSpokeProvider.chainConfig.trustlineConfigs.find(
        config => config.contractId.toLowerCase() === mockToken.toLowerCase(),
      );

      if (!trustlineConfig) {
        throw new Error('Trustline config not found');
      }

      // Set up a scenario where available trust is less than requested amount
      // Available = limit - balance = 1000 - 999.5 = 0.5 USDC
      // Requested = 1 USDC (mockAmount = 1000000n stroops)
      const mockBalances: Horizon.HorizonApi.BalanceLine[] = [
        createNativeBalance('1000.0000000'),
        createAssetBalance(
          trustlineConfig.assetCode,
          trustlineConfig.assetIssuer,
          '999.5000000', // 999.5 USDC
          '1000.0000000', // 1000 USDC limit
        ),
      ];

      mockAccountCall.mockResolvedValue({
        balances: mockBalances,
      });

      const result = await StellarSpokeService.hasSufficientTrustline(
        mockToken,
        mockAmount, // 1 USDC (1000000n stroops)
        mockSpokeProvider,
      );

      expect(result).toBe(false);
    });

    it('should handle case-insensitive asset code and issuer matching', async () => {
      const trustlineConfig = mockSpokeProvider.chainConfig.trustlineConfigs.find(
        config => config.contractId.toLowerCase() === mockToken.toLowerCase(),
      );

      if (!trustlineConfig) {
        throw new Error('Trustline config not found');
      }

      const mockBalances: Horizon.HorizonApi.BalanceLine[] = [
        createAssetBalance(
          trustlineConfig.assetCode.toLowerCase(), // lowercase
          trustlineConfig.assetIssuer.toLowerCase(), // lowercase
          '100.0000000',
          '1000.0000000',
        ),
      ];

      mockAccountCall.mockResolvedValue({
        balances: mockBalances,
      });

      const result = await StellarSpokeService.hasSufficientTrustline(mockToken, mockAmount, mockSpokeProvider);

      expect(result).toBe(true);
    });

    it('should handle exact trustline limit scenario', async () => {
      const trustlineConfig = mockSpokeProvider.chainConfig.trustlineConfigs.find(
        config => config.contractId.toLowerCase() === mockToken.toLowerCase(),
      );

      if (!trustlineConfig) {
        throw new Error('Trustline config not found');
      }

      const availableAmount = parseToStroops('0.1'); // 0.1 USDC
      const limit = parseToStroops('1.0'); // 1.0 USDC
      const balance = limit - availableAmount;

      const mockBalances: Horizon.HorizonApi.BalanceLine[] = [
        createAssetBalance(
          trustlineConfig.assetCode,
          trustlineConfig.assetIssuer,
          balance.toString(),
          limit.toString(),
        ),
      ];

      mockAccountCall.mockResolvedValue({
        balances: mockBalances,
      });

      const result = await StellarSpokeService.hasSufficientTrustline(mockToken, availableAmount, mockSpokeProvider);

      expect(result).toBe(true);
    });
  });

  describe('requestTrustline', () => {
    const mockAccountResponse = {
      accountId: mockWalletAddress,
      sequence: '123456789',
    };

    beforeEach(() => {
      mockLoadAccount.mockResolvedValue(mockAccountResponse);
    });

    it('should throw error when asset not found in trustline configs', async () => {
      const unknownToken = 'UNKNOWN_TOKEN_ADDRESS';

      await expect(StellarSpokeService.requestTrustline(unknownToken, mockAmount, mockSpokeProvider)).rejects.toThrow(
        `Asset ${unknownToken} not found. Cannot proceed with trustline.`,
      );
    });

    it('should return transaction hash when raw is false', async () => {
      const result = await StellarSpokeService.requestTrustline(mockToken, mockAmount, mockSpokeProvider, false);

      expect(result).toBe('mock-transaction-hash');
      expect(mockSignAndSendTransaction).toHaveBeenCalledTimes(1);
    });

    it('should return raw transaction data when raw is true', async () => {
      const result = await StellarSpokeService.requestTrustline(mockToken, mockAmount, mockSpokeProvider, true);

      expect(result).toEqual({
        from: mockWalletAddress,
        to: mockSpokeProvider.chainConfig.addresses.assetManager,
        value: mockAmount,
        data: 'mock-transaction-xdr',
      });
      expect(mockSignAndSendTransaction).not.toHaveBeenCalled();
    });

    it('should return transaction hash when raw is undefined (default false)', async () => {
      const result = await StellarSpokeService.requestTrustline(mockToken, mockAmount, mockSpokeProvider);

      expect(result).toBe('mock-transaction-hash');
      expect(mockSignAndSendTransaction).toHaveBeenCalledTimes(1);
    });

    it('should create correct transaction with proper asset configuration', async () => {
      const { TransactionBuilder, Operation, Asset } = await import('@stellar/stellar-sdk');

      await StellarSpokeService.requestTrustline(mockToken, mockAmount, mockSpokeProvider, false);

      expect(TransactionBuilder).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: mockWalletAddress,
          sequence: '123456789',
        }),
        expect.objectContaining({
          fee: '100',
          networkPassphrase: 'Test SDF Network ; September 2015',
        }),
      );

      const trustlineConfig = mockSpokeProvider.chainConfig.trustlineConfigs.find(
        config => config.contractId.toLowerCase() === mockToken.toLowerCase(),
      );

      if (!trustlineConfig) {
        throw new Error('Trustline config not found');
      }

      expect(Asset).toHaveBeenCalledWith(trustlineConfig.assetCode, trustlineConfig.assetIssuer);
      expect(Operation.changeTrust).toHaveBeenCalledWith({
        asset: expect.objectContaining({
          code: trustlineConfig.assetCode,
          issuer: trustlineConfig.assetIssuer,
        }),
      });
    });

    it('should handle case-insensitive token matching', async () => {
      await StellarSpokeService.requestTrustline(mockToken.toLowerCase(), mockAmount, mockSpokeProvider, false);

      expect(mockSignAndSendTransaction).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors from signAndSendTransaction', async () => {
      const error = new Error('Transaction failed');
      mockSignAndSendTransaction.mockRejectedValue(error);

      await expect(
        StellarSpokeService.requestTrustline(mockToken, mockAmount, mockSpokeProvider, false),
      ).rejects.toThrow('Transaction failed');
    });

    it('should propagate errors from server operations', async () => {
      const error = new Error('Network error');
      mockLoadAccount.mockRejectedValue(error);

      await expect(
        StellarSpokeService.requestTrustline(mockToken, mockAmount, mockSpokeProvider, false),
      ).rejects.toThrow('Network error');
    });

    it('should handle different token types in trustline configs', async () => {
      // Reset mocks for this test
      mockSignAndSendTransaction.mockResolvedValue('mock-transaction-hash');

      // Test with SODA token
      const sodaToken = 'CAH5LKJC2ZB4RVUVEVL2QWJWNJLHQE2UF767ILLQ5EQ4O3OURR2XIUGM';

      await StellarSpokeService.requestTrustline(sodaToken, mockAmount, mockSpokeProvider, false);

      expect(mockSignAndSendTransaction).toHaveBeenCalledTimes(1);

      const { Asset } = await import('@stellar/stellar-sdk');
      const sodaConfig = mockSpokeProvider.chainConfig.trustlineConfigs.find(
        config => config.contractId.toLowerCase() === sodaToken.toLowerCase(),
      );

      if (!sodaConfig) {
        throw new Error('SODA config not found');
      }

      expect(Asset).toHaveBeenCalledWith(sodaConfig.assetCode, sodaConfig.assetIssuer);
    });

    it('should set correct timeout for transaction', async () => {
      // Reset mocks for this test
      mockSignAndSendTransaction.mockResolvedValue('mock-transaction-hash');

      const { TransactionBuilder } = await import('@stellar/stellar-sdk');

      await StellarSpokeService.requestTrustline(mockToken, mockAmount, mockSpokeProvider, false);

      const mockResults = (
        TransactionBuilder as unknown as {
          mock: { results: Array<{ value: { setTimeout: ReturnType<typeof vi.fn> } }> };
        }
      ).mock.results;
      const transactionBuilderInstance = mockResults[0]?.value;

      if (!transactionBuilderInstance) {
        throw new Error('TransactionBuilder instance not found');
      }

      expect(transactionBuilderInstance.setTimeout).toHaveBeenCalledWith(STELLAR_DEFAULT_TX_TIMEOUT_SECONDS); // STELLAR_DEFAULT_TX_TIMEOUT_SECONDS
    });

    // Unit tests for StellarSpokeService.waitForTransaction (covers border cases)
    describe('waitForTransaction', () => {
      const mockTxHash = 'TRANSACTION_HASH';
      const spokeProvider = {
        sorobanServer: {
          getTransaction: vi.fn().mockResolvedValue({
            status: 'SUCCESS',
          }),
        },
      } as unknown as StellarSpokeProvider;

      it('should resolve when transaction is confirmed with SUCCESS status', async () => {
        vi.spyOn(spokeProvider.sorobanServer, 'getTransaction').mockResolvedValueOnce({
          status: 'SUCCESS',
        } as unknown as StellarRpc.Api.GetSuccessfulTransactionResponse);

        await expect(StellarSpokeService.waitForTransaction(spokeProvider, mockTxHash, 1, 1)).resolves.toEqual({
          ok: true,
          value: true,
        });
        expect(spokeProvider.sorobanServer.getTransaction).toHaveBeenCalledWith(mockTxHash);
      });

      it('should throw if transaction is failed (FAILED status)', async () => {
        vi.spyOn(spokeProvider.sorobanServer, 'getTransaction').mockResolvedValueOnce({
          status: 'FAILED',
        } as unknown as StellarRpc.Api.GetSuccessfulTransactionResponse);

        await expect(StellarSpokeService.waitForTransaction(spokeProvider, mockTxHash, 1, 1)).resolves.toEqual({
          ok: false,
          error: new Error('Transaction failed: {"status":"FAILED"}'),
        });
      });

      it('should poll repeatedly if transaction is NOT_FOUND, then resolves if eventually SUCCESS', async () => {
        vi.spyOn(spokeProvider.sorobanServer, 'getTransaction')
          .mockResolvedValueOnce({ status: 'NOT_FOUND' } as unknown as StellarRpc.Api.GetSuccessfulTransactionResponse) // 1
          .mockResolvedValueOnce({ status: 'NOT_FOUND' } as unknown as StellarRpc.Api.GetSuccessfulTransactionResponse) // 2
          .mockResolvedValueOnce({ status: 'SUCCESS' } as unknown as StellarRpc.Api.GetSuccessfulTransactionResponse); // 3

        // maxAttempts=4, only 3 attempts needed here
        await expect(StellarSpokeService.waitForTransaction(spokeProvider, mockTxHash, 1, 4)).resolves.toEqual({
          ok: true,
          value: true,
        });
        expect(spokeProvider.sorobanServer.getTransaction).toHaveBeenCalledTimes(3);
      });

      it('should throw if NOT_FOUND for all attempts', async () => {
        vi.spyOn(spokeProvider.sorobanServer, 'getTransaction').mockResolvedValue({
          status: 'NOT_FOUND',
        } as unknown as StellarRpc.Api.GetSuccessfulTransactionResponse);

        await expect(StellarSpokeService.waitForTransaction(spokeProvider, mockTxHash, 1, 3)).resolves.toEqual({
          ok: false,
          error: new Error('Transaction was not confirmed within the max attempts'),
        });

        expect(spokeProvider.sorobanServer.getTransaction).toHaveBeenCalledTimes(3);
      });

      it('should treat unknown status as retryable and eventually throw after max attempts', async () => {
        vi.spyOn(spokeProvider.sorobanServer, 'getTransaction').mockResolvedValue({
          status: 'UNRECOGNIZED_STATUS',
        } as unknown as StellarRpc.Api.GetSuccessfulTransactionResponse);

        await expect(StellarSpokeService.waitForTransaction(spokeProvider, mockTxHash, 1, 2)).resolves.toEqual({
          ok: false,
          error: new Error('Transaction was not confirmed within the max attempts'),
        });
        expect(spokeProvider.sorobanServer.getTransaction).toHaveBeenCalledTimes(2);
      });

      it('should retry when getTransaction throws a network error for some attempts', async () => {
        vi.spyOn(spokeProvider.sorobanServer, 'getTransaction')
          .mockRejectedValueOnce(new Error('Network hiccup'))
          .mockRejectedValueOnce(new Error('Transient'))
          .mockResolvedValueOnce({ status: 'SUCCESS' } as unknown as StellarRpc.Api.GetSuccessfulTransactionResponse);

        await expect(StellarSpokeService.waitForTransaction(spokeProvider, mockTxHash, 1, 5)).resolves.toEqual({
          ok: true,
          value: true,
        });
        expect(spokeProvider.sorobanServer.getTransaction).toHaveBeenCalledTimes(3); // 2 throw, 1 resolve
      });

      it('should preserve thrown errors if FAILED encountered after NOT_FOUNDs', async () => {
        vi.spyOn(spokeProvider.sorobanServer, 'getTransaction')
          .mockResolvedValueOnce({ status: 'NOT_FOUND' } as unknown as StellarRpc.Api.GetSuccessfulTransactionResponse)
          .mockResolvedValueOnce({
            status: 'FAILED',
            failReason: 'bad',
          } as unknown as StellarRpc.Api.GetSuccessfulTransactionResponse);

        await expect(StellarSpokeService.waitForTransaction(spokeProvider, mockTxHash, 1, 5)).resolves.toEqual({
          ok: false,
          error: new Error('Transaction failed: {"status":"FAILED","failReason":"bad"}'),
        });

        expect(spokeProvider.sorobanServer.getTransaction).toHaveBeenCalledTimes(2);
      });

      it('should only use up given maxAttempts times even if error is thrown each time', async () => {
        vi.spyOn(spokeProvider.sorobanServer, 'getTransaction').mockImplementation(() => {
          throw new Error('Always fails');
        });

        await expect(StellarSpokeService.waitForTransaction(spokeProvider, mockTxHash, 1, 3)).resolves.toEqual({
          ok: false,
          error: new Error('Transaction was not confirmed within the max attempts'),
        });

        expect(spokeProvider.sorobanServer.getTransaction).toHaveBeenCalledTimes(3);
      });
    });
  });
});
